import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

type HugeIconType = typeof ArrowRight01Icon;

interface MenuItemProps {
    icon?: HugeIconType;
    label: string;
    href?: string;
    onClick?: () => void;
    danger?: boolean;
    highlight?: boolean;
    delay?: number;
}

export function MenuItem({
    icon,
    label,
    href,
    onClick,
    danger = false,
    highlight = false,
    delay = 0,
}: MenuItemProps) {
    const className = `group flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all active:scale-98 animate-in fade-in slide-in-from-left-2 duration-300 ${danger
            ? "text-red-600 hover:bg-red-50"
            : highlight
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-muted/40"
        }`;

    const content = (
        <>
            {icon && (
                <HugeiconsIcon
                    icon={icon}
                    size={20}
                    className={
                        danger
                            ? ""
                            : highlight
                                ? ""
                                : "text-muted-foreground group-hover:text-foreground transition-colors"
                    }
                />
            )}
            <span className="flex-1 text-left">{label}</span>
            {!danger && !highlight && (
                <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    className="text-muted-foreground/70 group-hover:text-foreground transition-colors"
                />
            )}
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                className={className}
                onClick={onClick}
                style={{ animationDelay: `${delay}ms` }}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            className={className}
            onClick={onClick}
            style={{ animationDelay: `${delay}ms` }}
        >
            {content}
        </button>
    );
}
