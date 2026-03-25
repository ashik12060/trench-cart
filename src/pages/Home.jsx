import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/api/storeClient';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import DealSection from '@/components/home/DealSection';
import PromoBanner from '@/components/home/PromoBanner';
import BrandShowcase from '@/components/home/BrandShowcase';

export default function Home() {
  const { data: featuredProducts = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => storeApi.entities.Product.filter({ featured: true, is_active: true }, '-created_date', 10),
  });

  const { data: allProducts = [], isLoading: loadingAll } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => storeApi.entities.Product.list('-created_date', 12),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['home-categories'],
    queryFn: () => storeApi.entities.Category.filter({ is_active: true }, 'sort_order'),
  });

  const categoryHighlights = categories.slice(0, 2).map((category) => ({
    title: category.name,
    products: allProducts.filter((product) => product.category_id === category.id).slice(0, 4),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-2">
      <HeroBanner />
      <DealSection
        title="ðŸ”¥ Grab the Best Deals"
        products={featuredProducts.slice(0, 5)}
        loading={loadingFeatured}
      />
      <CategoryGrid />
      <PromoBanner />
      <BrandShowcase />
      {categoryHighlights.map((section) =>
        section.products.length > 0 ? (
          <DealSection
            key={section.title}
            title={`Top ${section.title}`}
            products={section.products}
            loading={loadingAll}
          />
        ) : null,
      )}
    </div>
  );
}
