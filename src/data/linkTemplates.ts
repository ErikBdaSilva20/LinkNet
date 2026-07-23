export interface LinkTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  iconName: string | null;
  iconColor?: string;
  iconBg?: string;
  urlPlaceholder?: string;
  defaultTitle?: string;
}

export interface LinkCategory {
  id: string;
  name: string;
  icon: string;
}

export const LINK_CATEGORIES: LinkCategory[] = [
  { id: "suggested", name: "Sugeridos", icon: "Sparkles" },
  { id: "social", name: "Social", icon: "Heart" },
  { id: "media", name: "Mídia", icon: "Play" },
  { id: "contact", name: "Contato", icon: "MessageCircle" },
  { id: "commerce", name: "Comércio", icon: "ShoppingBag" },
  { id: "events", name: "Eventos", icon: "Calendar" },
  { id: "all", name: "Ver todos", icon: "MoreHorizontal" },
];

export const LINK_TEMPLATES: LinkTemplate[] = [
  // Suggested (most popular)
  {
    id: "instagram",
    name: "Instagram",
    description: "Exiba seus posts e reels",
    category: "suggested",
    iconName: "Instagram",
    iconColor: "#E1306C",
    iconBg: "rgba(225, 48, 108, 0.1)",
    urlPlaceholder: "https://instagram.com/seu_usuario",
    defaultTitle: "Instagram",
  },
  {
    id: "tiktok-suggested",
    name: "TikTok",
    description: "Compartilhe seus TikToks",
    category: "suggested",
    iconName: "Music2",
    iconColor: "#000000",
    iconBg: "rgba(0, 0, 0, 0.1)",
    urlPlaceholder: "https://tiktok.com/@seu_usuario",
    defaultTitle: "TikTok",
  },
  {
    id: "youtube-suggested",
    name: "YouTube",
    description: "Mostre seus vídeos e canal",
    category: "suggested",
    iconName: "Youtube",
    iconColor: "#FF0000",
    iconBg: "rgba(255, 0, 0, 0.1)",
    urlPlaceholder: "https://youtube.com/@seu_canal",
    defaultTitle: "YouTube",
  },
  {
    id: "spotify-suggested",
    name: "Spotify",
    description: "Compartilhe sua música",
    category: "suggested",
    iconName: "Music",
    iconColor: "#1DB954",
    iconBg: "rgba(29, 185, 84, 0.1)",
    urlPlaceholder: "https://open.spotify.com/artist/...",
    defaultTitle: "Spotify",
  },
  {
    id: "whatsapp-suggested",
    name: "WhatsApp",
    description: "Conecte-se diretamente",
    category: "suggested",
    iconName: "MessageCircleMore",
    iconColor: "#25D366",
    iconBg: "rgba(37, 211, 102, 0.1)",
    urlPlaceholder: "https://wa.me/5511999999999",
    defaultTitle: "WhatsApp",
  },

  // Social
  {
    id: "instagram-social",
    name: "Instagram",
    description: "Exiba seus posts e reels",
    category: "social",
    iconName: "Instagram",
    iconColor: "#E1306C",
    iconBg: "rgba(225, 48, 108, 0.1)",
    urlPlaceholder: "https://instagram.com/seu_usuario",
    defaultTitle: "Instagram",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Compartilhe seus TikToks",
    category: "social",
    iconName: "Music2",
    iconColor: "#000000",
    iconBg: "rgba(0, 0, 0, 0.1)",
    urlPlaceholder: "https://tiktok.com/@seu_usuario",
    defaultTitle: "TikTok",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    description: "Exiba seus posts e tweets",
    category: "social",
    iconName: "Twitter",
    iconColor: "#000000",
    iconBg: "rgba(0, 0, 0, 0.1)",
    urlPlaceholder: "https://x.com/seu_usuario",
    defaultTitle: "X",
  },
  {
    id: "threads",
    name: "Threads",
    description: "Leve seu público ao Threads",
    category: "social",
    iconName: "AtSign",
    iconColor: "#000000",
    iconBg: "rgba(0, 0, 0, 0.1)",
    urlPlaceholder: "https://threads.net/@seu_usuario",
    defaultTitle: "Threads",
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Conecte sua página ou perfil",
    category: "social",
    iconName: "Facebook",
    iconColor: "#1877F2",
    iconBg: "rgba(24, 119, 242, 0.1)",
    urlPlaceholder: "https://facebook.com/sua_pagina",
    defaultTitle: "Facebook",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Mostre seu perfil profissional",
    category: "social",
    iconName: "Linkedin",
    iconColor: "#0A66C2",
    iconBg: "rgba(10, 102, 194, 0.1)",
    urlPlaceholder: "https://linkedin.com/in/seu_perfil",
    defaultTitle: "LinkedIn",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Compartilhe seus projetos",
    category: "social",
    iconName: "Github",
    iconColor: "#181717",
    iconBg: "rgba(24, 23, 23, 0.1)",
    urlPlaceholder: "https://github.com/seu_usuario",
    defaultTitle: "GitHub",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Convide para seu servidor",
    category: "social",
    iconName: "Gamepad2",
    iconColor: "#5865F2",
    iconBg: "rgba(88, 101, 242, 0.1)",
    urlPlaceholder: "https://discord.gg/seu_servidor",
    defaultTitle: "Discord",
  },
  {
    id: "twitch",
    name: "Twitch",
    description: "Acompanhe suas lives",
    category: "social",
    iconName: "Twitch",
    iconColor: "#9146FF",
    iconBg: "rgba(145, 70, 255, 0.1)",
    urlPlaceholder: "https://twitch.tv/seu_canal",
    defaultTitle: "Twitch",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    description: "Mostre suas inspirações",
    category: "social",
    iconName: "Pin",
    iconColor: "#E60023",
    iconBg: "rgba(230, 0, 35, 0.1)",
    urlPlaceholder: "https://pinterest.com/seu_perfil",
    defaultTitle: "Pinterest",
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Conecte-se no Telegram",
    category: "social",
    iconName: "Send",
    iconColor: "#0088CC",
    iconBg: "rgba(0, 136, 204, 0.1)",
    urlPlaceholder: "https://t.me/seu_usuario",
    defaultTitle: "Telegram",
  },

  // Media
  {
    id: "youtube",
    name: "YouTube",
    description: "Mostre seus vídeos e canal",
    category: "media",
    iconName: "Youtube",
    iconColor: "#FF0000",
    iconBg: "rgba(255, 0, 0, 0.1)",
    urlPlaceholder: "https://youtube.com/@seu_canal",
    defaultTitle: "YouTube",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Compartilhe sua música",
    category: "media",
    iconName: "Music",
    iconColor: "#1DB954",
    iconBg: "rgba(29, 185, 84, 0.1)",
    urlPlaceholder: "https://open.spotify.com/artist/...",
    defaultTitle: "Spotify",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    description: "Ouça suas tracks",
    category: "media",
    iconName: "Headphones",
    iconColor: "#FF5500",
    iconBg: "rgba(255, 85, 0, 0.1)",
    urlPlaceholder: "https://soundcloud.com/seu_perfil",
    defaultTitle: "SoundCloud",
  },
  {
    id: "podcast",
    name: "Podcast",
    description: "Ouça seu podcast",
    category: "media",
    iconName: "Podcast",
    iconColor: "#8940FA",
    iconBg: "rgba(137, 64, 250, 0.1)",
    urlPlaceholder: "https://...",
    defaultTitle: "Podcast",
  },
  {
    id: "music",
    name: "Música",
    description: "Link para sua música",
    category: "media",
    iconName: "Music",
    iconColor: "#1DB954",
    iconBg: "rgba(29, 185, 84, 0.1)",
    urlPlaceholder: "https://...",
    defaultTitle: "Música",
  },
  {
    id: "video",
    name: "Vídeo",
    description: "Compartilhe um vídeo",
    category: "media",
    iconName: "Video",
    iconColor: "#FF0000",
    iconBg: "rgba(255, 0, 0, 0.1)",
    urlPlaceholder: "https://...",
    defaultTitle: "Vídeo",
  },

  // Contact
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Conecte-se diretamente",
    category: "contact",
    iconName: "MessageCircleMore",
    iconColor: "#25D366",
    iconBg: "rgba(37, 211, 102, 0.1)",
    urlPlaceholder: "https://wa.me/5511999999999",
    defaultTitle: "WhatsApp",
  },
  {
    id: "email",
    name: "E-mail",
    description: "Entre em contato por e-mail",
    category: "contact",
    iconName: "Mail",
    iconColor: "#EA4335",
    iconBg: "rgba(234, 67, 53, 0.1)",
    urlPlaceholder: "mailto:seu@email.com",
    defaultTitle: "E-mail",
  },
  {
    id: "phone",
    name: "Telefone",
    description: "Ligue diretamente",
    category: "contact",
    iconName: "Phone",
    iconColor: "#34A853",
    iconBg: "rgba(52, 168, 83, 0.1)",
    urlPlaceholder: "tel:+5511999999999",
    defaultTitle: "Telefone",
  },
  {
    id: "telegram-contact",
    name: "Telegram",
    description: "Converse no Telegram",
    category: "contact",
    iconName: "Send",
    iconColor: "#0088CC",
    iconBg: "rgba(0, 136, 204, 0.1)",
    urlPlaceholder: "https://t.me/seu_usuario",
    defaultTitle: "Telegram",
  },

  // Commerce
  {
    id: "store",
    name: "Loja",
    description: "Acesse sua loja online",
    category: "commerce",
    iconName: "Store",
    iconColor: "#FF9900",
    iconBg: "rgba(255, 153, 0, 0.1)",
    urlPlaceholder: "https://sua-loja.com",
    defaultTitle: "Loja",
  },
  {
    id: "product",
    name: "Produto",
    description: "Destaque um produto",
    category: "commerce",
    iconName: "ShoppingBag",
    iconColor: "#FF6B6B",
    iconBg: "rgba(255, 107, 107, 0.1)",
    urlPlaceholder: "https://...",
    defaultTitle: "Produto",
  },
  {
    id: "payment",
    name: "Link de Pagamento",
    description: "Receba pagamentos",
    category: "commerce",
    iconName: "CreditCard",
    iconColor: "#635BFF",
    iconBg: "rgba(99, 91, 255, 0.1)",
    urlPlaceholder: "https://...",
    defaultTitle: "Pagamento",
  },
  {
    id: "donate",
    name: "Doação",
    description: "Receba apoio financeiro",
    category: "commerce",
    iconName: "Heart",
    iconColor: "#FF69B4",
    iconBg: "rgba(255, 105, 180, 0.1)",
    urlPlaceholder: "https://...",
    defaultTitle: "Apoie-me",
  },

  // Events
  {
    id: "calendar",
    name: "Calendário",
    description: "Agende um horário",
    category: "events",
    iconName: "Calendar",
    iconColor: "#4285F4",
    iconBg: "rgba(66, 133, 244, 0.1)",
    urlPlaceholder: "https://calendly.com/...",
    defaultTitle: "Agendar",
  },
  {
    id: "event",
    name: "Evento",
    description: "Divulgue seu evento",
    category: "events",
    iconName: "CalendarDays",
    iconColor: "#FF5722",
    iconBg: "rgba(255, 87, 34, 0.1)",
    urlPlaceholder: "https://...",
    defaultTitle: "Evento",
  },
  {
    id: "meetup",
    name: "Encontro",
    description: "Organize um encontro",
    category: "events",
    iconName: "Users",
    iconColor: "#00D084",
    iconBg: "rgba(0, 208, 132, 0.1)",
    urlPlaceholder: "https://...",
    defaultTitle: "Encontro",
  },
];

// Quick types for the top cards
export const QUICK_TYPES = [
  {
    id: "link",
    name: "Link",
    icon: "Link",
    description: "Link genérico",
  },
  {
    id: "page",
    name: "Página Interna",
    icon: "FileText",
    description: "Link para outra página sua",
  },
  {
    id: "header",
    name: "Cabeçalho",
    icon: "Type",
    description: "Texto separador",
  },
];

// URL detection patterns
interface UrlPattern {
  pattern: RegExp;
  templateId: string;
}

const URL_PATTERNS: UrlPattern[] = [
  { pattern: /instagram\.com/, templateId: "instagram" },
  { pattern: /tiktok\.com/, templateId: "tiktok-suggested" },
  { pattern: /youtube\.com|youtu\.be/, templateId: "youtube-suggested" },
  { pattern: /twitter\.com|x\.com/, templateId: "twitter" },
  { pattern: /spotify\.com/, templateId: "spotify-suggested" },
  { pattern: /whatsapp\.com|wa\.me/, templateId: "whatsapp-suggested" },
  { pattern: /linkedin\.com/, templateId: "linkedin" },
  { pattern: /github\.com/, templateId: "github" },
  { pattern: /discord\.gg|discord\.com/, templateId: "discord" },
  { pattern: /twitch\.tv/, templateId: "twitch" },
  { pattern: /pinterest\.com/, templateId: "pinterest" },
  { pattern: /t\.me|telegram\.me/, templateId: "telegram" },
  { pattern: /facebook\.com|fb\.com/, templateId: "facebook" },
  { pattern: /threads\.net/, templateId: "threads" },
  { pattern: /soundcloud\.com/, templateId: "soundcloud" },
];

export function detectPlatformFromUrl(url: string): LinkTemplate | null {
  const normalizedUrl = url.toLowerCase();
  
  for (const { pattern, templateId } of URL_PATTERNS) {
    if (pattern.test(normalizedUrl)) {
      return LINK_TEMPLATES.find((t) => t.id === templateId) || null;
    }
  }
  
  return null;
}

export function getTemplatesByCategory(categoryId: string): LinkTemplate[] {
  if (categoryId === "all") {
    return LINK_TEMPLATES;
  }
  if (categoryId === "suggested") {
    return LINK_TEMPLATES.filter((t) => t.category === "suggested");
  }
  return LINK_TEMPLATES.filter((t) => t.category === categoryId);
}
