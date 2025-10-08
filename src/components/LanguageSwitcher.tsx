import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '简体中文' }
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentLang(window.DeepSeekTranslate?.currentLang || 'en');

    const handleLanguageChange = (e: CustomEvent) => {
      setCurrentLang(e.detail);
      translateAllElements();
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  const translateAllElements = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = window.DeepSeekTranslate?.convert(key) || key;
      }
    });
  };

  const handleLanguageChange = (code: string) => {
    if (window.DeepSeekTranslate) {
      window.DeepSeekTranslate.setLanguage(code);
      setCurrentLang(code);
      translateAllElements();
    }
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm">{currentLang.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                currentLang === lang.code ? 'text-green-600 font-medium' : 'text-gray-700'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { LanguageSwitcher }