import React, { useState } from 'react';
import { i18n } from '../lib/i18n';
import { RefreshCw, Globe, Book, CheckSquare } from 'lucide-react';

export function TranslationCommands() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCommand = async (command: string, term?: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      switch (command) {
        case 'update_locale':
          await i18n.updateLocale();
          setMessage('Successfully synchronized with current language');
          break;
          
        case 'translate_page':
          await i18n.translatePage();
          setMessage('Page translations refreshed');
          break;
          
        case 'term':
          if (term) {
            const translation = await i18n.getTechnicalTerm(term);
            setMessage(`Translation: ${translation}`);
          }
          break;
          
        case 'check_i18n':
          const stats = await i18n.checkCoverage();
          setMessage(
            `Translation Coverage:\n` +
            `Total Strings: ${stats.totalStrings}\n` +
            `Translated: ${stats.translatedStrings}\n` +
            `Coverage: ${stats.coverage.toFixed(1)}%`
          );
          break;
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg p-4 space-y-2">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleCommand('update_locale')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Globe className="w-4 h-4" />
          Update Locale
        </button>
        
        <button
          onClick={() => handleCommand('translate_page')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Translate Page
        </button>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter technical term"
            className="flex-1 px-3 py-2 border rounded"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommand('term', e.currentTarget.value);
              }
            }}
          />
          <button
            onClick={() => {
              const term = document.querySelector('input')?.value;
              if (term) handleCommand('term', term);
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            <Book className="w-4 h-4" />
            Translate
          </button>
        </div>
        
        <button
          onClick={() => handleCommand('check_i18n')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          <CheckSquare className="w-4 h-4" />
          Check Coverage
        </button>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      
      {message && (
        <pre className="mt-2 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
          {message}
        </pre>
      )}
    </div>
  );
}