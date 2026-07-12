import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const response = await fetch(`http://localhost:8000/api/forms/${id}/publish`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to publish form" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish form" },
      { status: 500 }
    );
  }
}