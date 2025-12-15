import { useState, useEffect } from "react";

/**
 * Hook para detectar media queries
 * Útil para responsive design y conditional rendering
 *
 * @param query - Media query string (ej: '(min-width: 768px)')
 * @returns Boolean indicando si la media query coincide
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *   </div>
 * );
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Verificar si window está disponible (SSR safety)
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Verificar si window está disponible
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Handler para cambios en la media query
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Agregar listener
    mediaQuery.addEventListener("change", handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}
