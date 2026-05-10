'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MakeOfferModal } from '@/components/make-offer-modal';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

interface Product {
  id: string;
  title: string;
  description: string;
  condition: string;
  sellingPrice: number;
  originalPrice?: number;
  discount?: number;

  category: {
    id: string;
    name: string;
  };

  images: string[];

  user: {
    id: string;
    name: string;
    email: string;
  };

  _count?: {
    wishlists: number;
  };

  createdAt?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMakeOfferModal, setShowMakeOfferModal] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const session = useSession();
  const userEmail = session.data?.user?.email;
  const userId = session.data?.user?.id;
  const isOwnProduct = product?.user?.id === userId;

  const handleChat = async () => {
    if (!product || !userId || isOwnProduct) return;

    setChatLoading(true);
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          sellerId: product.user.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to start chat');

      const data = await res.json();
      const conversationId = data.data.conversation.id;
      router.push(`/chats?conversation=${conversationId}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/products/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();

        setProduct(data.data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">
            Product not found
          </p>
        </Card>
      </div>
    );
  }

  const discountPercentage =
    product.discount ||
    (product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.sellingPrice) /
            product.originalPrice) *
            100
        )
      : 0);

  return (
    <main className="min-h-screen bg-background text-foreground py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="border border-border rounded-3xl p-4 bg-card">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted">
                <img
                  src={
                    product.images[selectedImageIndex] || '/placeholder.jpg'
                  }
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all bg-card',
                      selectedImageIndex === index
                        ? 'border-primary'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-8">
            {/* Title + Price */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                {product.title}
              </h1>

              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-4xl font-bold">
                  {product.sellingPrice === 0 ? "Free" : `₹${product.sellingPrice.toLocaleString('en-IN')}`}
                </span>

                {product.originalPrice && (
                  <span className="text-2xl text-muted-foreground line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}

                {discountPercentage > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-green-50 text-green-700 border-green-200"
                  >
                    {discountPercentage}% OFF
                  </Badge>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="grid grid-cols-2 gap-6 py-6 border-y border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Category
                </p>

                <p className="font-medium">
                  {product.category?.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Condition
                </p>

                <p className="font-medium">
                  Used
                </p>
              </div>

              {product.createdAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Posted
                  </p>

                  <p className="font-medium">
                    {new Date(
                      product.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Wishlist
                </p>

                <p className="font-medium">
                  {product._count?.wishlists || 0} people
                </p>
              </div>
            </div>

            {/* Seller */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Seller
              </p>

              <h3 className="text-lg font-semibold">
                {product.user.name}
              </h3>

              <p className="text-muted-foreground">
                {product.user.email}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                onClick={() => setShowMakeOfferModal(true)}
                className="flex-1 h-12 text-base font-medium"
              >
                Make Offer
              </Button>

              <Button
                variant="outline"
                className="flex-1 h-12 text-base font-medium"
                onClick={handleChat}
                disabled={isOwnProduct || chatLoading}
              >
                {chatLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <MessageCircle className="mr-2 h-5 w-5" />
                )}
                {isOwnProduct ? 'Your Product' : 'Chat'}
              </Button>
            </div>
          </div>
        </div>

        {/* Description */}
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="text-2xl font-bold mb-5">
            Description
          </h2>

          <p className="text-muted-foreground leading-8 whitespace-pre-wrap text-base">
            {product.description}
          </p>
        </section>

        {/* Condition */}
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="text-2xl font-bold mb-5">
            Condition Details
          </h2>

          <p className="text-muted-foreground leading-8 text-base whitespace-pre-wrap">
            {product.condition}
          </p>
        </section>
      </div>

      {/* Offer Modal */}
      <MakeOfferModal
        open={showMakeOfferModal}
        onClose={() => setShowMakeOfferModal(false)}
        productId={product.id}
        productTitle={product.title}
        ownerEmail={product.user.email}
        userEmail={userEmail as string}
      />
    </main>
  );
}