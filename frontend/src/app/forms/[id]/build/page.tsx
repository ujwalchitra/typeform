"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Eye,
  Share2,
  Settings,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import type { FormDetail, Question, QuestionType } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import { QuestionList, QUESTION_TYPES } from "@/components/builder/QuestionList";
import { QuestionEditor } from "@/components/builder/QuestionEditor";
import { FormPreview } from "@/components/builder/FormPreview";

export default function BuilderPage() {
  const params = useParams();
  const formId = params.id as string;
  const { showToast } = useToast();

  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadForm = useCallback(async () => {
    try {
      const data = await api.forms.get(formId);
      setForm(data);
      if (!selectedQuestionId && data.questions.length > 0) {
        setSelectedQuestionId(data.questions[0].id);
      }
    } catch {
      showToast("Failed to load form", "error");
    } finally {
      setLoading(false);
    }
  }, [formId, selectedQuestionId, showToast]);

  useEffect(() => {
    loadForm();
  }, [formId]);

  const selectedQuestion = form?.questions.find(
    (q) => q.id === selectedQuestionId
  );

  const selectedIndex = form?.questions.findIndex(
    (q) => q.id === selectedQuestionId
  ) ?? 0;

  const handleAddQuestion = async (type: QuestionType) => {
    try {
      const q = await api.questions.add(formId, { type, title: "" });
      setShowAddMenu(false);
      await loadForm();
      setSelectedQuestionId(q.id);
      showToast("Question added");
    } catch {
      showToast("Failed to add question", "error");
    }
  };

  const handleUpdateQuestion = async (data: Partial<Question>) => {
    if (!selectedQuestionId) return;
    try {
      const payload: Record<string, unknown> = { ...data };
      if ("description" in payload && payload.description === null) {
        payload.description = "";
      }
      await api.questions.update(formId, selectedQuestionId, payload as Parameters<typeof api.questions.update>[2]);
      setForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === selectedQuestionId ? { ...q, ...data } : q
          ),
        };
      });
    } catch {
      showToast("Failed to update question", "error");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await api.questions.delete(formId, id);
      if (selectedQuestionId === id) {
        const remaining = form?.questions.filter((q) => q.id !== id);
        setSelectedQuestionId(remaining?.[0]?.id || null);
      }
      await loadForm();
      showToast("Question deleted");
    } catch {
      showToast("Failed to delete question", "error");
    }
  };

  const handleDuplicateQuestion = async (id: string) => {
    const q = form?.questions.find((q) => q.id === id);
    if (!q) return;
    try {
      const newQ = await api.questions.add(formId, {
        type: q.type,
        title: `${q.title} (Copy)`,
        description: q.description || undefined,
        required: q.required,
        options: q.options || undefined,
        settings: q.settings || undefined,
      });
      await loadForm();
      setSelectedQuestionId(newQ.id);
      showToast("Question duplicated");
    } catch {
      showToast("Failed to duplicate question", "error");
    }
  };

  const handleReorder = async (items: { id: string; order: number }[]) => {
    try {
      const updated = await api.questions.reorder(formId, items);
      setForm((prev) => (prev ? { ...prev, questions: updated } : prev));
    } catch {
      showToast("Failed to reorder questions", "error");
    }
  };

  const handleUpdateForm = async (data: {
    title?: string;
    description?: string;
    thank_you_title?: string;
    thank_you_message?: string;
  }) => {
    setSaving(true);
    try {
      const updated = await api.forms.update(formId, data);
      setForm(updated);
      showToast("Form updated");
    } catch {
      showToast("Failed to update form", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!form) return;
    try {
      const publish = form.status === "draft";
      const updated = await api.forms.publish(formId, publish);
      setForm(updated);
      showToast(publish ? "Form published!" : "Form unpublished");
      if (publish) setShowShareModal(true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to publish", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-typeform-accent border-t-transparent" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Form not found</p>
      </div>
    );
  }

  const shareUrl = `/to/${form.share_slug}`;

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-typeform-border bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft size={18} />
          </Link>
          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            onBlur={() => handleUpdateForm({ title: form.title })}
            className="border-none bg-transparent text-base font-semibold text-gray-900 outline-none focus:ring-0"
          />
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              form.status === "published"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {form.status === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/forms/${formId}/results`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <BarChart3 size={16} />
            Results
          </Link>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Settings size={16} />
            Settings
          </button>
          {form.status === "published" && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          )}
          <button
            onClick={handlePublish}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              form.status === "published"
                ? "bg-gray-600 hover:bg-gray-700"
                : "bg-typeform-accent hover:bg-typeform-accent-hover"
            }`}
          >
            {form.status === "published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </header>

      {/* Builder layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - question list */}
        <div className="flex w-72 flex-col border-r border-typeform-border bg-gray-50">
          <div className="flex-1 overflow-y-auto p-4">
            <QuestionList
              questions={form.questions}
              selectedId={selectedQuestionId}
              onSelect={setSelectedQuestionId}
              onDelete={handleDeleteQuestion}
              onDuplicate={handleDuplicateQuestion}
              onReorder={handleReorder}
            />
          </div>
          <div className="border-t border-typeform-border p-4">
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-typeform-accent hover:text-typeform-accent"
              >
                <Plus size={16} />
                Add question
              </button>
              {showAddMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowAddMenu(false)}
                  />
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                    {QUESTION_TYPES.map((qt) => (
                      <button
                        key={qt.type}
                        onClick={() => handleAddQuestion(qt.type)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-gray-100 text-xs">
                          {qt.icon}
                        </span>
                        {qt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center - question editor */}
        <div className="flex w-96 flex-col border-r border-typeform-border bg-white">
          {selectedQuestion ? (
            <div className="flex-1 overflow-y-auto p-6">
              <QuestionEditor
                question={selectedQuestion}
                onUpdate={handleUpdateQuestion}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-400">
              Select a question to edit or add a new one
            </div>
          )}
        </div>

        {/* Right - live preview */}
        <div className="flex-1 overflow-hidden">
          <FormPreview
            formTitle={form.title}
            formDescription={form.description}
            questions={form.questions}
            activeQuestionIndex={selectedIndex >= 0 ? selectedIndex : 0}
          />
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share your form"
      >
        <p className="mb-3 text-sm text-gray-600">
          Anyone with this link can fill out your form:
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
          />
          <button
            onClick={() => {
              const fullUrl = `${window.location.origin}${shareUrl}`;
              navigator.clipboard.writeText(fullUrl);
              showToast("Link copied!");
            }}
            className="rounded-lg bg-typeform-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-typeform-accent-hover"
          >
            Copy
          </button>
        </div>
        <Link
          href={`/to/${form.share_slug}`}
          target="_blank"
          className="mt-3 flex items-center gap-1.5 text-sm text-typeform-accent hover:underline"
        >
          <ExternalLink size={14} />
          Open form in new tab
        </Link>
      </Modal>

      {/* Settings Modal */}
      <Modal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Form settings"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Form Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-typeform-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value || null })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-typeform-accent"
              rows={2}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Thank You Title
            </label>
            <input
              type="text"
              value={form.thank_you_title}
              onChange={(e) =>
                setForm({ ...form, thank_you_title: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-typeform-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Thank You Message
            </label>
            <textarea
              value={form.thank_you_message}
              onChange={(e) =>
                setForm({ ...form, thank_you_message: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-typeform-accent"
              rows={2}
            />
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
            Theme customization — Coming Soon
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleUpdateForm({
                  title: form.title,
                  description: form.description || undefined,
                  thank_you_title: form.thank_you_title,
                  thank_you_message: form.thank_you_message,
                });
                setShowSettingsModal(false);
              }}
              disabled={saving}
              className="rounded-lg bg-typeform-accent px-4 py-2 text-sm font-medium text-white hover:bg-typeform-accent-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
