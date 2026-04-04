"use client";

import Link from "next/link";
import { Container } from "./ui/container";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { signOut, useSession } from "next-auth/react";

export const Navbar = () => {
  const { data: session } = useSession();

  return (
    <header className="w-full fixed z-10 backdrop-blur-lg border-b">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href={"/"} className={cn("font-semibold tracking-tight")}>
            CampusKart
          </Link>

          {session ? (
            <Button size={"sm"} onClick={() => signOut({ callbackUrl: "/" })}>
              Sign Out
            </Button>
          ) : (
            <Link href={"/signin"}>
              <Button size={"sm"}>Sign In</Button>
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
};
