'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { formatPrice } from '@/lib/currency';
import { useProducts, ProductWithCategory } from '@/hooks/useProducts';
import { usePromotions } from '@/hooks/usePromotions';
import { ProductCard } from '@/components/ProductCard';

export default function HomePage() {
  const { data: products = [], isLoading, error } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const { data: promotions = [] } = usePromotions();

  const filteredProducts = useMemo(
    () =>
      (products as ProductWithCategory[]).filter((p) => {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category?.name || '').toLowerCase().includes(q)
        );
      }),
    [products, searchTerm]
  );

  const hotDeals = useMemo(() => {
    const list = filteredProducts.filter(
      (p) => p.onSale || p.isBestSelling || p.newArrival
    );
    const source = list.length > 0 ? list : filteredProducts;
    return source.slice(0, 5);
  }, [filteredProducts]);

  const popularAccessories = useMemo(() => {
    const sorted = [...filteredProducts].sort(
      (a, b) => (b.soldCount || 0) - (a.soldCount || 0)
    );
    return sorted.slice(0, 3);
  }, [filteredProducts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Failed to load products. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Navigation */}
      <Navigation
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Active Promotion Banner */}
      {promotions && promotions.length > 0 && (
        <motion.div
          className="px-4 sm:px-6 lg:px-8 pt-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm text-white p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-100 mb-1">Active Promotion</p>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">{promotions[0].title}</h2>
              {promotions[0].bannerText && (
                <p className="text-sm text-blue-100 mb-1">{promotions[0].bannerText}</p>
              )}
              {promotions[0].description && (
                <p className="text-xs sm:text-sm text-blue-100 line-clamp-2">{promotions[0].description}</p>
              )}
            </div>
            {promotions[0].discount && (
              <div className="flex-shrink-0 bg-white/10 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-blue-100 mb-0.5">Discount</p>
                <p className="text-lg font-bold">{formatPrice(Number(promotions[0].discount))} OFF</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Hot Deals Section */}
      <motion.div
        className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Hot Deals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {hotDeals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </motion.div>

      {/* Popular Accessories Section */}
      <motion.div
        className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Popular Accessories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {popularAccessories.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
