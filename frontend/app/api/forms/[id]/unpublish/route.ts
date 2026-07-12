import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, context: any) {
  try {
    // Handle params whether it's a Promise or plain object
    const params = await context.params;
    const { id } = params;
    
    const response = await fetch(`http://localhost:8000/api/forms/${id}/unpublish`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to unpublish form" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unpublish error:", error);
    return NextResponse.json(
      { error: "Failed to unpublish form" },
      { status: 500 }
    );
  }
}