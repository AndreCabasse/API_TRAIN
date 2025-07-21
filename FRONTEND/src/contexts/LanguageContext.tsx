// -*- coding: utf-8 -*-
// Copyright (c) 2025 André CABASSE 
// All rights reserved.
//
// This software is licensed under the MIT License.
// See the LICENSE file for details.
// Contact: andre.cabasse.massena@gmail.com

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the supported language types
export type Language = 'fr' | 'en' | 'da';

// Interface for the context value
interface LanguageContextType {
  language: Language; // Current selected language
  setLanguage: (lang: Language) => void; // Function to change language
}

// Create the context with undefined as default (for error handling)
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Props for the LanguageProvider component
interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * LanguageProvider component.
 * Provides the current language and a setter to all children via context.
 * Default language is French ('fr').
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // State to hold the current language, default is 'fr'
  const [language, setLanguage] = useState<Language>('fr');

  return (
    // Provide the language and setter to the context consumers
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Custom hook to access the language context.
 * Throws an error if used outside of LanguageProvider.
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};