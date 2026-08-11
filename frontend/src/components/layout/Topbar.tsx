import { useState, useEffect, useRef, useCallback } from 'react';
import { customerService, productService, orderService, challanService } from '../../services';
import { useSearch } from '../../context';
import { SearchIcon, MenuIcon, LogoutIcon } from '../icons/navIcons';

interface TopbarProps {
  pageTitle: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
  };
  onLogout: () => void;
  onMobileMenuToggle: () => void;
  onPageChange: (page: string) => void;
}

interface SearchResult {
  id: number;
  type: 'customer' | 'product' | 'order' | 'challan';
  label: string;
  sublabel: string;
  page: string;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function Topbar({ pageTitle, user, onLogout, onMobileMenuToggle, onPageChange }: TopbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { setPendingSearch } = useSearch();

  const runSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const [customersRes, productsRes, ordersRes, challansRes] = await Promise.all([
        customerService.getAllCustomers({ search: term, limit: 5 }),
        productService.getAllProducts({ search: term, limit: 5 }),
        orderService.getAllOrders({ search: term, limit: 5 }),
        challanService.getAllChallans({ search: term, limit: 5 }),
      ]);

      const found: SearchResult[] = [];

      (customersRes.data || []).forEach((c) => {
        found.push({
          id: c.id,
          type: 'customer',
          label: c.company_name,
          sublabel: c.contact_person || c.email,
          page: 'customers',
        });
      });

      (productsRes.data || []).forEach((p) => {
        found.push({
          id: p.id,
          type: 'product',
          label: p.name,
          sublabel: p.sku,
          page: 'products',
        });
      });

      (ordersRes.data || []).forEach((o) => {
        found.push({
          id: o.id,
          type: 'order',
          label: o.order_number,
          sublabel: o.customer_name || `Customer #${o.customer_id}`,
          page: 'orders',
        });
      });

      (challansRes.data || []).forEach((c) => {
        found.push({
          id: c.id,
          type: 'challan',
          label: c.challan_number,
          sublabel: c.customer_name || `Customer #${c.customer_id}`,
          page: 'challans',
        });
      });

      setResults(found.slice(0, 12));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        runSearch(searchTerm);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const typeLabels: Record<SearchResult['type'], string> = {
    customer: 'Customer',
    product: 'Product',
    order: 'Order',
    challan: 'Challan',
  };

  const handleSelectResult = (result: SearchResult) => {
    setPendingSearch(result.page, result.label);
    onPageChange(result.page);
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
    setShowMobileSearch(false);
  };

  const renderSearchDropdown = () =>
    showResults && searchTerm.trim() ? (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-navy-200 rounded-lg shadow-lg-premium max-h-80 overflow-y-auto z-50">
        {searching ? (
          <p className="px-4 py-3 text-sm text-navy-500">Searching...</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-3 text-sm text-navy-500">No results found</p>
        ) : (
          results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => handleSelectResult(result)}
              className="w-full text-left px-4 py-3 hover:bg-navy-50 border-b border-navy-100 last:border-0 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-navy-900 truncate">{result.label}</span>
                <span className="text-xs text-primary-600 shrink-0">{typeLabels[result.type]}</span>
              </div>
              <p className="text-xs text-navy-500 truncate mt-0.5">{result.sublabel}</p>
            </button>
          ))
        )}
      </div>
    ) : null;

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-white border-b border-navy-200 shadow-sm-premium">
      <div className="flex items-center gap-2 sm:gap-4 h-16 px-4 sm:px-6 min-w-0 w-full">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-navy-500 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        {/* Mobile page title — desktop uses in-page PageHeader */}
        <div className="lg:hidden min-w-0 shrink">
          <h1 className="text-base font-semibold text-navy-900 truncate">{pageTitle}</h1>
        </div>

        <div className="flex-1 min-w-0 hidden sm:flex justify-center px-2" ref={searchRef}>
          <div className="relative group w-full max-w-[700px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search customers, products, orders, challans..."
              aria-label="Global search"
              className="w-full pl-10 pr-4 py-2.5 border border-navy-200 rounded-lg text-sm bg-navy-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 placeholder-navy-400"
            />
            {renderSearchDropdown()}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden p-2 text-navy-500 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors"
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-navy-100 rounded-lg transition-colors group"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-sm-premium ring-2 ring-white shrink-0">
                <span className="text-white text-sm font-medium">{user?.first_name?.[0] || 'A'}</span>
              </div>
              <div className="hidden md:block text-left min-w-0">
                <p className="text-sm font-medium text-navy-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-navy-500 capitalize truncate">{user?.role || 'User'}</p>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-navy-400 transition-transform duration-200 hidden md:block shrink-0 ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} aria-hidden="true" />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg-premium border border-navy-200 py-1.5 z-20">
                  <div className="px-4 py-2 border-b border-navy-100">
                    <p className="text-sm font-medium text-navy-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-navy-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 flex items-center transition-colors"
                  >
                    <LogoutIcon className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showMobileSearch && (
        <div className="sm:hidden border-t border-navy-200 bg-white px-4 py-3" ref={searchRef}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search customers, products, orders, challans..."
              aria-label="Global search"
              className="w-full pl-10 pr-4 py-2.5 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              autoFocus
            />
            {renderSearchDropdown()}
          </div>
        </div>
      )}
    </header>
  );
}
