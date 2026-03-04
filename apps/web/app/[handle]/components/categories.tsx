"use client";

type StorefrontView = "products" | "inspiration";

interface CategoriesProps {
  activeView: StorefrontView;
  onChangeView: (view: StorefrontView) => void;
  showInspiration: boolean;
}

const VIEW_OPTIONS: Array<{ key: StorefrontView; label: string }> = [
  { key: "products", label: "All Products" },
  { key: "inspiration", label: "Inspiration" },
];

const getButtonClassName = (isActive: boolean) =>
  [
    "h-9 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-all duration-150",
    isActive
      ? "border-border bg-background text-foreground shadow-xs"
      : "border-transparent bg-muted/55 text-foreground/80 hover:bg-muted",
  ].join(" ");

export function Categories({ activeView, onChangeView, showInspiration }: CategoriesProps) {
  const visibleOptions = showInspiration
    ? VIEW_OPTIONS
    : VIEW_OPTIONS.filter((option) => option.key !== "inspiration");

  return (
    <nav
      id="storefront-categories-rail"
      className="border-px border-border bg-background sticky top-0 z-10"
    >
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="mx-auto flex w-max min-w-full items-center justify-center gap-1.5 sm:gap-2 py-3">
            {visibleOptions.map((option) => {
              const isActive = activeView === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onChangeView(option.key)}
                  className={getButtonClassName(isActive)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}