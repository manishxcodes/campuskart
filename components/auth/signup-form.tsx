"use client";

import { GoogleLogo } from "@/public/svg";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { signIn } from "next-auth/react";

export function SignupForm() {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader>
        <CardTitle>Sign Up Now!</CardTitle>
        <CardDescription>
          Quick, secure sign‑up to access CampusKart
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant={"outline"}
          className="w-full mt-4 flex items-center"
          onClick={() => signIn("google", { callbackUrl: "/home" })}
        >
          <GoogleLogo />
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  );
}
