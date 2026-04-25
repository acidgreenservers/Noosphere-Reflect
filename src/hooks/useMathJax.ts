import { useEffect, useState, useRef } from 'react';

interface UseMathJaxResult {
  isLoaded: boolean;
  typeset: (element?: HTMLElement) => Promise<void>;
}

declare global {
  interface Window {
    MathJax?: any;
  }
}

export const useMathJax = (): UseMathJaxResult => {
  const [isLoaded, setIsLoaded] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    console.log('[MathJax] Initializing...');

    // Configure MathJax before loading
    window.MathJax = {
      tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
      svg: { fontCache: 'global' },
      startup: {
        typeset: false,
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
      console.log('[MathJax] Script loaded, waiting for ready...');
      // Wait for MathJax to be fully ready
      window.MathJax.startup.promise?.then(() => {
        console.log('[MathJax] Startup complete');
        setIsLoaded(true);
      }).catch((err: Error) => {
        console.error('[MathJax] Startup error:', err);
        setIsLoaded(true); // Still set loaded even if startup fails
      });
    };

    script.onerror = (err: Event) => {
      console.error('[MathJax] Failed to load:', err);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.MathJax;
    };
  }, []);

  const typeset = async (element?: HTMLElement) => {
    console.log('[MathJax] Typeset called, isLoaded:', isLoaded, 'has MathJax:', !!window.MathJax);

    if (!isLoaded || window.MathJax?.loading) {
      console.log('[MathJax] Skipping typeset - not loaded or loading');
      return;
    }

    try {
      const target = element || document.body;
      console.log('[MathJax] Typesetting element:', target);

      if (window.MathJax.typesetPromise) {
        await window.MathJax.typesetPromise([target]);
        console.log('[MathJax] Typeset complete');
      } else {
        console.warn('[MathJax] typesetPromise not available');
      }
    } catch (err) {
      console.error('[MathJax] Typeset error:', err);
    }
  };

  return { isLoaded, typeset };
};

export default useMathJax;
