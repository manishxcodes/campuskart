"use client";

import { useSession } from "next-auth/react";

export default function Hello() {
  const { data: session } = useSession();
  console.log(session?.user.email);
  return (
    <>
      <div>Hello</div>
    </>
  );
}
