export type FormStatus = "draft" | "published";

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export interface Question {
  id: string;
  form_id: string;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  options: string[] | null;
  settings: Record<string, unknown> | null;
}

export interface FormListItem {
  id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  share_slug: string;
  response_count: number;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormDetail {
  id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  share_slug: string;
  thank_you_title: string;
  thank_you_message: string;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface ResponseListItem {
  id: string;
  form_id: string;
  submitted_at: string;
  answer_count: number;
}

export interface AnswerDetail {
  id: string;
  question_id: string;
  value: string | null;
  question_title: string | null;
  question_type: QuestionType | null;
}

export interface ResponseDetail {
  id: string;
  form_id: string;
  submitted_at: string;
  answers: AnswerDetail[];
}

export interface QuestionStat {
  question_id: string;
  question_title: string;
  question_type: QuestionType;
  total_answers: number;
  distribution: Record<string, number> | null;
  average: number | null;
}

export interface FormStats {
  total_responses: number;
  question_stats: QuestionStat[];
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Multiple Choice",
  dropdown: "Dropdown",
  email: "Email",
  number: "Number",
  yes_no: "Yes / No",
  rating: "Rating",
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  short_text: "Aa",
  long_text: "¶",
  multiple_choice: "☑",
  dropdown: "▼",
  email: "@",
  number: "#",
  yes_no: "✓",
  rating: "★",
};
