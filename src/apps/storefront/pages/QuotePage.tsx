import type { ChangeEvent } from 'react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineStack,
  Text,
  TextField,
} from '@shopify/polaris';

import { QuantityStepper } from '../components/QuantityStepper';
import { getProductByHandle } from '../data/storefrontData';
import { useStorefrontState } from '../state/StorefrontState';

interface CsvEntry {
  handle: string;
  quantity: number;
}

interface CsvParseResult {
  entries: CsvEntry[];
  errors: string[];
}

type UploadStatus = {
  tone: 'success' | 'warning' | 'critical';
  title: string;
  message?: string;
  errors?: string[];
};

function parseQuoteCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length && !line.startsWith('#'));

  if (!lines.length) {
    return { entries: [], errors: ['The CSV file is empty.'] };
  }

  const [firstLine, ...rest] = lines;
  const lowerFirstLine = firstLine.toLowerCase();
  const hasHeader = lowerFirstLine.includes('handle');
  const dataLines = hasHeader ? rest : lines;

  const entries: CsvEntry[] = [];
  const errors: string[] = [];

  dataLines.forEach((line, index) => {
    const rowNumber = hasHeader ? index + 2 : index + 1;
    const parts = line.split(',').map((part) => part.trim().replace(/^"|"$/g, ''));
    if (!parts.length) {
      errors.push(`Row ${rowNumber}: no data present.`);
      return;
    }

    const handle = parts[0];
    if (!handle) {
      errors.push(`Row ${rowNumber}: missing product handle.`);
      return;
    }

    const quantityRaw = parts[1];
    const quantityValue = quantityRaw ? Number(quantityRaw) : 1;
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      errors.push(`Row ${rowNumber}: quantity must be a positive number.`);
      return;
    }

    entries.push({ handle, quantity: Math.floor(quantityValue) });
  });

  return { entries, errors };
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function QuotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    state,
    quoteDraftCount,
    addToQuote,
    updateQuoteQuantity,
    removeQuoteItem,
    moveItemToCart,
    setQuoteDetails,
    submitQuote,
    prefillQuoteFromHistory,
  } = useStorefrontState();

  const presetProduct = searchParams.get('product');
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!presetProduct) return;
    const product = getProductByHandle(presetProduct);
    if (!product) return;
    const exists = state.quoteDraft.items.some((item) => item.handle === product.handle);
    if (exists) return;
    addToQuote(product.handle);
  }, [addToQuote, presetProduct, state.quoteDraft.items]);

  const quoteItems = useMemo(() => {
    return state.quoteDraft.items
      .map((item) => {
        const product = getProductByHandle(item.handle);
        if (!product) return undefined;
        return {
          ...item,
          product,
          lineTotal: product.price * item.quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [state.quoteDraft.items]);

  const quoteSubtotal = quoteItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const mostRecentQuote = state.quoteHistory[0];
  const recentSubmission = lastSubmissionId
    ? state.quoteHistory.find((record) => record.id === lastSubmissionId)
    : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const record = submitQuote();
    if (!record) return;
    setLastSubmissionId(record.id);
    setUploadStatus(null);
  };

  const handlePrefill = (quoteId: string) => {
    prefillQuoteFromHistory(quoteId);
    setLastSubmissionId(null);
    setUploadStatus(null);
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleCsvUpload(file);
    event.target.value = '';
  };

  const handleCsvUpload = async (file: File) => {
    setUploadPending(true);
    setUploadStatus(null);
    try {
      const text = await file.text();
      const { entries, errors: parseErrors } = parseQuoteCsv(text);
      const issues = [...parseErrors];

      if (!entries.length) {
        setUploadStatus({
          tone: 'critical',
          title: 'No valid rows found',
          message: issues.length ? issues.join(' ') : 'Ensure the CSV includes a handle and optional quantity column.',
          errors: issues.length ? issues : undefined,
        });
        return;
      }

      const aggregated = new Map<string, number>();
      entries.forEach(({ handle, quantity }) => {
        const current = aggregated.get(handle) ?? 0;
        aggregated.set(handle, current + quantity);
      });

      let added = 0;
      let updated = 0;

      aggregated.forEach((quantity, handle) => {
        const product = getProductByHandle(handle);
        if (!product) {
          issues.push(`Unknown product handle "${handle}".`);
          return;
        }

        const existing = state.quoteDraft.items.find((item) => item.handle === handle);
        if (existing) {
          updateQuoteQuantity(handle, quantity);
          updated += 1;
        } else {
          addToQuote(handle, quantity);
          added += 1;
        }
      });

      if (!added && !updated) {
        setUploadStatus({
          tone: 'critical',
          title: 'CSV import failed',
          message: issues.length
            ? issues.join(' ')
            : 'No matching products were found for the provided handles.',
          errors: issues.length ? issues : undefined,
        });
        return;
      }

      const summaryParts: string[] = [];
      if (added) summaryParts.push(`${added} new ${added === 1 ? 'item' : 'items'} added`);
      if (updated) summaryParts.push(`${updated} ${updated === 1 ? 'item' : 'items'} updated`);

      const tone: UploadStatus['tone'] = issues.length ? 'warning' : 'success';
      setUploadStatus({
        tone,
        title: issues.length ? 'CSV imported with warnings' : 'CSV import complete',
        message: summaryParts.join(', '),
        errors: issues.length ? issues : undefined,
      });
    } catch (error) {
      setUploadStatus({
        tone: 'critical',
        title: 'Unable to read CSV file',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while reading the file.',
      });
    } finally {
      setUploadPending(false);
    }
  };

  return (
    <div className="StorefrontQuote">
      <BlockStack gap="400">
        <BlockStack gap="150">
          <Text as="p" tone="subdued" variant="bodySm">
            Quote draft
          </Text>
          <Text as="h1" variant="headingXl">
            Stage a quote for your account team
          </Text>
          <Text as="p" tone="subdued">
            Add products, capture job site details, and send the request to sales. You can move line items between the
            cart and this quote as your needs change.
          </Text>
        </BlockStack>

        {recentSubmission ? (
          <Banner
            tone="success"
            title={`Quote ${recentSubmission.id} sent to sales`}
            onDismiss={() => setLastSubmissionId(null)}
          >
            <p>We’ll follow up within one business day with pricing and availability.</p>
          </Banner>
        ) : null}

        <div className="StorefrontQuote__Layout">
          <Card roundedAbove="sm">
            <Box padding="300">
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center" wrap>
                  <Text as="h2" variant="headingSm">
                    Line items ({quoteDraftCount})
                  </Text>
                  {state.quoteDraft.lastPrefillQuoteId ? (
                    <Text as="span" tone="subdued" variant="bodySm">
                      Prefilled from {state.quoteDraft.lastPrefillQuoteId}
                    </Text>
                  ) : null}
                </InlineStack>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <InlineStack gap="150" wrap>
                  <Button onClick={handleUploadButtonClick} loading={uploadPending}>
                    Upload CSV
                  </Button>
                  <Text as="span" tone="subdued" variant="bodySm">
                    Format: handle, quantity. Missing quantities default to 1.
                  </Text>
                </InlineStack>
                {uploadStatus ? (
                  <Banner tone={uploadStatus.tone} title={uploadStatus.title} onDismiss={() => setUploadStatus(null)}>
                    <BlockStack gap="100">
                      {uploadStatus.message ? <Text as="p">{uploadStatus.message}</Text> : null}
                      {uploadStatus.errors?.length ? (
                        <ul className="StorefrontQuote__UploadErrors">
                          {uploadStatus.errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      ) : null}
                    </BlockStack>
                  </Banner>
                ) : null}
                <Divider />
                {quoteItems.length ? (
                  <BlockStack gap="300">
                    {quoteItems.map((item) => (
                      <div key={item.handle} className="StorefrontQuoteItem">
                        <div className="StorefrontQuoteItem__Details">
                          <img src={item.product.image} alt={item.product.title} />
                          <BlockStack gap="100">
                            <BlockStack gap="050">
                              <Text as="h3" variant="headingSm">
                                {item.product.title}
                              </Text>
                              <Text as="span" tone="subdued" variant="bodySm">
                                {item.product.category}
                              </Text>
                            </BlockStack>
                            <Text as="p" tone="subdued" variant="bodySm">
                              {item.product.description}
                            </Text>
                            <Badge tone="info">{item.product.leadTime}</Badge>
                          </BlockStack>
                        </div>
                        <div className="StorefrontQuoteItem__Controls">
                          <QuantityStepper
                            value={item.quantity}
                            onChange={(next) => updateQuoteQuantity(item.handle, next)}
                          />
                          <Text as="span" variant="headingSm">
                            {currencyFormatter.format(item.lineTotal)}
                          </Text>
                          <InlineStack gap="100">
                            <Button variant="tertiary" onClick={() => moveItemToCart(item.handle)}>
                              Move to cart
                            </Button>
                            <Button variant="tertiary" onClick={() => removeQuoteItem(item.handle)}>
                              Remove
                            </Button>
                          </InlineStack>
                        </div>
                      </div>
                    ))}
                  </BlockStack>
                ) : (
                  <BlockStack gap="200" align="center" inlineAlign="center">
                    <Text as="p" tone="subdued">
                      No products in this quote yet. Add from the catalog or pull from a recent quote.
                    </Text>
                    <InlineStack gap="150" wrap align="center">
                      <Button onClick={() => navigate('/storefront/products')}>Browse catalog</Button>
                      {mostRecentQuote ? (
                        <Button variant="secondary" onClick={() => handlePrefill(mostRecentQuote.id)}>
                          Prefill from last quote
                        </Button>
                      ) : null}
                    </InlineStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Box>
          </Card>

          <Card roundedAbove="sm">
            <Box padding="300">
              <BlockStack gap="300" as="form" onSubmit={handleSubmit}>
                <BlockStack gap="100">
                  <Text as="h2" variant="headingSm">
                    Quote details
                  </Text>
                  <Text as="p" tone="subdued" variant="bodySm">
                    Include context so the merchant team can respond with accurate pricing and delivery options.
                  </Text>
                </BlockStack>

                <TextField
                  label="Team or job site name"
                  autoComplete="off"
                  value={state.quoteDraft.details.teamName}
                  onChange={(value) => setQuoteDetails({ teamName: value })}
                  placeholder="Downtown retrofit phase 2"
                />

                <TextField
                  label="Target delivery date"
                  autoComplete="off"
                  type="date"
                  value={state.quoteDraft.details.requestedDeliveryDate ?? ''}
                  onChange={(value) => setQuoteDetails({ requestedDeliveryDate: value })}
                />

                <TextField
                  label="Notes for the account team"
                  autoComplete="off"
                  multiline={4}
                  value={state.quoteDraft.details.notes}
                  onChange={(value) => setQuoteDetails({ notes: value })}
                  placeholder="Need staggered deliveries by crew size and job phase."
                />

                <BlockStack gap="150">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">
                      Estimated value
                    </Text>
                    <Text as="span" variant="headingMd">
                      {currencyFormatter.format(quoteSubtotal)}
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" wrap>
                    <Button variant="primary" submit disabled={!quoteItems.length}>
                      Submit quote request
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/storefront/cart')}>
                      Move items to cart
                    </Button>
                  </InlineStack>
                  <Text as="p" tone="subdued" variant="bodySm">
                    Submitting pushes the draft to the merchant console for follow up. You’ll receive a confirmation
                    email with next steps in a production build.
                  </Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </Card>
        </div>

        {mostRecentQuote ? (
          <Card roundedAbove="sm">
            <Box padding="300">
              <BlockStack gap="300">
                <BlockStack gap="050">
                  <Text as="h2" variant="headingSm">
                    Most recent submitted quote
                  </Text>
                  <Text as="span" tone="subdued" variant="bodySm">
                    Submitted {dateFormatter.format(new Date(mostRecentQuote.submittedAt))}
                  </Text>
                </BlockStack>
                <Divider />
                <BlockStack gap="200">
                  {mostRecentQuote.items.map((item) => {
                    const product = getProductByHandle(item.handle);
                    if (!product) return null;
                    return (
                      <InlineStack key={item.handle} align="space-between" blockAlign="center">
                        <BlockStack gap="050">
                          <Text as="span" variant="bodyMd">
                            {product.title}
                          </Text>
                          <Text as="span" tone="subdued" variant="bodySm">
                            Qty {item.quantity}
                          </Text>
                        </BlockStack>
                        <Text as="span" tone="subdued" variant="bodySm">
                          {currencyFormatter.format(product.price * item.quantity)}
                        </Text>
                      </InlineStack>
                    );
                  })}
                </BlockStack>
                <Divider />
                <InlineStack align="space-between">
                  <Text as="span" variant="headingSm">
                    Estimated value
                  </Text>
                  <Text as="span" variant="headingSm">
                    {currencyFormatter.format(
                      mostRecentQuote.items.reduce((sum, item) => {
                        const product = getProductByHandle(item.handle);
                        if (!product) return sum;
                        return sum + product.price * item.quantity;
                      }, 0),
                    )}
                  </Text>
                </InlineStack>
                <InlineStack gap="200" wrap>
                  <Button onClick={() => handlePrefill(mostRecentQuote.id)}>Prefill new quote</Button>
                  <Button variant="tertiary" onClick={() => navigate('/storefront/cart')}>
                    Copy items to cart
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        ) : null}
      </BlockStack>
    </div>
  );
}
