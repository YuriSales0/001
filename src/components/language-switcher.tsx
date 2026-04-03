"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "en", label: "English", flag: "EN" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "sv", label: "Svenska", flag: "SV" },
];

interface LanguageSwitcherProps {
  currentLocale?: string;
  onChange?: (locale: string) => void;
}

export function LanguageSwitcher({ currentLocale = "en", onChange }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState(currentLocale);

  const handleChange = (code: string) => {
    setLocale(code);
    setOpen(false);
    onChange?.(code);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(!open)}
      >
        <Globe className="h-3.5 w-3.5" />
        {languages.find((l) => l.code === locale)?.flag}
      </Button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 rounded-md border bg-white py-1 shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                locale === lang.code ? "text-navy-900 font-medium" : "text-gray-600"
              }`}
            >
              <span className="text-xs font-mono w-5">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
