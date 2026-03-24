import { motion } from "motion/react";

interface QuestionCardProps {
  index: number;
  question: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
}

export function QuestionCard({
  index,
  question,
  icon,
  value,
  onChange,
}: QuestionCardProps) {
  return (
    <motion.div
      data-ocid={`eval.question.item.${index}`}
      className="bg-card rounded-2xl p-5 md:p-6 shadow-card border border-border/60"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-start gap-3 mb-5">
        <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 block">
            Question {index}
          </span>
          <p className="text-foreground font-semibold text-base leading-snug">
            {question}
          </p>
        </div>
      </div>

      <div className="flex items-end gap-2 md:gap-3">
        <span className="text-xs text-muted-foreground w-8 text-center mb-3 flex-shrink-0">
          Poor
        </span>
        <div className="flex gap-2 md:gap-3 flex-1 justify-center">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              data-ocid="eval.rating.button"
              data-question={index}
              data-value={v}
              onClick={() => onChange(v)}
              className={`rating-btn ${
                value === v ? "selected" : "unselected"
              }`}
              aria-label={`Rate ${v} out of 5`}
              aria-pressed={value === v}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground w-8 text-center mb-3 flex-shrink-0">
          Excel
        </span>
      </div>

      {value > 0 && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden origin-left"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
