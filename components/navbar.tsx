"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import { ProfileAvatar } from "./profile-avatar";

export const Navbar = () => {
  const { data: session, status } = useSession();

  return (
    <header className=" border-b flex items-center justify-between px-4 py-4 bg-background sticky top-0 z-10">
      <Link href={"/"} className={cn("font-semibold tracking-tight")}>
        CampusKart
      </Link>

      {status === "loading" ? (
        <ProfileAvatar isLoading />
      ) : session ? (
        <ProfileAvatar
          profileImageUrl={session.user.image!}
          fallbackName={session.user.name!}
          email={session.user.email!}
        />
      ) : (
        <Link href={"/signin"}>
          <Button size={"sm"}>Sign In</Button>
        </Link>
      )}
    </header>
  );
};
