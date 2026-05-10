'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPusherClient } from '@/lib/pusher-client';

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    image: string | null;
  };
  product: {
    id: string;
    title: string;
    images: string[];
    sellingPrice: number;
  };
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  product,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Check if user is near bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
    setShowScrollDown(!isNearBottom);
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/chat/conversations/${conversationId}/messages`
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setMessages(data.data.messages || []);
        // Mark as read
        fetch(`/api/chat/conversations/${conversationId}/read`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (!loading) {
      scrollToBottom('instant');
    }
  }, [loading, scrollToBottom]);

  // Subscribe to real-time messages via Pusher
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind('new-message', (message: MessageData) => {
      setMessages((prev) => {
        // Avoid duplicate messages
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // Mark as read since we're viewing the conversation
      fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
      });

      // Auto-scroll if near bottom
      const container = messagesContainerRef.current;
      if (container) {
        const threshold = 100;
        const isNearBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          threshold;
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(), 50);
        }
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId, scrollToBottom]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const optimisticMessage: MessageData = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: 'You', image: null },
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const res = await fetch(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );

      if (!res.ok) throw new Error('Failed to send');

      const data = await res.json();
      const realMessage = data.data.message;
      // Replace optimistic message with real one, and remove any duplicate
      // that may have arrived via Pusher while awaiting the API response
      setMessages((prev) => {
        const withoutDuplicates = prev.filter(
          (m) => m.id !== optimisticMessage.id && m.id !== realMessage.id
        );
        return [...withoutDuplicates, realMessage];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
      setNewMessage(content); // Restore the message
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Product context header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUser.image || ''} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
            {otherUser.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{otherUser.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{product.title}</span>
            <span>•</span>
            <span className="shrink-0">
              {product.sellingPrice === 0
                ? 'Free'
                : `₹${product.sellingPrice.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
        {product.images?.[0] && (
          <div className="h-10 w-10 rounded-lg overflow-hidden border border-border shrink-0">
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
        style={{ overscrollBehavior: 'contain' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUserId;
              const showDate =
                index === 0 ||
                getDateLabel(messages[index - 1].createdAt) !==
                  getDateLabel(msg.createdAt);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                        {getDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      'flex mb-1.5',
                      isOwn ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border border-border text-foreground rounded-bl-md'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={cn(
                          'text-[10px] mt-1 text-right',
                          isOwn
                            ? 'text-primary-foreground/60'
                            : 'text-muted-foreground'
                        )}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <div className="absolute bottom-20 right-6">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg h-8 w-8"
            onClick={() => scrollToBottom()}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 px-4"
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="rounded-full h-10 w-10 shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
