import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveShortLink } from "@/lib/data/public.repo";

export default function ShortLinkRedirectScreen() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveAndRedirect = async () => {
      if (!slug) {
        navigate("/", { replace: true });
        return;
      }

      try {
        // Pergunta em aberto #2 (Bloco 6): rota assumida, não confirmada com o gateway — ver
        // src/lib/data/public.repo.ts.
        const result = await resolveShortLink(slug);

        if (!result) {
          setError("Link não encontrado");
          return;
        }

        // Redirect via window.location (equivalent to 302)
        window.location.replace(result.destination_url);
      } catch (err) {
        console.error("Short link error:", err);
        setError("Erro de conexão");
      }
    };

    resolveAndRedirect();
  }, [slug, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-foreground font-semibold text-lg">{error}</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 animate-fade-in">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
