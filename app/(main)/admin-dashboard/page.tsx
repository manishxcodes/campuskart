"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Users,
  Package,
  Ban,
  Trash2,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  UserX,
  PackageX,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isBanned: boolean;
  isDeleted: boolean;
  createdAt: string;
  _count: { products: number };
}

interface AdminProduct {
  id: string;
  title: string;
  sellingPrice: number;
  originalPrice: number;
  images: string[];
  isDeleted: boolean;
  isBanned: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  category: { id: string; name: string };
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Action state
  const [banDialog, setBanDialog] = useState<{
    type: "user" | "product";
    id: string;
    name: string;
    isBanned: boolean;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "user" | "product";
    id: string;
    name: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Guard: redirect non-admins
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.isAdmin) {
      router.push("/home");
    }
  }, [session, status, router]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      setUsers(json.data?.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/products");
      const json = await res.json();
      setProducts(json.data?.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchUsers();
      fetchProducts();
    }
  }, [session?.user?.isAdmin]);

  const handleBan = async () => {
    if (!banDialog) return;
    setActionLoading(true);
    try {
      const url =
        banDialog.type === "user"
          ? `/api/admin/users/${banDialog.id}/ban`
          : `/api/admin/products/${banDialog.id}/ban`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !banDialog.isBanned }),
      });

      if (res.ok) {
        toast.success(
          `${banDialog.type === "user" ? "User" : "Product"} ${
            banDialog.isBanned ? "unbanned" : "banned"
          }`
        );
        fetchUsers();
        fetchProducts();
      } else {
        const json = await res.json();
        toast.error(json.message || "Action failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(false);
      setBanDialog(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setActionLoading(true);
    try {
      const url =
        deleteDialog.type === "user"
          ? `/api/admin/users/${deleteDialog.id}`
          : `/api/admin/products/${deleteDialog.id}`;

      const res = await fetch(url, { method: "DELETE" });

      if (res.ok) {
        toast.success(
          `${deleteDialog.type === "user" ? "User" : "Product"} deleted`
        );
        if (deleteDialog.type === "user") fetchUsers();
        else fetchProducts();
      } else {
        const json = await res.json();
        toast.error(json.message || "Action failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(false);
      setDeleteDialog(null);
    }
  };

  if (status === "loading" || !session?.user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalUsers = users.length;
  const bannedUsers = users.filter((u) => u.isBanned).length;
  const totalProducts = products.length;
  const bannedProducts = products.filter((p) => p.isBanned).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-2">
        <Shield className="h-5 w-5 text-primary mt-1" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage users and products
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5" />
              Banned Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-destructive">
              {bannedUsers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <PackageX className="h-3.5 w-3.5" />
              Banned Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-destructive">
              {bannedProducts}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Products
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          {loadingUsers ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className={cn(user.isBanned && "opacity-60")}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {user.name?.[0] || "?"}
                            </div>
                          )}
                          <span className="text-sm font-medium">
                            {user.name || "Unnamed"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {user._count.products}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.isBanned ? (
                          <Badge variant="destructive" className="text-[10px]">
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              setBanDialog({
                                type: "user",
                                id: user.id,
                                name: user.name || user.email,
                                isBanned: user.isBanned,
                              })
                            }
                          >
                            {user.isBanned ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3 mr-1" />
                                Ban
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteDialog({
                                type: "user",
                                id: user.id,
                                name: user.name || user.email,
                              })
                            }
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          {loadingProducts ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className={cn(
                        (product.isBanned || product.isDeleted) &&
                          "opacity-60"
                      )}
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
                          <span className="text-sm font-medium line-clamp-1 max-w-[150px]">
                            {product.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.user.name || product.user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {product.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        <span className="line-through text-muted-foreground text-xs">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                        <span className="ml-2">₹{product.sellingPrice.toLocaleString("en-IN")}</span>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              setBanDialog({
                                type: "product",
                                id: product.id,
                                name: product.title,
                                isBanned: product.isBanned,
                              })
                            }
                          >
                            {product.isBanned ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3 mr-1" />
                                Ban
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteDialog({
                                type: "product",
                                id: product.id,
                                name: product.title,
                              })
                            }
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ban Dialog */}
      <ConfirmDialog
        open={!!banDialog}
        onOpenChange={(open) => !open && setBanDialog(null)}
        title={
          banDialog?.isBanned
            ? `Unban ${banDialog?.type === "user" ? "User" : "Product"}`
            : `Ban ${banDialog?.type === "user" ? "User" : "Product"}`
        }
        description={
          banDialog?.isBanned
            ? `Are you sure you want to unban "${banDialog?.name}"?`
            : `Are you sure you want to ban "${banDialog?.name}"?${
                banDialog?.type === "user"
                  ? " All their products will also be banned."
                  : ""
              }`
        }
        confirmLabel={banDialog?.isBanned ? "Unban" : "Ban"}
        variant={banDialog?.isBanned ? "default" : "destructive"}
        loading={actionLoading}
        onConfirm={handleBan}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title={`Delete ${
          deleteDialog?.type === "user" ? "User" : "Product"
        }`}
        description={`Are you sure you want to delete "${deleteDialog?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={actionLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
