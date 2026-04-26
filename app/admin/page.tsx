"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ambassador, Task,
  getAmbassadors, getTasks, saveTasks, saveAmbassadors,
  DEFAULT_AMBASSADORS, DEFAULT_TASKS,
} from "@/lib/data";

type Tab = "overview" | "ambassadors" | "tasks" | "ai";

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

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.7)",
  border: "1.5px solid rgba(0,0,0,0.12)",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 13,
  fontFamily: "'Space Grotesk', sans-serif",
  color: "#1a1a1a",
  outline: "none",
};

export default function AdminPage() {
  const router = useRouter();
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [newTask, setNewTask] = useState({ title: "", description: "", type: "referral" as Task["type"], points: 50, deadline: "" });
  const [taskAdded, setTaskAdded] = useState(false);
  const [nudgeTarget, setNudgeTarget] = useState("");
  const [nudgeMsg, setNudgeMsg] = useState("");
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cc_ambassadors")) { saveAmbassadors(DEFAULT_AMBASSADORS); saveTasks(DEFAULT_TASKS); }
    setAmbassadors(getAmbassadors().sort((a, b) => b.points - a.points));
    setTasks(getTasks());
  }, []);

  function addTask() {
    if (!newTask.title || !newTask.deadline) return;
    const task: Task = { id: `task-${Date.now()}`, ...newTask, status: "pending", assignedTo: ambassadors.map((a) => a.id) };
    const updated = [...getTasks(), task];
    saveTasks(updated); setTasks(updated);
    setNewTask({ title: "", description: "", type: "referral", points: 50, deadline: "" });
    setTaskAdded(true); setTimeout(() => setTaskAdded(false), 3000);
  }

  function approveTask(taskId: string, submitterId?: string) {
    const allTasks = getTasks();
    const task = allTasks.find((t) => t.id === taskId); if (!task) return;
    const updatedTasks = allTasks.map((t) => t.id === taskId ? { ...t, status: "approved" as const } : t);
    saveTasks(updatedTasks); setTasks(updatedTasks);
    // Only award points to the ambassador who submitted (first in assignedTo), not all
    const submitter = submitterId ?? task.assignedTo[0];
    const ambs = getAmbassadors();
    const today = new Date().toISOString().split("T")[0];
    const updatedAmbs = ambs.map((a) =>
      a.id === submitter
        ? { ...a, points: a.points + task.points, tasksCompleted: a.tasksCompleted + 1, lastActive: today }
        : a
    );
    saveAmbassadors(updatedAmbs);
    setAmbassadors([...updatedAmbs].sort((a, b) => b.points - a.points));
  }

  async function generateNudge() {
    if (!nudgeTarget) return;
    setNudgeLoading(true); setNudgeMsg("");
    const amb = ambassadors.find((a) => a.id === nudgeTarget); if (!amb) return;
    const pendingTasks = tasks.filter((t) => t.assignedTo.includes(amb.id) && t.status === "pending").map((t) => t.title);
    const daysSince = Math.floor((Date.now() - new Date(amb.lastActive).getTime()) / 86400000);
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "nudge", ambassadorName: amb.name, daysSinceActive: daysSince, pendingTasks }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNudgeMsg(data.message || "Could not generate nudge.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setNudgeMsg(msg.includes("quota") || msg.includes("429")
        ? "API rate limit reached. Please wait a minute and try again."
        : `Hey ${amb.name}! 👋 You've got ${pendingTasks.length} pending task${pendingTasks.length !== 1 ? "s" : ""} waiting for you. Jump back in and keep that streak alive — your team is counting on you!`);
    }
    finally { setNudgeLoading(false); }
  }

  async function generateReport() {
    setReportLoading(true); setReportText("");
    const activeThisWeek = ambassadors.filter((a) => (Date.now() - new Date(a.lastActive).getTime()) / 86400000 <= 7).length;
    const totalCompleted = tasks.filter((t) => t.status === "approved").length;
    const totalReferrals = ambassadors.reduce((s, a) => s + a.referrals, 0);
    const avgPoints = Math.round(ambassadors.reduce((s, a) => s + a.points, 0) / (ambassadors.length || 1));
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", stats: { totalAmbassadors: ambassadors.length, activeThisWeek, totalTasksCompleted: totalCompleted, totalReferrals, topPerformer: ambassadors[0]?.name ?? "N/A", avgPoints } }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReportText(data.report || "Could not generate report.");
    } catch {
      setReportText(
        `Program Health Report — ${new Date().toLocaleDateString()}\n\n` +
        `The AICore Connect 2026 program currently has ${ambassadors.length} active ambassadors with an average of ${avgPoints} points each. ` +
        `${activeThisWeek} ambassadors were active this week, generating ${totalReferrals} total referrals. ` +
        `Top performer is ${ambassadors[0]?.name ?? "N/A"} with ${ambassadors[0]?.points ?? 0} points. ` +
        `Recommendation: Re-engage the ${ambassadors.length - activeThisWeek} inactive ambassadors using the Nudge Generator.`
      );
    }
    finally { setReportLoading(false); }
  }

  const totalPoints = ambassadors.reduce((s, a) => s + a.points, 0);
  const totalReferrals = ambassadors.reduce((s, a) => s + a.referrals, 0);
  const submittedTasks = tasks.filter((t) => t.status === "submitted");

  return (
    <div style={{ minHeight: "100vh", background: "#EDECE8", fontFamily: "'Space Grotesk', sans-serif", color: "#1a1a1a", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, ...GRID_BG }} />

      {/* HEADER */}
      <header style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1.5px solid rgba(0,0,0,0.1)", background: "rgba(237,236,232,0.85)", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, border: "1.5px solid #1a1a1a", boxShadow: "2px 2px 0 rgba(0,0,0,0.2)" }}>🏢</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Admin Dashboard</p>
            <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", margin: 0, letterSpacing: "0.05em" }}>UNSAIDTALKS · AICORE CONNECT 2026</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {(["overview", "ambassadors", "tasks", "ai"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s", borderColor: tab === t ? "#1a1a1a" : "transparent", background: tab === t ? "#1a1a1a" : "transparent", color: tab === t ? "white" : "rgba(0,0,0,0.5)", boxShadow: tab === t ? "2px 2px 0 rgba(0,0,0,0.2)" : "none" }}>
              {t === "ai" ? "AI Tools" : t}
            </button>
          ))}
        </div>

        <button onClick={() => router.push("/")}
          style={{ padding: "8px 14px", border: "1.5px solid rgba(0,0,0,0.15)", borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", color: "rgba(0,0,0,0.4)" }}>
          ← Exit
        </button>
      </header>

      <main style={{ position: "relative", zIndex: 5, maxWidth: 1200, margin: "0 auto", padding: "40px 40px" }}>

        {/* ── OVERVIEW ──────────────────────────────── */}
        {tab === "overview" && (
          <div>
            <div style={{ borderBottom: "1.5px solid rgba(0,0,0,0.1)", paddingBottom: 20, marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.9, margin: 0 }}>PROGRAM <span style={{ color: "#4F46E5" }}>OVERVIEW</span></h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "AMBASSADORS", value: ambassadors.length, color: "#4F46E5" },
                { label: "POINTS AWARDED", value: totalPoints, color: "#1a1a1a" },
                { label: "TOTAL REFERRALS", value: totalReferrals, color: "#059669" },
                { label: "PENDING REVIEWS", value: submittedTasks.length, color: "#d97706" },
              ].map((s) => (
                <div key={s.label} style={{ ...CARD, padding: "20px 24px" }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 8px 0" }}>{s.label}</p>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, lineHeight: 1, margin: 0, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
              {/* Top performers */}
              <div style={{ ...CARD, padding: "24px" }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 16px 0" }}>TOP PERFORMERS</p>
                {ambassadors.slice(0, 5).map((amb, i) => (
                  <div key={amb.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: i < 3 ? "#4F46E5" : "rgba(0,0,0,0.25)", width: 32, textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, border: "2px solid #1a1a1a", flexShrink: 0 }}>{amb.name.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{amb.name}</p>
                      <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", margin: 0 }}>{amb.college} · {amb.tasksCompleted} tasks · {amb.referrals} referrals</p>
                    </div>
                    <div style={{ flex: 1, height: 5, background: "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(amb.points / (ambassadors[0]?.points || 1)) * 100}%`, background: "linear-gradient(90deg, #4F46E5, #818cf8)", borderRadius: 3 }} />
                    </div>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#4F46E5", margin: 0, marginLeft: 12, minWidth: 60, textAlign: "right" }}>{amb.points}</p>
                  </div>
                ))}
              </div>

              {/* Task status */}
              <div style={{ ...CARD, padding: "24px" }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 16px 0" }}>TASK STATUS</p>
                {(["pending", "submitted", "approved", "rejected"] as const).map((status) => {
                  const count = tasks.filter((t) => t.status === status).length;
                  const colors: Record<string, string> = { pending: "#4F46E5", submitted: "#d97706", approved: "#059669", rejected: "#e11d48" };
                  return (
                    <div key={status} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(0,0,0,0.5)" }}>{status}</span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: colors[status], lineHeight: 1 }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${tasks.length ? (count / tasks.length) * 100 : 0}%`, background: colors[status], borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── AMBASSADORS ───────────────────────────── */}
        {tab === "ambassadors" && (
          <div>
            <div style={{ borderBottom: "1.5px solid rgba(0,0,0,0.1)", paddingBottom: 20, marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.9, margin: 0 }}>ALL <span style={{ color: "#4F46E5" }}>AMBASSADORS</span></h1>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {ambassadors.map((amb) => {
                const daysSince = Math.floor((Date.now() - new Date(amb.lastActive).getTime()) / 86400000);
                return (
                  <div key={amb.id} style={{ ...CARD, padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18, border: "2px solid #1a1a1a", flexShrink: 0 }}>{amb.name.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px 0" }}>{amb.name}</p>
                        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", margin: "0 0 2px 0" }}>{amb.email}</p>
                        <p style={{ fontSize: 11, color: "rgba(0,0,0,0.3)", margin: 0, letterSpacing: "0.04em" }}>{amb.college.toUpperCase()}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#4F46E5", margin: 0, lineHeight: 1 }}>{amb.points}</p>
                        <p style={{ fontSize: 10, letterSpacing: "0.06em", margin: "2px 0 0 0", color: daysSince > 3 ? "#e11d48" : "#059669", fontWeight: 600 }}>
                          {daysSince === 0 ? "ACTIVE TODAY" : `${daysSince}D AGO`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
                      {[{ l: "TASKS", v: amb.tasksCompleted }, { l: "REFERRALS", v: amb.referrals }, { l: "STREAK", v: `${amb.streak}D` }, { l: "BADGES", v: amb.badges.length }].map((s) => (
                        <div key={s.l} style={{ textAlign: "center", padding: "8px 0", background: "rgba(0,0,0,0.03)", borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)" }}>
                          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, margin: 0, lineHeight: 1 }}>{s.v}</p>
                          <p style={{ fontSize: 9, color: "rgba(0,0,0,0.4)", margin: 0, letterSpacing: "0.08em", fontWeight: 600 }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                    {amb.badges.length > 0 && (
                      <div style={{ display: "flex", gap: 4 }}>
                        {amb.badges.map((b) => <span key={b.id} title={b.name} style={{ fontSize: 18 }}>{b.icon}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TASKS ─────────────────────────────────── */}
        {tab === "tasks" && (
          <div>
            <div style={{ borderBottom: "1.5px solid rgba(0,0,0,0.1)", paddingBottom: 20, marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.9, margin: 0 }}>TASK <span style={{ color: "#4F46E5" }}>MANAGEMENT</span></h1>
            </div>

            {/* Pending reviews */}
            {submittedTasks.length > 0 && (
              <div style={{ ...CARD, padding: "24px", marginBottom: 24, borderColor: "rgba(217,119,6,0.3)", background: "rgba(217,119,6,0.04)" }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#d97706", margin: "0 0 14px 0" }}>PENDING REVIEWS ({submittedTasks.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {submittedTasks.map((task) => (
                    <div key={task.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px 0" }}>{task.title}</p>
                        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", margin: 0 }}>{task.proof}</p>
                      </div>
                      <button onClick={() => approveTask(task.id)}
                        style={{ padding: "8px 18px", background: "#059669", color: "white", border: "1.5px solid #1a1a1a", borderRadius: 8, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", boxShadow: "2px 2px 0 #1a1a1a", marginLeft: 16, flexShrink: 0 }}>
                        APPROVE
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create task */}
            <div style={{ ...CARD, padding: "24px", marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 16px 0" }}>CREATE NEW TASK</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} placeholder="Task title" style={INPUT} />
                <textarea value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} placeholder="Task description and requirements" style={{ ...INPUT, resize: "none" }} rows={2} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <select value={newTask.type} onChange={(e) => setNewTask((p) => ({ ...p, type: e.target.value as Task["type"] }))} style={{ ...INPUT }}>
                    <option value="referral">Referral</option>
                    <option value="content">Content</option>
                    <option value="event">Event</option>
                    <option value="promotion">Promotion</option>
                  </select>
                  <input type="number" value={newTask.points} onChange={(e) => setNewTask((p) => ({ ...p, points: Number(e.target.value) }))} placeholder="Points" style={INPUT} />
                  <input type="date" value={newTask.deadline} onChange={(e) => setNewTask((p) => ({ ...p, deadline: e.target.value }))} style={INPUT} />
                </div>
                <button onClick={addTask} disabled={!newTask.title || !newTask.deadline}
                  style={{ padding: "12px 24px", background: newTask.title && newTask.deadline ? "#4F46E5" : "rgba(0,0,0,0.1)", color: newTask.title && newTask.deadline ? "white" : "rgba(0,0,0,0.3)", border: "1.5px solid", borderColor: newTask.title && newTask.deadline ? "#1a1a1a" : "transparent", borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: newTask.title && newTask.deadline ? "pointer" : "not-allowed", boxShadow: newTask.title && newTask.deadline ? "3px 3px 0 #1a1a1a" : "none", alignSelf: "flex-start" }}>
                  {taskAdded ? "✓ TASK ASSIGNED!" : "ASSIGN TO ALL AMBASSADORS"}
                </button>
              </div>
            </div>

            {/* Task list */}
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 12px 0" }}>ALL TASKS ({tasks.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map((task) => (
                <div key={task.id} style={{ ...CARD, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 5, background: task.status === "approved" ? "rgba(5,150,105,0.1)" : task.status === "submitted" ? "rgba(217,119,6,0.1)" : "rgba(79,70,229,0.08)", color: task.status === "approved" ? "#059669" : task.status === "submitted" ? "#d97706" : "#4F46E5", border: `1px solid ${task.status === "approved" ? "rgba(5,150,105,0.2)" : task.status === "submitted" ? "rgba(217,119,6,0.2)" : "rgba(79,70,229,0.2)"}` }}>{task.status}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.35)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{task.type}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 2px 0" }}>{task.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", margin: 0 }}>Due: {task.deadline} · {task.assignedTo.length} ambassadors</p>
                  </div>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#4F46E5", margin: 0 }}>{task.points} PTS</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI TOOLS ──────────────────────────────── */}
        {tab === "ai" && (
          <div>
            <div style={{ borderBottom: "1.5px solid rgba(0,0,0,0.1)", paddingBottom: 20, marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.9, margin: 0 }}>AI <span style={{ color: "#4F46E5" }}>TOOLS</span></h1>
            </div>

            <div style={{ background: "rgba(79,70,229,0.06)", border: "1.5px solid rgba(79,70,229,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: "#4F46E5", margin: 0, fontWeight: 500 }}>
                Powered by <strong>Gemini Flash</strong> — automate ambassador engagement and generate program insights.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Nudge generator */}
              <div style={{ ...CARD, padding: "28px" }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 4px 0" }}>AI TOOL 01</p>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, margin: 0, lineHeight: 1 }}>NUDGE GENERATOR</h3>
                  <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: "8px 0 0 0", lineHeight: 1.5 }}>Generate a personalized re-engagement message for an inactive ambassador.</p>
                </div>
                <select value={nudgeTarget} onChange={(e) => setNudgeTarget(e.target.value)} style={{ ...INPUT, marginBottom: 12 }}>
                  <option value="">Select an ambassador...</option>
                  {ambassadors.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.college}</option>)}
                </select>
                <button onClick={generateNudge} disabled={!nudgeTarget || nudgeLoading}
                  style={{ padding: "11px 22px", background: nudgeTarget && !nudgeLoading ? "#4F46E5" : "rgba(0,0,0,0.1)", color: nudgeTarget && !nudgeLoading ? "white" : "rgba(0,0,0,0.3)", border: "1.5px solid", borderColor: nudgeTarget && !nudgeLoading ? "#1a1a1a" : "transparent", borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: nudgeTarget && !nudgeLoading ? "pointer" : "not-allowed", boxShadow: nudgeTarget && !nudgeLoading ? "3px 3px 0 #1a1a1a" : "none" }}>
                  {nudgeLoading ? "GENERATING..." : "GENERATE NUDGE"}
                </button>
                {nudgeMsg && (
                  <div style={{ marginTop: 16, padding: "16px", background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#4F46E5", margin: "0 0 8px 0" }}>GENERATED MESSAGE</p>
                    <p style={{ fontSize: 13, color: "rgba(0,0,0,0.7)", margin: "0 0 10px 0", lineHeight: 1.6 }}>{nudgeMsg}</p>
                    <button onClick={() => navigator.clipboard.writeText(nudgeMsg)} style={{ fontSize: 11, color: "#4F46E5", background: "none", border: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.05em", padding: 0 }}>
                      COPY TO CLIPBOARD ↗
                    </button>
                  </div>
                )}
              </div>

              {/* Program report */}
              <div style={{ ...CARD, padding: "28px" }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 4px 0" }}>AI TOOL 02</p>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, margin: 0, lineHeight: 1 }}>PROGRAM REPORT</h3>
                  <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: "8px 0 0 0", lineHeight: 1.5 }}>AI-written program health summary based on current engagement data.</p>
                </div>
                <button onClick={generateReport} disabled={reportLoading}
                  style={{ padding: "11px 22px", background: !reportLoading ? "#1a1a1a" : "rgba(0,0,0,0.1)", color: !reportLoading ? "white" : "rgba(0,0,0,0.3)", border: "1.5px solid", borderColor: !reportLoading ? "#1a1a1a" : "transparent", borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: !reportLoading ? "pointer" : "not-allowed", boxShadow: !reportLoading ? "3px 3px 0 rgba(0,0,0,0.2)" : "none" }}>
                  {reportLoading ? "ANALYZING..." : "GENERATE REPORT"}
                </button>
                {reportText && (
                  <div style={{ marginTop: 16, padding: "16px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)", margin: "0 0 8px 0" }}>HEALTH REPORT</p>
                    <p style={{ fontSize: 13, color: "rgba(0,0,0,0.7)", margin: 0, lineHeight: 1.7 }}>{reportText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
