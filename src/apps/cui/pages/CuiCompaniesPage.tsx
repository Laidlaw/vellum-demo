import { Link } from 'react-router-dom';

import { COMPANY_INDEX } from '../../../data';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';

export function CuiCompaniesPage() {
  const companies = COMPANY_INDEX;

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Companies</h1>
        <p className="text-sm text-slate-600">
          Browse customers and jump into their finance profile, approvals, and credit exposure.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Customer list</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2 pr-3 font-medium text-slate-500">Company</th>
                <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                <th className="py-2 pr-3 font-medium text-slate-500 text-right">Orders</th>
                <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total sales</th>
                <th className="py-2 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{company.name}</span>
                      <span className="text-xs text-slate-500">{company.id}</span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-3 text-xs capitalize text-slate-600">{company.orderingStatus}</td>
                  <td className="py-1.5 pr-3 text-right">{company.totalOrders}</td>
                  <td className="py-1.5 pr-3 text-right">${company.totalSales.toLocaleString()}</td>
                  <td className="py-1.5">
                    <div className="flex flex-wrap gap-1 text-xs">
                      <Link
                        to={`/ccx/companies/${company.id}/finance`}
                        className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        Finance view
                      </Link>
                      <Link
                        to={`/cui/companies/${company.id}`}
                        className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        Admin view
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
