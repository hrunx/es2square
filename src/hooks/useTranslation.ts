import { useState, useEffect } from 'react';

let translationsReady = false;

interface DeepSeekTranslate {
  convert: (text: string) => string;
  currentLang: string;
  setLanguage: (lang: string) => void;
  init: (config: { autoDetect: boolean; fallbackLang: string }) => void;
}

declare global {
  interface Window {
    DeepSeekTranslate?: DeepSeekTranslate;
  }
}

export function useTranslation() {
  const [isReady, setIsReady] = useState(translationsReady);

  useEffect(() => {
    if (!isReady) {
      const checkTranslation = () => {
        if (typeof window !== 'undefined' && window.DeepSeekTranslate?.convert instanceof Function) {
          translationsReady = true;
          setIsReady(true);
          
          // Add data-i18n attributes to all text nodes
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while (node = walker.nextNode()) {
            const text = node.textContent?.trim();
            if (text && node.parentElement && !node.parentElement.hasAttribute('data-i18n')) {
              node.parentElement.setAttribute('data-i18n', text);
              if (window.DeepSeekTranslate?.currentLang !== 'en') {
                node.parentElement.textContent = window.DeepSeekTranslate?.convert(text) || text;
              }
            }
          }
        } else {
          setTimeout(checkTranslation, 100);
        }
      };
      checkTranslation();
    }

    const handleTranslateReady = () => {
      translationsReady = true;
      setIsReady(true);
    };

    window.addEventListener('DSTranslateReady', handleTranslateReady);
    return () => {
      window.removeEventListener('DSTranslateReady', handleTranslateReady);
    };
  }, [isReady]);

  const t = (text: string): string => {
    if (!isReady || !window.DeepSeekTranslate?.convert) {
      return text;
    }
    try {
      return window.DeepSeekTranslate.convert(text);
    } catch {
      return text;
    }
  };

  return {
    t,
    isReady,
    currentLang: typeof window !== 'undefined' 
      ? window.DeepSeekTranslate?.currentLang || 'en' 
      : 'en'
  };
}