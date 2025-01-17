import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const apiBase = process.env.PAYPAL_API_BASE;
    
    if (!clientId || !apiBase) {
      console.error("PayPal configuration missing");
      return new NextResponse(
        JSON.stringify({ error: "PayPal configuration error" }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json({ 
      clientId,
      apiBase,
      environment: process.env.NODE_ENV === "production" ? "production" : "live"
    });
  } catch (error) {
    console.error("[PAYPAL_CLIENT_TOKEN_ERROR]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
