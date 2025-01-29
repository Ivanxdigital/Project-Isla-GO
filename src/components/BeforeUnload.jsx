import { useEffect } from 'react';

export default function BeforeUnload({ enabled, message }) {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!enabled) return;
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, message]);

  return null;
}