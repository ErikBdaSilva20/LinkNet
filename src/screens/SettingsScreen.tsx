import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import { User, AtSign, FileText, Save, Loader2, Check, X, Upload } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsScreen() {
  const { profile, isLoading, checkHandleUniqueness, updateProfile, isUpdating, uploadAvatar } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Handle validation state
  const [handleError, setHandleError] = useState<string | null>(null);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleIsValid, setHandleIsValid] = useState(true);
  
  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Sync form with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setHandle(profile.handle || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url);
      setHandleIsValid(true);
      setHandleError(null);
    }
  }, [profile]);

  // Handle validation
  const validateHandle = async (value: string) => {
    const handleRegex = /^[a-z0-9_]{3,20}$/;
    
    if (!value) {
      setHandleError("Handle é obrigatório");
      setHandleIsValid(false);
      return;
    }
    
    if (!handleRegex.test(value)) {
      if (value.length < 3) {
        setHandleError("Mínimo de 3 caracteres");
      } else if (value.length > 20) {
        setHandleError("Máximo de 20 caracteres");
      } else {
        setHandleError("Apenas letras minúsculas, números e _");
      }
      setHandleIsValid(false);
      return;
    }
    
    // Check uniqueness
    setIsCheckingHandle(true);
    const isUnique = await checkHandleUniqueness(value);
    setIsCheckingHandle(false);
    
    if (!isUnique) {
      setHandleError("Este handle já está em uso");
      setHandleIsValid(false);
    } else {
      setHandleError(null);
      setHandleIsValid(true);
    }
  };

  const handleHandleChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setHandle(sanitized);
    setHandleError(null);
    setHandleIsValid(true);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;

    setIsUploadingAvatar(true);
    const url = await uploadAvatar(file);
    if (url) {
      setAvatarUrl(url);
      updateProfile({ avatar_url: url });
    }
    setIsUploadingAvatar(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = () => {
    if (!handleIsValid) return;
    
    updateProfile({
      display_name: displayName,
      handle: handle,
      bio: bio,
    });
  };

  const canSave = handleIsValid && !isCheckingHandle && handle.length >= 3;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu perfil e preferências
          </p>
        </div>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Informações do Perfil
            </h3>
          </div>

          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="gradient-primary text-3xl font-bold text-primary-foreground">
                    {displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  className="rounded-xl border-border/50"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Trocar Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG ou GIF. Máximo 2MB.
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 input-styled"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            {/* Handle */}
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="handle"
                  value={handle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  onBlur={() => validateHandle(handle)}
                  className={`pl-10 pr-10 input-styled ${handleError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="seuhandle"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingHandle && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                  {!isCheckingHandle && handleIsValid && handle.length >= 3 && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                  {!isCheckingHandle && handleError && (
                    <X className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
              {handleError ? (
                <p className="text-xs text-destructive">{handleError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sua página será acessível em /{handle || "seuhandle"}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="pl-10 input-styled min-h-24 resize-none"
                  placeholder="Uma breve descrição sobre você..."
                  maxLength={160}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/160
              </p>
            </div>

            <Button 
              className="gradient-primary text-primary-foreground rounded-xl"
              onClick={handleSaveProfile}
              disabled={!canSave || isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Perfil
            </Button>
          </div>
        </GlassCard>
      </div>
  );
}