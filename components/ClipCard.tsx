
import React, { useState, useRef, useEffect } from 'react';
import { Clip } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';
import { parseTimestamp, createAudioClip, downloadBlob, dataUrlToBlob } from '../utils/audioUtils';

interface ClipCardProps {
  clip: Clip;
  audioBuffer: AudioBuffer | null;
}

const ClipCard: React.FC<ClipCardProps> = ({ clip, audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Ensure audio context is available on the client
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Cleanup function to stop audio if component unmounts
    return () => {
      audioSourceRef.current?.stop();
    };
  }, []);

  const handlePlayPause = async () => {
    if (!audioBuffer || !audioContextRef.current) return;

    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    const { start, duration } = parseTimestamp(clip.timestamp);
    if (duration <= 0) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start(0, start, duration);
    source.onended = () => {
      setIsPlaying(false);
    };
    audioSourceRef.current = source;
    setIsPlaying(true);
  };

  const handleDownload = async () => {
    // Download image
    downloadBlob(dataUrlToBlob(clip.cardImageUrl!), `podcastclip-card-${clip.title.replace(/\s/g, '_')}.png`);

    // Download audio clip if buffer is available
    if (audioBuffer) {
        try {
            const audioBlob = await createAudioClip(audioBuffer, clip.timestamp);
            downloadBlob(audioBlob, `podcastclip-audio-${clip.title.replace(/\s/g, '_')}.wav`);
        } catch (error) {
            console.error("Failed to create or download audio clip:", error);
        }
    }
  };

  const handleShare = async () => {
    const shareTitle = `Podcast Clip: ${clip.title}`;
    const shareText = `${clip.summary}\n\nFrom The Digital Frontier podcast.`;
    const shareUrl = 'https://podcastclip.ai'; // A fallback URL for context

    // Prioritize Native Web Share API (especially for mobile)
    if (navigator.share && clip.cardImageUrl) {
      try {
        const imageBlob = dataUrlToBlob(clip.cardImageUrl);
        const imageFile = new File([imageBlob], `podcastclip-${clip.title.replace(/\s/g, '_')}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [imageFile] })) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
            files: [imageFile],
          });
          return; // Exit after successful share
        }
      } catch (error) {
        // This error is common when the user cancels the share action.
        // We check for this specific error name to avoid falling back to clipboard unnecessarily.
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('Share was cancelled by the user.');
          return; // Do nothing and exit gracefully.
        }
        console.error('Web Share API with file failed:', error);
        // For other, genuine errors, we let it fall through to the clipboard fallback.
      }
    }

    // Fallback to copying a rich text block to the clipboard
    const textToCopy = `${shareTitle}\n${shareText}\n\n${clip.hashtags.join(' ')}\n\nListen here: ${shareUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy share link.');
    }
  };
  
  const isAudioAvailable = audioBuffer !== null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 group">
      <div className="relative aspect-[9/16] bg-gray-100">
        {clip.cardImageUrl ? (
          <img src={clip.cardImageUrl} alt={clip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500">Generating preview...</p>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium text-purple-600">{clip.timestamp}</p>
          <p className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{clip.speaker}</p>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate group-hover:whitespace-normal">{clip.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{clip.summary}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {clip.hashtags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button 
            onClick={handlePlayPause}
            disabled={!isAudioAvailable}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            aria-label={isPlaying ? 'Pause clip' : 'Play clip'}
          >
            {isPlaying ? <PauseIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
            aria-label="Download clip"
            title="Download visual and audio clip"
            >
            <DownloadIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleShare} 
            className="relative p-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
            aria-label="Share clip"
          >
            <ShareIcon className="w-5 h-5" />
            {showCopied && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded">
                Copied!
              </span>
            )}
          </button>
        </div>
        {!isAudioAvailable && <p className="text-xs text-gray-400 text-center mt-2">Audio playback/download not available for demo.</p>}
      </div>
    </div>
  );
};

export default ClipCard;
