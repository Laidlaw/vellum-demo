import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BlockStack, Button, ButtonGroup, InlineStack, Text } from '@shopify/polaris';

import { ProductGrid } from '../components/ProductGrid';
import { highlightedCategories, products, type StorefrontCategory } from '../data/storefrontData';

type CategoryFilter = StorefrontCategory | 'All';

const categoryFilters: CategoryFilter[] = ['All', ...highlightedCategories];

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = (searchParams.get('category') as CategoryFilter | null) ?? 'All';

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [selectedCategory]);

  const handleCategoryChange = (category: CategoryFilter) => {
    if (category === 'All') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category });
    }
  };

  return (
    <div className="StorefrontCatalog">
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="p" tone="subdued" variant="bodySm">
            Catalog
          </Text>
          <InlineStack align="space-between">
            <Text as="h1" variant="headingXl">
              Shop the full catalog
            </Text>
            <Button variant="secondary" onClick={() => navigate('/storefront/quote')}>
              Build a quote
            </Button>
          </InlineStack>
          <Text as="p" tone="subdued">
            Browse industrial-grade power tools, safety gear, and material handling equipment ready for procurement
            teams. Select a category to filter the grid.
          </Text>
        </BlockStack>
        <ButtonGroup segmented>
          {categoryFilters.map((category) => (
            <Button
              key={category}
              pressed={selectedCategory === category}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </ButtonGroup>

        <ProductGrid
          products={filteredProducts}
          onViewProduct={(handle) => navigate(`/storefront/products/${handle}`)}
          showCategory
        />
      </BlockStack>
    </div>
  );
}
