import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClipboardList, History, Leaf, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Evaluation } from "./backend.d";
import { QuestionCard } from "./components/QuestionCard";
import { ResultsPanel } from "./components/ResultsPanel";
import { useGetPastEvaluations, useSubmitEvaluation } from "./hooks/useQueries";

const queryClient = new QueryClient();

const QUESTIONS = [
  { id: "grip", label: "How good is your grip?", icon: "✊" },
  {
    id: "mobility",
    label: "Can you get up and walk after a good night sleep?",
    icon: "🌅",
  },
  {
    id: "memory",
    label: "Can you remember an incident from 20 years ago?",
    icon: "🧠",
  },
  {
    id: "perspire",
    label: "Do you perspire after walking for 20 minutes?",
    icon: "🚶",
  },
  {
    id: "social",
    label: "Do you like to meet friends once a week?",
    icon: "🤝",
  },
  { id: "skin", label: "Is your skin dull?", icon: "✨" },
];

const FIELD_KEYS: (keyof Omit<Evaluation, "id" | "timestamp">)[] = [
  "gripStrength",
  "morningMobility",
  "longTermMemory",
  "perspirationAfterWalking",
  "socialEngagement",
  "skinCondition",
];

function formatDate(timestamp: bigint) {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWellnessLabel(total: number) {
  if (total > 24)
    return {
      label: "Excellent Health",
      cls: "bg-forest-100 text-forest-700",
    };
  if (total >= 18)
    return { label: "Good", cls: "bg-forest-50 text-forest-600" };
  if (total >= 12)
    return { label: "Fair", cls: "bg-terracotta-100 text-terracotta-500" };
  return {
    label: "Please Visit a Doctor",
    cls: "bg-destructive/10 text-destructive font-semibold",
  };
}

function HistoryView() {
  const { data: evaluations, isLoading, isError } = useGetPastEvaluations();

  if (isLoading) {
    return (
      <div data-ocid="eval.loading_state" className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="eval.error_state"
        className="text-center py-12 text-destructive"
      >
        <p className="font-semibold">Failed to load history</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please try again later.
        </p>
      </div>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="font-display text-xl text-foreground mb-2">
          No evaluations yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Complete your first wellness check to see history here.
        </p>
      </div>
    );
  }

  const sorted = [...evaluations].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  return (
    <div className="space-y-4">
      {sorted.map((ev, i) => {
        const scores = FIELD_KEYS.map((k) => Number(ev[k]));
        const total = scores.reduce((a, b) => a + b, 0);
        const { label, cls } = getWellnessLabel(total);
        const isDoctor = total < 12;
        return (
          <motion.div
            key={String(ev.id)}
            data-ocid={`eval.history.item.${i + 1}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl p-5 shadow-card border ${
              isDoctor
                ? "bg-destructive/5 border-destructive/20"
                : "bg-card border-border/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-semibold text-foreground text-base">
                  Wellness Check
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(ev.timestamp)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div
                  className={`font-display text-3xl ${
                    isDoctor ? "text-destructive" : "text-primary"
                  }`}
                >
                  {total}
                </div>
                <div className="text-xs text-muted-foreground">/30</div>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${cls}`}
                >
                  {label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUESTIONS.map((q, qi) => (
                <div key={q.id} className="flex items-center gap-1.5">
                  <span className="text-sm">{q.icon}</span>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isDoctor ? "bg-destructive/60" : "bg-primary/70"
                        }`}
                        style={{ width: `${(scores[qi] / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono w-4 text-right">
                    {scores[qi]}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function EvaluationForm() {
  const [answers, setAnswers] = useState<number[]>(Array(6).fill(0));
  const [submitted, setSubmitted] = useState(false);
  const { mutate, isPending } = useSubmitEvaluation();

  const allAnswered = answers.every((a) => a > 0);

  const handleSubmit = () => {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    mutate(
      {
        gripStrength: BigInt(answers[0]),
        morningMobility: BigInt(answers[1]),
        longTermMemory: BigInt(answers[2]),
        perspirationAfterWalking: BigInt(answers[3]),
        socialEngagement: BigInt(answers[4]),
        skinCondition: BigInt(answers[5]),
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success("Wellness check submitted!");
        },
        onError: () => {
          toast.error("Failed to submit. Please try again.");
        },
      },
    );
  };

  const handleReset = () => {
    setAnswers(Array(6).fill(0));
    setSubmitted(false);
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {QUESTIONS.map((q, i) => (
              <QuestionCard
                key={q.id}
                index={i + 1}
                question={q.label}
                icon={q.icon}
                value={answers[i]}
                onChange={(v) => {
                  const next = [...answers];
                  next[i] = v;
                  setAnswers(next);
                }}
              />
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-2"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {answers.filter((a) => a > 0).length}/6 answered
                </p>
                <div className="h-1.5 w-32 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${
                        (answers.filter((a) => a > 0).length / 6) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <Button
                data-ocid="eval.submit_button"
                onClick={handleSubmit}
                disabled={!allAnswered || isPending}
                className="w-full h-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Wellness Check"
                )}
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <ResultsPanel
              scores={answers}
              labels={QUESTIONS.map((q) => q.label)}
              icons={QUESTIONS.map((q) => q.icon)}
            />
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full h-11 rounded-xl font-semibold border-primary/30 text-primary hover:bg-primary/5"
            >
              Take Another Evaluation
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(0.88 0.04 145 / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, oklch(0.91 0.04 50 / 0.2) 0%, transparent 50%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/70 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl text-foreground leading-none">
              WellCheck
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personal Wellness Evaluation
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="questionnaire">
          <TabsList className="w-full mb-6 h-11 rounded-xl bg-muted/70 p-1">
            <TabsTrigger
              value="questionnaire"
              data-ocid="eval.questionnaire_tab"
              className="flex-1 gap-2 rounded-lg text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <ClipboardList className="w-4 h-4" />
              Evaluate
            </TabsTrigger>
            <TabsTrigger
              value="history"
              data-ocid="eval.history_tab"
              className="flex-1 gap-2 rounded-lg text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questionnaire">
            <div className="mb-5">
              <h2 className="font-display text-2xl text-foreground">
                How are you feeling?
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Rate each aspect of your wellness from 1 (poor) to 5
                (excellent).
              </p>
            </div>
            <EvaluationForm />
          </TabsContent>

          <TabsContent value="history">
            <div className="mb-5">
              <h2 className="font-display text-2xl text-foreground">
                Your History
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Track your wellness journey over time.
              </p>
            </div>
            <HistoryView />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 mt-8 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
