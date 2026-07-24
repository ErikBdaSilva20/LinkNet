import { useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { useProfile } from "@/hooks/useProfile";
import { useActivePage } from "@/contexts/ActivePageContext";
import { X, QrCode } from "lucide-react";

interface QrCodeSectionProps {
  onClose: () => void;
}

/**
 * Gerador de QR code (da página pública ou de uma URL customizada) — extraído de
 * ShortLinksScreen.tsx. Não tem nenhuma relação de dado com short links (não lê
 * `shortLinks`/`clickCounts`), só compartilhava a tela por conveniência de navegação.
 */
export function QrCodeSection({ onClose }: QrCodeSectionProps) {
  const { profile } = useProfile();
  const { page } = useActivePage();

  const [qrTarget, setQrTarget] = useState<string>("page");
  const [qrCustomUrl, setQrCustomUrl] = useState("");

  const qrUrl = useMemo(() => {
    if (qrTarget === "custom") {
      return qrCustomUrl.trim() || null;
    }
    const base = page?.custom_domain ? `https://${page.custom_domain}` : window.location.origin;
    return profile?.handle ? `${base}/${profile.handle}` : null;
  }, [qrTarget, qrCustomUrl, profile?.handle, page?.custom_domain]);

  return (
    <GlassCard className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <QrCode className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Gerar QR Code</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Selecionar destino</Label>
          <Select value={qrTarget} onValueChange={setQrTarget}>
            <SelectTrigger className="input-styled">
              <SelectValue placeholder="Escolha o destino do QR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page">
                Minha Página (/{profile?.handle || "..."})
              </SelectItem>
              <SelectItem value="custom">Link personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {qrTarget === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="qr-custom-url">URL personalizada</Label>
            <Input
              id="qr-custom-url"
              placeholder="https://..."
              value={qrCustomUrl}
              onChange={(e) => setQrCustomUrl(e.target.value)}
              className="input-styled"
            />
          </div>
        )}

        {qrUrl ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">URL do QR Code:</p>
              <p className="text-sm font-mono text-foreground break-all">{qrUrl}</p>
            </div>
            <QRCodeGenerator
              value={qrUrl}
              size={200}
              label={qrTarget === "page" ? profile?.handle || "page" : qrTarget}
            />
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-muted/30 border border-border/50">
            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {!profile?.handle
                ? "Configure seu handle nas configurações de perfil primeiro."
                : "Selecione um destino para gerar o QR Code."}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
