'use client';

import { useState, useMemo } from 'react';
import { Grid, List, Search, Filter } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Navigation } from '@/components/Navigation';

interface ProductWithCategory {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  tags: string[];
  isBestSelling: boolean;
  isTopSelling: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  } | null;
}

export default function ProductsPageClient({
  initialProducts,
}: {
  initialProducts: ProductWithCategory[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const products = initialProducts as any[];

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const product of products) {
      const cat = (product as any).category;
      if (cat && cat.id && !map.has(cat.id)) {
        map.set(cat.id, { id: cat.id, name: cat.name });
      }
    }
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;
    const matchesPrice =
      product.price >= priceRange[0] && product.price <= priceRange[1];

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const handleAddToCart = (productId: string) => {
    console.log('Adding to cart:', productId);
    // Cart functionality is handled inside ProductCard via useCart
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navigation />

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 sm:py-16">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Premium Car Accessories
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8">
              Discover our curated collection of high-quality car accessories
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                <input
                  type="text"
                  placeholder="Search for accessories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Products
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredProducts.length} Products
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedCategory
                ? `Filtered by: ${
                    categories.find((c) => c.id === selectedCategory)?.name
                  }`
                : 'Showing all products'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select className="text-sm bg-white border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest First</option>
              <option>Best Rated</option>
            </select>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div
            className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're
              looking for
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
