"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface QuestionData {
  id: number;
  title: string;
  question_type: string;
  description: string;
  required: boolean;
  position: number;
}

interface OptionData {
  id: number;
  text: string;
  position: number;
}

async function readResponseData(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {
      error: responseText,
    };
  }
}

export default function PublicFormPage() {
  const params = useParams();
  const formId = String(params.id);

  const [formTitle, setFormTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [options, setOptions] = useState<
    Record<number, OptionData[]>
  >({});
  const [answers, setAnswers] = useState<
    Record<number, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadForm() {
      try {
        setLoading(true);
        setError("");

        const formResponse = await fetch(
          `/api/forms/${formId}`,
          {
            cache: "no-store",
          }
        );

        const formData =
          await readResponseData(formResponse);

        if (!formResponse.ok) {
          throw new Error(
            formData.detail ||
              formData.error ||
              "Failed to load form"
          );
        }

        setFormTitle(formData.title || "Untitled Form");

        const questionsResponse = await fetch(
          `/api/forms/${formId}/questions`,
          {
            cache: "no-store",
          }
        );

        const questionsData =
          await readResponseData(questionsResponse);

        if (!questionsResponse.ok) {
          throw new Error(
            questionsData.detail ||
              questionsData.error ||
              "Failed to load questions"
          );
        }

        const sortedQuestions: QuestionData[] =
          Array.isArray(questionsData)
            ? [...questionsData].sort(
                (
                  firstQuestion: QuestionData,
                  secondQuestion: QuestionData
                ) =>
                  firstQuestion.position -
                  secondQuestion.position
              )
            : [];

        setQuestions(sortedQuestions);

        const optionsMap: Record<
          number,
          OptionData[]
        > = {};

        for (const question of sortedQuestions) {
          if (
            question.question_type ===
              "multiple_choice" ||
            question.question_type === "dropdown"
          ) {
            const optionsResponse = await fetch(
              `/api/questions/${question.id}/options`,
              {
                cache: "no-store",
              }
            );

            const optionsData =
              await readResponseData(optionsResponse);

            if (!optionsResponse.ok) {
              throw new Error(
                optionsData.detail ||
                  optionsData.error ||
                  `Failed to load options for "${question.title}"`
              );
            }

            optionsMap[question.id] = Array.isArray(
              optionsData
            )
              ? [...optionsData].sort(
                  (
                    firstOption: OptionData,
                    secondOption: OptionData
                  ) =>
                    firstOption.position -
                    secondOption.position
                )
              : [];
          }
        }

        setOptions(optionsMap);
      } catch (loadError) {
        console.error("Load form error:", loadError);

        if (loadError instanceof Error) {
          setError(loadError.message);
        } else {
          setError("Failed to load form");
        }
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [formId]);

  function handleAnswer(
    questionId: number,
    value: string
  ) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const missingRequiredQuestions = questions.filter(
      (question) =>
        question.required &&
        !answers[question.id]?.trim()
    );

    if (missingRequiredQuestions.length > 0) {
      setError(
        "Please answer all required questions before submitting."
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form_id: Number(formId),
          answers,
        }),
      });

      const data = await readResponseData(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to submit form"
        );
      }

      setSubmitted(true);
      setAnswers({});
    } catch (submitError) {
      console.error("Submit form error:", submitError);

      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("Failed to submit form");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading form...
        </p>
      </main>
    );
  }

  if (error && questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-red-600">
            Unable to load form
          </h1>

          <p className="mt-3 text-gray-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl">✅</div>

          <h1 className="mb-2 text-2xl font-bold text-black">
            Form Submitted!
          </h1>

          <p className="text-gray-600">
            Thank you for your response.
          </p>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-6 rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
          >
            Submit another response
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-black">
            {formTitle}
          </h1>

          <p className="text-gray-500">
            Please fill out this form.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {questions.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-lg">
            <h2 className="text-xl font-semibold text-black">
              No questions available
            </h2>

            <p className="mt-2 text-gray-500">
              This form does not contain any questions.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-xl bg-white p-8 shadow-lg"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black">
                    {index + 1}. {question.title}

                    {question.required && (
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    )}
                  </h3>

                  {question.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {question.description}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  {question.question_type ===
                    "short_text" && (
                    <input
                      type="text"
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        handleAnswer(
                          question.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                      placeholder="Your answer..."
                      required={question.required}
                    />
                  )}

                  {question.question_type ===
                    "long_text" && (
                    <textarea
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        handleAnswer(
                          question.id,
                          event.target.value
                        )
                      }
                      className="min-h-32 w-full rounded-lg border border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                      placeholder="Your answer..."
                      required={question.required}
                    />
                  )}

                  {question.question_type ===
                    "email" && (
                    <input
                      type="email"
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        handleAnswer(
                          question.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                      placeholder="email@example.com"
                      required={question.required}
                    />
                  )}

                  {question.question_type ===
                    "number" && (
                    <input
                      type="number"
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        handleAnswer(
                          question.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                      placeholder="Enter a number"
                      required={question.required}
                    />
                  )}

                  {question.question_type ===
                    "yes_no" && (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleAnswer(
                            question.id,
                            "yes"
                          )
                        }
                        className={`rounded-lg border px-6 py-2 ${
                          answers[question.id] === "yes"
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-black hover:bg-gray-50"
                        }`}
                      >
                        Yes
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAnswer(
                            question.id,
                            "no"
                          )
                        }
                        className={`rounded-lg border px-6 py-2 ${
                          answers[question.id] === "no"
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-black hover:bg-gray-50"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  )}

                  {question.question_type ===
                    "rating" && (
                    <div className="flex gap-2 text-3xl">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              handleAnswer(
                                question.id,
                                String(star)
                              )
                            }
                            className={`transition hover:scale-110 ${
                              Number(
                                answers[question.id]
                              ) >= star
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {question.question_type ===
                    "multiple_choice" && (
                    <div className="space-y-3">
                      {options[question.id]?.map(
                        (option) => (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name={`question_${question.id}`}
                              value={option.text}
                              checked={
                                answers[question.id] ===
                                option.text
                              }
                              onChange={(event) =>
                                handleAnswer(
                                  question.id,
                                  event.target.value
                                )
                              }
                              className="h-4 w-4"
                              required={
                                question.required
                              }
                            />

                            <span className="text-black">
                              {option.text}
                            </span>
                          </label>
                        )
                      )}

                      {!options[question.id]?.length && (
                        <p className="text-sm text-gray-500">
                          No options available.
                        </p>
                      )}
                    </div>
                  )}

                  {question.question_type ===
                    "dropdown" && (
                    <select
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        handleAnswer(
                          question.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                      required={question.required}
                    >
                      <option value="">
                        Select an option
                      </option>

                      {options[question.id]?.map(
                        (option) => (
                          <option
                            key={option.id}
                            value={option.text}
                          >
                            {option.text}
                          </option>
                        )
                      )}
                    </select>
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-black py-4 text-lg font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Form"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}