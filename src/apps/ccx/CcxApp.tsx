import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import type { CcxRouteDefinition } from './domain';
import { CCX_ROUTE_DEFINITIONS } from './domain';
import { COMPANIES } from '../../data';

interface CcxCompanyContextValue {
  currentCompanyId: string;
  setCurrentCompanyId: (companyId: string) => void;
}

const defaultCompanyId = COMPANIES[0]?.id ?? 'comp-abstract-industrial';

const CcxCompanyContext = createContext<CcxCompanyContextValue>({
  currentCompanyId: defaultCompanyId,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setCurrentCompanyId: () => {},
});

export function useCcxCompany() {
  return useContext(CcxCompanyContext);
}

interface CcxAppFrameProps {
  children: ReactNode;
}

function CcxAppFrame({ children }: CcxAppFrameProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(defaultCompanyId);

  const contextValue = useMemo(
    () => ({
      currentCompanyId,
      setCurrentCompanyId,
    }),
    [currentCompanyId],
  );

  return (
    <CcxCompanyContext.Provider value={contextValue}>
      <div
        style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont' }}
      >
        <nav
          style={{
            width: 260,
            borderRight: '1px solid #e5e5e5',
            padding: '1.5rem 1.25rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.08 }}>Prototype</div>
            <div style={{ fontWeight: 600 }}>CX-Ray (non-Polaris)</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, marginBottom: 4 }}>Company</div>
            <select
              value={currentCompanyId}
              onChange={(event) => {
                const nextId = event.target.value;
                setCurrentCompanyId(nextId);

                if (location.pathname.startsWith('/ccx/companies/')) {
                  const parts = location.pathname.split('/');
                  if (parts.length > 3) {
                    parts[3] = nextId;
                    const nextPath = parts.join('/');
                    navigate(nextPath + location.search + location.hash);
                  }
                } else if (location.pathname === '/ccx') {
                  navigate(`/ccx/companies/${nextId}/finance`);
                }
              }}
              style={{
                width: '100%',
                padding: '0.4rem 0.5rem',
                fontSize: '0.875rem',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
              }}
            >
              {COMPANIES.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {CCX_ROUTE_DEFINITIONS.map((route: CcxRouteDefinition) => {
              const isActive =
                route.path === '/ccx'
                  ? location.pathname === route.path
                  : location.pathname.startsWith(route.path.replace(/:.*$/, ''));

              const to = route.path
                .replace(/:companyId/g, currentCompanyId)
                .replace(/:invoiceId/g, 'inv-2024-0067');

              return (
                <li key={route.id}>
                  <Link
                    to={to}
                    style={{
                      display: 'block',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      color: isActive ? '#111827' : '#4b5563',
                      backgroundColor: isActive ? '#e5f0ff' : 'transparent',
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{route.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{route.description}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main style={{ flex: 1, padding: '1.5rem 2rem', boxSizing: 'border-box' }}>{children}</main>
      </div>
    </CcxCompanyContext.Provider>
  );
}

export function CcxApp() {
  return (
    <CcxAppFrame>
      <Outlet />
    </CcxAppFrame>
  );
}
