export interface FormData {
  id: number;
  title: string;
  status: string;
}

export async function getForms(): Promise<FormData[]> {
  const response = await fetch("/api/forms", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load forms: ${response.status}`);
  }

  return response.json();
}

export async function createForm(
  title: string
): Promise<FormData> {
  const response = await fetch("/api/forms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create form: ${response.status}`);
  }

  return response.json();
}

export async function deleteForm(id: number) {
  const response = await fetch(`/api/forms/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete form: ${response.status}`);
  }

  return response.json();
}

export async function getFormById(
  id: number
): Promise<FormData> {
  const response = await fetch(`/api/forms/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load form: ${response.status}`);
  }

  return response.json();
}