import {useEffect, useState} from 'react';

export const useLanguage = () => {
  const [language, setLanguage] = useState<string>(null!);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLanguage(window.navigator.language);
    } else {
      return;
    }
  }, []);
  return language;
};
