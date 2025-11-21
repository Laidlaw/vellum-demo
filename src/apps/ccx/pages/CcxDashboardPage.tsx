import { Link } from 'react-router-dom';

import type { CcxDashboardState } from '../domain';
import { COMPANY_INDEX } from '../../../data';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface CcxDashboardPageProps {
  state: CcxDashboardState;
}

export function CcxDashboardPage() {
  const companies = COMPANY_INDEX;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">CX-Ray dashboard</h1>
          <p className="text-sm text-slate-600">
            Start from a company and jump into its finance profile, approvals, credit exposure, or exceptions.
          </p>
        </div>
        <Badge variant="info">Prototype · domain-first</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{company.name}</span>
                    <span className="text-xs text-slate-500">({company.id})</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {company.totalOrders} orders · ${company.totalSales.toLocaleString()} lifetime sales
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    to={`/ccx/companies/${company.id}/finance`}
                    className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                  >
                    Finance profile
                  </Link>
                  <Link
                    to={`/ccx/companies/${company.id}/approvals`}
                    className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                  >
                    Approvals
                  </Link>
                  <Link
                    to={`/ccx/companies/${company.id}/credit`}
                    className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                  >
                    Credit exposure
                  </Link>
                  <Link
                    to={`/ccx/companies/${company.id}/exceptions`}
                    className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                  >
                    Exceptions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
