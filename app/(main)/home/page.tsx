"use client";

import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  console.log(session?.user.email);
  return (
    <>
      <div>Hello</div>
    </>
  );
}
