import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from '@headlessui/react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'ko', name: '한국어' },
  { code: 'pl', name: 'Polski' }
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900">
        <GlobeAltIcon className="h-5 w-5" />
        <span>{t(`languages.${i18n.language}`)}</span>
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
        <div className="py-1">
          {languages.map((lang) => (
            <Menu.Item key={lang.code}>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } w-full text-left px-4 py-2 text-sm text-gray-700`}
                  onClick={() => i18n.changeLanguage(lang.code)}
                >
                  {t(`languages.${lang.code}`)}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}