import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { getCompanyById } from '../../../data';
import type { ApprovalMatrixProps, ApprovalMatrixState, ApprovalPolicy } from '../domain';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface ApprovalMatrixPageProps {
  initialState?: ApprovalMatrixState;
  onStateChange?(next: ApprovalMatrixState): void;
}

export function ApprovalMatrixPage() {
  const { companyId } = useParams<{ companyId: string }>();

  const state: ApprovalMatrixState | null = useMemo(() => {
    if (!companyId) return null;
    const company = getCompanyById(companyId);
    if (!company) return null;

    // Seed with a simple, readable set of policies that mirror the blueprint:
    // - Day-to-day approvals below a threshold
    // - Higher-value spend requiring finance leadership
    // - Pay-runs with separate limits
    const policies: ApprovalPolicy[] = [
      {
        id: 'quote-standard',
        scope: 'company',
        appliesTo: 'quote',
        minAmount: 0,
        maxAmount: 25000,
        requiredApproverRoles: ['approver', 'finance'],
      },
      {
        id: 'quote-escalation',
        scope: 'company',
        appliesTo: 'quote',
        minAmount: 25000,
        maxAmount: undefined,
        requiredApproverRoles: ['finance', 'admin'],
      },
      {
        id: 'invoice-3wm',
        scope: 'company',
        appliesTo: 'invoice',
        minAmount: 0,
        maxAmount: 15000,
        requiredApproverRoles: ['system_3_way_match'],
      },
      {
        id: 'invoice-manual',
        scope: 'company',
        appliesTo: 'invoice',
        minAmount: 15000,
        maxAmount: undefined,
        requiredApproverRoles: ['finance'],
      },
      {
        id: 'pay-run',
        scope: 'portfolio',
        appliesTo: 'pay_run',
        minAmount: 0,
        maxAmount: undefined,
        requiredApproverRoles: ['finance', 'admin'],
      },
    ];

    return { company, policies };
  }, [companyId]);

  const propsSignature: ApprovalMatrixProps | null = state
    ? {
        state,
        onChangePolicy() {},
        onDeletePolicy() {},
      }
    : null;

  if (!propsSignature) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Approval matrix</h1>
        <p className="text-sm text-slate-600">No company found for ID: {companyId ?? '—'}.</p>
      </section>
    );
  }

  const { company, policies } = propsSignature.state;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Approval matrix</h1>
          <p className="text-sm text-slate-600">
            {company.name} · Define who can approve quotes, invoices, and pay runs — and when escalation is required.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            This aims to remove the &quot;authority limit invisibility&quot; highlighted in the service blueprint by
            making limits explicit.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <Badge variant="info">Prototype policy view</Badge>
          <p className="text-xs text-slate-500">
            Future iterations can make these rows editable and auditable.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Authority bands</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2 pr-3 font-medium text-slate-500">Object</th>
                <th className="py-2 pr-3 font-medium text-slate-500">Scope</th>
                <th className="py-2 pr-3 font-medium text-slate-500 text-right">Min</th>
                <th className="py-2 pr-3 font-medium text-slate-500 text-right">Max</th>
                <th className="py-2 pr-3 font-medium text-slate-500">Required roles</th>
                <th className="py-2 font-medium text-slate-500">Notes</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => {
                const objectLabel =
                  policy.appliesTo === 'quote'
                    ? 'Quote'
                    : policy.appliesTo === 'invoice'
                      ? 'Invoice'
                      : 'Pay run';
                const scopeLabel =
                  policy.scope === 'company' ? 'Company-wide' : policy.scope === 'location' ? 'Per location' : 'Portfolio';
                const min = policy.minAmount ?? 0;
                const max = policy.maxAmount;
                const rolesLabel = policy.requiredApproverRoles.join(', ');

                const isEscalationBand = max === undefined && min > 0;

                return (
                  <tr key={policy.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 pr-3">{objectLabel}</td>
                    <td className="py-1.5 pr-3 text-xs text-slate-500">{scopeLabel}</td>
                    <td className="py-1.5 pr-3 text-right">${min.toLocaleString()}</td>
                    <td className="py-1.5 pr-3 text-right">
                      {max !== undefined ? `$${max.toLocaleString()}` : 'No upper limit'}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className="text-xs text-slate-700">{rolesLabel}</span>
                    </td>
                    <td className="py-1.5 text-xs text-slate-500">
                      {policy.appliesTo === 'invoice' && policy.requiredApproverRoles.includes('system_3_way_match')
                        ? 'Auto-approve when 3-way match passes.'
                        : isEscalationBand
                          ? 'Escalation band — higher authority required.'
                          : 'Standard authority band.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Design notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
            <li>
              Authority bands should be visible wherever an approver is looking at a quote or invoice, so they know
              whether they&apos;re the right person to act.
            </li>
            <li>
              Auto-approval via 3-way match aligns with the blueprint&apos;s observation that ~68% of invoices can be
              safely automated, focusing attention on true exceptions.
            </li>
            <li>
              Escalation bands make &quot;Requires CFO&quot; explicit instead of forcing finance stakeholders to guess
              from context or tribal knowledge.
            </li>
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
