export default function WishlistPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <p className="text-muted-foreground">Your saved items and wishlist.</p>
      </div>
    </div>
  );
}
