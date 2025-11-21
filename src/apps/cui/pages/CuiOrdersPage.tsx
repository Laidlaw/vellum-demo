import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ORDER_CARDS } from '../../cx/data/orders';
import { getCompanyById } from '../../../data';
import { CUI_ACTIVE_COMPANY_ID } from '../config';
import { Badge } from '../../shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';

const ORDER_RELATIONSHIPS: Record<
  string,
  {
    quoteId?: string;
    invoiceId?: string;
  }
> = {
  // Treat this order as the one generated from the Q3 Maintenance Supplies quote/invoice.
  'order-1412': {
    quoteId: 'quote-2024-0156',
    invoiceId: 'inv-2024-0094',
  },
};

export function CuiOrdersPage() {
  const activeCompany = useMemo(() => getCompanyById(CUI_ACTIVE_COMPANY_ID) ?? null, []);

  const orders = useMemo(() => {
    if (!activeCompany) return [];
    const locationIds = new Set(activeCompany.locations.map((location) => location.id));
    return ORDER_CARDS.filter((order) => locationIds.has(order.locationId));
  }, [activeCompany]);

  const summary = useMemo(() => {
    const scoped = orders;
    const awaitingPayment = scoped.filter((order) =>
      order.fulfillmentLabel.toLowerCase().includes('payment'),
    );
    const awaitingApproval = scoped.filter((order) =>
      order.statusLabel.toLowerCase().includes('approval'),
    );
    const inTransit = scoped.filter((order) =>
      order.statusLabel.toLowerCase().includes('delivery') ||
      order.fulfillmentLabel.toLowerCase().includes('carrier'),
    );
    const totalValue = scoped.reduce((sum, order) => sum + order.total, 0);
    return {
      totalValue,
      awaitingPaymentCount: awaitingPayment.length,
      awaitingApprovalCount: awaitingApproval.length,
      inTransitCount: inTransit.length,
    };
  }, [orders]);

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-600">
          See orders in flight for this customer and how they relate to invoice and payment status.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Value in flight</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">${summary.totalValue.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Total order value for this customer.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Awaiting payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{summary.awaitingPaymentCount}</p>
            <p className="text-xs text-slate-500">Orders where fulfillment is ahead of payment.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In transit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{summary.inTransitCount}</p>
            <p className="text-xs text-slate-500">Orders currently moving through carriers.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea maxHeight={420}>
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 pr-3 font-medium text-slate-500">Order</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Fulfillment</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Items</th>
                  <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const relationship = ORDER_RELATIONSHIPS[order.id];
                  const orderHref = relationship?.invoiceId
                    ? `/cui/invoices/${relationship.invoiceId}/review`
                    : '/cui/orders';

                  return (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 pr-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            <Link to={orderHref} className="hover:underline">
                              {order.orderNumber}
                            </Link>
                          </span>
                          <span className="text-xs text-slate-500">{order.statusMeta}</span>
                          {relationship ? (
                            <span className="mt-0.5 text-[11px] text-slate-500">
                              {relationship.quoteId ? (
                                <>
                                  Quote{' '}
                                  <Link
                                    to={`/cui/quotes/${relationship.quoteId}`}
                                    className="text-sky-700 hover:underline"
                                  >
                                    {relationship.quoteId.replace('quote-', 'Q-').toUpperCase()}
                                  </Link>
                                </>
                              ) : null}
                              {relationship.quoteId && relationship.invoiceId ? ' · ' : ''}
                              {relationship.invoiceId ? (
                                <>
                                  Invoice{' '}
                                  <Link
                                    to={`/cui/invoices/${relationship.invoiceId}/review`}
                                    className="text-sky-700 hover:underline"
                                  >
                                    {relationship.invoiceId.replace('inv-', 'INV-').toUpperCase()}
                                  </Link>
                                </>
                              ) : null}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">
                        <Badge variant="info">{order.statusLabel}</Badge>
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">{order.fulfillmentLabel}</td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">{order.itemsCount}</td>
                      <td className="py-1.5 pr-3 text-right">${order.total.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  );
}
