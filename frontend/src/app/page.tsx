"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  BarChart3,
  Pencil,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { FormListItem } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";

export default function DashboardPage() {
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<FormListItem | null>(null);
  const [renameModal, setRenameModal] = useState<FormListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const { showToast } = useToast();

  const loadForms = async () => {
    try {
      const data = await api.forms.list();
      setForms(data);
    } catch {
      showToast("Failed to load forms", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleCreate = async () => {
    try {
      const form = await api.forms.create({ title: "Untitled Form" });
      window.location.href = `/forms/${form.id}/build`;
    } catch {
      showToast("Failed to create form", "error");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.forms.duplicate(id);
      showToast("Form duplicated");
      loadForms();
    } catch {
      showToast("Failed to duplicate form", "error");
    }
    setMenuOpen(null);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.forms.delete(deleteModal.id);
      showToast("Form deleted");
      setDeleteModal(null);
      loadForms();
    } catch {
      showToast("Failed to delete form", "error");
    }
  };

  const handleRename = async () => {
    if (!renameModal || !renameValue.trim()) return;
    try {
      await api.forms.update(renameModal.id, { title: renameValue.trim() });
      showToast("Form renamed");
      setRenameModal(null);
      loadForms();
    } catch {
      showToast("Failed to rename form", "error");
    }
  };

  const handlePublish = async (form: FormListItem) => {
    try {
      const publish = form.status === "draft";
      await api.forms.publish(form.id, publish);
      showToast(publish ? "Form published!" : "Form unpublished");
      loadForms();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update status", "error");
    }
    setMenuOpen(null);
  };

  return (
    <div className="min-h-screen bg-typeform-bg">
      <header className="border-b border-typeform-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-typeform-accent text-sm font-bold text-white">
              T
            </div>
            <h1 className="text-xl font-semibold text-typeform-dark">My Forms</h1>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-typeform-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-typeform-accent-hover"
          >
            <Plus size={18} />
            Create new form
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-typeform-accent border-t-transparent" />
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              📝
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              No forms yet
            </h2>
            <p className="mb-6 text-gray-500">
              Create your first form to get started
            </p>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-typeform-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-typeform-accent-hover"
            >
              <Plus size={18} />
              Create new form
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group flex items-center justify-between rounded-xl border border-typeform-border bg-white p-5 transition-shadow hover:shadow-md"
              >
                <Link
                  href={`/forms/${form.id}/build`}
                  className="flex-1"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-typeform-accent">
                      {form.title}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        form.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {form.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span>{form.question_count} questions</span>
                    <span>{form.response_count} responses</span>
                    <span>
                      Updated {formatDate(form.updated_at)}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  {form.status === "published" && (
                    <Link
                      href={`/to/${form.share_slug}`}
                      target="_blank"
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <ExternalLink size={16} />
                      View
                    </Link>
                  )}
                  <Link
                    href={`/forms/${form.id}/results`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <BarChart3 size={16} />
                    Results
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === form.id ? null : form.id)
                      }
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {menuOpen === form.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          <button
                            onClick={() => {
                              setRenameModal(form);
                              setRenameValue(form.title);
                              setMenuOpen(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil size={14} />
                            Rename
                          </button>
                          <button
                            onClick={() => handleDuplicate(form.id)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy size={14} />
                            Duplicate
                          </button>
                          <button
                            onClick={() => handlePublish(form)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <ExternalLink size={14} />
                            {form.status === "published" ? "Unpublish" : "Publish"}
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => {
                              setDeleteModal(form);
                              setMenuOpen(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete form"
        size="sm"
      >
        <p className="mb-4 text-sm text-gray-600">
          Are you sure you want to delete &quot;{deleteModal?.title}&quot;? This
          action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteModal(null)}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>

      <Modal
        open={!!renameModal}
        onClose={() => setRenameModal(null)}
        title="Rename form"
        size="sm"
      >
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-typeform-accent"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setRenameModal(null)}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleRename}
            className="rounded-lg bg-typeform-accent px-4 py-2 text-sm font-medium text-white hover:bg-typeform-accent-hover"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
