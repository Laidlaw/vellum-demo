import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { getCompanyById, getInvoicesForCompany } from '../../../data';
import type { CompanyFinanceProfileProps, CompanyFinanceProfileState } from '../domain';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface CompanyFinanceProfilePageProps {
  /**
   * In a real implementation, routing would provide the companyId and data loading would
   * construct a CompanyFinanceProfileState, then pass props into a presentational view.
   */
  initialState?: CompanyFinanceProfileState;
  onStateChange?(next: CompanyFinanceProfileState): void;
}

export function CompanyFinanceProfilePage() {
  const { companyId } = useParams<{ companyId: string }>();

  const state: CompanyFinanceProfileState | null = useMemo(() => {
    if (!companyId) return null;
    const company = getCompanyById(companyId);
    if (!company) return null;

    const credit = company.credit;
    const invoices = getInvoicesForCompany(company.id);
    const primaryContactEmail = company.mainContact;

    const taxProfile = {
      taxExempt: Boolean(company.taxExempt),
      taxId: company.notes?.includes('TAX-ID:') ? company.notes.split('TAX-ID:')[1]?.trim() : undefined,
      documentationStatus: company.taxExempt ? 'verified' : 'missing',
    } as CompanyFinanceProfileState['taxProfile'];

    const remittanceProfile = {
      preferredMethod: 'ach',
      remittanceInstructions: 'Refer to banking details on file; consolidate invoices by due date where possible.',
    };

    return {
      company,
      credit,
      paymentTerms: company.paymentTerms,
      primaryContactEmail,
      taxProfile,
      remittanceProfile,
    };
  }, [companyId]);

  const propsSignature: CompanyFinanceProfileProps | null = state
    ? {
        state,
        onChangePaymentTerms() {},
        onChangeTaxProfile() {},
        onChangeRemittanceProfile() {},
      }
    : null;

  if (!propsSignature) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Company finance profile</h1>
        <p className="text-sm text-slate-600">No company found for ID: {companyId ?? '—'}.</p>
      </section>
    );
  }

  const { company, credit, paymentTerms, taxProfile, remittanceProfile, primaryContactEmail } = propsSignature.state;

  const creditLimit = credit.creditLimit?.amount ?? 0;
  const creditUsed = credit.creditUsed?.amount ?? 0;
  const availableCredit = credit.availableCredit?.amount ?? creditLimit - creditUsed;
  const creditUtilization = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;

  const creditTone: 'default' | 'success' | 'warning' | 'critical' =
    creditUtilization < 60 ? 'success' : creditUtilization < 90 ? 'warning' : 'critical';

  const daysPastDue = credit.daysPastDue ?? 0;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{company.name}</h1>
          <p className="text-sm text-slate-600">Finance profile · Company ID: {company.id}</p>
          <p className="text-xs text-slate-500 mt-1">
            This view should make it obvious whether you can safely approve new spend without hunting across multiple
            tabs.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <Badge variant={creditTone}>Credit utilization: {creditUtilization}%</Badge>
          {daysPastDue > 0 ? (
            <p className="text-xs text-red-700">Past due: {daysPastDue} days</p>
          ) : (
            <p className="text-xs text-emerald-700">No invoices past due</p>
          )}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                {paymentTerms.type === 'net'
                  ? `Net ${paymentTerms.netDays ?? 0}`
                  : paymentTerms.type === 'due_on_receipt'
                    ? 'Due on receipt'
                    : 'Installments'}
              </p>
              {paymentTerms.discountPercent ? (
                <p className="mt-1 text-xs text-slate-500">
                  Early payment discount: {paymentTerms.discountPercent}% if paid within{' '}
                  {paymentTerms.netDays ?? 0} days.
                </p>
              ) : null}
              {paymentTerms.description ? (
                <p className="mt-2 text-xs text-slate-500">{paymentTerms.description}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                {taxProfile.taxExempt ? 'Tax exemption on file' : 'Tax documentation required'}
              </p>
              {taxProfile.taxId ? (
                <p className="mt-1 text-xs text-slate-500">Tax ID: {taxProfile.taxId}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Missing tax ID. Finance may need to pause approvals above a threshold.
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Status: {taxProfile.documentationStatus.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Remittance profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                Preferred method: {remittanceProfile.preferredMethod.toUpperCase()}
              </p>
              {remittanceProfile.bankName && remittanceProfile.accountLast4 ? (
                <p className="mt-1 text-xs text-slate-500">
                  {remittanceProfile.bankName} · Account ending in {remittanceProfile.accountLast4}
                </p>
              ) : null}
              {remittanceProfile.remittanceInstructions ? (
                <p className="mt-2 text-xs text-slate-500">{remittanceProfile.remittanceInstructions}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit line</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Credit limit</dt>
                  <dd className="font-medium">
                    {creditLimit ? `$${creditLimit.toLocaleString()}` : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Used</dt>
                  <dd>${creditUsed.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Available</dt>
                  <dd className="font-semibold">${availableCredit.toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                Accounts payable:{' '}
                {primaryContactEmail ? (
                  <a href={`mailto:${primaryContactEmail}`} className="text-sky-700 underline">
                    {primaryContactEmail}
                  </a>
                ) : (
                  'Not configured'
                )}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                In the new CX, this section should make it obvious who to loop in when an approval hits a policy limit
                (e.g., &quot;Requires CFO&quot;), addressing the authority-limit visibility gap from the blueprint.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

