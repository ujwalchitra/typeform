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
      `${BACKEND_URL}/forms/${id}/questions`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        detail: "Failed to load questions",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/forms/${id}/questions`,
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
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        detail: "Failed to create question",
      },
      {
        status: 500,
      }
    );
  }
}