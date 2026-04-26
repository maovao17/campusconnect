"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, MouseEvent } from "react";
import { DEFAULT_AMBASSADORS, saveAmbassadors, saveTasks, DEFAULT_TASKS } from "@/lib/data";

function seed() {
  if (typeof window !== "undefined" && !localStorage.getItem("cc_ambassadors")) {
    saveAmbassadors(DEFAULT_AMBASSADORS);
    saveTasks(DEFAULT_TASKS);
  }
}

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current; if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) scale3d(1.04,1.04,1.04)`;
  }
  function onLeave() {
    if (ref.current) ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className}
      style={{ transition: "transform 0.18s ease-out", transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}

/* 3D floating robot / mascot made in pure CSS */
function Mascot() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "float 3s ease-in-out infinite" }}>
      {/* head */}
      <div style={{
        width: 140, height: 140, borderRadius: 32,
        background: "linear-gradient(145deg, #4F46E5, #6366f1)",
        boxShadow: "6px 6px 0 #3730A3, 0 20px 60px rgba(79,70,229,0.4)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        position: "relative", border: "3px solid #1a1a1a",
      }}>
        {/* grid on face */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 30,
          backgroundImage: "linear-gradient(rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.12) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />
        {/* eyes */}
        <div style={{ display: "flex", gap: 24, position: "relative", zIndex: 1 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a1a1a", boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.3)" }} />
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a1a1a", boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.3)" }} />
        </div>
        {/* ear left */}
        <div style={{ position: "absolute", left: -18, top: "50%", transform: "translateY(-50%)", width: 16, height: 32, borderRadius: "4px 0 0 4px", background: "#3730A3", border: "3px solid #1a1a1a", borderRight: "none" }} />
        {/* ear right */}
        <div style={{ position: "absolute", right: -18, top: "50%", transform: "translateY(-50%)", width: 16, height: 32, borderRadius: "0 4px 4px 0", background: "#3730A3", border: "3px solid #1a1a1a", borderLeft: "none" }} />
      </div>
      {/* neck */}
      <div style={{ width: 24, height: 18, background: "#3730A3", border: "3px solid #1a1a1a", borderTop: "none", borderBottom: "none" }} />
      {/* body */}
      <div style={{
        width: 100, height: 70, borderRadius: 16,
        background: "linear-gradient(145deg, #1a1a1a, #2d2d2d)",
        border: "3px solid #1a1a1a",
        boxShadow: "4px 4px 0 #000",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 60, height: 40, borderRadius: 8,
          background: "rgba(79,70,229,0.15)",
          border: "1px solid rgba(79,70,229,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 36, height: 6, borderRadius: 3, background: "#4F46E5", boxShadow: "0 0 12px rgba(79,70,229,0.8)" }} />
        </div>
      </div>
      {/* pedestal */}
      <div style={{ width: 120, height: 16, background: "#e0deda", borderRadius: "0 0 8px 8px", border: "2px solid #ccc", borderTop: "none", marginTop: 2 }} />
      <div style={{ width: 180, height: 10, background: "#d4d3cf", borderRadius: "0 0 8px 8px", border: "2px solid #c0c0c0", borderTop: "none" }} />
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [modal, setModal] = useState<"ambassador" | "admin" | null>(null);

  function handleAmbassadorLogin(id: string) {
    seed(); localStorage.setItem("cc_current_user", id); router.push("/ambassador");
  }
  function handleAdminLogin() {
    seed(); router.push("/admin");
  }

  return (
    <div style={{ background: "#EDECE8", minHeight: "100vh", fontFamily: "'Space Grotesk', sans-serif", color: "#1a1a1a", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-14px) rotate(1deg)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>

      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,0,0,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />

      {/* ── NAVBAR ─────────────────────────────────── */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "white", border: "2px solid #1a1a1a" }}>C</div>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>CampusConnect</span>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.5)" }}>
          {["Features", "Leaderboard", "AI Tools", "FAQ"].map((l) => (
            <span key={l} style={{ cursor: "pointer" }}>{l}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setModal("ambassador")} style={{ fontSize: 13, fontWeight: 500, padding: "10px 20px", border: "1.5px solid rgba(0,0,0,0.15)", borderRadius: 8, background: "transparent", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>
            Sign In
          </button>
          <button onClick={() => setModal("admin")} style={{ fontSize: 13, fontWeight: 600, padding: "10px 20px", border: "1.5px solid #1a1a1a", borderRadius: 8, background: "#4F46E5", color: "white", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Admin Login
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 5 }}>
        {/* Corner markers */}
        <div style={{ position: "absolute", top: 20, left: 20, color: "rgba(0,0,0,0.25)", fontSize: 22, fontWeight: 300, lineHeight: 1 }}>×</div>
        <div style={{ position: "absolute", top: 20, right: 20, width: 16, height: 16, borderRadius: "50%", border: "1.5px solid rgba(0,0,0,0.2)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 20, width: 8, height: 8, background: "#4F46E5" }} />
        <div style={{ position: "absolute", bottom: 20, right: 20, width: 8, height: 8, background: "#4F46E5" }} />

        {/* BIG display text */}
        <div style={{ overflow: "hidden", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingTop: 24 }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(90px, 17vw, 220px)",
            lineHeight: 0.88,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            margin: "0 -4px",
            paddingLeft: 36,
            color: "#1a1a1a",
          }}>
            CAMPUS CONNECT
          </h1>
        </div>

        {/* 3-column grid layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", borderBottom: "1px solid rgba(0,0,0,0.1)", minHeight: 480 }}>

          {/* Left col */}
          <div style={{ borderRight: "1px solid rgba(0,0,0,0.1)", padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, background: "#4F46E5" }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,0,0,0.5)" }}>Ambassador Program OS</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: "rgba(0,0,0,0.55)", fontWeight: 400, maxWidth: 260 }}>
                The AI-powered platform that replaces spreadsheets and WhatsApp groups — built for scale, retention, and real results.
              </p>
            </div>
            <div>
              <button
                onClick={() => setModal("ambassador")}
                style={{ width: "100%", padding: "14px 24px", background: "#4F46E5", color: "white", border: "1.5px solid #1a1a1a", borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", boxShadow: "4px 4px 0 #1a1a1a", transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 0 #1a1a1a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translate(0,0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0 #1a1a1a"; }}
              >
                APPLY AS AMBASSADOR
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
                <div style={{ display: "flex" }}>
                  {["P","A","S","R","K"].map((l, i) => (
                    <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b"][i], border: "2px solid #EDECE8", marginLeft: i > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white" }}>{l}</div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", fontWeight: 500 }}>5 ambassadors enrolled</span>
              </div>
            </div>
          </div>

          {/* Center col — 3D mascot */}
          <div style={{ borderRight: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative" }}>
            <TiltCard>
              <Mascot />
            </TiltCard>
          </div>

          {/* Right col */}
          <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, background: "#4F46E5" }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,0,0,0.5)" }}>OUR AI FEATURES</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "🤖", label: "Auto task scoring" },
                  { icon: "📨", label: "Smart nudge generator" },
                  { icon: "📊", label: "Program health reports" },
                  { icon: "🏆", label: "Live leaderboard" },
                ].map((f) => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, background: "rgba(255,255,255,0.5)" }}>
                    <span style={{ fontSize: 16 }}>{f.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* mini mockup card */}
            <TiltCard>
              <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 14, padding: 18, border: "1.5px solid rgba(0,0,0,0.1)", boxShadow: "4px 4px 0 rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ fontSize: 9, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0, fontWeight: 600 }}>LEADERBOARD</p>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F46E5" }} />
                </div>
                {[{ n: "Priya S.", p: 340, w: "100%" }, { n: "Arjun M.", p: 210, w: "62%" }, { n: "Sneha P.", p: 175, w: "52%" }].map((r, i) => (
                  <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12 }}>{["🥇","🥈","🥉"][i]}</span>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a", margin: 0, width: 56, flexShrink: 0 }}>{r.n}</p>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                      <div style={{ width: r.w, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #4F46E5, #818cf8)" }} />
                    </div>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "#4F46E5", fontWeight: 700, width: 28, textAlign: "right" }}>{r.p}</span>
                  </div>
                ))}
              </div>
            </TiltCard>
          </div>
        </div>

        {/* ── STATS ROW ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
          {[
            { val: "5", label: "ACTIVE AMBASSADORS" },
            { val: "880", label: "TOTAL POINTS AWARDED" },
            { val: "26", label: "REFERRALS TRACKED" },
            { val: "3", label: "AI FEATURES LIVE" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "24px 32px", borderRight: i < 3 ? "1px solid rgba(0,0,0,0.1)" : "none" }}>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, lineHeight: 1, color: "#1a1a1a", marginBottom: 4 }}>{s.val}</p>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ambassador modal */}
      {modal === "ambassador" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: "#EDECE8", border: "1.5px solid rgba(0,0,0,0.15)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "8px 8px 0 rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "0.02em" }}>SELECT PROFILE</h2>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "rgba(0,0,0,0.4)", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEFAULT_AMBASSADORS.map((amb) => (
                <button key={amb.id} onClick={() => handleAmbassadorLogin(amb.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 12, background: "rgba(255,255,255,0.6)", cursor: "pointer", textAlign: "left", fontFamily: "'Space Grotesk', sans-serif", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#4F46E5"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,70,229,0.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.1)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.6)"; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, border: "2px solid #1a1a1a", flexShrink: 0 }}>{amb.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{amb.name}</p>
                    <p style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", margin: 0 }}>{amb.college}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#4F46E5", margin: 0 }}>{amb.points} pts</p>
                    <p style={{ fontSize: 11, color: "rgba(0,0,0,0.3)", margin: 0 }}>{amb.streak > 0 ? `🔥 ${amb.streak}d` : "—"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin modal */}
      {modal === "admin" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: "#EDECE8", border: "1.5px solid rgba(0,0,0,0.15)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, boxShadow: "8px 8px 0 rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "0.02em" }}>ADMIN ACCESS</h2>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "rgba(0,0,0,0.4)", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              {[["Organization", "UnsaidTalks Education"], ["Program", "AICore Connect 2026"], ["Ambassadors", "5 enrolled"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <span style={{ color: "rgba(0,0,0,0.4)" }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={handleAdminLogin}
              style={{ width: "100%", padding: "14px", background: "#1a1a1a", color: "white", border: "1.5px solid #1a1a1a", borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", boxShadow: "4px 4px 0 rgba(0,0,0,0.2)" }}>
              ENTER DASHBOARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
