
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import UploadForm from './components/UploadForm';
import Loader from './components/Loader';
import ResultsGrid from './components/ResultsGrid';
import { Clip } from './types';
import { generateClipsFromTranscript, transcribeAudio } from './services/geminiService';
import { ExclamationTriangleIcon } from './components/icons/ExclamationTriangleIcon';

type AppState = 'upload' | 'loading' | 'results';

const DEMO_TRANSCRIPT = `
Interviewer: Welcome, Dr. Anya Sharma, a leading researcher in artificial intelligence. Let's dive right in. What is the most misunderstood aspect of AI today?
Dr. Sharma: Thank you for having me. I believe the biggest misconception is the idea of a single, all-knowing AI, like in the movies. The reality is far more specialized. We have AIs that can master chess, and others that can diagnose diseases, but they can't swap roles. The secret is that intelligence is not a single dimension. We're building a toolbox of specialized intelligences, not a single god-like entity. This is a crucial distinction for managing public expectation and fostering realistic, productive development in the field.
Interviewer: That's a fascinating point. So, we're not expecting a super-intelligence to emerge overnight?
Dr. Sharma: Exactly. Another key point is the role of data. An AI is only as good, or as biased, as the data it's trained on. If we feed it biased data, it will produce biased results. That’s why ethical data sourcing and cleaning are perhaps the most critical challenges we face. It's not just about algorithms; it's about the foundation of information we build them upon. This is the conversation we need to be having, the one that shapes a fair and equitable future with AI.
Interviewer: So ethics in data is the real frontier?
Dr. Sharma: Precisely. The future isn't about rogue AI, it's about responsible AI. It’s about ensuring the systems we build reflect the best of our values. The challenge isn't just technical; it's deeply human. We must decide what kind of intelligence we want to create, and what values we want it to uphold. That's the real work, and it requires all of us, not just the engineers.
`;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

// Create a single AudioContext to be reused.
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clipCount, setClipCount] = useState<number>(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);


  useEffect(() => {
    const savedCount = localStorage.getItem('podcastClipCount');
    if (savedCount) {
      setClipCount(parseInt(savedCount, 10));
    }
  }, []);

  const handleGenerateClips = useCallback(async (transcript: string, isRetry = false) => {
    setAppState('loading');
    setError(null);

    try {
      const generatedClips = await generateClipsFromTranscript(transcript);
      setClips(generatedClips);
      setAppState('results');
      if (!isRetry) {
        const newCount = clipCount + generatedClips.length;
        setClipCount(newCount);
        localStorage.setItem('podcastClipCount', newCount.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState('upload');
    }
  }, [clipCount]);

  const processAudioFile = async (file: File) => {
    setAppState('loading');
    setError(null);
    setAudioBuffer(null);
    try {
      // Decode audio for playback/download first
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);

      // Then get base64 for transcription
      const audioData = await fileToBase64(file);
      const transcript = await transcribeAudio({
        mimeType: file.type,
        data: audioData,
      });
      await handleGenerateClips(transcript);
    } catch (err) {
       setError(err instanceof Error ? err.message : 'An unknown error occurred during audio processing.');
       setAppState('upload');
    }
  };

  const onGenerateSubmit = (inputType: 'file' | 'link' | 'demo', data?: File | string) => {
    setError(null);
    setAudioBuffer(null); // Reset audio buffer on new submission
    if (inputType === 'demo') {
      handleGenerateClips(DEMO_TRANSCRIPT);
    } else if (inputType === 'file' && data instanceof File) {
      processAudioFile(data);
    } else if (inputType === 'link' && typeof data === 'string' && data.length > 0) {
      handleGenerateClips(DEMO_TRANSCRIPT);
    }
  };

  const handleRegenerate = () => {
    handleGenerateClips(DEMO_TRANSCRIPT, true);
     setAudioBuffer(null);
  };
  
  const resetApp = () => {
    setAppState('upload');
    setClips([]);
    setError(null);
    setAudioBuffer(null);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-4">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center">
        {error && (
          <div className="w-full max-w-2xl mx-auto my-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg" role="alert">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="font-bold text-red-800">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Fix: Changed `isLoading={appState === 'loading'}` to `isLoading={false}`.
            The original comparison `appState === 'loading'` occurs inside a block where `appState` is already known to be `'upload'`,
            making the comparison always false. This caused a TypeScript error. Setting it explicitly to `false` resolves the
            error and maintains the original runtime behavior. */}
        {appState === 'upload' && <UploadForm onGenerate={onGenerateSubmit} isLoading={false} />}
        {appState === 'loading' && <Loader />}
        {appState === 'results' && clips.length > 0 && 
            <ResultsGrid clips={clips} onRegenerate={handleRegenerate} clipCount={clipCount} audioBuffer={audioBuffer} />
        }
        {appState === 'results' && (
             <button onClick={resetApp} className="mt-8 mb-4 text-gray-500 hover:text-gray-800 transition-colors">
                Start Over
            </button>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
