import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Quiz session not found" }, { status: 404 });
    }

    // Reset the session - clear answers, completedAt, and score
    const resetSession = updateSession(sessionId, {
      answers: [],
      completedAt: undefined,
      score: undefined,
    });

    return NextResponse.json({ session: resetSession });
  } catch (error) {
    console.error("Error resetting quiz:", error);
    return NextResponse.json({ error: "Failed to reset quiz" }, { status: 500 });
  }
}
