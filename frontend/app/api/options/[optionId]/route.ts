const BACKEND_URL = "http://127.0.0.1:8000";

interface RouteContext {
  params: Promise<{
    optionId: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const { optionId } = await context.params;
  const body = await request.json();

  const response = await fetch(
    `${BACKEND_URL}/options/${optionId}`,
    {
      method: "PATCH",
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

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { optionId } = await context.params;

  const response = await fetch(
    `${BACKEND_URL}/options/${optionId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  return Response.json(data, {
    status: response.status,
  });
}