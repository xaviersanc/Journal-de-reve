import React, { createContext, useContext, useState } from 'react';

export type SearchCriteria = {
  search?: string;
  type?: 'lucid' | 'nightmare' | 'pleasant' | '';
  character?: string;
  periodStart?: string;
  periodEnd?: string;
  tag?: string;
};

const SearchContext = createContext<{
  criteria: SearchCriteria;
  setCriteria: (c: SearchCriteria) => void;
}>({
  criteria: {},
  setCriteria: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [criteria, setCriteria] = useState<SearchCriteria>({});
  return (
    <SearchContext.Provider value={{ criteria, setCriteria }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
