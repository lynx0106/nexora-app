"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = i18n.language || 'es';

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-zinc-500" />
      <div className="flex gap-1 text-sm">
        <button
          onClick={() => changeLanguage('es')}
          className={`px-2 py-1 rounded transition-colors ${
            currentLang.startsWith('es') 
              ? 'bg-zinc-200 text-zinc-900 font-medium' 
              : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`px-2 py-1 rounded transition-colors ${
            currentLang.startsWith('en') 
              ? 'bg-zinc-200 text-zinc-900 font-medium' 
              : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
