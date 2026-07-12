"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface FormData {
  id: number;
  title: string;
  status: string;
}

interface FormSettings {
  primary_color: string;
  background_color: string;
  font_family: string;
  button_text: string;
}

export default function FormSettingsPage() {
  const params = useParams();
  const formId = String(params.id);

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settings, setSettings] = useState<FormSettings>({
    primary_color: "#000000",
    background_color: "#f3f4f6",
    font_family: "Inter, sans-serif",
    button_text: "Submit",
  });

  useEffect(() => {
    async function loadForm() {
      try {
        console.log("Loading form with ID:", formId);
        const response = await fetch(`/api/forms/${formId}`);
        const data = await response.json();
        console.log("Form data:", data);
        setForm(data);
      } catch (err) {
        console.error("Load form error:", err);
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [formId]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      console.log("Saving settings for form ID:", formId);
      console.log("Settings data:", settings);

      const response = await fetch(`/api/forms/${formId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Failed to save settings");
      }

      setSuccess("Settings saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-gray-600">Form not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">{form.title}</h1>
            <p className="text-gray-500">Form Settings</p>
          </div>
          <Link
            href={`/forms/${formId}`}
            className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Back to Builder
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Primary Color */}
          <div className="rounded-lg bg-white p-6 shadow">
            <label className="mb-2 block font-medium text-black">
              Primary Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) =>
                  setSettings({ ...settings, primary_color: e.target.value })
                }
                className="h-12 w-12 cursor-pointer rounded border"
              />
              <input
                type="text"
                value={settings.primary_color}
                onChange={(e) =>
                  setSettings({ ...settings, primary_color: e.target.value })
                }
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-black"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="rounded-lg bg-white p-6 shadow">
            <label className="mb-2 block font-medium text-black">
              Background Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.background_color}
                onChange={(e) =>
                  setSettings({ ...settings, background_color: e.target.value })
                }
                className="h-12 w-12 cursor-pointer rounded border"
              />
              <input
                type="text"
                value={settings.background_color}
                onChange={(e) =>
                  setSettings({ ...settings, background_color: e.target.value })
                }
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-black"
                placeholder="#f3f4f6"
              />
            </div>
          </div>

          {/* Font Family */}
          <div className="rounded-lg bg-white p-6 shadow">
            <label className="mb-2 block font-medium text-black">
              Font Family
            </label>
            <select
              value={settings.font_family}
              onChange={(e) =>
                setSettings({ ...settings, font_family: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Times New Roman, serif">Times New Roman</option>
            </select>
          </div>

          {/* Button Text */}
          <div className="rounded-lg bg-white p-6 shadow">
            <label className="mb-2 block font-medium text-black">
              Submit Button Text
            </label>
            <input
              type="text"
              value={settings.button_text}
              onChange={(e) =>
                setSettings({ ...settings, button_text: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
              placeholder="Submit"
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-medium text-black">Live Preview</h3>
            <div
              className="rounded-lg p-8"
              style={{
                backgroundColor: settings.background_color,
                fontFamily: settings.font_family,
              }}
            >
              <h2 className="mb-4 text-2xl font-bold" style={{ color: settings.primary_color }}>
                {form.title}
              </h2>
              <p className="mb-4 text-gray-600">This is how your form will look.</p>
              <button
                className="rounded-lg px-6 py-3 text-white"
                style={{ backgroundColor: settings.primary_color }}
              >
                {settings.button_text}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-black py-3 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </main>
  );
}