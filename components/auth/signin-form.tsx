"use client";

import { signinSchema } from "@/types/schema/auth";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { GoogleLogo } from "@/public/svg";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof signinSchema>;

export function SigninForm() {
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: FormData) {
    console.log("data: ", data);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      console.log("result: ", result);
      toast.error("Invalid email or password");
      return;
    }

    if (result?.ok == false) {
      console.log("result: ", result);
      toast.error("Please sign in with Google");
      return;
    }

    if (result?.ok) {
      toast.success("Signed in successfully");
      router.push("/home");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="signin-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    className="placeholder:text-sm"
                    {...field}
                    id="email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="your@example.com"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    className="placeholder:text-sm"
                    {...field}
                    id="password"
                    aria-invalid={fieldState.invalid}
                    type={"password"}
                    placeholder="Enter your password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" className="w-full mt-4">
            Sign In
          </Button>

          <Button
            type="button"
            variant={"outline"}
            className="w-full mt-4 flex items-center"
            onClick={() => signIn("google", { callbackUrl: "/home" })}
          >
            <GoogleLogo />
            Continue with Google
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
