"use client";

import React from "react";
import Color from "color";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/shared/components/kibo-ui/color-picker";
import { Button } from "@shopvendly/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@shopvendly/ui/components/popover";
import { cn } from "@shopvendly/ui/lib/utils";
import { buttonVariants } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { getColorName } from "@/shared/lib/constants/colors";

interface HexPickerProps {
    onColorSelect: (hex: string) => void;
    className?: string;
}

export function HexPicker({ onColorSelect, className }: HexPickerProps) {
    const [tempColor, setTempColor] = React.useState("#FF0000");
    const [colorName, setColorName] = React.useState("Red");
    const [isManualName, setIsManualName] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = () => {
        // If it's a standard preset name and the hex matches exactly, just send the name
        // But for custom naming, we send Name:Hex
        onColorSelect(`${colorName}:${tempColor}`);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
                className={cn(buttonVariants({ variant: "outline" }), "flex h-11 items-center gap-3 px-4 rounded-full border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all font-medium text-sm text-neutral-600", className)}
                type="button"
            >
                <div 
                    className="size-5 rounded-full border shadow-sm" 
                    style={{ backgroundColor: tempColor }}
                />
                Custom Color
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-none shadow-2xl z-50">
                <ColorPicker 
                    value={tempColor}
                    onChange={(rgba: any) => {
                        if (Array.isArray(rgba)) {
                            const [r, g, b, a] = rgba;
                            const hex = Color.rgb(r, g, b).alpha(a).hex();
                            setTempColor(hex);
                            if (!isManualName) {
                                setColorName(getColorName(hex));
                            }
                        }
                    }}
                    className="rounded-xl border bg-background p-4 shadow-sm w-full space-y-4"
                >
                    <div className="h-40 w-full touch-none">
                        <ColorPickerSelection className="h-full w-full rounded-lg border shadow-inner touch-none" />
                    </div>
                    <div className="flex items-center gap-4">
                        <ColorPickerEyeDropper />
                        <div className="grid w-full gap-2 touch-none">
                            <ColorPickerHue className="touch-none" />
                            <ColorPickerAlpha className="touch-none" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Input 
                            placeholder="Color Name" 
                            value={colorName} 
                            onChange={(e) => {
                                setColorName(e.target.value);
                                setIsManualName(true);
                            }}
                            className="h-10 rounded-lg border-neutral-200 focus-visible:ring-1 text-base"
                        />
                        <p className="text-[10px] text-muted-foreground px-1">
                            Name your custom brand color (e.g. "Sky Blue")
                        </p>
                    </div>
                    <Button onClick={handleSelect} className="w-full">
                        Add Color
                    </Button>
                </ColorPicker>
            </PopoverContent>
        </Popover>
    );
}
