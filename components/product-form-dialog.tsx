"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, CreateProductFormValues } from "@/types/schema/product";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  /** If provided, we're editing an existing product */
  editProduct?: {
    id: string;
    title: string;
    description: string;
    condition: string;
    originalPrice: number;
    sellingPrice: number;
    categoryId: string;
    images: string[];
  };
  onSuccess: () => void;
}

const MAX_IMAGE_SIZE = 250 * 1024 ; // 250KB

export function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  editProduct,
  onSuccess,
}: ProductFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!editProduct;

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      title: "",
      description: "",
      condition: "",
      originalPrice: 0,
      sellingPrice: 0,
      categoryId: "",
      images: [],
    },
  });

  useEffect(() => {
    if (open && editProduct) {
      form.reset({
        title: editProduct.title,
        description: editProduct.description,
        condition: editProduct.condition || "",
        originalPrice: editProduct.originalPrice || 0,
        sellingPrice: editProduct.sellingPrice || 0,
        categoryId: editProduct.categoryId,
        images: editProduct.images,
      });
      setImagePreviews(editProduct.images);
    } else if (open) {
      form.reset({
        title: "",
        description: "",
        condition: "",
        originalPrice: 0,
        sellingPrice: 0,
        categoryId: "",
        images: [],
      });
      setImagePreviews([]);
    }
  }, [open, editProduct]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImages = form.getValues("images");

    if (currentImages.length + files.length > 4) {
      toast.error("Maximum 4 images allowed");
      return;
    }

    files.forEach((file) => {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} exceeds 256KB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const current = form.getValues("images");
        form.setValue("images", [...current, base64], {
          shouldValidate: true,
        });
        setImagePreviews((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const current = form.getValues("images");
    const updated = current.filter((_, i) => i !== index);
    form.setValue("images", updated, { shouldValidate: true });
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: CreateProductFormValues) => {
    setLoading(true);
    try {
      const url = isEditing
        ? `/api/products/${editProduct!.id}`
        : "/api/products";
      const method = isEditing ? "PATCH" : "POST";

      console.log("isEditing: ", isEditing)
      console.log("values: ", values);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Something went wrong");
        return;
      }

      toast.success(isEditing ? "Product updated!" : "Product created!");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Create New Listing"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your product details."
              : "Fill in the details to list your product."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Images ({imagePreviews.length}/4)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {imagePreviews.map((preview, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                  >
                    <img
                      src={preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {imagePreviews.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px]">Add</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Max 256KB per image. JPG, PNG, or WebP.
              </p>
              {form.formState.errors.images && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.images.message}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageAdd}
              />
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Engineering Mathematics Book" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product specfications"
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Condition */}
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product condition(e.g Year Used, etc)"
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing Section */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value}
                          onFocus={() => {
                            if (field.value === 0) field.onChange("");
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") field.onChange(0);
                            else field.onBlur();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? "" : Number(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                          type="number"
                          value={field.value}
                          onFocus={() => {
                            if (field.value === 0) field.onChange("");
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") field.onChange(0);
                            else field.onBlur();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? "" : Number(val));
                          }}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              
              <p className="text-xs text-muted-foreground italic">
                💡 If you want to give it for free, set the price to 0
              </p>
            </div>

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                {isEditing ? "Update" : "Create Listing"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
