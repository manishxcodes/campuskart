'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatWindow } from '@/components/chat-window';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getPusherClient } from '@/lib/pusher-client';

// Wrapper to handle Suspense for useSearchParams
export default function ChatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ChatsPageContent />
    </Suspense>
  );
}

interface ConversationData {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  product: {
    id: string;
    title: string;
    images: string[];
    sellingPrice: number;
  };
  buyer: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
  seller: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  }>;
  _count: {
    messages: number;
  };
  updatedAt: string;
}

function ChatsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get('conversation');

  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setConversations(data.data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchConversations();
    }
  }, [status, fetchConversations]);

  // Subscribe to real-time updates for conversation list
  useEffect(() => {
    if (!session?.user?.id) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`user-${session.user.id}`);

    channel.bind('new-notification', () => {
      // Refresh conversation list when a new message arrives
      fetchConversations();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id, fetchConversations]);

  const currentUserId = session?.user?.id;

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const getOtherUser = (conv: ConversationData) => {
    return conv.buyerId === currentUserId ? conv.seller : conv.buyer;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!search.trim()) return true;
    const other = getOtherUser(conv);
    const s = search.toLowerCase();
    return (
      other.name?.toLowerCase().includes(s) ||
      conv.product.title.toLowerCase().includes(s)
    );
  });

  const getTimeLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background rounded-xl border border-border shadow-sm">
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          'w-full md:w-[340px] lg:w-[380px] border-r border-border flex flex-col shrink-0 bg-card/50',
          activeConversationId && 'hidden md:flex'
        )}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <h1 className="text-xl font-bold tracking-tight mb-3">Chats</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {search
                  ? 'No conversations match your search'
                  : 'No conversations yet. Chat with a seller from a product page!'}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {filteredConversations.map((conv) => {
                const other = getOtherUser(conv);
                const lastMsg = conv.messages[0];
                const unreadCount = conv._count.messages;
                const isActive = conv.id === activeConversationId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      router.push(`/chats?conversation=${conv.id}`);
                      // Refresh to clear unread after navigation
                      setTimeout(fetchConversations, 500);
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 px-5 py-3.5 text-left transition-all hover:bg-muted/50',
                      isActive && 'bg-primary/5 hover:bg-primary/10 border-r-2 border-primary'
                    )}
                  >
                    <Avatar className="h-11 w-11 shrink-0 mt-0.5">
                      <AvatarImage src={other.image || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {other.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                          className={cn(
                            'text-sm font-medium truncate',
                            unreadCount > 0 && 'font-semibold'
                          )}
                        >
                          {other.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {getTimeLabel(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {conv.product.title}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-xs truncate',
                            unreadCount > 0
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground'
                          )}
                        >
                          {lastMsg
                            ? lastMsg.senderId === currentUserId
                              ? `You: ${lastMsg.content}`
                              : lastMsg.content
                            : 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge className="h-5 min-w-[20px] rounded-full text-[10px] px-1.5 shrink-0 bg-primary text-primary-foreground">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window Panel */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 relative',
          !activeConversationId && 'hidden md:flex'
        )}
      >
        {/* Mobile back button */}
        {activeConversationId && (
          <button
            onClick={() => router.push('/chats')}
            className="md:hidden absolute top-3 left-2 z-10 p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {activeConversation && currentUserId ? (
          <ChatWindow
            conversationId={activeConversation.id}
            currentUserId={currentUserId}
            otherUser={getOtherUser(activeConversation)}
            product={activeConversation.product}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-9 w-9 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Your Messages</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Select a conversation from the sidebar or start chatting with a
              seller from a product page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
