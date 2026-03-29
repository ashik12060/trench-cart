import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/api/storeClient';
import { createPageUrl } from '@/utils';
import { ChevronRight, ArrowUpRight } from 'lucide-react';

const defaultImages = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80",
  "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
];

export default function CategoryGrid() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['category-grid'],
    queryFn: () => storeApi.entities.Category.filter({ is_active: true }, 'sort_order'),
  });

  const activeCategories = useMemo(
    () => categories.slice(0, 8),
    [categories],
  );

  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Discover by category</h2>
        <div className="text-sm font-medium text-blue-600 flex items-center gap-1">
          <span>View all</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3  lg:grid-cols-6 gap-4">
        {isLoading
          ? Array(4)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="aspect-[4/3] rounded-2xl bg-gray-100 animate-pulse" />
            ))
          : activeCategories.map((cat, idx) => {
            const image = cat.image_url || defaultImages[idx % defaultImages.length];
            return (
              <a
                key={cat.id}
                href={createPageUrl(`ProductListing?category=${cat.id}`)}
                className="group relative flex aspect-[4/3] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition"
              >
                <img
                  src={image}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="relative mt-auto flex items-end justify-between p-5">
                  <div>
                    <span className="mb-1 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                      Category
                    </span>
                    <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                    {cat.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-white/75">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-gray-900">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </a>
            );
          })}
      </div>
    </section>
  );
}
