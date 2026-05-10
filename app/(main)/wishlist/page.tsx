"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Package } from "lucide-react";

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    description: string;
    sellingPrice: number;
    originalPrice: number;
    discount: number;
    images: string[];
    isBanned: boolean;
    isDeleted: boolean;
    category: { id: string; name: string };
    user: { id: string; name: string | null; image: string | null };
  };
}

export default function WishlistPage() {
  const { data: session } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist");
      const json = await res.json();
      setWishlist(json.data?.wishlist || []);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchWishlist();
    }
  }, [session?.user?.id]);

  const handleWishlistToggle = (productId: string, isNowWishlisted: boolean) => {
    if (!isNowWishlisted) {
      // Removed from wishlist — remove from list
      setWishlist((prev) => prev.filter((w) => w.product.id !== productId));
    }
  };

  return (
    <div className="space-y-6 bg-white h-full">
      {/* Header */}
      <div className="flex  gap-2">
        <Heart className="h-5 w-5 text-red-500 ml-2 mt-2" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Products you've saved for later
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">Your wishlist is empty</p>
          <p className="text-sm">
            Browse the marketplace and tap the heart icon to save items
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wishlist
            .filter((w) => !w.product.isDeleted)
            .map((item) => (
              <ProductCard
                key={item.id}
                id={item.product.id}
                title={item.product.title}
                description={item.product.description}
                sellingPrice={item.product.sellingPrice}
                originalPrice={item.product.originalPrice}
                discount={item.product.discount}
                images={item.product.images}
                category={item.product.category}
                seller={item.product.user}
                isWishlisted={true}
                isBanned={item.product.isBanned}
                showWishlist={true}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
        </div>
      )}
    </div>
  );
}
