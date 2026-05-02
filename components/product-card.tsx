"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  title: string;
  description?: string;
  sellingPrice: number;
  originalPrice: number;
  discount: number;
  condition?: string;
  images: string[];
  category: { id: string; name: string };
  seller: { id: string; name: string | null; image: string | null };
  wishlistCount?: number;
  isWishlisted?: boolean;
  isBanned?: boolean;
  showWishlist?: boolean;
  onWishlistToggle?: (productId: string, isWishlisted: boolean) => void;
  onClick?: () => void;
}

export function ProductCard({
  id,
  title,
  description,
  sellingPrice,
  originalPrice,
  condition,
  discount,
  images,
  category,
  seller, 
  wishlistCount = 0,
  isWishlisted = false,
  isBanned = false,
  showWishlist = true,
  onWishlistToggle,
  onClick,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      const method = wishlisted ? "DELETE" : "POST";
      const res = await fetch(`/api/wishlist/${id}`, { method });
      if (res.ok) {
        setWishlisted(!wishlisted);
        onWishlistToggle?.(id, !wishlisted);
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border bg-card text-card-foreground overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/20",
        isBanned && "opacity-60",
        onClick && "cursor-pointer"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted p-2">
        {images.length > 0 ? (
          <img
            src={images[imgIdx] || images[0]}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-md"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setImgIdx(i);
                }}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all",
                  i === imgIdx
                    ? "bg-white w-3"
                    : "bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}

        {/* Banned badge */}
        {isBanned && (
          <Badge
            variant="destructive"
            className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5"
          >
            Banned
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Wishlist button */}
          {!showWishlist && (
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={cn(
                " p-1.5 rounded-full transition-all duration-200",
                "bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm",
                wishlisted && "text-red-500",
                wishlistLoading && "opacity-50"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-all",
                  wishlisted && "fill-red-500 text-red-500"
                )}
              />
            </button>
          )}
        </div>
        <div className="flex items-center">
          <span className="text-mediun font-semibold text-primary mr-1">₹{sellingPrice.toLocaleString("en-IN")}</span>
          <span className="text-xs text-muted-foreground line-through mr-1">₹{originalPrice.toLocaleString("en-IN")}</span>
          <Badge  variant={"secondary"} className="text-xs text-green-500">{discount == 100 ? 'Free' : `${discount}% off`}</Badge>
        </div>

        <div className="mb-2">
          <p className="text-xs text-muted-foreground">{description?.substring(0,200)}{description!.length>200?"...":""}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-normal"
          >
            {category.name}
          </Badge>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {seller.image ? (
              <img
                src={seller.image}
                alt=""
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium">
                {seller.name?.[0] || "?"}
              </div>
            )}
            <span className="truncate max-w-[80px]">
              {seller.name || "User"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
