import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/api/storeClient';
import { createPageUrl } from '@/utils';
import { ChevronRight, Sparkles } from 'lucide-react';

const palette = [
  { bg: 'bg-blue-50', text: 'text-blue-700' },
  { bg: 'bg-purple-50', text: 'text-purple-700' },
  { bg: 'bg-green-50', text: 'text-green-700' },
  { bg: 'bg-amber-50', text: 'text-amber-700' },
  { bg: 'bg-pink-50', text: 'text-pink-700' },
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array(4)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
            ))
          : activeCategories.map((cat, idx) => {
            const colors = palette[idx % palette.length];
            return (
              <a
                key={cat.id}
                href={createPageUrl(`ProductListing?category=${cat.id}`)}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-lg transition"
              >
                <div className={`flex items-center justify-center w-12 h-12 mb-4 rounded-xl ${colors.bg}`}>
                  <Sparkles className={`w-5 h-5 ${colors.text}`} />
                </div>
                <span className="text-base font-semibold text-gray-900">{cat.name}</span>
                {cat.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </a>
            );
          })}
      </div>
    </section>
  );
}
