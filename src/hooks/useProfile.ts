import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch profile only (page is now managed by ActivePageContext)
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      return profile;
    },
    enabled: !!user?.id,
  });

  // Check handle uniqueness
  const checkHandleUniqueness = async (handle: string): Promise<boolean> => {
    if (!user?.id || !handle) return false;

    const handleRegex = /^[a-z0-9_]{3,20}$/;
    if (!handleRegex.test(handle)) return false;

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .neq("user_id", user.id)
      .maybeSingle();

    return !data; // true if unique (no other user has this handle)
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "display_name" | "handle" | "bio" | "avatar_url">>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "Perfil atualizado",
        description: "Suas alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    },
  });

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: uploadError.message,
      });
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  };

  return {
    profile: profile ?? null,
    isLoading,
    error,
    checkHandleUniqueness,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    uploadAvatar,
  };
}
