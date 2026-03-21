"use client";

import Link from "next/link";
import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  InstagramIcon,
  Loading03Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { useRouter } from "next/navigation";
import { Button } from "@shopvendly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shopvendly/ui/components/dialog";
import { cn } from "@shopvendly/ui/lib/utils";

const GRID_CONTAINER_CLASS = "grid grid-cols-2 gap-3";
const INLINE_CONTAINER_CLASS = "flex items-center gap-2";
const GRID_CARD_CLASS =
  "flex h-14 items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 shadow-sm transition hover:bg-muted/60";
const INLINE_BUTTON_CLASS = "gap-2 rounded-md";

type HugeiconComponent = Parameters<typeof HugeiconsIcon>[0]["icon"];

type QuickAddLayout = "standalone" | "grid" | "inline";

interface QuickAction {
  label: string;
  href: string;
  icon: HugeiconComponent;
  external?: boolean;
}

interface SocialConnectConfig {
  enabled?: boolean;
  variant?: "default" | "compact";
  className?: string;
}

interface QuickAddLauncherProps {
  tenantId?: string;
  label?: string;
  layout?: QuickAddLayout;
  className?: string;
  actions?: QuickAction[];
  socialConnect?: SocialConnectConfig;
  shareAction?: QuickAction;
}

// ── Hooks & Helper Components (Actions) ──────────────────────────────────────
function useIntegrationStatus(storeId?: string) {
  const [igConnected, setIgConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    const run = async () => {
      try {
        const igRes = await fetch(
          `/api/integrations/instagram/status?storeId=${storeId}`,
        );
        if (!cancelled) {
          const ig = await igRes.json();
          setIgConnected(Boolean(ig?.connected));
        }
      } catch (e) {
        console.error("Failed to fetch integration status", e);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return { igConnected };
}

function SocialConnectButton({
  className,
  variant = "default",
  storeId,
  storeSlug,
}: {
  className?: string;
  variant?: "default" | "compact";
  storeId?: string;
  storeSlug?: string;
}) {
  const { igConnected } = useIntegrationStatus(storeId);
  const [linking, setLinking] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const connectInstagram = async () => {
    if (!storeSlug) return;
    setLinking("instagram");
    try {
      const { linkInstagram } = await import("@shopvendly/auth/client");
      await linkInstagram({
        callbackURL: `/admin/${storeSlug}?connected=true`,
      });
    } finally {
      setLinking(null);
    }
  };

  const shouldRenderInstagram = igConnected === false || igConnected === null;
  if (!storeId || !shouldRenderInstagram) return null;

  return (
    <div className={cn(className)}>
      {variant === "compact" ? (
        <Button
          variant="outline"
          size="sm"
          className={INLINE_BUTTON_CLASS}
          onClick={() => setModalOpen(true)}
        >
          <HugeiconsIcon icon={Share01Icon} className="h-4 w-4 text-primary" />
          Connect
        </Button>
      ) : (
        <button
          type="button"
          className={GRID_CARD_CLASS}
          onClick={() => setModalOpen(true)}
        >
          <HugeiconsIcon icon={Share01Icon} className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Connect</p>
        </button>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[92vw] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Connect socials</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {shouldRenderInstagram && (
              <button
                type="button"
                onClick={connectInstagram}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 text-left hover:bg-muted/40",
                  linking === "instagram" && "opacity-70",
                )}
                disabled={linking === "instagram"}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HugeiconsIcon icon={InstagramIcon} className="size-4" />
                </div>
                <span className="text-sm font-semibold">Instagram</span>
                {linking === "instagram" && (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="ml-auto size-4 animate-spin text-muted-foreground"
                  />
                )}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AddProductButtonProps {
  layout: QuickAddLayout;
  label: string;
  onClick: () => void;
}

function AddProductButton({ layout, label, onClick }: AddProductButtonProps) {
  if (layout === "grid") {
    return (
      <button type="button" onClick={onClick} className={GRID_CARD_CLASS}>
        <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{label}</span>
      </button>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className={INLINE_BUTTON_CLASS}
    >
      <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 text-primary" />
      {label}
    </Button>
  );
}

interface QuickActionLinkProps {
  action: QuickAction;
  layout: QuickAddLayout;
}

function QuickActionLink({ action, layout }: QuickActionLinkProps) {
  const sharedProps = {
    href: action.href,
    target: action.external ? "_blank" : undefined,
    rel: action.external ? "noreferrer" : undefined,
  } as const;

  if (layout === "grid") {
    return (
      <Link {...sharedProps} className={GRID_CARD_CLASS}>
        <HugeiconsIcon icon={action.icon} className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{action.label}</span>
      </Link>
    );
  }

  return (
    <Link {...sharedProps}>
      <Button variant="outline" size="sm" className={INLINE_BUTTON_CLASS}>
        <HugeiconsIcon icon={action.icon} className="h-4 w-4 text-primary" />
        {action.label}
      </Button>
    </Link>
  );
}

interface SocialConnectSlotProps {
  layout: QuickAddLayout;
  config: SocialConnectConfig;
  storeId?: string;
  storeSlug?: string;
}

function SocialConnectSlot({
  layout,
  config,
  storeId,
  storeSlug,
}: SocialConnectSlotProps) {
  if (!config.enabled) return null;

  const variant =
    config.variant ?? (layout === "inline" ? "compact" : "default");
  const promptClassName =
    layout === "grid" ? cn("h-14", config.className) : config.className;

  return (
    <SocialConnectButton
      className={promptClassName}
      variant={variant}
      storeId={storeId}
      storeSlug={storeSlug}
    />
  );
}

function getContainerClass(layout: QuickAddLayout, extraClass?: string) {
  if (layout === "standalone") return extraClass;
  const base =
    layout === "grid" ? GRID_CONTAINER_CLASS : INLINE_CONTAINER_CLASS;
  return cn(base, extraClass);
}

interface QuickActionsGroupProps {
  actions: QuickAction[];
  layout: QuickAddLayout;
}

function QuickActionsGroup({ actions, layout }: QuickActionsGroupProps) {
  if (!actions.length) return null;

  return (
    <>
      {actions.map((action) => (
        <QuickActionLink key={action.label} action={action} layout={layout} />
      ))}
    </>
  );
}

interface ShareActionSlotProps {
  action?: QuickAction;
  layout: QuickAddLayout;
}

function ShareActionSlot({ action, layout }: ShareActionSlotProps) {
  if (!action) return null;
  return <QuickActionLink action={action} layout={layout} />;
}

interface QuickAddContentProps {
  layout: QuickAddLayout;
  className?: string;
  label: string;
  actions: QuickAction[];
  shareAction?: QuickAction;
  socialConfig: SocialConnectConfig;
  storeId?: string;
  storeSlug?: string;
  onAdd: () => void;
}

function QuickAddContent({
  layout,
  className,
  label,
  actions,
  shareAction,
  socialConfig,
  storeId,
  storeSlug,
  onAdd,
}: QuickAddContentProps) {
  const content = (
    <>
      <AddProductButton layout={layout} label={label} onClick={onAdd} />
      <QuickActionsGroup actions={actions} layout={layout} />
      <SocialConnectSlot
        layout={layout}
        config={socialConfig}
        storeId={storeId}
        storeSlug={storeSlug}
      />
      <ShareActionSlot action={shareAction} layout={layout} />
    </>
  );

  if (layout === "standalone") {
    return className ? <div className={className}>{content}</div> : content;
  }

  return <div className={getContainerClass(layout, className)}>{content}</div>;
}

// ── Component ────────────────────────────────────────────────────────────────
export function QuickAddLauncher({
  tenantId: tenantIdProp,
  label = "Add product",
  layout,
  className,
  actions = [],
  socialConnect,
  shareAction,
}: QuickAddLauncherProps) {
  const { bootstrap } = useTenant();
  const router = useRouter();
  const storeSlug = bootstrap?.storeSlug;

  const handleAdd = React.useCallback(() => {
    if (!storeSlug) return;
    router.push(`/admin/${storeSlug}/products/new`);
  }, [router, storeSlug]);

  const hasExtras =
    actions.length > 0 ||
    Boolean(shareAction) ||
    Boolean(socialConnect?.enabled);
  const resolvedLayout: QuickAddLayout =
    layout ?? (hasExtras ? "inline" : "standalone");
  const resolvedSocialConfig: SocialConnectConfig = {
    enabled: socialConnect?.enabled ?? false,
    variant: socialConnect?.variant,
    className: socialConnect?.className ?? "",
  };

  return (
    <QuickAddContent
      layout={resolvedLayout}
      className={className}
      label={label}
      actions={actions}
      shareAction={shareAction}
      socialConfig={resolvedSocialConfig}
      storeId={bootstrap?.storeId}
      storeSlug={storeSlug}
      onAdd={handleAdd}
    />
  );
}

