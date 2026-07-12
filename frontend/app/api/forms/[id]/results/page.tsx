"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface FormData {
  id: number;
  title: string;
  status: string;
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

interface ResponseData {
  id: number;
  form_id: number;
}

interface AnswerData {
  id: number;
  response_id: number;
  question_id: number;
  value: string;
}

interface ResponseWithAnswers extends ResponseData {
  answers: AnswerData[];
}

export default function ResultsPage() {
  const params = useParams();
  const formId = String(params.id);

  const [form, setForm] = useState<FormData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        const [formResponse, questionsResponse, responsesResponse] =
          await Promise.all([
            fetch(`/api/forms/${formId}`, {
              cache: "no-store",
            }),
            fetch(`/api/forms/${formId}/questions`, {
              cache: "no-store",
            }),
            fetch(`/api/responses/form/${formId}`, {
              cache: "no-store",
            }),
          ]);

        const formText = await formResponse.text();
        const questionsText = await questionsResponse.text();
        const responsesText = await responsesResponse.text();

        const formData = formText
          ? JSON.parse(formText)
          : null;

        const questionsData = questionsText
          ? JSON.parse(questionsText)
          : [];

        const responsesData = responsesText
          ? JSON.parse(responsesText)
          : [];

        if (!formResponse.ok) {
          throw new Error(
            formData?.error ||
              formData?.detail ||
              "Failed to load form"
          );
        }

        if (!questionsResponse.ok) {
          throw new Error(
            questionsData?.error ||
              questionsData?.detail ||
              "Failed to load questions"
          );
        }

        if (!responsesResponse.ok) {
          throw new Error(
            responsesData?.error ||
              responsesData?.detail ||
              "Failed to load responses"
          );
        }

        const responseList: ResponseData[] = Array.isArray(
          responsesData
        )
          ? responsesData
          : [];

        const responsesWithAnswers =
          await Promise.all(
            responseList.map(async (responseItem) => {
              const answersResponse = await fetch(
                `/api/responses/answers/response/${responseItem.id}`,
                {
                  cache: "no-store",
                }
              );

              const answersText =
                await answersResponse.text();

              let answersData: AnswerData[] = [];

              if (answersText) {
                try {
                  const parsedAnswers =
                    JSON.parse(answersText);

                  answersData = Array.isArray(
                    parsedAnswers
                  )
                    ? parsedAnswers
                    : [];
                } catch {
                  answersData = [];
                }
              }

              if (!answersResponse.ok) {
                throw new Error(
                  `Failed to load answers for response ${responseItem.id}`
                );
              }

              return {
                ...responseItem,
                answers: answersData,
              };
            })
          );

        setForm(formData);

        setQuestions(
          Array.isArray(questionsData)
            ? [...questionsData].sort(
                (firstQuestion, secondQuestion) =>
                  firstQuestion.position -
                  secondQuestion.position
              )
            : []
        );

        setResponses(responsesWithAnswers);
      } catch (loadError) {
        console.error(
          "Load results error:",
          loadError
        );

        if (loadError instanceof Error) {
          setError(loadError.message);
        } else {
          setError("Failed to load results");
        }
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [formId]);

  function getAnswer(
    responseItem: ResponseWithAnswers,
    questionId: number
  ) {
    const answer = responseItem.answers.find(
      (answerItem) =>
        answerItem.question_id === questionId
    );

    return answer?.value || "No answer";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-black">
        <p>Loading results...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-black">
        <div className="w-full max-w-lg rounded-xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-red-600">
            Failed to load results
          </h1>

          <p className="mt-3 text-gray-600">
            {error}
          </p>

          <Link
            href={`/forms/${formId}`}
            className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white"
          >
            Back to builder
          </Link>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-black">
        <div className="rounded-xl border bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">
            Form not found
          </h1>

          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-black">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div className="flex items-center gap-5">
          <Link
            href={`/forms/${formId}`}
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Back
          </Link>

          <div>
            <p className="text-sm text-gray-500">
              Form Results
            </p>

            <h1 className="text-2xl font-bold">
              {form.title}
            </h1>
          </div>
        </div>

        <div className="rounded-full bg-gray-200 px-4 py-2">
          {responses.length}{" "}
          {responses.length === 1
            ? "response"
            : "responses"}
        </div>
      </header>

      <section className="p-8">
        {responses.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No responses yet
            </h2>

            <p className="mt-2 text-gray-500">
              Responses will appear here after users
              submit this form.
            </p>

            <Link
              href={`/forms/${formId}/public`}
              className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white"
            >
              Open public form
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map(
              (responseItem, responseIndex) => (
                <article
                  key={responseItem.id}
                  className="rounded-xl border bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex items-center justify-between border-b pb-4">
                    <h2 className="text-lg font-semibold">
                      Response {responseIndex + 1}
                    </h2>

                    <span className="text-sm text-gray-500">
                      ID: {responseItem.id}
                    </span>
                  </div>

                  <div className="space-y-5">
                    {questions.map(
                      (
                        question,
                        questionIndex
                      ) => (
                        <div
                          key={question.id}
                          className="rounded-lg bg-gray-50 p-4"
                        >
                          <p className="text-sm text-gray-500">
                            Question{" "}
                            {questionIndex + 1}
                          </p>

                          <h3 className="mt-1 font-medium">
                            {question.title}
                          </h3>

                          <p className="mt-3 whitespace-pre-wrap text-gray-700">
                            {getAnswer(
                              responseItem,
                              question.id
                            )}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}