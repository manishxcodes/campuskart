"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Loader } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function LandingPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="animate-spin" />
        <span>loading</span>
      </div>
    );
  }

  if (session) {
    redirect("/home");
  }

  return (
    <>
      <Navbar />
      <div className="flex h-screen items-center justify-center ">
        <Container>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
              Your Campus <br />
              Your Marketplace
            </h1>

            <p className="mt-5 text-sm md:text-base text-zinc-500">
              Connect with fellow students to buy, sell, <br />
              and save on everyday essentials.
            </p>

            <Link href={"/signup"}>
              <Button className="mt-8">Start Shopping</Button>
            </Link>
          </div>
        </Container>
      </div>
    </>
  );
}
