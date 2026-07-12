"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface FormData {
  id: number;
  title: string;
  status: string;
}

export default function Home() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadForms() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/forms", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load forms");
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid forms response");
      }

      setForms(data);
    } catch (error) {
      console.error("Load forms error:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load forms");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForms();
  }, []);

  async function handleCreate() {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    try {
      setError("");

      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: cleanTitle,
        }),
      });

      const data = await response.json();

      console.log("Create response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create form");
      }

      setForms((currentForms) => [
        ...currentForms,
        data,
      ]);

      setTitle("");
    } catch (error) {
      console.error("Create form error:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create form");
      }
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");

      const response = await fetch(`/api/forms/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete form");
      }

      setForms((currentForms) =>
        currentForms.filter((form) => form.id !== id)
      );
    } catch (error) {
      console.error("Delete form error:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete form");
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-10">
      <h1 className="mb-8 text-4xl font-bold">
        Typeform Dashboard
      </h1>

      <div className="mb-8 flex gap-3">
        <input
          type="text"
          value={title}
          placeholder="New form title"
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleCreate();
            }
          }}
          className="flex-1 rounded-lg border p-3"
        />

        <button
          type="button"
          onClick={handleCreate}
          className="rounded-lg bg-black px-6 py-3 text-white"
        >
          Create
        </button>

        <button
          type="button"
          onClick={loadForms}
          className="rounded-lg border px-6 py-3"
        >
          Reload
        </button>
      </div>

      {loading && (
        <p className="text-gray-500">
          Loading forms...
        </p>
      )}

      {!loading && error && (
        <div className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && forms.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          No forms available.
        </div>
      )}

      {!loading && !error && forms.length > 0 && (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="flex items-center justify-between rounded-xl border p-5 shadow"
            >
              <div>
                <h2 className="text-xl font-semibold">
                  {form.title}
                </h2>

                <p className="capitalize text-gray-500">
                  {form.status}
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/forms/${form.id}/public`}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Share
                </Link>


                <Link
                  href={`/forms/${form.id}`}
                  className="rounded-lg bg-black px-4 py-2 text-white"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={() => handleDelete(form.id)}
                  className="rounded-lg bg-red-500 px-4 py-2 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}