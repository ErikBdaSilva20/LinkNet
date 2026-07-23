import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message,
      });
    } else {
      setEmailSent(true);
    }

    setLoading(false);
  };

  return (
    <PageContainer className="flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <GlassCard className="p-8">
          {emailSent ? (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Verifique seu email</h1>
              <p className="text-muted-foreground mb-6">
                Enviamos um link de recuperação para <strong>{email}</strong>.
                Clique no link para redefinir sua senha.
              </p>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar para o login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold gradient-text mb-2">
                  Recuperar Senha
                </h1>
                <p className="text-muted-foreground">
                  Insira seu email para receber um link de recuperação
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                    "Enviar link de recuperação"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  Lembrou a senha?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Fazer login
                  </Link>
                </p>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </PageContainer>
  );
}
