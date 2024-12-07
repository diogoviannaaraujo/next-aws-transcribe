import React, { useEffect, useState } from 'react';

export default function Home() {
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndConnect = async () => {
      try {
        // Get WebSocket URL from API
        const response = await fetch('/api/transcribe-url');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get WebSocket URL');
        }

        const { url } = data;

        // Connect to WebSocket
        const socket = new WebSocket(url);

        socket.onopen = () => {
          console.log('WebSocket connection established');
        };

        socket.onmessage = (event) => {
          // Handle transcription results
          const result = JSON.parse(event.data);
          if (result?.results?.[0]?.alternatives?.[0]?.transcript) {
            setTranscription((prev) => prev + result.results[0].alternatives[0].transcript);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('WebSocket connection failed');
        };

        socket.onclose = () => {
          console.log('WebSocket connection closed');
        };

        // Stream audio to WebSocket
        const streamAudio = async () => {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new AudioContext();
          const mediaStreamSource = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);

          mediaStreamSource.connect(processor);
          processor.connect(audioContext.destination);

          processor.onaudioprocess = (event) => {
            if (socket.readyState === WebSocket.OPEN) {
              const audioData = event.inputBuffer.getChannelData(0);
              const int16Array = new Int16Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                int16Array[i] = Math.min(1, audioData[i]) * 0x7fff;
              }
              socket.send(int16Array.buffer);
            }
          };
        };

        streamAudio();
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error occurred');
      }
    };

    fetchAndConnect();
  }, []);

  return (
    <div>
      <h1>Amazon Transcribe</h1>
      <p>{error ? `Error: ${error}` : transcription || 'Listening...'}</p>
    </div>
  );
};