'use server';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prismadb";
import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const body = await req.json();
    const { latency, bandwidth, packetLoss, status, metadata } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!latency || !bandwidth) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Optional: Check if user has available API calls
    const hasApiLimit = await checkApiLimit(userId);
    if (!hasApiLimit) {
      return new NextResponse("Free tier limit reached", { status: 403 });
    }

    // Create network metrics entry
    const metrics = await prisma.networkMetrics.create({
      data: {
        userId,
        latency,
        bandwidth,
        packetLoss: packetLoss || 0,
        status: status || "active",
        metadata: metadata || {},
      },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[NETWORK_METRICS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") as "day" | "week" | "month" || "day";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const freeTrial = await checkApiLimit(userId);
    const isPro = await checkSubscription(userId);

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired. Please upgrade to pro.", { status: 403 });
    }

    const startDate = new Date();
    switch (timeframe) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    const metrics = await prisma.networkMetrics.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!isPro) {
      await increaseApiLimit(userId);
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[NETWORK_METRICS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
