"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface ThemeSettings {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  fontFamily: string;
}

interface FormData {
  id: number;
  title: string;
  status: string;
  settings?: Partial<ThemeSettings> | string | null;
}

interface QuestionData {
  id: number;
  form_id: number;
  title: string;
  question_type: string;
  description: string;
  required: boolean;
  position: number;
}

interface OptionData {
  id: number;
  question_id: number;
  text: string;
  position: number;
}

interface SortableQuestionProps {
  question: QuestionData;
  index: number;
  selected: boolean;
  onSelect: (id: number) => void;
  theme: ThemeSettings;
}

const DEFAULT_THEME: ThemeSettings = {
  backgroundColor: "#f3f4f6",
  textColor: "#111827",
  buttonColor: "#000000",
  fontFamily: "Inter",
};

const questionTypes = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "dropdown", label: "Dropdown" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "yes_no", label: "Yes / No" },
  { value: "rating", label: "Rating" },
];

function parseThemeSettings(
  settings: FormData["settings"]
): ThemeSettings {
  if (!settings) {
    return DEFAULT_THEME;
  }

  let parsed: Record<string, string> = {};

  if (typeof settings === "string") {
    try {
      parsed = JSON.parse(settings);
    } catch {
      return DEFAULT_THEME;
    }
  } else {
    parsed = settings as Record<string, string>;
  }

  return {
    backgroundColor:
      parsed.backgroundColor ||
      parsed.background_color ||
      DEFAULT_THEME.backgroundColor,

    textColor:
      parsed.textColor ||
      parsed.text_color ||
      DEFAULT_THEME.textColor,

    buttonColor:
      parsed.buttonColor ||
      parsed.button_color ||
      parsed.primaryColor ||
      parsed.primary_color ||
      DEFAULT_THEME.buttonColor,

    fontFamily:
      parsed.fontFamily ||
      parsed.font_family ||
      DEFAULT_THEME.fontFamily,
  };
}

async function readResponse(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {
      detail: responseText,
    };
  }
}

function SortableQuestion({
  question,
  index,
  selected,
  onSelect,
  theme,
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging
          ? "0 10px 30px rgba(0, 0, 0, 0.2)"
          : "none",
        zIndex: isDragging ? 999 : "auto",
        borderColor: selected
          ? theme.buttonColor
          : "#d1d5db",
        backgroundColor: selected
          ? `${theme.buttonColor}12`
          : "#ffffff",
      }}
      className="w-full rounded-lg border"
    >
      <div className="flex items-center gap-2 p-3">
        <div
          className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={20} />
        </div>

        <button
          type="button"
          onClick={() => onSelect(question.id)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-xs text-gray-500">
            Question {index + 1}
          </p>

          <p
            className="truncate font-medium"
            style={{
              color: theme.textColor,
            }}
          >
            {question.title || "Untitled question"}
          </p>
        </button>
      </div>
    </div>
  );
}

export default function FormBuilderPage() {
  const params = useParams();
  const formId = String(params.id);

  const [form, setForm] = useState<FormData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [options, setOptions] = useState<OptionData[]>([]);
  const [theme, setTheme] =
    useState<ThemeSettings>(DEFAULT_THEME);

  const [selectedQuestionId, setSelectedQuestionId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const selectedQuestion =
    questions.find(
      (question) => question.id === selectedQuestionId
    ) ?? null;

async function loadForm() {
  const response = await fetch(`/api/forms/${formId}`, {
    cache: "no-store",
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail || data.error || "Failed to load form"
    );
  }

  const settings =
    typeof data.settings === "string"
      ? JSON.parse(data.settings || "{}")
      : data.settings || {};

  const loadedTheme: ThemeSettings = {
    backgroundColor:
      settings.background_color ||
      settings.backgroundColor ||
      "#f3f4f6",

    textColor:
      settings.text_color ||
      settings.textColor ||
      "#111827",

    buttonColor:
      settings.primary_color ||
      settings.button_color ||
      settings.buttonColor ||
      "#000000",

    fontFamily:
      settings.font_family ||
      settings.fontFamily ||
      "Inter, sans-serif",
  };

  console.log(
    "Applied theme:",
    JSON.stringify(loadedTheme, null, 2)
  );

  setForm(data);
  setTheme(loadedTheme);
}

  async function loadQuestions() {
    const response = await fetch(
      `/api/forms/${formId}/questions`,
      {
        cache: "no-store",
      }
    );

    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.error ||
          "Failed to load questions"
      );
    }

    const sortedQuestions: QuestionData[] = Array.isArray(data)
      ? [...data].sort(
          (firstQuestion, secondQuestion) =>
            firstQuestion.position -
            secondQuestion.position
        )
      : [];

    setQuestions(sortedQuestions);

    setSelectedQuestionId((currentSelectedId) => {
      if (
        currentSelectedId !== null &&
        sortedQuestions.some(
          (question) =>
            question.id === currentSelectedId
        )
      ) {
        return currentSelectedId;
      }

      return sortedQuestions.length > 0
        ? sortedQuestions[0].id
        : null;
    });
  }

  async function loadOptions(questionId: number) {
    const response = await fetch(
      `/api/questions/${questionId}/options`,
      {
        cache: "no-store",
      }
    );

    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.error ||
          "Failed to load options"
      );
    }

    const sortedOptions: OptionData[] = Array.isArray(data)
      ? [...data].sort(
          (firstOption, secondOption) =>
            firstOption.position -
            secondOption.position
        )
      : [];

    setOptions(sortedOptions);
  }

  useEffect(() => {
    async function loadBuilder() {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadForm(),
          loadQuestions(),
        ]);
      } catch (loadError) {
        console.error(
          "Load builder error:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load builder"
        );
      } finally {
        setLoading(false);
      }
    }

    loadBuilder();
  }, [formId]);

  // Reload theme when returning from the settings page.
  useEffect(() => {
    function refreshTheme() {
      loadForm().catch((loadError) => {
        console.error(
          "Refresh theme error:",
          loadError
        );
      });
    }

    window.addEventListener("focus", refreshTheme);

    return () => {
      window.removeEventListener(
        "focus",
        refreshTheme
      );
    };
  }, [formId]);

  useEffect(() => {
    if (
      selectedQuestion &&
      (selectedQuestion.question_type ===
        "multiple_choice" ||
        selectedQuestion.question_type ===
          "dropdown")
    ) {
      loadOptions(selectedQuestion.id).catch(
        (loadError) => {
          console.error(
            "Load options error:",
            loadError
          );
          setError("Failed to load options");
        }
      );
    } else {
      setOptions([]);
    }
  }, [
    selectedQuestionId,
    selectedQuestion?.question_type,
  ]);

  async function handleAddQuestion() {
    try {
      setError("");

      const response = await fetch(
        `/api/forms/${formId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `Question ${
              questions.length + 1
            }`,
            question_type: "short_text",
            description: "",
            required: false,
            position: questions.length,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to add question"
        );
      }

      setQuestions((currentQuestions) => [
        ...currentQuestions,
        data,
      ]);

      setSelectedQuestionId(data.id);
    } catch (addError) {
      console.error(
        "Add question error:",
        addError
      );

      setError(
        addError instanceof Error
          ? addError.message
          : "Failed to add question"
      );
    }
  }

  function updateQuestion(
    field: keyof Pick<
      QuestionData,
      | "title"
      | "question_type"
      | "description"
      | "required"
    >,
    value: string | boolean
  ) {
    if (selectedQuestionId === null) {
      return;
    }

    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === selectedQuestionId
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );

    void saveQuestionField(
      selectedQuestionId,
      field,
      value
    );
  }

  async function saveQuestionField(
    questionId: number,
    field: string,
    value: string | boolean
  ) {
    try {
      setError("");

      const response = await fetch(
        `/api/questions/${questionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [field]: value,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to update question"
        );
      }
    } catch (updateError) {
      console.error(
        "Update question error:",
        updateError
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update question"
      );
    }
  }

  async function handleDeleteQuestion(
    questionId: number
  ) {
    try {
      setError("");

      const response = await fetch(
        `/api/questions/${questionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to delete question"
        );
      }

      const remainingQuestions = questions.filter(
        (question) => question.id !== questionId
      );

      setQuestions(remainingQuestions);
      setOptions([]);

      setSelectedQuestionId(
        remainingQuestions.length > 0
          ? remainingQuestions[0].id
          : null
      );
    } catch (deleteError) {
      console.error(
        "Delete question error:",
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete question"
      );
    }
  }

  async function handleAddOption() {
    if (!selectedQuestion) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `/api/questions/${selectedQuestion.id}/options`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: `Option ${options.length + 1}`,
            position: options.length,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to add option"
        );
      }

      setOptions((currentOptions) => [
        ...currentOptions,
        data,
      ]);
    } catch (addError) {
      console.error(
        "Add option error:",
        addError
      );

      setError(
        addError instanceof Error
          ? addError.message
          : "Failed to add option"
      );
    }
  }

  async function handleDeleteOption(
    optionId: number
  ) {
    try {
      setError("");

      const response = await fetch(
        `/api/options/${optionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to delete option"
        );
      }

      setOptions((currentOptions) =>
        currentOptions.filter(
          (option) => option.id !== optionId
        )
      );
    } catch (deleteError) {
      console.error(
        "Delete option error:",
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete option"
      );
    }
  }

  function handleUpdateOption(
    optionId: number,
    text: string
  ) {
    setOptions((currentOptions) =>
      currentOptions.map((option) =>
        option.id === optionId
          ? {
              ...option,
              text,
            }
          : option
      )
    );

    void saveOptionText(optionId, text);
  }

  async function saveOptionText(
    optionId: number,
    text: string
  ) {
    try {
      setError("");

      const response = await fetch(
        `/api/options/${optionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to update option"
        );
      }
    } catch (updateError) {
      console.error(
        "Update option error:",
        updateError
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update option"
      );
    }
  }

  async function updateQuestionPosition(
    questionId: number,
    position: number
  ) {
    const response = await fetch(
      `/api/questions/${questionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position,
        }),
      }
    );

    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.error ||
          `Failed to reorder question ${questionId}`
      );
    }
  }

  async function handleDragEnd(
    event: DragEndEvent
  ) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = questions.findIndex(
      (question) => question.id === active.id
    );

    const newIndex = questions.findIndex(
      (question) => question.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const previousQuestions = [...questions];

    const reorderedQuestions = arrayMove(
      questions,
      oldIndex,
      newIndex
    ).map((question, index) => ({
      ...question,
      position: index,
    }));

    setQuestions(reorderedQuestions);

    try {
      setError("");

      // Temporary positions prevent duplicate-position
      // conflicts in the database.
      for (
        let index = 0;
        index < reorderedQuestions.length;
        index++
      ) {
        await updateQuestionPosition(
          reorderedQuestions[index].id,
          1000 + index
        );
      }

      for (const question of reorderedQuestions) {
        await updateQuestionPosition(
          question.id,
          question.position
        );
      }
    } catch (dragError) {
      console.error(
        "Question reorder error:",
        dragError
      );

      setQuestions(previousQuestions);

      setError(
        dragError instanceof Error
          ? dragError.message
          : "Failed to save question order"
      );
    }
  }

  async function handleCopyLink() {
    const publicUrl =
      `${window.location.origin}/forms/${formId}/public`;

    try {
      await navigator.clipboard.writeText(
        publicUrl
      );

      setCopyMessage("Public form link copied!");

      window.setTimeout(() => {
        setCopyMessage("");
      }, 3000);
    } catch (copyError) {
      console.error("Copy link error:", copyError);

      window.prompt(
        "Copy this public form link:",
        publicUrl
      );
    }
  }

  const themedButtonStyle = {
    backgroundColor: theme.buttonColor,
  };

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor:
            theme.backgroundColor,
          color: theme.textColor,
          fontFamily: theme.fontFamily,
        }}
      >
        <p>Loading builder...</p>
      </main>
    );
  }

  if (!form) {
    return (
      <main
  className="min-h-screen"
  style={{
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
  }}
>
        <div className="rounded-xl border bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">
            Form not found
          </h1>

          <Link
            href="/"
            className="mt-4 inline-block rounded-lg px-4 py-2 text-white"
            style={themedButtonStyle}
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-8 py-4">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Back
          </Link>

          <div>
            <p className="text-sm text-gray-500">
              Form Builder
            </p>

            <h1
              className="text-2xl font-bold"
              style={{
                color: theme.textColor,
              }}
            >
              {form.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/forms/${formId}/settings`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100"
            style={{
              color: theme.textColor,
            }}
          >
            Settings
          </Link>

          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-lg px-4 py-2 text-white"
            style={themedButtonStyle}
          >
            Share
          </button>

          <span className="rounded-full bg-gray-200 px-4 py-2 capitalize text-gray-800">
            {form.status}
          </span>
        </div>
      </header>

      {copyMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-600 px-5 py-3 font-medium text-white shadow-lg">
          {copyMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 px-8 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-h-[calc(100vh-81px)] grid-cols-[280px_1fr_380px]">
        <aside className="border-r border-black/10 bg-white p-5">
          <h2
            className="mb-4 font-semibold"
            style={{
              color: theme.textColor,
            }}
          >
            Questions
          </h2>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="mb-5 w-full rounded-lg px-4 py-3 text-white"
            style={themedButtonStyle}
          >
            Add Question
          </button>

          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(
                (question) => question.id
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {questions.map(
                  (question, index) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      index={index}
                      selected={
                        selectedQuestionId ===
                        question.id
                      }
                      onSelect={
                        setSelectedQuestionId
                      }
                      theme={theme}
                    />
                  )
                )}
              </div>
            </SortableContext>
          </DndContext>
        </aside>

        <section className="p-8">
          {!selectedQuestion ? (
            <div className="rounded-xl border border-black/10 bg-white p-10 text-center">
              <h2
                className="text-xl font-semibold"
                style={{
                  color: theme.textColor,
                }}
              >
                No question selected
              </h2>

              <p className="mt-2 text-gray-500">
                Add a question to start building.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2
                  className="text-xl font-semibold"
                  style={{
                    color: theme.textColor,
                  }}
                >
                  Question Editor
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteQuestion(
                      selectedQuestion.id
                    )
                  }
                  className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    className="mb-2 block font-medium"
                    style={{
                      color: theme.textColor,
                    }}
                  >
                    Question title
                  </label>

                  <input
                    type="text"
                    value={selectedQuestion.title}
                    onChange={(event) =>
                      updateQuestion(
                        "title",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium"
                    style={{
                      color: theme.textColor,
                    }}
                  >
                    Question type
                  </label>

                  <select
                    value={
                      selectedQuestion.question_type
                    }
                    onChange={(event) =>
                      updateQuestion(
                        "question_type",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                  >
                    {questionTypes.map((type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium"
                    style={{
                      color: theme.textColor,
                    }}
                  >
                    Description
                  </label>

                  <textarea
                    value={
                      selectedQuestion.description
                    }
                    onChange={(event) =>
                      updateQuestion(
                        "description",
                        event.target.value
                      )
                    }
                    className="min-h-28 w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                    placeholder="Optional help text"
                  />
                </div>

                {(selectedQuestion.question_type ===
                  "multiple_choice" ||
                  selectedQuestion.question_type ===
                    "dropdown") && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label
                        className="font-medium"
                        style={{
                          color: theme.textColor,
                        }}
                      >
                        Options
                      </label>

                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="rounded-lg px-4 py-2 text-sm text-white"
                        style={themedButtonStyle}
                      >
                        Add Option
                      </button>
                    </div>

                    <div className="space-y-3">
                      {options.map(
                        (option, index) => (
                          <div
                            key={option.id}
                            className="flex gap-3"
                          >
                            <input
                              type="text"
                              value={option.text}
                              onChange={(event) =>
                                handleUpdateOption(
                                  option.id,
                                  event.target.value
                                )
                              }
                              className="flex-1 rounded-lg border border-gray-300 bg-white p-3 text-black"
                              placeholder={`Option ${
                                index + 1
                              }`}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteOption(
                                  option.id
                                )
                              }
                              className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        )
                      )}

                      {options.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No options added yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <label
                  className="flex items-center gap-3"
                  style={{
                    color: theme.textColor,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedQuestion.required
                    }
                    onChange={(event) =>
                      updateQuestion(
                        "required",
                        event.target.checked
                      )
                    }
                    className="h-5 w-5"
                    style={{
                      accentColor:
                        theme.buttonColor,
                    }}
                  />

                  <span className="font-medium">
                    Required question
                  </span>
                </label>
              </div>
            </div>
          )}
        </section>

        <aside className="border-l border-black/10 bg-white p-6">
          <h2
            className="mb-4 font-semibold"
            style={{
              color: theme.textColor,
            }}
          >
            Live Preview
          </h2>

          {!selectedQuestion ? (
            <div
              className="flex min-h-80 items-center justify-center rounded-xl p-6"
              style={{
                backgroundColor:
                  theme.backgroundColor,
              }}
            >
              <p
                style={{
                  color: theme.textColor,
                }}
              >
                Questions will appear here.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor:
                  theme.backgroundColor,
                color: theme.textColor,
                fontFamily: theme.fontFamily,
              }}
            >
              <p className="mb-2 text-sm opacity-60">
                Question
              </p>

              <h3 className="text-2xl font-semibold">
                {selectedQuestion.title}

                {selectedQuestion.required && (
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                )}
              </h3>

              {selectedQuestion.description && (
                <p className="mt-2 opacity-70">
                  {selectedQuestion.description}
                </p>
              )}

              <div className="mt-8">
                {selectedQuestion.question_type ===
                  "short_text" && (
                  <input
                    disabled
                    placeholder="Type your answer here..."
                    className="w-full rounded-lg border bg-white p-3 text-black"
                  />
                )}

                {selectedQuestion.question_type ===
                  "long_text" && (
                  <textarea
                    disabled
                    placeholder="Type your answer here..."
                    className="min-h-32 w-full rounded-lg border bg-white p-3 text-black"
                  />
                )}

                {selectedQuestion.question_type ===
                  "email" && (
                  <input
                    disabled
                    type="email"
                    placeholder="name@example.com"
                    className="w-full rounded-lg border bg-white p-3 text-black"
                  />
                )}

                {selectedQuestion.question_type ===
                  "number" && (
                  <input
                    disabled
                    type="number"
                    placeholder="Enter a number"
                    className="w-full rounded-lg border bg-white p-3 text-black"
                  />
                )}

                {selectedQuestion.question_type ===
                  "yes_no" && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="rounded-lg px-5 py-3 text-white"
                      style={themedButtonStyle}
                    >
                      Yes
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-black"
                    >
                      No
                    </button>
                  </div>
                )}

                {selectedQuestion.question_type ===
                  "rating" && (
                  <div
                    className="text-3xl"
                    style={{
                      color: theme.buttonColor,
                    }}
                  >
                    ★ ★ ★ ★ ★
                  </div>
                )}

                {selectedQuestion.question_type ===
                  "multiple_choice" && (
                  <div className="space-y-3">
                    {options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white p-3 text-black"
                      >
                        <input
                          type="radio"
                          disabled
                          name="preview-option"
                          style={{
                            accentColor:
                              theme.buttonColor,
                          }}
                        />

                        <span>{option.text}</span>
                      </label>
                    ))}

                    {options.length === 0 && (
                      <p className="opacity-60">
                        Add options to preview this
                        question.
                      </p>
                    )}
                  </div>
                )}

                {selectedQuestion.question_type ===
                  "dropdown" && (
                  <select className="w-full rounded-lg border bg-white p-3 text-black">
                    <option value="">
                      Select an option
                    </option>

                    {options.map((option) => (
                      <option
                        key={option.id}
                        value={option.text}
                      >
                        {option.text}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}