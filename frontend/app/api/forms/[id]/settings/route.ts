import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  const { id } = params;
  return NextResponse.json({ 
    message: "Settings route is working", 
    formId: id 
  });
}

export async function PATCH(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const body = await request.json();
    
    const response = await fetch(`http://localhost:8000/api/forms/${id}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to update settings" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}