"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ambassador, Task,
  getAmbassadors, getCurrentAmbassador, getTasksForAmbassador,
  getRank, saveTasks, getTasks, saveAmbassadors, BADGES,
} from "@/lib/data";

type Tab = "dashboard" | "tasks" | "leaderboard";

const GRID_BG = {
  backgroundImage: "linear-gradient(rgba(0,0,0,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px)",
  backgroundSize: "80px 80px",
};

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  border: "1.5px solid rgba(0,0,0,0.1)",
  borderRadius: 16,
  boxShadow: "4px 4px 0 rgba(0,0,0,0.08)",
};

export default function AmbassadorPage() {
  const router = useRouter();
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allAmbassadors, setAllAmbassadors] = useState<Ambassador[]>([]);
  const [rank, setRank] = useState(0);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [proof, setProof] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<Record<string, { score: number; feedback: string }>>({});

  useEffect(() => {
    const amb = getCurrentAmbassador();
    if (!amb) { router.push("/"); return; }
    setAmbassador(amb);
    setTasks(getTasksForAmbassador(amb.id));
    setAllAmbassadors(getAmbassadors().sort((a, b) => b.points - a.points));
    setRank(getRank(amb.id));
  }, [router]);

  async function handleSubmitTask(task: Task) {
    if (!ambassador || !proof[task.id]?.trim()) return;
    setSubmitting(task.id);

    let scored = 70;
    let feedback = "Good effort! Keep engaging with your campus community.";

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "score", taskTitle: task.title, taskDescription: task.description, proof: proof[task.id] }),
      });
      const result = await res.json();
      if (!result.error) {
        scored = result.score ?? 70;
        feedback = result.feedback ?? feedback;
      }
    } catch {
      // fallback score used
    }

    // Always update task + points regardless of AI success
    setAiResult((prev) => ({ ...prev, [task.id]: { score: scored, feedback } }));

    const allTasks = getTasks();
    const updatedTasks = allTasks.map((t) =>
      t.id === task.id
        ? { ...t, status: "approved" as const, proof: proof[task.id], aiScore: scored, aiFeedback: feedback }
        : t
    );
    saveTasks(updatedTasks);

    const pointsEarned = Math.round((scored / 100) * task.points);
    const today = new Date().toISOString().split("T")[0];
    const allAmbassadors = getAmbassadors();

    const updatedAmbassadors = allAmbassadors.map((a) => {
      if (a.id !== ambassador.id) return a;
      const newPoints = a.points + pointsEarned;
      const newTasksCompleted = a.tasksCompleted + 1;
      // Badge logic
      let badges = [...a.badges];
      if (newTasksCompleted === 1 && !badges.find((b) => b.id === "first-task")) badges.push(BADGES[0]);
      if (a.streak + 1 >= 3 && !badges.find((b) => b.id === "streak-3")) badges.push(BADGES[1]);
      if (newPoints >= 100 && !badges.find((b) => b.id === "century")) badges.push(BADGES[5]);
      if (task.type === "event" && !badges.find((b) => b.id === "event-host")) badges.push(BADGES[4]);
      if (task.type === "content" && allTasks.filter((t) => t.type === "content" && t.status === "approved").length + 1 >= 5 && !badges.find((b) => b.id === "content-king")) badges.push(BADGES[3]);
      return { ...a, points: newPoints, tasksCompleted: newTasksCompleted, streak: a.streak + 1, lastActive: today, badges };
    });

    saveAmbassadors(updatedAmbassadors);
    const updated = updatedAmbassadors.find((a) => a.id === ambassador.id)!;
    const sorted = [...updatedAmbassadors].sort((a, b) => b.points - a.points);
    setAmbassador(updated);
    setTasks(updatedTasks.filter((t) => t.assignedTo.includes(ambassador.id)));
    setAllAmbassadors(sorted);
    setRank(sorted.findIndex((a) => a.id === ambassador.id) + 1);
    setSubmitting(null);
  }

  if (!ambassador) return (
    <div style={{ minHeight: "100vh", background: "#EDECE8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif" }}>
      <p style={{ color: "rgba(0,0,0,0.4)", fontSize: 14 }}>Loading...</p>
    </div>
  );

  const completedTasks = tasks.filter((t) => t.status === "approved").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const progressPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#EDECE8", fontFamily: "'Space Grotesk', sans-serif", color: "#1a1a1a", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, ...GRID_BG }} />

      {/* HEADER */}
      <header style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1.5px solid rgba(0,0,0,0.1)", background: "rgba(237,236,232,0.8)", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, border: "1.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a" }}>
            {ambassador.name.charAt(0)}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{ambassador.name}</p>
            <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", margin: 0, letterSpacing: "0.05em" }}>{ambassador.college.toUpperCase()}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["dashboard", "tasks", "leaderboard"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s", borderColor: tab === t ? "#1a1a1a" : "transparent", background: tab === t ? "#1a1a1a" : "transparent", color: tab === t ? "white" : "rgba(0,0,0,0.5)", boxShadow: tab === t ? "2px 2px 0 rgba(0,0,0,0.2)" : "none" }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#4F46E5", margin: 0, lineHeight: 1 }}>{ambassador.points} PTS</p>
              <p style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", margin: 0, letterSpacing: "0.08em" }}>RANK #{rank}</p>
            </div>
            <button onClick={() => { localStorage.removeItem("cc_current_user"); router.push("/"); }}
              style={{ padding: "8px 14px", border: "1.5px solid rgba(0,0,0,0.15)", borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", color: "rgba(0,0,0,0.4)" }}>
              ← Exit
            </button>
          </div>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 5, maxWidth: 1100, margin: "0 auto", padding: "40px 40px" }}>

        {/* ── DASHBOARD TAB ─────────────────────────── */}
        {tab === "dashboard" && (
          <div>
            {/* Big title */}
            <div style={{ borderBottom: "1.5px solid rgba(0,0,0,0.1)", paddingBottom: 20, marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.9, margin: 0, letterSpacing: "0.02em" }}>
                WELCOME BACK,<br />
                <span style={{ color: "#4F46E5" }}>{ambassador.name.split(" ")[0].toUpperCase()}</span>
              </h1>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "TOTAL POINTS", value: ambassador.points, suffix: "PTS", color: "#4F46E5" },
                { label: "PROGRAM RANK", value: `#${rank}`, suffix: "", color: "#1a1a1a" },
                { label: "DAY STREAK", value: ambassador.streak, suffix: "🔥", color: "#e11d48" },
                { label: "TASKS DONE", value: ambassador.tasksCompleted, suffix: "", color: "#059669" },
              ].map((s) => (
                <div key={s.label} style={{ ...CARD, padding: "20px 24px" }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 8px 0" }}>{s.label}</p>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, lineHeight: 1, margin: 0, color: s.color }}>
                    {s.value}<span style={{ fontSize: 20, marginLeft: 4 }}>{s.suffix}</span>
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
              {/* Progress */}
              <div style={{ ...CARD, padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 4px 0" }}>TASK PROGRESS</p>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, margin: 0, lineHeight: 1 }}>{completedTasks} / {tasks.length} COMPLETE</p>
                  </div>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#4F46E5", margin: 0, lineHeight: 1 }}>{progressPct}%</p>
                </div>
                <div style={{ height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
                  <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #4F46E5, #818cf8)", borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>

                {/* Pending tasks */}
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 10px 0" }}>PENDING ({pendingTasks})</p>
                  {tasks.filter((t) => t.status === "pending").slice(0, 2).map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(79,70,229,0.05)", border: "1px solid rgba(79,70,229,0.15)", borderRadius: 10, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t.title}</p>
                        <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", margin: 0 }}>Due: {t.deadline}</p>
                      </div>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "#4F46E5" }}>{t.points} PTS</span>
                    </div>
                  ))}
                  {pendingTasks === 0 && <p style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>All caught up! Great work.</p>}
                </div>
              </div>

              {/* Badges */}
              <div style={{ ...CARD, padding: "24px" }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 16px 0" }}>BADGES EARNED</p>
                {ambassador.badges.length === 0
                  ? <p style={{ fontSize: 13, color: "rgba(0,0,0,0.35)", fontStyle: "italic" }}>Complete tasks to earn badges!</p>
                  : <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    {ambassador.badges.map((badge) => (
                      <div key={badge.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(79,70,229,0.06)", border: "1.5px solid rgba(79,70,229,0.2)", borderRadius: 10 }}>
                        <span style={{ fontSize: 18 }}>{badge.icon}</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{badge.name}</p>
                          <p style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", margin: 0 }}>{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                }
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.3)", margin: "16px 0 10px 0" }}>LOCKED</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {BADGES.filter((b) => !ambassador.badges.find((ab) => ab.id === b.id)).map((badge) => (
                    <div key={badge.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, opacity: 0.5 }}>
                      <span style={{ fontSize: 14, filter: "grayscale(1)" }}>{badge.icon}</span>
                      <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", margin: 0 }}>{badge.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS TAB ─────────────────────────────── */}
        {tab === "tasks" && (
          <div>
            <div style={{ borderBottom: "1.5px solid rgba(0,0,0,0.1)", paddingBottom: 20, marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.9, margin: 0 }}>MY <span style={{ color: "#4F46E5" }}>TASKS</span></h1>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tasks.map((task) => (
                <div key={task.id} style={{ ...CARD, padding: "24px", overflow: "hidden", position: "relative" }}>
                  {/* left accent bar */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: task.status === "approved" ? "#059669" : task.status === "submitted" ? "#d97706" : "#4F46E5", borderRadius: "16px 0 0 16px" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ flex: 1, paddingLeft: 12 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 5, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.2)", color: "#4F46E5" }}>{task.type}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 5, background: task.status === "approved" ? "rgba(5,150,105,0.08)" : task.status === "submitted" ? "rgba(217,119,6,0.08)" : "rgba(0,0,0,0.05)", border: `1px solid ${task.status === "approved" ? "rgba(5,150,105,0.2)" : task.status === "submitted" ? "rgba(217,119,6,0.2)" : "rgba(0,0,0,0.1)"}`, color: task.status === "approved" ? "#059669" : task.status === "submitted" ? "#d97706" : "rgba(0,0,0,0.4)" }}>{task.status}</span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px 0" }}>{task.title}</h3>
                      <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: 0, lineHeight: 1.5 }}>{task.description}</p>
                      <p style={{ fontSize: 11, color: "rgba(0,0,0,0.3)", margin: "8px 0 0 0", letterSpacing: "0.05em" }}>DUE: {task.deadline}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 24 }}>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, lineHeight: 1, color: "#4F46E5", margin: 0 }}>{task.points}</p>
                      <p style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", letterSpacing: "0.08em", margin: 0 }}>POINTS</p>
                    </div>
                  </div>

                  {/* AI result */}
                  {(task.aiScore || aiResult[task.id]) && (
                    <div style={{ marginLeft: 12, padding: "12px 16px", background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: 10, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#4F46E5" }}>AI SCORE</span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#4F46E5", lineHeight: 1 }}>{aiResult[task.id]?.score ?? task.aiScore}/100</span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", margin: 0, lineHeight: 1.5 }}>{aiResult[task.id]?.feedback ?? task.aiFeedback}</p>
                    </div>
                  )}

                  {/* Submit proof */}
                  {task.status === "pending" && (
                    <div style={{ marginLeft: 12, marginTop: 8 }}>
                      <textarea value={proof[task.id] || ""} onChange={(e) => setProof((p) => ({ ...p, [task.id]: e.target.value }))}
                        placeholder="Describe your proof of completion — link, screenshot description, evidence..."
                        style={{ width: "100%", background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", color: "#1a1a1a", resize: "none", outline: "none", marginBottom: 10 }}
                        rows={2}
                      />
                      <button onClick={() => handleSubmitTask(task)} disabled={!proof[task.id]?.trim() || submitting === task.id}
                        style={{ padding: "10px 20px", background: proof[task.id]?.trim() && submitting !== task.id ? "#4F46E5" : "rgba(0,0,0,0.1)", color: proof[task.id]?.trim() && submitting !== task.id ? "white" : "rgba(0,0,0,0.3)", border: "1.5px solid", borderColor: proof[task.id]?.trim() && submitting !== task.id ? "#1a1a1a" : "transparent", borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: proof[task.id]?.trim() && submitting !== task.id ? "pointer" : "not-allowed", boxShadow: proof[task.id]?.trim() && submitting !== task.id ? "3px 3px 0 #1a1a1a" : "none" }}>
                        {submitting === task.id ? "AI SCORING..." : "SUBMIT & GET AI SCORE"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ───────────────────────── */}
        {tab === "leaderboard" && (
          <div>
            <div style={{ borderBottom: "1.5px solid rgba(0,0,0,0.1)", paddingBottom: 20, marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.9, margin: 0 }}>PROGRAM <span style={{ color: "#4F46E5" }}>LEADERBOARD</span></h1>
            </div>

            {/* top 3 podium */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 12, marginBottom: 24, alignItems: "flex-end" }}>
              {[allAmbassadors[1], allAmbassadors[0], allAmbassadors[2]].map((amb, i) => {
                if (!amb) return <div key={i} />;
                const podiumIndex = [1, 0, 2][i];
                const heights = [140, 180, 120];
                const medals = ["🥈", "🥇", "🥉"];
                return (
                  <div key={amb.id} style={{ ...CARD, padding: "20px 16px", textAlign: "center", height: heights[i], display: "flex", flexDirection: "column", justifyContent: "flex-end", background: podiumIndex === 0 ? "rgba(79,70,229,0.08)" : "rgba(255,255,255,0.55)", borderColor: podiumIndex === 0 ? "rgba(79,70,229,0.3)" : "rgba(0,0,0,0.1)", boxShadow: podiumIndex === 0 ? "4px 4px 0 rgba(79,70,229,0.2)" : "4px 4px 0 rgba(0,0,0,0.08)" }}>
                    <span style={{ fontSize: 28, marginBottom: 8 }}>{medals[i]}</span>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, margin: "0 auto 8px", border: "2px solid #1a1a1a" }}>{amb.name.charAt(0)}</div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px 0" }}>{amb.name.split(" ")[0]}</p>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#4F46E5", margin: 0, lineHeight: 1 }}>{amb.points}</p>
                  </div>
                );
              })}
            </div>

            {/* full list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allAmbassadors.map((amb, index) => (
                <div key={amb.id} style={{ ...CARD, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, background: amb.id === ambassador?.id ? "rgba(79,70,229,0.06)" : "rgba(255,255,255,0.55)", borderColor: amb.id === ambassador?.id ? "rgba(79,70,229,0.3)" : "rgba(0,0,0,0.1)" }}>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: index < 3 ? "#4F46E5" : "rgba(0,0,0,0.25)", margin: 0, width: 40, textAlign: "center", lineHeight: 1 }}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </p>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, border: "2px solid #1a1a1a", flexShrink: 0 }}>{amb.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{amb.name} {amb.id === ambassador?.id && <span style={{ fontSize: 11, color: "#4F46E5", fontWeight: 500 }}>(You)</span>}</p>
                    <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", margin: 0 }}>{amb.college}</p>
                  </div>
                  <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(amb.points / (allAmbassadors[0]?.points || 1)) * 100}%`, background: "linear-gradient(90deg, #4F46E5, #818cf8)", borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", gap: 4, minWidth: 60, justifyContent: "center" }}>
                    {amb.badges.slice(0, 3).map((b) => <span key={b.id} style={{ fontSize: 14 }}>{b.icon}</span>)}
                  </div>
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#4F46E5", margin: 0, lineHeight: 1 }}>{amb.points}</p>
                    <p style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", margin: 0, letterSpacing: "0.06em" }}>{amb.tasksCompleted} TASKS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
