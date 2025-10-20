import { Card, Grid, Page, Text } from '@shopify/polaris';
import { Link } from 'react-router-dom';

const experiences = [
  {
    id: 'storefront',
    title: 'Storefront (Shopper)',
    description: 'Show the add-to-quote cart experience and hand-off to approvals.',
    to: '/storefront',
  },
  {
    id: 'cx',
    title: 'Customer Admin (Finance)',
    description: 'Demonstrate quote approvals, payment terms, and invoice oversight.',
    to: '/cx',
  },
  {
    id: 'mx',
    title: 'Merchant Admin',
    description: 'Walk through company management, customer lists, and merchant KPIs.',
    to: '/mx',
  },
];

export function ExperienceLanding() {
  return (
    <Page title="B2B experience switcher" subtitle="Choose a persona to explore the prototype">
      <Grid>
        {experiences.map((experience) => (
          <Grid.Cell key={experience.id} columnSpan={{ xs: 6, sm: 6, md: 4 }}>
            <Link to={experience.to} style={{ textDecoration: 'none' }}>
              <Card padding="500">
                <Text as="h3" variant="headingMd">
                  {experience.title}
                </Text>
                <Text as="p" tone="subdued">
                  {experience.description}
                </Text>
              </Card>
            </Link>
          </Grid.Cell>
        ))}
      </Grid>
    </Page>
  );
}
