import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import Groq from "groq-sdk";
import { distance } from "fastest-levenshtein";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import os from "os";

const groq = new Groq();

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audio = formData.get("audio") as Blob;
        const expectedText = formData.get("expectedText") as string;
        const language = formData.get("language") as string;

        if (!audio || !expectedText || !language) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const buffer = Buffer.from(await audio.arrayBuffer());
        const tempFileName = `${randomUUID()}.webm`;
        const filePath = path.join(os.tmpdir(), tempFileName);

        await writeFile(filePath, buffer);
        console.log('language received', language.toLowerCase());
        const transcription = await groq.audio.transcriptions.create({
            file: createReadStream(filePath),
            model: "whisper-large-v3-turbo",
            response_format: "json",
            language: language.toLowerCase(),
        });

        const spokenText = transcription.text.trim().toLowerCase();
        const targetText = expectedText.trim().toLowerCase();
        const score =
            1 - distance(spokenText, targetText) / Math.max(spokenText.length, targetText.length);
        const isCorrect = score > 0.9;

        return NextResponse.json({
            spokenText,
            expectedText: targetText,
            score: Number(score.toFixed(2)),
            isCorrect,
        });
    } catch (err) {
        console.error("Validation error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
