import { Link } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Link2, Sparkles, BarChart3, Palette, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Links Ilimitados",
    description: "Adicione quantos links quiser e organize do seu jeito.",
  },
  {
    icon: BarChart3,
    title: "Analytics Completo",
    description: "Acompanhe cliques, views e desempenho em tempo real.",
  },
  {
    icon: Palette,
    title: "Personalização Total",
    description: "Customize cores, fontes e estilos da sua página.",
  },
  {
    icon: Sparkles,
    title: "Short Links",
    description: "Links curtos e rastreáveis para compartilhar.",
  },
];

const LandingScreen = () => {
  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Sua página de links profissional</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground">
            Todos os seus links em{" "}
            <span className="gradient-text">um só lugar</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Crie uma página personalizada com seus links, acompanhe analytics e
            compartilhe com o mundo. Simples, rápido e profissional.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
            >
              <Link to="/register">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 rounded-xl border-2 border-border/50 hover:bg-muted/50"
            >
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <GlassCard
              key={feature.title}
              hover
              className="p-6"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Preview */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Crie sua conta gratuita e tenha sua página de links pronta em
            minutos.
          </p>
          <Button
            asChild
            size="lg"
            className="h-14 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg"
          >
            <Link to="/register">
              Criar Minha Página
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-2xl font-bold gradient-text">LinkBio</span>
            <p className="text-sm text-muted-foreground">
              © 2024 Viver de IA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </PageContainer>
  );
};

export default LandingScreen;
