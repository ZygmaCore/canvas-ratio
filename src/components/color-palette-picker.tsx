"use client";

import { PROJECT_COLORS } from "@/lib/palette";

type ColorPalettePickerProps = {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
};

export function ColorPalettePicker({
  value,
  onChange,
  disabled = false,
}: ColorPalettePickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {PROJECT_COLORS.map((color) => {
        const selected = color.hex === value;

        return (
          <button
            key={color.hex}
            type="button"
            disabled={disabled}
            onClick={() => onChange(color.hex)}
            aria-label={`Project color ${color.name} ${color.hex}`}
            title={color.name}
            className={`aspect-square min-h-10 border-2 border-[#1A1A1A] transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed ${
              selected
                ? "scale-105 shadow-[3px_3px_0_#1A1A1A] ring-4 ring-[#FFD91A]"
                : "hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1A1A1A]"
            }`}
            style={{ backgroundColor: color.hex }}
          />
        );
      })}
    </div>
  );
}
