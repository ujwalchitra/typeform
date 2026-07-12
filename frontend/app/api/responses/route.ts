import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

async function readBackendResponse(response: Response) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(
      `${BACKEND_URL}/responses/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await readBackendResponse(
      backendResponse
    );

    if (!backendResponse.ok) {
      console.error(
        "Backend submit response error:",
        {
          status: backendResponse.status,
          data,
        }
      );

      const errorMessage =
        typeof data.detail === "string"
          ? data.detail
          : typeof data.error === "string"
            ? data.error
            : "Failed to submit response";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: backendResponse.status,
        }
      );
    }

    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error(
      "Submit response proxy error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to submit response",
      },
      {
        status: 500,
      }
    );
  }
}