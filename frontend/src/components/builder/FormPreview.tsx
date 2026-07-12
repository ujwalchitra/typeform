"use client";

import type { Question } from "@/lib/types";

interface FormPreviewProps {
  formTitle: string;
  formDescription: string | null;
  questions: Question[];
  activeQuestionIndex: number;
}

export function FormPreview({
  formTitle,
  formDescription,
  questions,
  activeQuestionIndex,
}: FormPreviewProps) {
  const question = questions[activeQuestionIndex];

  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#0445AF] p-8 text-white">
      {!question ? (
        <div className="text-center animate-slide-up">
          <h2 className="mb-2 text-3xl font-light">{formTitle}</h2>
          {formDescription && (
            <p className="text-lg opacity-80">{formDescription}</p>
          )}
          <p className="mt-8 text-sm opacity-60">
            Add questions to see a live preview
          </p>
        </div>
      ) : (
        <div className="w-full max-w-xl animate-slide-in-right">
          <div className="mb-2 flex items-center gap-2 text-sm opacity-70">
            <span>{activeQuestionIndex + 1}</span>
            <span>→</span>
            {question.required && <span className="text-red-300">*</span>}
          </div>
          <h2 className="mb-2 text-2xl font-light leading-snug">
            {question.title || "Untitled question"}
          </h2>
          {question.description && (
            <p className="mb-6 text-base opacity-70">{question.description}</p>
          )}
          <PreviewInput question={question} />
          <div className="mt-8 flex items-center gap-3">
            <button className="rounded bg-white/20 px-5 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/30">
              OK ✓
            </button>
            <span className="text-xs opacity-50">
              press <strong>Enter ↵</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewInput({ question }: { question: Question }) {
  switch (question.type) {
    case "short_text":
    case "email":
    case "number":
      return (
        <input
          type="text"
          placeholder="Type your answer here..."
          className="tf-input py-2 text-lg"
          disabled
        />
      );
    case "long_text":
      return (
        <textarea
          placeholder="Type your answer here..."
          className="tf-input min-h-[80px] resize-none py-2 text-lg"
          disabled
        />
      );
    case "multiple_choice":
      return (
        <div className="space-y-2">
          {(question.options || []).map((opt, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-white/20 px-4 py-3 transition-colors hover:border-white/40 hover:bg-white/5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded border border-white/40 text-xs">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </div>
          ))}
        </div>
      );
    case "dropdown":
      return (
        <select className="tf-input py-2 text-lg" disabled>
          <option>Select an option...</option>
          {(question.options || []).map((opt, i) => (
            <option key={i}>{opt}</option>
          ))}
        </select>
      );
    case "yes_no":
      return (
        <div className="flex gap-3">
          {["Yes", "No"].map((opt) => (
            <div
              key={opt}
              className="rounded-lg border border-white/20 px-6 py-3 transition-colors hover:border-white/40 hover:bg-white/5"
            >
              <span className="mr-2 text-xs opacity-50">
                {opt === "Yes" ? "Y" : "N"}
              </span>
              {opt}
            </div>
          ))}
        </div>
      );
    case "rating":
      const max = (question.settings?.max_rating as number) || 5;
      return (
        <div className="flex gap-2">
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className="text-3xl opacity-40 hover:opacity-100">
              ★
            </span>
          ))}
        </div>
      );
    default:
      return null;
  }
}
