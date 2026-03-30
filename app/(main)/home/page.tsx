"use client";

import { useSession } from "next-auth/react";

export default function Hello() {
  const session = useSession();
  console.log(session.data?.user.email);
  return <div>Hello</div>;
}
