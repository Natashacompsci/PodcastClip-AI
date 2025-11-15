
import React from 'react';
import { Clip } from '../types';
import ClipCard from './ClipCard';
import { SparklesIcon } from './icons/SparklesIcon';

interface ResultsGridProps {
  clips: Clip[];
  onRegenerate: () => void;
  clipCount: number;
  audioBuffer: AudioBuffer | null;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ clips, onRegenerate, clipCount, audioBuffer }) => {
  return (
    <div className="w-full max-w-7xl mx-auto my-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900">Your Clips are Ready!</h2>
           <p className="text-gray-600">You've created {clipCount} clips so far.</p>
        </div>
        <button 
            onClick={onRegenerate}
            className="flex items-center justify-center gap-2 px-5 py-3 font-semibold text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          Regenerate
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clips.map((clip, index) => (
          <ClipCard key={index} clip={clip} audioBuffer={audioBuffer} />
        ))}
      </div>
    </div>
  );
};

export default ResultsGrid;
