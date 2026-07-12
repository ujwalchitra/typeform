const BACKEND_URL = "http://127.0.0.1:8000";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const response = await fetch(
      `${BACKEND_URL}/forms/${id}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("GET form proxy error:", error);

    return Response.json(
      {
        detail: "Could not load form",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const response = await fetch(
      `${BACKEND_URL}/forms/${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("DELETE form proxy error:", error);

    return Response.json(
      {
        detail: "Could not delete form",
      },
      {
        status: 500,
      }
    );
  }
}