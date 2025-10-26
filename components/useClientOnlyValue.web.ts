import React from 'react';

// `useEffect` is not invoked during server rendering, meaning
// we can use this to determine if we're on the server or not.
/**
 * Hook web-only : retourne la valeur client après le montage, sinon la valeur serveur (SSR).
 * @param server Valeur à utiliser côté serveur (rendu initial)
 * @param client Valeur à utiliser côté client (après montage)
 * @returns La valeur serveur lors du SSR, puis la valeur client après le montage (hydratation).
 */
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  const [value, setValue] = React.useState<S | C>(server);
  React.useEffect(() => {
    setValue(client);
  }, [client]);

  return value;
}
