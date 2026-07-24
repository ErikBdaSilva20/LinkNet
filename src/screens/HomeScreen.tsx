import { useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useLinks } from "@/hooks/useLinks";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Link2, Eye, MousePointerClick, TrendingUp, Plus, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { subDays } from "date-fns";

const STATS_WINDOW_DAYS = 30;

export default function HomeScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { links } = useLinks();

  const { startDate, endDate } = useMemo(() => {
    const endDate = new Date();
    return { startDate: subDays(endDate, STATS_WINDOW_DAYS), endDate };
  }, []);
  const { data: analytics } = useAnalytics({ startDate, endDate });

  const handleCopyLink = async () => {
    if (!profile?.handle) return;
    const url = `${window.location.origin}/${profile.handle}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Cole no seu Instagram ou onde quiser compartilhar.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: "Total de Links", value: String(links.length), icon: Link2, color: "text-primary" },
    { label: `Views (${STATS_WINDOW_DAYS}d)`, value: String(analytics.totalViews), icon: Eye, color: "text-secondary" },
    { label: `Cliques (${STATS_WINDOW_DAYS}d)`, value: String(analytics.totalClicks), icon: MousePointerClick, color: "text-cyan-light" },
    { label: `CTR (${STATS_WINDOW_DAYS}d)`, value: `${analytics.ctr.toFixed(1)}%`, icon: TrendingUp, color: "text-teal-light" },
  ];

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Olá, {user?.name || "Usuário"}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua página de links
            </p>
          </div>
          <Button asChild className="gradient-primary text-primary-foreground rounded-xl">
            <Link to="/app/links">
              <Plus className="h-4 w-4 mr-2" />
              Novo Link
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <GlassCard key={stat.label} className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start rounded-xl border-border/50 hover:bg-muted/50"
              >
                <Link to="/app/links">
                  <Link2 className="h-4 w-4 mr-3" />
                  Gerenciar Links
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start rounded-xl border-border/50 hover:bg-muted/50"
              >
                <Link to="/app/design">
                  <ExternalLink className="h-4 w-4 mr-3" />
                  Personalizar Página
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start rounded-xl border-border/50 hover:bg-muted/50"
              >
                <Link to="/app/analytics">
                  <TrendingUp className="h-4 w-4 mr-3" />
                  Ver Analytics
                </Link>
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Compartilhe sua Página
            </h3>
            {profile?.handle ? (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Seu link:</p>
                  <p className="text-foreground font-medium break-all">
                    {window.location.origin}/{profile.handle}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCopyLink} 
                    className="flex-1 rounded-xl gradient-primary text-primary-foreground"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copiado!" : "Copiar Link"}
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl border-border/50">
                    <a href={`/${profile.handle}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <p className="text-muted-foreground text-sm mb-3">
                  Configure seu handle nas configurações para ter sua página pública.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Link to="/app/settings">
                    Configurar Handle
                  </Link>
                </Button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Empty State / Activity */}
        <GlassCard className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center">
              <Link2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Comece a criar seus links
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Adicione seus links e compartilhe sua página personalizada com o mundo.
            </p>
            <Button asChild className="gradient-primary text-primary-foreground rounded-xl">
              <Link to="/app/links">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Link
              </Link>
            </Button>
          </div>
        </GlassCard>
      </div>
  );
}
