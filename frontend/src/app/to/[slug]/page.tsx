"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import type { FormDetail, Question } from "@/lib/types";

type Phase = "welcome" | "questions" | "submitting" | "thankyou";

export default function RespondentPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    api.public
      .getForm(slug)
      .then(setForm)
      .catch(() => setError("This form is not available."))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (phase === "questions" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [currentIndex, phase]);

  const currentQuestion = form?.questions[currentIndex];
  const totalQuestions = form?.questions.length || 0;
  const progress = phase === "welcome" ? 0 : ((currentIndex + 1) / totalQuestions) * 100;

  const validateCurrent = useCallback((): boolean => {
    if (!currentQuestion) return true;
    const value = answers[currentQuestion.id];

    if (currentQuestion.required && (!value || value.trim() === "")) {
      setValidationError("This field is required");
      return false;
    }

    if (value && currentQuestion.type === "email") {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(value)) {
        setValidationError("Please enter a valid email address");
        return false;
      }
    }

    if (value && currentQuestion.type === "number") {
      if (isNaN(Number(value))) {
        setValidationError("Please enter a valid number");
        return false;
      }
    }

    setValidationError(null);
    return true;
  }, [currentQuestion, answers]);

  const goNext = useCallback(() => {
    if (phase === "welcome") {
      setPhase("questions");
      return;
    }

    if (!validateCurrent()) return;

    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      handleSubmit();
    }
  }, [phase, currentIndex, totalQuestions, validateCurrent]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
      setValidationError(null);
    } else if (phase === "questions") {
      setPhase("welcome");
    }
  }, [currentIndex, phase]);

  const handleSubmit = async () => {
    if (!form) return;
    setPhase("submitting");
    try {
      const answerList = form.questions.map((q) => ({
        question_id: q.id,
        value: answers[q.id] || null,
      }));
      await api.public.submit(slug, answerList);
      setPhase("thankyou");
    } catch (e) {
      setPhase("questions");
      setValidationError(e instanceof Error ? e.message : "Submission failed");
    }
  };

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setValidationError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (currentQuestion?.type === "long_text") return;
      e.preventDefault();
      goNext();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      goBack();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      goNext();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0445AF]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0445AF] text-white">
        <h1 className="mb-2 text-2xl font-light">Form not found</h1>
        <p className="opacity-70">{error || "This form may have been removed or is not published."}</p>
      </div>
    );
  }

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div
      className="relative flex h-screen flex-col bg-[#0445AF] text-white"
      onKeyDown={handleKeyDown}
    >
      {/* Progress bar */}
      {phase !== "welcome" && phase !== "thankyou" && (
        <div className="absolute top-0 left-0 right-0 z-10 h-1 bg-white/10">
          <motion.div
            className="h-full bg-white/60"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            {phase === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <h1 className="mb-4 text-4xl font-light leading-tight md:text-5xl">
                  {form.title}
                </h1>
                {form.description && (
                  <p className="mb-10 text-lg opacity-80 md:text-xl">
                    {form.description}
                  </p>
                )}
                <button
                  onClick={goNext}
                  className="rounded bg-white px-8 py-3 text-base font-medium text-[#0445AF] transition-transform hover:scale-105 active:scale-95"
                >
                  Start
                </button>
                <p className="mt-4 text-xs opacity-50">
                  press <strong>Enter ↵</strong>
                </p>
              </motion.div>
            )}

            {phase === "questions" && currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-3 flex items-center gap-2 text-sm opacity-60">
                  <span>{currentIndex + 1}</span>
                  <span className="text-xs">→</span>
                  {currentQuestion.required && (
                    <span className="text-red-300">*</span>
                  )}
                </div>

                <h2 className="mb-2 text-2xl font-light leading-snug md:text-3xl">
                  {currentQuestion.title}
                </h2>
                {currentQuestion.description && (
                  <p className="mb-8 text-base opacity-70">
                    {currentQuestion.description}
                  </p>
                )}

                <QuestionInput
                  question={currentQuestion}
                  value={answers[currentQuestion.id] || ""}
                  onChange={(v) => setAnswer(currentQuestion.id, v)}
                  inputRef={inputRef}
                />

                {validationError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-sm text-red-300"
                  >
                    {validationError}
                  </motion.p>
                )}

                <div className="mt-8 flex items-center gap-4">
                  <button
                    onClick={goNext}
                    className="rounded bg-white/20 px-6 py-2.5 text-sm font-medium backdrop-blur transition-all hover:bg-white/30 active:scale-95"
                  >
                    {currentIndex < totalQuestions - 1 ? "OK ✓" : "Submit ✓"}
                  </button>
                  <span className="text-xs opacity-50">
                    press <strong>Enter ↵</strong>
                  </span>
                </div>
              </motion.div>
            )}

            {phase === "submitting" && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <p className="text-lg opacity-80">Submitting your response...</p>
              </motion.div>
            )}

            {phase === "thankyou" && (
              <motion.div
                key="thankyou"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <div className="mb-6 text-5xl">🎉</div>
                <h1 className="mb-4 text-3xl font-light md:text-4xl">
                  {form.thank_you_title}
                </h1>
                <p className="text-lg opacity-80">{form.thank_you_message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation hints */}
      {phase === "questions" && (
        <div className="absolute bottom-6 left-6 flex gap-3 text-xs opacity-40">
          <button
            onClick={goBack}
            className="hover:opacity-80"
            disabled={currentIndex === 0 && phase === "questions"}
          >
            ↑ Previous
          </button>
        </div>
      )}

      {/* Branding */}
      <div className="absolute bottom-6 right-6 text-xs opacity-30">
        Made with Typeform Clone
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  inputRef,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}) {
  switch (question.type) {
    case "short_text":
    case "email":
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={question.type === "email" ? "email" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          className="tf-input py-3 text-xl md:text-2xl"
        />
      );

    case "number":
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a number..."
          className="tf-input py-3 text-xl md:text-2xl"
        />
      );

    case "long_text":
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          className="tf-input min-h-[100px] resize-none py-3 text-xl md:text-2xl"
        />
      );

    case "multiple_choice":
      return (
        <div className="space-y-2">
          {(question.options || []).map((opt, i) => (
            <button
              key={i}
              onClick={() => onChange(opt)}
              className={`flex w-full items-center gap-4 rounded-lg border px-5 py-3.5 text-left text-base transition-all ${
                value === opt
                  ? "border-white bg-white/15"
                  : "border-white/25 hover:border-white/50 hover:bg-white/5"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${
                  value === opt
                    ? "bg-white text-[#0445AF]"
                    : "border border-white/40"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      );

    case "dropdown":
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tf-input cursor-pointer py-3 text-xl md:text-2xl"
        >
          <option value="" className="text-gray-900">
            Select an option...
          </option>
          {(question.options || []).map((opt, i) => (
            <option key={i} value={opt} className="text-gray-900">
              {opt}
            </option>
          ))}
        </select>
      );

    case "yes_no":
      return (
        <div className="flex gap-3">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`rounded-lg border px-8 py-3.5 text-base transition-all ${
                value === opt
                  ? "border-white bg-white/15"
                  : "border-white/25 hover:border-white/50 hover:bg-white/5"
              }`}
            >
              <span className="mr-2 text-xs opacity-50">
                {opt === "Yes" ? "Y" : "N"}
              </span>
              {opt}
            </button>
          ))}
        </div>
      );

    case "rating":
      const max = (question.settings?.max_rating as number) || 5;
      return (
        <div className="flex gap-1">
          {Array.from({ length: max }, (_, i) => (
            <button
              key={i}
              onClick={() => onChange(String(i + 1))}
              className={`text-4xl transition-all hover:scale-110 ${
                value && parseInt(value) >= i + 1
                  ? "text-yellow-300"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      );

    default:
      return null;
  }
}
