import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from '@headlessui/react';
import { GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// Language options with their codes, names, and flag emojis
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' }
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  
  // Find the current language object
  const currentLanguage = languages.find(lang => 
    i18n.language === lang.code || i18n.language.startsWith(lang.code + '-')
  ) || languages[0]; // Default to English if not found

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 rounded-md border border-gray-200 bg-white shadow-sm transition-all hover:bg-gray-50">
        <GlobeAltIcon className="h-5 w-5 text-gray-500" />
        <span className="flex items-center">
          <span className="mr-2">{currentLanguage.flag}</span>
          <span>{currentLanguage.name}</span>
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
        <div className="py-1">
          {languages.map((lang) => (
            <Menu.Item key={lang.code}>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center`}
                  onClick={() => i18n.changeLanguage(lang.code)}
                >
                  <span className="mr-3 text-lg">{lang.flag}</span>
                  {lang.name}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}