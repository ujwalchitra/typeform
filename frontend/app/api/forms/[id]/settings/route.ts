import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

async function readResponse(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {
      detail: responseText,
    };
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const response = await fetch(
      `${BACKEND_URL}/forms/${id}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await readResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            typeof data.detail === "string"
              ? data.detail
              : "Failed to load form settings",
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Load settings error:", error);

    return NextResponse.json(
      {
        error: "Failed to load form settings",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/forms/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await readResponse(response);

    if (!response.ok) {
      console.error("Backend settings error:", {
        status: response.status,
        data,
      });

      return NextResponse.json(
        {
          error:
            typeof data.detail === "string"
              ? data.detail
              : typeof data.error === "string"
                ? data.error
                : "Failed to update form settings",
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update settings error:", error);

    return NextResponse.json(
      {
        error: "Failed to update form settings",
      },
      {
        status: 500,
      }
    );
  }
}