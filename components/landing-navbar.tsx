"use client";

import { useAuth } from "@clerk/nextjs";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const font = Montserrat({
  weight: "600",
  subsets: ["latin"],
});

export const LandingNabvbar = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const onUpgradeClick = () => {
    if (isSignedIn) {
      router.push("/settings");
    } else {
      router.push("/sign-up");
    }
  };

  return (
    <nav className="p-4 bg-transparent flex items-center justify-between">
      <Link href="/" className="flex items-center">
        <div className="relative h-8 w-8 mr-4">
          <Image fill src="/logo.png" alt="Logo" />
        </div>
        <h1 className={cn("text-2xl font-bold text-white", font.className)}>workfusionapp</h1>
      </Link>
      <div className="flex items-center gap-x-2">
        <Button 
          onClick={onUpgradeClick}
          variant="premium" 
          className="rounded-full"
        >
          Upgrade <Zap className="w-4 h-4 ml-2 fill-white" />
        </Button>
        <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
          <Button variant="outline" className="rounded-full">
            Get Started
          </Button>
        </Link>
      </div>
    </nav>
  );
};
