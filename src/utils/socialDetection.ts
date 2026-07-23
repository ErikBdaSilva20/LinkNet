export interface SocialPlatform {
  id: string;
  name: string;
  iconName: string;
  color: string;
}

const SOCIAL_PLATFORMS: Array<{
  id: string;
  name: string;
  iconName: string;
  color: string;
  patterns: RegExp[];
}> = [
  {
    id: "instagram",
    name: "Instagram",
    iconName: "Instagram",
    color: "#E4405F",
    patterns: [/instagram\.com/i],
  },
  {
    id: "tiktok",
    name: "TikTok",
    iconName: "Music2",
    color: "#000000",
    patterns: [/tiktok\.com/i],
  },
  {
    id: "twitter",
    name: "Twitter / X",
    iconName: "Twitter",
    color: "#1DA1F2",
    patterns: [/twitter\.com/i, /x\.com/i],
  },
  {
    id: "youtube",
    name: "YouTube",
    iconName: "Youtube",
    color: "#FF0000",
    patterns: [/youtube\.com/i, /youtu\.be/i],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    iconName: "Linkedin",
    color: "#0A66C2",
    patterns: [/linkedin\.com/i],
  },
  {
    id: "github",
    name: "GitHub",
    iconName: "Github",
    color: "#181717",
    patterns: [/github\.com/i],
  },
  {
    id: "twitch",
    name: "Twitch",
    iconName: "Twitch",
    color: "#9146FF",
    patterns: [/twitch\.tv/i],
  },
  {
    id: "facebook",
    name: "Facebook",
    iconName: "Facebook",
    color: "#1877F2",
    patterns: [/facebook\.com/i, /fb\.com/i],
  },
  {
    id: "spotify",
    name: "Spotify",
    iconName: "Music",
    color: "#1DB954",
    patterns: [/spotify\.com/i],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    iconName: "MessageCircle",
    color: "#25D366",
    patterns: [/wa\.me/i, /whatsapp\.com/i, /api\.whatsapp\.com/i],
  },
  {
    id: "telegram",
    name: "Telegram",
    iconName: "Send",
    color: "#26A5E4",
    patterns: [/t\.me/i, /telegram\.org/i],
  },
  {
    id: "discord",
    name: "Discord",
    iconName: "Gamepad2",
    color: "#5865F2",
    patterns: [/discord\.gg/i, /discord\.com/i],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    iconName: "Image",
    color: "#BD081C",
    patterns: [/pinterest\.com/i, /pin\.it/i],
  },
  {
    id: "snapchat",
    name: "Snapchat",
    iconName: "Ghost",
    color: "#FFFC00",
    patterns: [/snapchat\.com/i],
  },
  {
    id: "threads",
    name: "Threads",
    iconName: "AtSign",
    color: "#000000",
    patterns: [/threads\.net/i],
  },
];

/**
 * Detects the social platform from a given URL.
 * Returns platform info or null if not a known social platform.
 */
export function detectSocialPlatform(url: string | null | undefined): SocialPlatform | null {
  if (!url) return null;

  for (const platform of SOCIAL_PLATFORMS) {
    for (const pattern of platform.patterns) {
      if (pattern.test(url)) {
        return {
          id: platform.id,
          name: platform.name,
          iconName: platform.iconName,
          color: platform.color,
        };
      }
    }
  }

  return null;
}

/**
 * Check if a URL belongs to a known social platform.
 */
export function isSocialUrl(url: string | null | undefined): boolean {
  return detectSocialPlatform(url) !== null;
}
