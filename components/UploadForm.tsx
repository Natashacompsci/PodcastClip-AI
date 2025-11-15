import React, { useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { LinkIcon } from './icons/LinkIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface UploadFormProps {
  onGenerate: (inputType: 'file' | 'link' | 'demo', data?: File | string) => void;
  isLoading: boolean;
}

const UploadForm: React.FC<UploadFormProps> = ({ onGenerate, isLoading }) => {
  const [link, setLink] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onGenerate('file', e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (link) {
      onGenerate('link', link);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-8 bg-gray-50 border border-gray-200 rounded-2xl shadow-xl">
      <div
        className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors"
      >
        <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Drag & drop your audio file</h3>
        <p className="text-gray-500">or click to browse</p>
        <p className="text-xs text-gray-400 mt-2">MP3, WAV, M4A</p>
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept=".mp3,.wav,.m4a"
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-200" />
        <span className="mx-4 text-gray-400 text-sm font-semibold">OR</span>
        <hr className="flex-grow border-gray-200" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Paste YouTube or Spotify link..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || (!link)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          <SparklesIcon className="w-6 h-6" />
          Generate Clips
        </button>
      </form>
      <div className="mt-6 text-center">
        <button
          onClick={() => onGenerate('demo')}
          disabled={isLoading}
          className="text-purple-600 hover:text-purple-800 font-medium disabled:text-gray-400 transition-colors"
        >
          Try a Demo
        </button>
      </div>
    </div>
  );
};

export default UploadForm;