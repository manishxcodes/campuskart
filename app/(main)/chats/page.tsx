export default function ChatsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Chats</h1>
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <p className="text-muted-foreground">View and reply to your messages here.</p>
      </div>
    </div>
  );
}
