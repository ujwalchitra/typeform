"use client";

import { Plus, X } from "lucide-react";
import type { Question } from "@/lib/types";
import { QUESTION_TYPE_LABELS } from "@/lib/types";

interface QuestionEditorProps {
  question: Question;
  onUpdate: (data: Partial<Question>) => void;
}

export function QuestionEditor({ question, onUpdate }: QuestionEditorProps) {
  const addOption = () => {
    const options = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
    onUpdate({ options });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(question.options || [])];
    options[index] = value;
    onUpdate({ options });
  };

  const removeOption = (index: number) => {
    const options = (question.options || []).filter((_, i) => i !== index);
    onUpdate({ options });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Question Type
        </label>
        <p className="text-sm font-medium text-gray-900">
          {QUESTION_TYPE_LABELS[question.type]}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Question
        </label>
        <input
          type="text"
          value={question.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Type your question here..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-typeform-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Description (optional)
        </label>
        <input
          type="text"
          value={question.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value || null })}
          placeholder="Add a description or help text..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-typeform-accent"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Required</p>
          <p className="text-xs text-gray-500">Respondents must answer this question</p>
        </div>
        <button
          onClick={() => onUpdate({ required: !question.required })}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            question.required ? "bg-typeform-accent" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              question.required ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {(question.type === "multiple_choice" || question.type === "dropdown") && (
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Options
          </label>
          <div className="space-y-2">
            {(question.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded text-xs text-gray-400">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-typeform-accent"
                />
                <button
                  onClick={() => removeOption(i)}
                  className="rounded p-1 text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addOption}
              className="flex items-center gap-1.5 text-sm text-typeform-accent hover:underline"
            >
              <Plus size={14} />
              Add option
            </button>
          </div>
        </div>
      )}

      {question.type === "rating" && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Max Rating
          </label>
          <select
            value={(question.settings?.max_rating as number) || 5}
            onChange={(e) =>
              onUpdate({
                settings: { ...question.settings, max_rating: parseInt(e.target.value) },
              })
            }
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-typeform-accent"
          >
            {[3, 4, 5, 7, 10].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
