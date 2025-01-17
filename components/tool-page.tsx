"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tool } from "@/app/(dashboard)/(routes)/dashboard/config";
import { Loader2 } from "lucide-react";

interface ToolPageProps {
  tool: Tool;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

export function ToolPage({ tool, children, isLoading }: ToolPageProps) {
  if (!tool) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl md:text-4xl font-bold text-center">
          {tool.label}
        </h2>
        <p className="text-muted-foreground font-light text-sm md:text-lg text-center">
          {tool.description}
        </p>
      </div>
      <div className="px-4 lg:px-8">
        <Card className={cn(
          "w-full",
          tool.bgColor,
          "p-6 rounded-lg border-none shadow-md"
        )}>
          {children}
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
