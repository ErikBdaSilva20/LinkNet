import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, ArrowLeft, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session, the token might be invalid or expired
      if (!session) {
        setTokenError(true);
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao redefinir senha",
        description: error.message,
      });
    } else {
      toast({
        title: "Senha alterada com sucesso!",
        description: "Você será redirecionado para o login.",
      });
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 2000);
    }

    setLoading(false);
  };

  if (checkingSession) {
    return (
      <PageContainer className="flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <GlassCard className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Verificando...</p>
          </GlassCard>
        </div>
      </PageContainer>
    );
  }

  if (tokenError) {
    return (
      <PageContainer className="flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <GlassCard className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Link expirado</h1>
            <p className="text-muted-foreground mb-6">
              Este link de recuperação é inválido ou já expirou.
              Solicite um novo link para redefinir sua senha.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                Solicitar novo link
              </Button>
            </Link>
            <div className="mt-4">
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors inline-flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </GlassCard>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Nova Senha
            </h1>
            <p className="text-muted-foreground">
              Defina sua nova senha abaixo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 input-styled"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 input-styled"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
