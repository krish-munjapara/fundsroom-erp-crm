import React, { createContext, useContext, useState, useCallback } from 'react';

interface SearchContextType {
  pendingSearch: { page: string; term: string } | null;
  setPendingSearch: (page: string, term: string) => void;
  consumePendingSearch: (page: string) => string | null;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingSearch, setPendingSearchState] = useState<{ page: string; term: string } | null>(null);

  const setPendingSearch = useCallback((page: string, term: string) => {
    setPendingSearchState({ page, term });
  }, []);

  const consumePendingSearch = useCallback((page: string) => {
    if (pendingSearch?.page === page) {
      const term = pendingSearch.term;
      setPendingSearchState(null);
      return term;
    }
    return null;
  }, [pendingSearch]);

  return (
    <SearchContext.Provider value={{ pendingSearch, setPendingSearch, consumePendingSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export function useSearch(): SearchContextType {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return ctx;
}
