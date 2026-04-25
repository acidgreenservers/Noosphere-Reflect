import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface MathJaxContextType {
  isLoaded: boolean;
  error: string | null;
  typeset: () => Promise<void>;
}

const MathJaxContext = createContext<MathJaxContextType>({
  isLoaded: false,
  error: null,
  typeset: async () => {},
});

interface MathJaxProviderProps {
  children: ReactNode;
}

const MathJaxProvider: React.FC<MathJaxProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded || window.MathJax) return;

    // Configure MathJax before loading
    window.MathJax = {
      tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
      svg: { fontCache: 'global' },
      startup: {
        typeset: false, // We'll trigger manually
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      },
    };

    // Load MathJax from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.id = 'MathJax-script';

    script.onload = () => {
      setIsLoaded(true);
      setError(null);
      console.log('[MathJax] Loaded successfully');
    };

    script.onerror = () => {
      setError('Failed to load MathJax');
      console.error('[MathJax] Failed to load');
    };

    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(script);
      delete window.MathJax;
    };
  }, [isLoaded]);

  const typeset = async () => {
    if (!isLoaded || window.MathJax?.loading) {
      return;
    }

    try {
      if (window.MathJax.typesetPromise) {
        await window.MathJax.typesetPromise();
      } else {
        const input = document.querySelectorAll('.MathJax, .mathjax-content');
        if (input.length > 0) {
          await new Promise<void>((resolve) => {
            window.MathJax.typesetPromise?.().then(resolve);
            // Fallback for older versions
            if (!window.MathJax.typesetPromise) {
              window.MathJax.startup.promise.then(() => resolve());
            }
          });
        }
      }
    } catch (err) {
      console.error('[MathJax] Typeset error:', err);
    }
  };

  return (
    <MathJaxContext.Provider value={{ isLoaded, error, typeset }}>
      {children}
    </MathJaxContext.Provider>
  );
};

export const useMathJax = () => useContext(MathJaxContext);
export default MathJaxProvider;