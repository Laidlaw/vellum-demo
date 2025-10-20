import { useMemo } from 'react';
import {
  Badge,
  BlockStack,
  Card,
  Divider,
  Icon,
  InlineStack,
  Page,
  Text,
} from '@shopify/polaris';
import {
  CalendarIcon,
  CashDollarIcon,
  ContractIcon,
  NoteIcon,
  PaymentIcon,
} from '@shopify/polaris-icons';

import { useCustomerPortalContext, ALL_LOCATIONS_ID } from '../CustomerApp';
import { INVOICES, QUOTES, type Invoice, type Quote } from '../../../data';
import { formatCurrency, formatDateTime, formatTimeUntil } from '../../../utils/formatters';

type TimelineEventType =
  | 'quote_created'
  | 'quote_submitted'
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_expired'
  | 'invoice_issued'
  | 'invoice_due'
  | 'payment_posted';

interface TimelineEvent {
  id: string;
  occurredAt: string;
  type: TimelineEventType;
  title: string;
  description: string;
  locationId?: string;
}

function getEventIcon(type: TimelineEventType) {
  switch (type) {
    case 'quote_created':
    case 'quote_submitted':
    case 'quote_approved':
    case 'quote_rejected':
    case 'quote_expired':
      return ContractIcon;
    case 'invoice_issued':
      return PaymentIcon;
    case 'invoice_due':
      return CalendarIcon;
    case 'payment_posted':
      return CashDollarIcon;
    default:
      return NoteIcon;
  }
}

function getEventBadge(type: TimelineEventType): { tone: 'success' | 'attention' | 'critical' | 'info'; label: string } {
  switch (type) {
    case 'quote_submitted':
      return { tone: 'attention', label: 'Awaiting review' };
    case 'quote_approved':
      return { tone: 'success', label: 'Approved' };
    case 'quote_rejected':
      return { tone: 'critical', label: 'Rejected' };
    case 'quote_expired':
      return { tone: 'critical', label: 'Expired' };
    case 'invoice_due':
      return { tone: 'attention', label: 'Due soon' };
    case 'payment_posted':
      return { tone: 'success', label: 'Payment received' };
    case 'invoice_issued':
      return { tone: 'info', label: 'Invoice issued' };
    case 'quote_created':
    default:
      return { tone: 'info', label: 'Activity' };
  }
}

function getQuoteLocationId(quote: Quote, companyContactIds: Map<string, string | undefined>) {
  const contactLocation = companyContactIds.get(quote.requesterId);
  if (contactLocation) return contactLocation;
  if (quote.approverId) {
    const approverLocation = companyContactIds.get(quote.approverId);
    if (approverLocation) return approverLocation;
  }
  return undefined;
}

function getInvoiceLocationId(invoice: Invoice, quoteLocationId?: string) {
  if (quoteLocationId) return quoteLocationId;
  return undefined;
}

export function HistoryPage() {
  const { company, locations, activeLocationId } = useCustomerPortalContext();

  if (!company) {
    return (
      <Page title="History" subtitle="Audit trail of approvals and payments">
        <Card>
          <Text as="p" tone="subdued">
            Activity data is unavailable for this demo profile.
          </Text>
        </Card>
      </Page>
    );
  }

  const contactLocationLookup = useMemo(() => {
    const map = new Map<string, string | undefined>();
    company.contacts.forEach((contact) => {
      map.set(contact.id, contact.locationIds[0]);
    });
    return map;
  }, [company.contacts]);

  const locationLookup = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);

  const quoteEvents = useMemo<TimelineEvent[]>(() => {
    return QUOTES.filter((quote) => quote.companyId === company.id).flatMap((quote) => {
      const locationId = getQuoteLocationId(quote, contactLocationLookup);
      if (activeLocationId !== ALL_LOCATIONS_ID && locationId !== activeLocationId) {
        return [];
      }

      return quote.history.map<TimelineEvent>((event) => {
        let type: TimelineEventType = 'quote_created';
        if (event.type === 'submitted') type = 'quote_submitted';
        if (event.type === 'approved') type = 'quote_approved';
        if (event.type === 'rejected') type = 'quote_rejected';
        if (event.type === 'expired') type = 'quote_expired';

        const actor = event.actor ? ` by ${event.actor}` : '';
        const description =
          event.note ?? `Quote ${quote.quoteNumber} ${event.type === 'created' ? 'drafted' : event.type}${actor}.`;

        return {
          id: `${quote.id}-${event.id}`,
          occurredAt: event.occurredAt,
          type,
          title: `Quote ${quote.quoteNumber} ${event.type}`,
          description,
          locationId,
        };
      });
    });
  }, [ALL_LOCATIONS_ID, activeLocationId, company.id, contactLocationLookup]);

  const invoiceEvents = useMemo<TimelineEvent[]>(() => {
    return INVOICES.filter((invoice) => invoice.companyId === company.id).flatMap((invoice) => {
      const relatedQuote = invoice.quoteId ? QUOTES.find((quote) => quote.id === invoice.quoteId) : undefined;
      const quoteLocationId = relatedQuote ? getQuoteLocationId(relatedQuote, contactLocationLookup) : undefined;
      const locationId = getInvoiceLocationId(invoice, quoteLocationId);
      if (activeLocationId !== ALL_LOCATIONS_ID && locationId !== activeLocationId) {
        return [];
      }

      const events: TimelineEvent[] = [
        {
          id: `${invoice.id}-issued`,
          occurredAt: invoice.issuedAt,
          type: 'invoice_issued',
          title: `Invoice ${invoice.invoiceNumber} issued`,
          description: `Total ${formatCurrency(invoice.total.amount)} due ${formatDateTime(invoice.dueAt)}.`,
          locationId,
        },
        {
          id: `${invoice.id}-due`,
          occurredAt: invoice.dueAt,
          type: 'invoice_due',
          title: `Invoice ${invoice.invoiceNumber} due`,
          description: `Balance remaining: ${formatCurrency(invoice.balanceDue.amount)} (${formatTimeUntil(invoice.dueAt)}).`,
          locationId,
        },
      ];

      invoice.payments.forEach((payment) => {
        events.push({
          id: `${invoice.id}-payment-${payment.id}`,
          occurredAt: payment.processedAt,
          type: 'payment_posted',
          title: `Payment posted (${payment.method.toUpperCase()})`,
          description: `${formatCurrency(payment.amount.amount)} applied to ${invoice.invoiceNumber}.`,
          locationId,
        });
      });

      return events;
    });
  }, [ALL_LOCATIONS_ID, activeLocationId, company.id, contactLocationLookup]);

  const timelineEvents = useMemo(() => {
    const events = [...quoteEvents, ...invoiceEvents];
    return events.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }, [invoiceEvents, quoteEvents]);

  const activeLocationBadge =
    activeLocationId === ALL_LOCATIONS_ID
      ? `All ${locations.length} locations`
      : locationLookup.get(activeLocationId)?.name ?? 'Selected location';

  return (
    <Page
      title="History"
      subtitle="Audit trail of approvals and payments"
      secondaryActions={[{ content: 'Export timeline', icon: NoteIcon }]}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <InlineStack gap="200" blockAlign="center">
              <Badge tone="info">{activeLocationBadge}</Badge>
              <Text tone="subdued" variant="bodySm">
                {timelineEvents.length} events
              </Text>
            </InlineStack>
            <BlockStack gap="200">
              {timelineEvents.length === 0 ? (
                <Text tone="subdued">
                  No activity recorded for the selected location yet. Approvals, invoice events, and payments will appear
                  here when initiated.
                </Text>
              ) : (
                timelineEvents.map((event, index) => {
                  const icon = getEventIcon(event.type);
                  const badge = getEventBadge(event.type);
                  const location = event.locationId ? locationLookup.get(event.locationId) : undefined;

                  return (
                    <BlockStack key={event.id} gap="150">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={icon} tone="subdued" />
                        <BlockStack gap="050">
                          <InlineStack gap="150" blockAlign="center">
                            <Text variant="bodyMd" fontWeight="medium">
                              {event.title}
                            </Text>
                            <Badge tone={badge.tone}>{badge.label}</Badge>
                            {location ? <Badge tone="subdued">{location.code ?? location.name}</Badge> : null}
                          </InlineStack>
                          <Text tone="subdued" variant="bodySm">
                            {formatDateTime(event.occurredAt)}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <Text variant="bodyMd">{event.description}</Text>
                      {index < timelineEvents.length - 1 ? <Divider /> : null}
                    </BlockStack>
                  );
                })
              )}
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
