import type {
  FormDetail,
  FormListItem,
  FormStats,
  Question,
  QuestionType,
  ResponseDetail,
  ResponseListItem,
} from "./types";

const API_BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  forms: {
    list: () => request<FormListItem[]>("/api/forms"),
    get: (id: string) => request<FormDetail>(`/api/forms/${id}`),
    create: (data: { title?: string; description?: string }) =>
      request<FormDetail>("/api/forms", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: {
        title?: string;
        description?: string;
        thank_you_title?: string;
        thank_you_message?: string;
      }
    ) =>
      request<FormDetail>(`/api/forms/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/forms/${id}`, { method: "DELETE" }),
    duplicate: (id: string) =>
      request<FormDetail>(`/api/forms/${id}/duplicate`, { method: "POST" }),
    publish: (id: string, publish: boolean) =>
      request<FormDetail>(`/api/forms/${id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ publish }),
      }),
    stats: (id: string) => request<FormStats>(`/api/forms/${id}/stats`),
  },

  questions: {
    add: (
      formId: string,
      data: {
        type: QuestionType;
        title?: string;
        description?: string;
        required?: boolean;
        options?: string[];
        settings?: Record<string, unknown>;
      }
    ) =>
      request<Question>(`/api/forms/${formId}/questions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      formId: string,
      questionId: string,
      data: Partial<{
        type: QuestionType;
        title: string;
        description: string;
        required: boolean;
        options: string[];
        settings: Record<string, unknown>;
      }>
    ) =>
      request<Question>(`/api/forms/${formId}/questions/${questionId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (formId: string, questionId: string) =>
      request<void>(`/api/forms/${formId}/questions/${questionId}`, {
        method: "DELETE",
      }),
    reorder: (formId: string, items: { id: string; order: number }[]) =>
      request<Question[]>(`/api/forms/${formId}/questions/reorder`, {
        method: "PUT",
        body: JSON.stringify(items),
      }),
  },

  responses: {
    list: (formId: string) =>
      request<ResponseListItem[]>(`/api/forms/${formId}/responses`),
    get: (formId: string, responseId: string) =>
      request<ResponseDetail>(`/api/forms/${formId}/responses/${responseId}`),
  },

  public: {
    getForm: (slug: string) => request<FormDetail>(`/api/public/forms/${slug}`),
    submit: (
      slug: string,
      answers: { question_id: string; value: string | null }[]
    ) =>
      request<ResponseDetail>(`/api/public/forms/${slug}/responses`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
  },
};
