/**
 * Hook web-only : retourne toujours 'light' (pas de détection du thème système sur le web).
 * Ne prend pas de paramètres.
 * @returns La chaîne 'light' (mode clair forcé sur le web).
 */
export function useColorScheme() {
  return 'light';
}
