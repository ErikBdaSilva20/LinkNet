import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShortLink() {
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
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-short-link`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug,
              referrer: document.referrer,
              user_agent: navigator.userAgent,
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Link não encontrado");
          } else {
            const data = await response.json().catch(() => ({}));
            setError(data.error || "Erro ao processar link");
          }
          return;
        }

        const { destination_url } = await response.json();

        // Redirect via window.location (equivalent to 302)
        window.location.replace(destination_url);
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
