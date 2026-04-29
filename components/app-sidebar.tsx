"use client";

import {
  Bell,
  Heart,
  Home,
  LayoutDashboard,
  LucideShoppingCart,
  MessageCircle,
  Shield,
  ShoppingBasketIcon,
  ShoppingCart,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
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
                            <item.icon
                              className={cn(
                                "transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <item.icon
                                  className={cn(
                                    "transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {item.title}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <span
                            className={cn(
                              "transition-colors",
                              isActive ? "font-semibold text-primary" : "text-muted-foreground"
                            )}
                          >
                            {item.title}
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
