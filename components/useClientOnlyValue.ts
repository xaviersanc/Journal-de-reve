/**
 * Hook web-only : retourne la valeur client même lors du rendu côté serveur (SSR non supporté nativement).
 * @param server Valeur à utiliser côté serveur (jamais utilisée ici)
 * @param client Valeur à utiliser côté client (toujours renvoyée)
 * @returns Toujours la valeur client (C), jamais la valeur serveur (S).
 */
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return client;
}
