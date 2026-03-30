import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center font-sans">
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

          <Button className="mt-8">Start Shopping</Button>
        </div>
      </Container>
    </div>
  );
}
