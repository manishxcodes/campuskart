"use client";

import {
  Bell,
  Heart,
  Home,
  LayoutDashboard,
  LucideShoppingCart,
  MessageCircle,
  Shield,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusher-client";

const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "My Listings",
    url: "/listings",
    icon: LayoutDashboard,
  },
  {
    title: "Chats",
    url: "/chats",
    icon: MessageCircle,
    badgeKey: "chats" as const,
  },
  {
    title: "Wishlist",
    url: "/wishlist",
    icon: Heart,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    badgeKey: "notifications" as const,
  },
  {
    title: "Profile",
    url: "/user/profile",
    icon: User,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open } = useSidebar();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      // Fetch notification count
      const notifRes = await fetch("/api/notifications/unread-count");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setUnreadNotifications(notifData.data.count || 0);
      }

      // Fetch unread chat count from conversations
      const chatRes = await fetch("/api/chat/conversations");
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        const conversations = chatData.data.conversations || [];
        const totalUnread = conversations.reduce(
          (acc: number, conv: any) => acc + (conv._count?.messages || 0),
          0
        );
        setUnreadChats(totalUnread);
      }
    } catch {
      // Silently fail badge updates
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCounts();
    }
  }, [session?.user?.id, fetchUnreadCounts, pathname]);

  // Subscribe to real-time updates for badges
  useEffect(() => {
    if (!session?.user?.id) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`user-${session.user.id}`);

    channel.bind("new-notification", () => {
      fetchUnreadCounts();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id, fetchUnreadCounts]);

  const getBadgeCount = (badgeKey?: "chats" | "notifications") => {
    if (badgeKey === "notifications") return unreadNotifications;
    if (badgeKey === "chats") return unreadChats;
    return 0;
  };

  // Build menu items dynamically based on admin status
  const menuItems = [
    ...items,
    ...(session?.user?.isAdmin
      ? [
          {
            title: "Admin Dashboard",
            url: "/admin-dashboard",
            icon: Shield,
          },
        ]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-2 py-2",
            !open && "justify-center px-0",
          )}
        >
          {open && (
            <span className="font-semibold">
              <LucideShoppingCart
                height={20}
                width={20}
                className="text-neutral-700"
              />
            </span>
          )}
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <TooltipProvider delayDuration={1}>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
                  const badgeKey = 'badgeKey' in item ? item.badgeKey : undefined;
                  const badgeCount = getBadgeCount(badgeKey as "chats" | "notifications" | undefined);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link 
                          href={item.url}
                          onClick={(e) => {
                            if (pathname === item.url) {
                              e.preventDefault();
                            }
                          }}
                        >
                          {open ? (
                            <div className="relative">
                              <item.icon
                                className={cn(
                                  "transition-colors",
                                  isActive ? "text-primary" : "text-muted-foreground"
                                )}
                              />
                              {badgeCount > 0 && !open && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center px-1 font-medium">
                                  {badgeCount > 99 ? "99+" : badgeCount}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <item.icon
                                    className={cn(
                                      "transition-colors",
                                      isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                  />
                                  {badgeCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center px-1 font-medium">
                                      {badgeCount > 99 ? "99+" : badgeCount}
                                    </span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {item.title}
                                {badgeCount > 0 && ` (${badgeCount})`}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <span
                            className={cn(
                              "transition-colors flex items-center gap-2",
                              isActive ? "font-semibold text-primary" : "text-muted-foreground"
                            )}
                          >
                            {item.title}
                            {badgeCount > 0 && open && (
                              <span className="h-5 min-w-[20px] rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center px-1.5 font-medium">
                                {badgeCount > 99 ? "99+" : badgeCount}
                              </span>
                            )}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </TooltipProvider>
      </SidebarContent>
      <SidebarFooter>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-2",
            !open && "justify-center px-0",
          )}
        >
          <Avatar>
            <AvatarImage src={session?.user.image || ""} />
            <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex flex-col text-sm">
              <span>{session?.user?.name || "User"}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
