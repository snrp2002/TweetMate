import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Minimal replacement for `react-router-hash-link`, which is unmaintained and
 * ships no TypeScript types.
 *
 * Navigates to `path` if needed, then smooth-scrolls to `#elementId`.
 */
export function useScrollToHash(path: string, elementId: string): () => void {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const scroll = () => {
      requestAnimationFrame(() => {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    if (location.pathname !== path) {
      void navigate(path);
      // Wait for the destination route to mount before scrolling.
      setTimeout(scroll, 60);
    } else {
      scroll();
    }
  }, [navigate, location.pathname, path, elementId]);
}
