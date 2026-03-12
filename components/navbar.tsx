import Link from "next/link";
import { Container } from "./ui/container";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export const Navbar = () => {
  return (
    <header className="w-full fixed z-10 backdrop-blur-lg border-b">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href={"/"} className={cn("font-semibold tracking-tight")}>
            CampusKart
          </Link>

          <Link href={"/sign-in"}>
            <Button className="font-medium">Sign In</Button>
          </Link>
        </div>
      </Container>
    </header>
  );
};
