const BACKEND_URL = "http://127.0.0.1:8000";

interface RouteContext {
  params: Promise<{
    questionId: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { questionId } = await context.params;

  const response = await fetch(
    `${BACKEND_URL}/questions/${questionId}/options`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  return Response.json(data, {
    status: response.status,
  });
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { questionId } = await context.params;
  const body = await request.json();

  const response = await fetch(
    `${BACKEND_URL}/questions/${questionId}/options`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  return Response.json(data, {
    status: response.status,
  });
}