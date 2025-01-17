import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STUDY_PROMPTS = {
  flashcards: "Create study flashcards with questions on one side and answers on the other. Format each flashcard as Q: [question] A: [answer]",
  summary: "Create a concise summary of the key concepts and main points. Use bullet points and clear headings.",
  quiz: "Create a quiz with multiple-choice questions and explanations for the answers. Format as Q1: [question] Options: [a,b,c,d] Answer: [correct option] Explanation: [why]",
  mindmap: "Create a text-based mind map showing the relationships between key concepts. Use indentation and bullet points to show hierarchy.",
  timeline: "Create a chronological timeline of important events and developments. Format as [date/period]: [event/development]"
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { content, studyType = 'summary', messages } = body;

    if (!content && !messages) {
      return new NextResponse("Content or messages are required", { status: 400 });
    }

    const freeTrial = await checkApiLimit(userId);
    const isPro = await checkSubscription(userId);

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired. Please upgrade to pro.", { status: 403 });
    }

    let response;
    if (messages) {
      response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages.map((msg: any) => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000,
      });
    } else {
      response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: STUDY_PROMPTS[studyType as keyof typeof STUDY_PROMPTS] || STUDY_PROMPTS.summary
          },
          {
            role: "user",
            content
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
    }

    if (!isPro) {
      await increaseApiLimit(userId);
    }

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error("[STUDY_ERROR]", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
