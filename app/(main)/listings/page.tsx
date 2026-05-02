"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ProductFormDialog } from "@/components/product-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  description: string;  
  condition: string;
  originalPrice: number;
  sellingPrice: number;
  images: string[];
  isBanned: boolean;
  isDeleted: boolean;
  categoryId: string;
  category: { id: string; name: string };
  user: { id: string; name: string | null; image: string | null };
  _count: { wishlists: number };
}

export default function ListingsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=100");
      const json = await res.json();
      // Filter to only user's products
      const allProducts: Product[] = json.data?.products || [];
      const myProducts = allProducts.filter(
        (p) => p.user?.id === session?.user?.id
      );
      setProducts(myProducts);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      setCategories(json.data?.categories || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchProducts();
      fetchCategories();
    }
  }, [session?.user?.id]);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/products/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Product deleted");
        setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      } else {
        const json = await res.json();
        toast.error(json.message || "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handleFormSuccess = () => {
    setEditProduct(null);
    fetchProducts();
  };

  return (
    <div className="space-y-6 bg-background p-4 md:p-8 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My Listings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your product listings
          </p>
        </div>
        <Button
          onClick={() => {
            setEditProduct(null);
            setFormOpen(true);
          }}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Listing
        </Button>
      </div>

      {/* Products */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">No listings yet</p>
          <p className="text-sm mb-4">
            Create your first listing to start selling
          </p>
          <Button
            onClick={() => {
              setEditProduct(null);
              setFormOpen(true);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Listing
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}
                className={cn(product.isBanned || product.isDeleted && "bg-muted")}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted" />
                      )}
                      <span className="text-sm font-medium line-clamp-1 max-w-[200px]">
                        {product.title.substring(0, 20)}{product.title.length > 30 && "..."}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {product.originalPrice > 0 && (
                        <>
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{product.originalPrice}
                        </span>
                        </>
                      )}
                      <span className="text-xs">
                        ₹{product.sellingPrice}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                        {product.isDeleted ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            Deleted
                          </Badge>
                        ) : product.isBanned ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px]"
                          >
                            Banned
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-green-50 text-green-700 border-green-200"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive cursor-pointer"
                                onClick={() => handleEdit(product)}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Edit
                              </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive cursor-pointer hover:text-destructive"
                                onClick={() =>
                                  setDeleteId(product.id)
                                }
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Delete
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        </TooltipProvider>
                      </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        // <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        //   {products.map((product) => (
        //     <Card
        //       key={product.id}
        //       className={cn(
        //         "overflow-hidden transition-all duration-200 hover:shadow-md",
        //         product.isBanned && "opacity-60"
        //       )}
        //     >
        //       {/* Image */}
        //       <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        //         {product.images.length > 0 ? (
        //           <img
        //             src={product.images[0]}
        //             alt={product.title}
        //             className="h-full w-full object-cover"
        //           />
        //         ) : (
        //           <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        //             No image
        //           </div>
        //         )}

        //         {product.isBanned && (
        //           <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        //             <Badge
        //               variant="destructive"
        //               className="gap-1 text-xs"
        //             >
        //               <ShieldAlert className="h-3 w-3" />
        //               Banned by Admin
        //             </Badge>
        //           </div>
        //         )}
        //       </div>

        //       {/* Content */}
        //       <div className="p-4 space-y-3">
        //         <div className="flex items-start justify-between gap-2">
        //           <div>
        //             <h3 className="font-medium text-sm line-clamp-1">
        //               {product.title}
        //             </h3>
        //             <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
        //               {product.description}
        //             </p>
        //           </div>
        //           <span className="text-sm font-semibold text-primary whitespace-nowrap">
        //             ₹{product.sellingPrice.toLocaleString("en-IN")}
        //           </span>
        //         </div>

        //         <div className="flex items-center justify-between">
        //           <Badge variant="secondary" className="text-[10px]">
        //             {product.category.name}
        //           </Badge>
        //           <span className="text-[10px] text-muted-foreground">
        //             {product._count.wishlists} wishlisted
        //           </span>
        //         </div>

        //         {/* Actions */}
        //         <div className="flex items-center gap-2 pt-1 border-t">
        //           <Button
        //             variant="outline"
        //             size="sm"
        //             className="flex-1 gap-1.5 text-xs h-8"
        //             onClick={() => handleEdit(product)}
        //             disabled={product.isBanned}
        //           >
        //             <Pencil className="h-3 w-3" />
        //             Edit
        //           </Button>
        //           <Button
        //             variant="outline"
        //             size="sm"
        //             className="flex-1 gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
        //             onClick={() => setDeleteId(product.id)}
        //           >
        //             <Trash2 className="h-3 w-3" />
        //             Delete
        //           </Button>
        //         </div>
        //       </div>
        //     </Card>
        //   ))}
        // </div>
      )}

      {/* Create/Edit Dialog */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditProduct(null);
        }}
        categories={categories}
        editProduct={
          editProduct
            ? {
                id: editProduct.id,
                title: editProduct.title,
                description: editProduct.description,
                condition: editProduct.condition,
                originalPrice: editProduct.originalPrice,
                sellingPrice: editProduct.sellingPrice,
                categoryId: editProduct.categoryId,
                images: editProduct.images,
              }
            : undefined
        }
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
