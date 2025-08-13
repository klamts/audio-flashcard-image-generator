
import React from 'react';
import type { FlashcardItem } from '../types';
import Spinner from './Spinner';

interface CardProps {
  item: FlashcardItem;
  onGenerateImage: (id: string, prompt: string) => void;
}

const Card: React.FC<CardProps> = ({ item, onGenerateImage }) => {
  const handleGenerateClick = () => {
    if (!item.isLoading && !item.imageUrl) {
      onGenerateImage(item.id, item.text);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-cyan-500/50 hover:scale-105">
      <div className="relative aspect-square w-full bg-gray-700 flex items-center justify-center">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.text} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {item.isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-white mb-2 flex-grow">{item.text}</h3>
        <audio controls src={item.audioUrl} className="w-full h-10 mb-3 rounded-lg">
          Your browser does not support the audio element.
        </audio>
        <button
          onClick={handleGenerateClick}
          disabled={item.isLoading || !!item.imageUrl}
          className="w-full px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                     bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
        >
          {item.isLoading ? 'Generating...' : item.imageUrl ? 'Image Generated' : 'Generate Image'}
        </button>
      </div>
    </div>
  );
};

export default Card;
