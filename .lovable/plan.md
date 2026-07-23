
# Plano: Botão "Copiar Link do Perfil" no Dashboard

## Objetivo
Adicionar um botão visível e intuitivo no dashboard (AppHome) para copiar o link público do perfil do usuário, facilitando o compartilhamento em redes sociais como Instagram.

## Alterações

### Arquivo: `src/pages/app/AppHome.tsx`

**1. Novos imports:**
- `Copy`, `Check` do lucide-react (ícones para feedback visual)
- `useProfile` para obter o handle do usuário
- `useState` para controlar estado do botão após cópia
- `useToast` para feedback de sucesso

**2. Substituir o card "Sua Página Pública":**

O card atual mostra apenas "Configure seu handle". Vou transformá-lo em:
- Se o usuário **tem handle**: mostrar o link completo com botão de copiar
- Se o usuário **não tem handle**: manter o comportamento atual

**3. Layout do novo card:**

```text
┌─────────────────────────────────────────┐
│  📤 Compartilhe sua Página              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ profile-nest-app.lovable.app/  │    │
│  │ @seuhandle                      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [🔗 Copiar Link]  [👁 Ver Página]      │
│                                         │
└─────────────────────────────────────────┘
```

**4. Funcionalidade de cópia:**
- Usar `navigator.clipboard.writeText()` 
- Trocar ícone para ✓ por 2 segundos após copiar
- Mostrar toast de confirmação

## Código a ser modificado

**Linhas 96-114** do `AppHome.tsx` - substituir o card existente por:

```tsx
<GlassCard className="p-6">
  <h3 className="text-lg font-semibold text-foreground mb-4">
    Compartilhe sua Página
  </h3>
  {profile?.handle ? (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
        <p className="text-sm text-muted-foreground mb-1">Seu link:</p>
        <p className="text-foreground font-medium break-all">
          {window.location.origin}/@{profile.handle}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleCopyLink} className="flex-1 rounded-xl">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copiado!" : "Copiar Link"}
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={`/@${profile.handle}`} target="_blank">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  ) : (
    // Estado sem handle configurado (mantém comportamento atual)
  )}
</GlassCard>
```

## Resumo das mudanças
| Local | Ação |
|-------|------|
| `src/pages/app/AppHome.tsx` | Adicionar lógica de cópia e novo card com botão |

## Comportamento esperado
1. Usuário com handle → vê seu link e pode copiar com 1 clique
2. Usuário sem handle → vê mensagem para configurar nas settings
3. Após copiar → feedback visual (ícone muda, toast aparece)
