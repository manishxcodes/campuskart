"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  _count: { products: number };
}

interface Product {
  id: string;
  title: string;
  description: string;
  condition: string;
  sellingPrice: number;
  originalPrice: number;
  discount: number;
  images: string[];
  isBanned: boolean;
  category: { id: string; name: string };
  user: { id: string; name: string | null; image: string | null };
  _count: { wishlists: number };
}

export default function Home() {
  const { data: session } = useSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data?.categories || []))
      .catch(console.error);
  }, []);

  // Fetch wishlist on mount (if logged in)
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        const ids = (data.data?.wishlist || []).map(
          (w: any) => w.productId || w.product?.id
        );
        setWishlisted(new Set(ids));
      })
      .catch(console.error);
  }, [session?.user?.id]);

  // Fetch products (reset on search/category change)
  const fetchProducts = useCallback(
    async (cursorParam?: string) => {
      const isInitial = !cursorParam;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedCategory) params.set("category", selectedCategory);
        if (cursorParam) params.set("cursor", cursorParam);
        params.set("limit", "12");

        const res = await fetch(`/api/products?${params}`);
        const json = await res.json();
        const data = json.data;

        console.log("data: ", data);

        if (isInitial) {
          setProducts(data?.products || []);
        } else {
          setProducts((prev) => [...prev, ...(data?.products || [])]);
        }

        setCursor(data?.nextCursor || null);
        setHasMore(data?.hasMore || false);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, selectedCategory]
  );

  // Reset and refetch when search/category changes
  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchProducts();
  }, [debouncedSearch, selectedCategory, fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && cursor) {
          fetchProducts(cursor);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, cursor, fetchProducts]);

  const handleWishlistToggle = (productId: string, isNowWishlisted: boolean) => {
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (isNowWishlisted) next.add(productId);
      else next.delete(productId);
      return next;
    });
  };

  return (
    <div className="h-full space-y-6 bg-background p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Explore Marketplace
        </h1>
        <p className="text-sm text-muted-foreground">
          Find what you need from fellow students
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="search-products"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border",
            !selectedCategory
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === cat.id ? null : cat.id
              )
            }
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">
            {debouncedSearch || selectedCategory
              ? "Try adjusting your search or filters"
              : "Be the first to list something!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                sellingPrice={product.sellingPrice}
                condition={product.condition}
                description={product.description}
                discount={product.discount}
                originalPrice={product.originalPrice}
                images={product.images}
                category={product.category}
                seller={product.user}
                wishlistCount={product._count.wishlists}
                isWishlisted={wishlisted.has(product.id)}
                showWishlist={!!session?.user && product.user.id !== session.user.id}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={observerRef} className="flex justify-center py-4">
            {loadingMore && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading more...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
