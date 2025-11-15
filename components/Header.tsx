import React from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center">
      <div className="inline-flex items-center gap-3">
        <MicrophoneIcon className="w-8 h-8 text-purple-400" />
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          PodcastClip AI
        </h1>
      </div>
      <p className="mt-4 text-lg text-gray-600">
        Generate viral clips from your podcast in seconds.
      </p>
    </header>
  );
};

export default Header;