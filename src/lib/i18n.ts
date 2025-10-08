import { supabase } from './supabase';

interface TranslationStats {
  totalStrings: number;
  translatedStrings: number;
  coverage: number;
}

export const i18n = {
  async updateLocale(): Promise<void> {
    const currentLang = window.DeepSeekTranslate?.currentLang || 'en';
    const { data: existingTranslations, error } = await supabase
      .from('translations')
      .select('*')
      .eq('locale', currentLang);

    if (error) {
      throw new Error(`Failed to update locale: ${error.message}`);
    }

    // Update DeepSeek with existing translations
    existingTranslations?.forEach(translation => {
      window.DeepSeekTranslate?.setTranslation(
        translation.key,
        translation.value,
        currentLang
      );
    });
  },

  async translatePage(): Promise<void> {
    const elements = document.querySelectorAll('[data-i18n]');
    const currentLang = window.DeepSeekTranslate?.currentLang || 'en';

    for (const element of elements) {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const translation = window.DeepSeekTranslate?.convert(key);
        if (translation && translation !== key) {
          // Store new translation
          await supabase.from('translations').upsert({
            key,
            value: translation,
            locale: currentLang
          });
        }
      }
    }
  },

  async getTechnicalTerm(term: string): Promise<string> {
    const currentLang = window.DeepSeekTranslate?.currentLang || 'en';
    
    // First check cache
    const { data: cached } = await supabase
      .from('translations')
      .select('value')
      .eq('key', term)
      .eq('locale', currentLang)
      .single();

    if (cached?.value) {
      return cached.value;
    }

    // Get new translation
    const translation = window.DeepSeekTranslate?.convert(term) || term;
    
    // Cache the result
    await supabase.from('translations').insert({
      key: term,
      value: translation,
      locale: currentLang,
      type: 'technical'
    });

    return translation;
  },

  async checkCoverage(): Promise<TranslationStats> {
    const currentLang = window.DeepSeekTranslate?.currentLang || 'en';
    
    // Get all translatable strings
    const elements = document.querySelectorAll('[data-i18n]');
    const totalStrings = elements.length;

    // Get translated strings
    const { count } = await supabase
      .from('translations')
      .select('*', { count: 'exact' })
      .eq('locale', currentLang);

    const translatedStrings = count || 0;
    const coverage = totalStrings ? (translatedStrings / totalStrings) * 100 : 0;

    return {
      totalStrings,
      translatedStrings,
      coverage
    };
  }
};

declare global {
  interface Window {
    DeepSeekTranslate: {
      setLanguage: (lang: string) => void;
      currentLang: string;
      convert: (text: string) => string;
      setTranslation: (key: string, value: string, locale: string) => void;
    };
  }
}