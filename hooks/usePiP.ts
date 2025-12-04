import { useState, useCallback, useEffect } from 'react';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    documentPictureInPicture: {
      requestWindow(options: { width: number; height: number }): Promise<Window>;
      window: Window | null;
    };
  }
}

export const usePiP = () => {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const togglePiP = useCallback(async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    if (!('documentPictureInPicture' in window)) {
      alert("当前浏览器不支持文档画中画 API (Document Picture-in-Picture)。请尝试使用 Chrome 116+ 版本。");
      return;
    }

    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 380,
        height: 650,
      });

      // Copy styles
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pip.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = styleSheet.type;
          link.media = styleSheet.media.toString();
          link.href = styleSheet.href || '';
          pip.document.head.appendChild(link);
        }
      });
      
      // Copy Tailwind CDN if present in head
      const tailwindScript = document.querySelector('script[src*="tailwindcss"]');
      if(tailwindScript) {
        const script = document.createElement('script');
        script.src = tailwindScript.getAttribute('src') || '';
        pip.document.head.appendChild(script);
      }
      
      // Add dark mode class
      pip.document.documentElement.classList.add('dark');
      pip.document.body.classList.add('bg-gray-950', 'text-white');

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (err) {
      console.error("Failed to open PiP window:", err);
    }
  }, [pipWindow]);

  return { pipWindow, togglePiP };
};