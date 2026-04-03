import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    // Validate basic fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Simulate network delay to make it look like an email is being sent to a dummy inbox
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Log the dummy mail locally (so developers know it "worked")
    console.log(`[DUMMY MAIL SENT]
To: admin@businessvaani.com
From: ${body.name} <${body.email}>
Message: ${body.message}
-------------------------`);

    return NextResponse.json({ success: true, message: "Email successfully delivered!" });
  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
