const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated.";
}

export async function scoreTaskSubmission(
  taskTitle: string,
  taskDescription: string,
  proof: string
): Promise<{ score: number; feedback: string }> {
  const prompt = `You are an evaluator for a Campus Ambassador program.

Task: "${taskTitle}"
Description: "${taskDescription}"
Ambassador's proof of completion: "${proof}"

Evaluate the submission and respond in this exact JSON format:
{"score": <number 0-100>, "feedback": "<2 sentence constructive feedback>"}

Score based on: relevance to task, effort demonstrated, quality of proof provided. Be fair but encouraging.`;

  const raw = await callGemini(prompt);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return { score: 70, feedback: "Good effort on this task. Keep up the engagement!" };
}

export async function generateNudge(
  ambassadorName: string,
  daysSinceActive: number,
  pendingTasks: string[]
): Promise<string> {
  const prompt = `Write a short, friendly, motivating WhatsApp-style message (2-3 sentences max) to re-engage a Campus Ambassador named ${ambassadorName} who has been inactive for ${daysSinceActive} days.

Their pending tasks: ${pendingTasks.join(", ")}.

Be warm, specific, and action-oriented. Don't be preachy. Sound like a supportive team lead.`;

  return callGemini(prompt);
}

export async function generateProgramReport(stats: {
  totalAmbassadors: number;
  activeThisWeek: number;
  totalTasksCompleted: number;
  totalReferrals: number;
  topPerformer: string;
  avgPoints: number;
}): Promise<string> {
  const prompt = `Generate a concise 4-5 sentence program health report for a Campus Ambassador program manager based on these stats:

- Total ambassadors: ${stats.totalAmbassadors}
- Active this week: ${stats.activeThisWeek}
- Tasks completed: ${stats.totalTasksCompleted}
- Total referrals generated: ${stats.totalReferrals}
- Top performer: ${stats.topPerformer}
- Average points per ambassador: ${stats.avgPoints}

Highlight what's going well, what needs attention, and one specific recommendation. Be concise and professional.`;

  return callGemini(prompt);
}
