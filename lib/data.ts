export type Badge = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  type: "referral" | "content" | "event" | "promotion";
  points: number;
  deadline: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  proof?: string;
  aiScore?: number;
  aiFeedback?: string;
  assignedTo: string[];
};

export type Ambassador = {
  id: string;
  name: string;
  email: string;
  college: string;
  points: number;
  streak: number;
  badges: Badge[];
  joinedAt: string;
  lastActive: string;
  tasksCompleted: number;
  referrals: number;
};

export const BADGES: Badge[] = [
  { id: "first-task", name: "First Step", icon: "🎯", description: "Completed your first task" },
  { id: "streak-3", name: "On Fire", icon: "🔥", description: "3-day streak" },
  { id: "top-referrer", name: "Top Referrer", icon: "🚀", description: "10+ referrals" },
  { id: "content-king", name: "Content King", icon: "👑", description: "5 content tasks done" },
  { id: "event-host", name: "Event Host", icon: "🎪", description: "Hosted a campus event" },
  { id: "century", name: "Century Club", icon: "💯", description: "Earned 100+ points" },
];

export const DEFAULT_AMBASSADORS: Ambassador[] = [
  {
    id: "amb-1",
    name: "Priya Sharma",
    email: "priya@iitd.ac.in",
    college: "IIT Delhi",
    points: 340,
    streak: 5,
    badges: [BADGES[0], BADGES[1], BADGES[5]],
    joinedAt: "2026-04-01",
    lastActive: "2026-04-26",
    tasksCompleted: 8,
    referrals: 12,
  },
  {
    id: "amb-2",
    name: "Arjun Mehta",
    email: "arjun@bits.ac.in",
    college: "BITS Pilani",
    points: 210,
    streak: 3,
    badges: [BADGES[0], BADGES[2]],
    joinedAt: "2026-04-03",
    lastActive: "2026-04-25",
    tasksCompleted: 5,
    referrals: 7,
  },
  {
    id: "amb-3",
    name: "Sneha Patel",
    email: "sneha@vit.ac.in",
    college: "VIT Vellore",
    points: 175,
    streak: 2,
    badges: [BADGES[0]],
    joinedAt: "2026-04-05",
    lastActive: "2026-04-24",
    tasksCompleted: 4,
    referrals: 4,
  },
  {
    id: "amb-4",
    name: "Rahul Gupta",
    email: "rahul@nit.ac.in",
    college: "NIT Trichy",
    points: 95,
    streak: 1,
    badges: [],
    joinedAt: "2026-04-10",
    lastActive: "2026-04-22",
    tasksCompleted: 2,
    referrals: 2,
  },
  {
    id: "amb-5",
    name: "Aisha Khan",
    email: "aisha@du.ac.in",
    college: "Delhi University",
    points: 60,
    streak: 0,
    badges: [],
    joinedAt: "2026-04-15",
    lastActive: "2026-04-20",
    tasksCompleted: 1,
    referrals: 1,
  },
];

export const DEFAULT_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Share referral link on LinkedIn",
    description: "Post about CampusConnect on your LinkedIn profile with your unique referral link. Include a screenshot as proof.",
    type: "referral",
    points: 50,
    deadline: "2026-04-30",
    status: "approved",
    assignedTo: ["amb-1", "amb-2", "amb-3", "amb-4", "amb-5"],
    aiScore: 88,
    aiFeedback: "Great engagement potential. Clear call-to-action.",
  },
  {
    id: "task-2",
    title: "Host a 30-minute campus demo session",
    description: "Organize a demo session for at least 10 students on your campus. Submit attendance sheet or photo as proof.",
    type: "event",
    points: 100,
    deadline: "2026-04-28",
    status: "submitted",
    assignedTo: ["amb-1", "amb-2"],
    proof: "Hosted session with 15 students at IIT Delhi tech fest",
  },
  {
    id: "task-3",
    title: "Create an Instagram Reel about the platform",
    description: "Create a 30-60 second reel showcasing platform features. Tag @campusconnect and use #CampusConnect.",
    type: "content",
    points: 75,
    deadline: "2026-05-02",
    status: "pending",
    assignedTo: ["amb-1", "amb-2", "amb-3", "amb-4", "amb-5"],
  },
  {
    id: "task-4",
    title: "Get 5 peer sign-ups using your referral code",
    description: "Drive 5 verified sign-ups using your unique referral code. Track via your ambassador dashboard.",
    type: "referral",
    points: 80,
    deadline: "2026-05-05",
    status: "pending",
    assignedTo: ["amb-1", "amb-2", "amb-3", "amb-4", "amb-5"],
  },
  {
    id: "task-5",
    title: "Distribute flyers across campus",
    description: "Print and distribute at least 50 CampusConnect flyers. Upload geotagged photo as proof.",
    type: "promotion",
    points: 40,
    deadline: "2026-04-29",
    status: "approved",
    assignedTo: ["amb-3", "amb-4", "amb-5"],
    aiScore: 72,
    aiFeedback: "Solid ground-level promotion. Consider digital follow-up.",
  },
];

export function getAmbassadors(): Ambassador[] {
  if (typeof window === "undefined") return DEFAULT_AMBASSADORS;
  const stored = localStorage.getItem("cc_ambassadors");
  return stored ? JSON.parse(stored) : DEFAULT_AMBASSADORS;
}

export function saveAmbassadors(ambassadors: Ambassador[]) {
  localStorage.setItem("cc_ambassadors", JSON.stringify(ambassadors));
}

export function getTasks(): Task[] {
  if (typeof window === "undefined") return DEFAULT_TASKS;
  const stored = localStorage.getItem("cc_tasks");
  return stored ? JSON.parse(stored) : DEFAULT_TASKS;
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem("cc_tasks", JSON.stringify(tasks));
}

export function getCurrentAmbassador(): Ambassador | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("cc_current_user");
  if (!id) return null;
  const ambassadors = getAmbassadors();
  return ambassadors.find((a) => a.id === id) || null;
}

export function getTasksForAmbassador(ambassadorId: string): Task[] {
  return getTasks().filter((t) => t.assignedTo.includes(ambassadorId));
}

export function getRank(ambassadorId: string): number {
  const sorted = getAmbassadors().sort((a, b) => b.points - a.points);
  return sorted.findIndex((a) => a.id === ambassadorId) + 1;
}
