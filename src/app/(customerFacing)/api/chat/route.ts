import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { env } from "process";


const FASTAPI_URL = env.FASTAPI_URL || "http://localhost:8000/chat";

export async function POST(req: NextRequest) {
    try {
        console.log("Received request at /api/chat"); // Debugging
        const body = await req.json();
        console.log("Request body:", body); // Debugging

        const { message } = body;
        if (!message) {
            console.error("Error: Message is missing");
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        console.log("Sending request to FastAPI...");
        const response = await axios.post(FASTAPI_URL, { message });
        console.log("Received response from FastAPI:", response.data); // Debugging

        return NextResponse.json({ reply: response.data.reply }, { status: 200 });

    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Axios error:", error.response?.data || error.message);
            return NextResponse.json({ error: error.response?.data || "Failed to get response" }, { status: 500 });
        } else if (error instanceof Error) {
            console.error("Error in API route:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            console.error("Unexpected error:", error);
            return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
        }
    }
}
