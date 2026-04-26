import { NextRequest, NextResponse } from "next/server";
import { scoreTaskSubmission, generateNudge, generateProgramReport } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "score") {
      const { taskTitle, taskDescription, proof } = body;
      const result = await scoreTaskSubmission(taskTitle, taskDescription, proof);
      return NextResponse.json(result);
    }

    if (action === "nudge") {
      const { ambassadorName, daysSinceActive, pendingTasks } = body;
      const message = await generateNudge(ambassadorName, daysSinceActive, pendingTasks);
      return NextResponse.json({ message });
    }

    if (action === "report") {
      const { stats } = body;
      const report = await generateProgramReport(stats);
      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI service error" }, { status: 500 });
  }
}
