"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type {
  FormDetail,
  FormStats,
  ResponseListItem,
  ResponseDetail,
} from "@/lib/types";
import { QUESTION_TYPE_LABELS } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";

export default function ResultsPage() {
  const params = useParams();
  const formId = params.id as string;
  const { showToast } = useToast();

  const [form, setForm] = useState<FormDetail | null>(null);
  const [responses, setResponses] = useState<ResponseListItem[]>([]);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<ResponseDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "responses">("summary");

  useEffect(() => {
    Promise.all([
      api.forms.get(formId),
      api.responses.list(formId),
      api.forms.stats(formId),
    ])
      .then(([f, r, s]) => {
        setForm(f);
        setResponses(r);
        setStats(s);
      })
      .catch(() => showToast("Failed to load results", "error"))
      .finally(() => setLoading(false));
  }, [formId]);

  const viewResponse = async (responseId: string) => {
    try {
      const detail = await api.responses.get(formId, responseId);
      setSelectedResponse(detail);
    } catch {
      showToast("Failed to load response", "error");
    }
  };

  const exportCSV = () => {
    if (!form || responses.length === 0) return;
    showToast("CSV export — Coming Soon", "info");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-typeform-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-typeform-bg">
      <header className="border-b border-typeform-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/forms/${formId}/build`}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {form?.title} — Results
              </h1>
              <p className="text-sm text-gray-500">
                {stats?.total_responses || 0} responses
              </p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          {(["summary", "responses"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "summary" ? "Summary" : `Responses (${responses.length})`}
            </button>
          ))}
        </div>

        {activeTab === "summary" && stats && (
          <div className="space-y-6">
            {stats.question_stats.length === 0 ? (
              <div className="rounded-xl border border-typeform-border bg-white p-12 text-center text-gray-400">
                No questions in this form yet
              </div>
            ) : (
              stats.question_stats.map((qs) => (
                <div
                  key={qs.question_id}
                  className="rounded-xl border border-typeform-border bg-white p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {qs.question_title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {QUESTION_TYPE_LABELS[qs.question_type]} ·{" "}
                      {qs.total_answers} answers
                      {qs.average !== null && ` · Avg: ${qs.average}`}
                    </p>
                  </div>

                  {qs.distribution && (
                    <div className="space-y-2">
                      {Object.entries(qs.distribution)
                        .sort(([, a], [, b]) => b - a)
                        .map(([label, count]) => {
                          const pct =
                            qs.total_answers > 0
                              ? Math.round((count / qs.total_answers) * 100)
                              : 0;
                          return (
                            <div key={label} className="flex items-center gap-3">
                              <span className="w-32 truncate text-sm text-gray-700">
                                {label}
                              </span>
                              <div className="flex-1">
                                <div className="h-6 rounded bg-gray-100">
                                  <div
                                    className="h-full rounded bg-typeform-accent transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                              <span className="w-16 text-right text-sm text-gray-500">
                                {count} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {!qs.distribution && qs.average === null && (
                    <p className="text-sm text-gray-400">
                      Text responses — view individual submissions for details
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "responses" && (
          <div className="rounded-xl border border-typeform-border bg-white overflow-hidden">
            {responses.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                No responses yet. Share your form to start collecting answers.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Answers
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, i) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {responses.length - i}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDateTime(r.submitted_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.answer_count} answers
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => viewResponse(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-typeform-accent hover:bg-blue-50"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Response detail modal */}
      <Modal
        open={!!selectedResponse}
        onClose={() => setSelectedResponse(null)}
        title="Response Details"
        size="lg"
      >
        {selectedResponse && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Submitted{" "}
              {formatDateTime(selectedResponse.submitted_at)}
            </p>
            {selectedResponse.answers.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {a.question_title}
                </p>
                <p className="text-sm text-gray-900">
                  {a.value || <span className="italic text-gray-400">No answer</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
