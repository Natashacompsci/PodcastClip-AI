import React from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-12">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
        <div className="relative p-4 bg-gray-100 rounded-full">
          <MicrophoneIcon className="w-12 h-12 text-gray-800 animate-pulse" />
        </div>
      </div>
      <p className="text-xl font-semibold text-gray-800 animate-pulse">
        Analyzing your podcast... 🎙️
      </p>
      <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full animate-[wiggle_2s_ease-in-out_infinite]"></div>
      </div>
       <style>{`
          @keyframes wiggle {
            0%, 100% { width: 0%; }
            50% { width: 100%; }
          }
       `}</style>
    </div>
  );
};

export default Loader;