import { useEffect, useState, useRef } from 'react';

export default function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Clean up previous observer if it exists
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const checkReady = () => {
      if (window.DeepSeekTranslate && typeof window.DeepSeekTranslate.init === 'function') {
        window.DeepSeekTranslate.init({
          autoDetect: true,
          supportedLanguages: ['en', 'ar', 'de', 'zh'],
          fallback: 'en'
        });
        
        // Initialize MutationObserver to watch for DOM changes
        observerRef.current = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Add data-i18n attributes to new text elements
                const walker = document.createTreeWalker(
                  element,
                  NodeFilter.SHOW_TEXT,
                  null
                );

                let textNode;
                while (textNode = walker.nextNode()) {
                  const text = textNode.textContent?.trim();
                  if (text && textNode.parentElement && !textNode.parentElement.hasAttribute('data-i18n')) {
                    textNode.parentElement.setAttribute('data-i18n', text);
                    if (window.DeepSeekTranslate?.currentLang !== 'en') {
                      textNode.parentElement.textContent = window.DeepSeekTranslate?.convert(text) || text;
                    }
                  }
                }

                // Translate existing data-i18n elements
                element.querySelectorAll('[data-i18n]').forEach(el => {
                  const key = el.getAttribute('data-i18n');
                  if (key && window.DeepSeekTranslate?.currentLang !== 'en') {
                    el.textContent = window.DeepSeekTranslate?.convert(key) || key;
                  }
                });
              }
            });
          });
        });

        // Start observing the document
        observerRef.current.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Initial translation of existing elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
          const text = el.textContent?.trim() || '';
          if (text) {
            el.setAttribute('data-i18n', text);
            if (window.DeepSeekTranslate?.currentLang !== 'en') {
              el.textContent = window.DeepSeekTranslate?.convert(text) || text;
            }
          }
        });

        setReady(true);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  }, []);

  if (!ready) return <div className="p-4">Loading translations...</div>;
  return <>{children}</>;
}