"use client";
import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import WordBox from "@/components/sentences/WordBox";

interface SentenceBoxProps {
  sentence: string;
  language: string | null;
}

const SentenceBox: React.FC<SentenceBoxProps> = ({ sentence, language }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translatedLang, setTranslatedLang] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [phonetic, setPhonetic] = useState<string | null>(null);
  const [showPhonetic, setShowPhonetic] = useState(false);
  const [recording, setRecording] = useState(false);
  const [validationResult, setValidationResult] = useState<null | {
    spokenText: string;
    score: number;
    isCorrect: boolean;
  }>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const lang = language;

  async function handlePlay() {
    setLoading(true);
    setAudioUrl(null);
    const res = await fetch("/api/generateOrFetchAudio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sentence, type: "sentence", language: lang }),
    });
    const data = await res.json();
    setAudioUrl(data.url);
    const audio = new Audio(data.url);
    await audio.play();
    setLoading(false);
  }

  async function handlePhonetic(selectedLang: string) {
    setLoading(true);
    setShowPhonetic(false);
    const res = await fetch("/api/getPhonetics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence, lang: selectedLang }),
    });
    const data = await res.json();
    setPhonetic(data.phonetic);
    setShowPhonetic(true);
    setLoading(false);
  }

  async function handleTranslate(selectedLang: string) {
    setTranslating(true);
    setTranslatedLang(selectedLang);
    const res = await fetch("/api/translateSentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence, lang: selectedLang }),
    });
    const data = await res.json();
    setTranslated(data.sentence);
    setTranslating(false);
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("expectedText", sentence);
      formData.append("language", lang ? lang : "en");


      const res = await fetch("/api/validateSpeech", {
        method: "POST",
        body: formData,
      });
      console.log(res);

      const data = await res.json();
      setValidationResult(data);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
                variant="outline"
                size="icon"
                onClick={handlePlay}
                disabled={loading}
                className="w-8 h-8"
            >
              {loading ? "..." : "🔊"}
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTranslate((v) => !v)}
                className="w-8 h-8"
            >
              🌐
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePhonetic(lang!)}
                disabled={!lang || loading}
                className="w-8 h-8"
            >
              🗣️
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={recording ? stopRecording : startRecording}
                className={`w-8 h-8 ${recording ? "bg-red-100" : ""}`}
            >
              {recording ? "⏹️" : "🎤"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {sentence.split(" ").map((word, idx) => (
                <WordBox key={idx} word={word} language={lang} />
            ))}
          </div>

          {showPhonetic && phonetic && (
              <div className="mt-4 border-t pt-4 text-muted-foreground italic">
                <p>Phonetic: {phonetic}</p>
              </div>
          )}

          {validationResult && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  You said: <i>"{validationResult.spokenText}"</i>
                </p>
                <p>
                  ✅ Match:{" "}
                  <span className={validationResult.isCorrect ? "text-green-600" : "text-red-600"}>
                {validationResult.isCorrect ? "Correct" : "Incorrect"}
              </span>{" "}
                  ({(validationResult.score * 100).toFixed(0)}%)
                </p>
              </div>
          )}

          {showTranslate && (
              <div className="mt-2">
                <Select onValueChange={handleTranslate} disabled={translating}>
                  <SelectTrigger className="w-[180px]">
                    <span>Choose language</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
                {translating && <span className="ml-2">Translating...</span>}
              </div>
          )}

          {translated && translatedLang && (
              <div className="mt-4 border-t pt-4">
                <SentenceBox sentence={translated} language={translatedLang} />
              </div>
          )}
        </CardContent>
      </Card>
  );
};

export default SentenceBox;
