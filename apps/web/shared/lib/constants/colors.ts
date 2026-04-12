import Color from "color";

export const COLOR_MAP: Record<string, string> = {
    "Black": "#000000",
    "White": "#FFFFFF",
    "Grey": "#808080",
    "Brown": "#A52A2A",
    "Beige": "#F5F5DC",
    "Navy": "#000080",
    "Blue": "#0000FF",
    "Green": "#008000",
    "Olive": "#808000",
    "Yellow": "#FFFF00",
    "Orange": "#FFA500",
    "Red": "#FF0000",
    "Pink": "#FFC0CB",
    "Purple": "#800080",
    "Gold": "#FFD700",
    "Silver": "#C0C0C0",
    "Burgundy": "#800020",
    "Teal": "#008080",
    "Coral": "#FF7F50",
    "Cream": "#FFFDD0",
    "Sky": "#87CEEB",
    "Lavender": "#E6E6FA",
};

export const REVERSE_COLOR_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(COLOR_MAP).map(([name, hex]) => [hex.toLowerCase(), name])
);

export function getColorName(value: string | null): string {
    if (!value) return "";
    
    // Handle the Name:Hex format
    if (value.includes(":")) {
        return value.split(":")[0] || "";
    }

    if (!value.startsWith("#")) return value;
    
    const hex = value.toLowerCase();
    
    // Exact match check first
    if (REVERSE_COLOR_MAP[hex]) {
        return REVERSE_COLOR_MAP[hex];
    }

    // Closest match search
    try {
        const color = Color(hex);
        const rgb: any = color.rgb().object();
        let closestName = value; // Fallback to original hex
        let minDistance = Infinity;

        for (const [name, presetHex] of Object.entries(COLOR_MAP)) {
            const pColor: any = Color(presetHex).rgb().object();
            // Simple Euclidean distance in RGB space
            const distance = Math.pow((rgb.r ?? 0) - (pColor.r ?? 0), 2) +
                             Math.pow((rgb.g ?? 0) - (pColor.g ?? 0), 2) +
                             Math.pow((rgb.b ?? 0) - (pColor.b ?? 0), 2);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestName = name;
            }
        }
        
        return closestName;
    } catch {
        return value;
    }
}
