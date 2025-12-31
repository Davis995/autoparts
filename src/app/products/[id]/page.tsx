'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/currency';
import { ProductCard } from '@/components/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(id);
  const { data: allProducts = [] } = useProducts();
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const similar = allProducts.filter(
    (p) => p.id !== id && p.categoryId === product?.categoryId
  ).slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <p className="text-gray-600 mb-4">Product not found.</p>
          <button
            onClick={() => router.push('/products')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (product.stockQuantity === 0) return;
    await addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      stock: product.stockQuantity,
      images: product.images || [],
      is_active: product.isActive,
    } as any, 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div
          className="grid lg:grid-cols-2 gap-8 items-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="relative w-full aspect-square overflow-hidden rounded-xl">
              <Image
                src={product.images?.[0] || '/images/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">{product.category?.name}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-gray-600">{product.shortDescription}</p>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-blue-600">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="font-medium">Stock: </span>
                {product.stockQuantity > 0
                  ? `${product.stockQuantity} available`
                  : 'Out of stock'}
              </p>
              {product.brand && (
                <p>
                  <span className="font-medium">Brand: </span>
                  {product.brand}
                </p>
              )}
            </div>

            {product.description && (
              <div className="border-t border-gray-200 pt-4 mt-2 text-sm text-gray-700 leading-relaxed">
                {product.description}
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={cartLoading || product.stockQuantity === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-4 w-4" />
              {product.stockQuantity === 0 ? 'Out of stock' : 'Add to Cart'}
            </button>
          </div>
        </motion.div>

        {similar.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              Similar products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
