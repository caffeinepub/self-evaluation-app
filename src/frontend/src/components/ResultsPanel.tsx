import {
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

interface ResultsPanelProps {
  scores: number[];
  labels: string[];
  icons: string[];
}

type WellnessTier = "excellent" | "good" | "fair" | "doctor";

function getWellnessInfo(total: number): {
  tier: WellnessTier;
  label: string;
  badgeColor: string;
  badgeBg: string;
  headerFrom: string;
  headerTo: string;
  icon: typeof CheckCircle2;
} {
  if (total > 24)
    return {
      tier: "excellent",
      label: "Excellent Health",
      badgeColor: "text-forest-700",
      badgeBg: "bg-forest-100",
      headerFrom: "from-forest-600",
      headerTo: "to-forest-700",
      icon: CheckCircle2,
    };
  if (total >= 18)
    return {
      tier: "good",
      label: "Good",
      badgeColor: "text-forest-600",
      badgeBg: "bg-forest-50",
      headerFrom: "from-forest-500",
      headerTo: "to-forest-600",
      icon: TrendingUp,
    };
  if (total >= 12)
    return {
      tier: "fair",
      label: "Fair",
      badgeColor: "text-terracotta-600",
      badgeBg: "bg-terracotta-100",
      headerFrom: "from-terracotta-500",
      headerTo: "to-terracotta-600",
      icon: HeartPulse,
    };
  return {
    tier: "doctor",
    label: "Please Visit a Doctor",
    badgeColor: "text-red-100",
    badgeBg: "bg-red-900/30",
    headerFrom: "from-red-700",
    headerTo: "to-red-900",
    icon: AlertCircle,
  };
}

const SCORE_GUIDE = [
  { range: "6–11", label: "Please Visit a Doctor", color: "text-destructive" },
  { range: "12–17", label: "Fair", color: "text-terracotta-500" },
  { range: "18–24", label: "Good", color: "text-forest-500" },
  { range: "25–30", label: "Excellent Health", color: "text-forest-700" },
];

export function ResultsPanel({ scores, labels, icons }: ResultsPanelProps) {
  const total = scores.reduce((a, b) => a + b, 0);
  const wellness = getWellnessInfo(total);
  const WellnessIcon = wellness.icon;
  const isDoctor = wellness.tier === "doctor";
  const isExcellent = wellness.tier === "excellent";

  return (
    <motion.div
      data-ocid="eval.results_panel"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="bg-card rounded-3xl shadow-card-hover border border-border/60 overflow-hidden"
    >
      {/* Header — color shifts by tier */}
      <div
        className={`bg-gradient-to-br ${wellness.headerFrom} ${wellness.headerTo} p-6 md:p-8 text-white relative overflow-hidden`}
      >
        {/* Celebratory shimmer for Excellent */}
        {isExcellent && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 1.8, repeat: 2, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(ellipse at 60% 40%, oklch(0.95 0.12 90 / 0.6) 0%, transparent 60%)",
            }}
          />
        )}
        {/* Urgency pulse ring for Doctor */}
        {isDoctor && (
          <motion.div
            className="absolute -top-4 -right-4 w-24 h-24 rounded-full border-4 border-red-400/40 pointer-events-none"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}

        <p className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-2">
          Your Wellness Score
        </p>
        <div className="flex items-end gap-3">
          <motion.span
            className="font-display text-6xl font-normal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            {total}
          </motion.span>
          <span className="text-2xl opacity-60 mb-2">/30</span>
        </div>

        <div
          className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-sm font-semibold ${wellness.badgeBg} ${wellness.badgeColor}`}
        >
          <WellnessIcon className="w-4 h-4" />
          {wellness.label}
        </div>

        {isDoctor && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3 text-xs text-red-200 leading-relaxed max-w-xs"
          >
            Your score indicates several areas that may benefit from
            professional medical attention. Please consult your healthcare
            provider.
          </motion.p>
        )}

        {isExcellent && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3 text-xs text-green-100 leading-relaxed"
          >
            🎉 Fantastic — you&apos;re in great shape! Keep up the wonderful
            habits.
          </motion.p>
        )}
      </div>

      {/* Breakdown */}
      <div className="p-5 md:p-6">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-4">
          Category Breakdown
        </h3>
        <div className="space-y-4">
          {scores.map((score, i) => (
            <div key={labels[i]} className="flex items-center gap-3">
              <span className="text-lg w-6 flex-shrink-0">{icons[i]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-foreground truncate">
                    {labels[i]}
                  </span>
                  <span className="text-xs font-bold text-primary ml-2">
                    {score}/5
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isDoctor ? "bg-destructive" : "bg-primary"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / 5) * 100}%` }}
                    transition={{
                      delay: i * 0.08 + 0.3,
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Score guide */}
        <div className="mt-6 p-4 rounded-xl bg-muted/60 border border-border/40">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Score Guide
          </p>
          <div className="space-y-2">
            {SCORE_GUIDE.map(({ range, label, color }) => {
              const isActive =
                label === wellness.label ||
                (wellness.tier === "excellent" &&
                  label === "Excellent Health") ||
                (wellness.tier === "good" && label === "Good") ||
                (wellness.tier === "fair" && label === "Fair") ||
                (wellness.tier === "doctor" &&
                  label === "Please Visit a Doctor");
              return (
                <div
                  key={range}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 transition-colors ${
                    isActive ? "bg-foreground/5 ring-1 ring-foreground/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                    <span className={`text-xs font-semibold ${color}`}>
                      {label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {range}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
