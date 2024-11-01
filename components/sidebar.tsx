"use client";
import { Analytics } from "@vercel/analytics/react"
import { FC } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import {
  Code,
  ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Music,
  Settings,
  VideoIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import FreeCounter from "./free-counter";

const montserrat = Montserrat({ weight: "600", subsets: ["latin"] });

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Conversation",
    icon: MessageSquare,
    href: "/conversation",
    color: "text-violet-500",
  },
  {
    label: "Image Generation",
    icon: ImageIcon,
    href: "/image",
    color: "text-pink-700",
  },
  
  
  {
    label: "Code Generation",
    icon: Code,
    href: "/code",
    color: "text-green-700",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

interface SidebarProps {
  apiLimitCount: number;
  isPro: boolean;
}

const Sidebar: FC<SidebarProps> = ({ apiLimitCount = 0, isPro = false }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-blue-900 text-white">
      <div className="px-4 py-3 flex-1">
        <Link href="/dashboard" className="flex items-center mb-12">
          <div className="relative w-10 h-10 mr-3">
            <Image fill alt="Logo" src="/logo.png" className="rounded-full" />
          </div>
          <h1 className={cn("text-3xl font-bold", montserrat.className)}>
            WorkFusion
          </h1>
        </Link>
        <div className="space-y-2">
          {routes.map((route) => (
            <div
              key={route.href}
              onClick={() => handleNavigation(route.href)}
              className={cn(
                "text-base group flex items-center p-3 rounded-lg transition-all duration-150 cursor-pointer",
                pathname === route.href
                  ? "bg-blue-700 text-white"
                  : "text-zinc-300 hover:bg-blue-800 hover:text-white"
              )}
            >
              <route.icon className={cn("w-6 h-6 mr-3", route.color)} />
              {route.label}
            </div>
          ))}
        </div>
      </div>
      <FreeCounter apiLimitCount={apiLimitCount} isPro={isPro} />
    </div>
  );
};

export default Sidebar;