// app/api/voice/route.ts

import { NextResponse } from "next/server";
import { checkSubscription } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkFeatureLimit, incrementFeatureUsage } from "@/lib/feature-limit";
import { FEATURE_TYPES } from "@/constants";

const voiceMapping: { [key: string]: string } = {
  male: "alloy",
  female: "ash",
  child: "fable",
  // Include any additional mappings if necessary
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { text, voice } = await req.json();

    if (!text) {
      return new NextResponse("Text is required", { status: 400 });
    }

    const isPro = await checkSubscription();
    const hasAvailableUsage = await checkFeatureLimit(FEATURE_TYPES.VOICE_SYNTHESIS);

    if (!hasAvailableUsage && !isPro) {
      return new NextResponse(
        "Free usage limit reached. Please upgrade to pro for unlimited access.",
        { status: 403 }
      );
    }

    // Map the voice parameter to the accepted values
    const mappedVoice = voiceMapping[voice] || voice || "alloy";
    console.log("Using voice:", mappedVoice); // Added for debugging

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mp3",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: mappedVoice,
        input: text,
      }),
    });

    if (!response.ok) {
      console.log("[VOICE_ERROR]", await response.text());
      return new NextResponse("Voice generation failed", { status: 500 });
    }

    if (!isPro) {
      await incrementFeatureUsage(FEATURE_TYPES.VOICE_SYNTHESIS);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    return NextResponse.json({ audio: `data:audio/mp3;base64,${base64Audio}` });
  } catch (error) {
    console.log("[VOICE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
