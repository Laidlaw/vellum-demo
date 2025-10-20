import type { StorefrontProduct } from '../data/storefrontData';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: StorefrontProduct[];
  onViewProduct: (handle: string) => void;
  showCategory?: boolean;
}

export function ProductGrid({ products, onViewProduct, showCategory }: ProductGridProps) {
  if (!products.length) {
    return <div className="StorefrontProductGrid StorefrontProductGrid--empty">No products yet.</div>;
  }

  return (
    <div className="StorefrontProductGrid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewProduct={onViewProduct}
          showCategory={showCategory}
        />
      ))}
    </div>
  );
}
