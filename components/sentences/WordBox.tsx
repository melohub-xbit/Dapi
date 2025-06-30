import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface WordBoxProps {
  word: string;
  language: string | null;
}

const WordBox: React.FC<WordBoxProps> = ({ word, language }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePlay() {
    setLoading(true);
    setAudioUrl(null);
    const res = await fetch('/api/generateOrFetchAudio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: word, type: 'word', language: language }),
    });
    const data = await res.json();
    setAudioUrl(data.url);
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`inline-flex items-center bg-gray-100 rounded px-2 py-1 mr-1 mb-1 cursor-pointer transition border border-transparent hover:border-blue-200 hover:underline ${
        loading ? 'opacity-50 pointer-events-none' : ''
      }`}
      onClick={loading ? undefined : handlePlay}
      title="Play audio"
      style={{ userSelect: 'none' }}
      disabled={loading}
    >
      {word}
      {audioUrl && <audio src={audioUrl} autoPlay style={{ display: 'none' }} />}
    </Button>
  );
};

export default WordBox;
