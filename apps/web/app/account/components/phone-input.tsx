"use client";

import { Input } from "@shopvendly/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shopvendly/ui/components/select";

const COUNTRY_OPTIONS = [
  { code: "256", iso: "Ug", label: "Uganda", flag: "🇺🇬" },
  { code: "254", iso: "Ke", label: "Kenya", flag: "🇰🇪" },
];

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onValueChange: (v: string) => void;
  onCountryChange: (code: string) => void;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  countryCode,
  onValueChange,
  onCountryChange,
  disabled,
}: PhoneInputProps) {
  const selected = COUNTRY_OPTIONS.find((o) => o.code === countryCode);

  return (
    <div className="flex h-11 rounded-md border border-input bg-background text-sm focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20 overflow-hidden transition-all">
      <Select
        value={countryCode}
        onValueChange={(value) => {
          if (value) onCountryChange(value);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-11 min-w-[90px] shrink-0 rounded-none border-0 border-r border-input/60 bg-transparent px-3 text-sm font-medium text-foreground shadow-none focus-visible:ring-0 gap-1.5">
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span className="text-base leading-none">{selected?.flag}</span>
              <span className="text-xs font-medium text-foreground">+{selected?.code}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" side="bottom" sideOffset={6} alignItemWithTrigger={false} className="z-50 rounded-md min-w-[220px]">
          {COUNTRY_OPTIONS.map((opt) => (
            <SelectItem key={opt.code} value={opt.code}>
              <span className="flex items-center gap-2 text-sm">
                <span className="text-base">{opt.flag}</span>
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">(+{opt.code})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="tel"
        placeholder="780 000 000"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className="h-full flex-1 !w-auto min-w-0 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 px-3 text-sm"
      />
    </div>
  );
}

export { COUNTRY_OPTIONS };