const BACKEND_URL = "http://127.0.0.1:8000";

interface RouteContext {
  params: Promise<{
    questionId: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const { questionId } = await context.params;

  try {
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/questions/${questionId}`,
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
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        detail: "Failed to update question",
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
  const { questionId } = await context.params;

  try {
    const response = await fetch(
      `${BACKEND_URL}/questions/${questionId}`,
      {
        method: "DELETE",
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
        detail: "Failed to delete question",
      },
      {
        status: 500,
      }
    );
  }
}