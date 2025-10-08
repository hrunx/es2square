import React, { useState } from 'react';
import { Phone, Mail, MapPin, Menu, X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header>
      {/* Top Bar */}
      <div className="bg-green-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <a href="tel:+1234567890" className="flex items-center gap-1 hover:text-green-200">
                <Phone className="w-4 h-4" />
                <span>(123) 456-7890</span>
              </a>
              <a href="mailto:info@es2.energy" className="flex items-center gap-1 hover:text-green-200">
                <Mail className="w-4 h-4" />
                <span>info@es2.energy</span>
              </a>
            </div>
            <div className="flex items-center gap-1 mt-2 sm:mt-0">
              <MapPin className="w-4 h-4" />
              <span className="text-center">123 Energy Street, Cityville, ST 12345</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <span className="text-2xl font-bold text-green-600">ES</span>
                <span className="text-2xl font-bold text-gray-900">²</span>
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <LanguageSwitcher />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="ml-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-600 hover:text-green-600">
                {window.DeepSeekTranslate?.convert('Services') ?? 'Services'}
              </a>
              <a href="#about" className="text-gray-600 hover:text-green-600">
                {window.DeepSeekTranslate?.convert('About') ?? 'About'}
              </a>
              <a href="#process" className="text-gray-600 hover:text-green-600">
                {window.DeepSeekTranslate?.convert('Process') ?? 'Process'}
              </a>
              <a href="#contact" className="text-gray-600 hover:text-green-600">
                {window.DeepSeekTranslate?.convert('Contact') ?? 'Contact'}
              </a>
              <LanguageSwitcher />
              <button className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors">
                {window.DeepSeekTranslate?.convert('Get Started') ?? 'Get Started'}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-4">
                <a href="#services" className="text-gray-600 hover:text-green-600 px-4">
                  {window.DeepSeekTranslate?.convert('Services') ?? 'Services'}
                </a>
                <a href="#about" className="text-gray-600 hover:text-green-600 px-4">
                  {window.DeepSeekTranslate?.convert('About') ?? 'About'}
                </a>
                <a href="#process" className="text-gray-600 hover:text-green-600 px-4">
                  {window.DeepSeekTranslate?.convert('Process') ?? 'Process'}
                </a>
                <a href="#contact" className="text-gray-600 hover:text-green-600 px-4">
                  {window.DeepSeekTranslate?.convert('Contact') ?? 'Contact'}
                </a>
                <button className="bg-green-600 text-white px-6 py-2 mx-4 rounded-full hover:bg-green-700 transition-colors">
                  {window.DeepSeekTranslate?.convert('Get Started') ?? 'Get Started'}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}