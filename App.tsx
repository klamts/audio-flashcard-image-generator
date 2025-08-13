
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AUDIO_URLS } from './constants';
import { FlashcardItem } from './types';
import Card from './components/Card';
import { generateImageFromPrompt } from './services/geminiService';

const App: React.FC = () => {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const parsedFlashcards = AUDIO_URLS.map(url => {
      const filename = url.split('/').pop() || '';
      const text = decodeURIComponent(filename)
        .replace(/\.mp3$/, '')
        .replace(/%20/g, ' ')
        .trim();
      return {
        id: url,
        text: text.charAt(0).toUpperCase() + text.slice(1),
        audioUrl: url,
        imageUrl: null,
        isLoading: false,
      };
    });
    setFlashcards(parsedFlashcards);
  }, []);

  const handleGenerateImage = useCallback(async (id: string, prompt: string) => {
    setFlashcards(prev =>
      prev.map(card => (card.id === id ? { ...card, isLoading: true } : card))
    );
    setError(null);

    try {
      const fullPrompt = `A simple, cute, cartoon-style illustration for a children's flashcard, with a clean, solid light-colored background. The image should clearly and simply depict: ${prompt}`;
      const imageUrl = await generateImageFromPrompt(fullPrompt);
      setFlashcards(prev =>
        prev.map(card =>
          card.id === id ? { ...card, imageUrl, isLoading: false } : card
        )
      );
    } catch (err) {
      console.error('Failed to generate image:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate image for "${prompt}". ${errorMessage}`);
      setFlashcards(prev =>
        prev.map(card => (card.id === id ? { ...card, isLoading: false } : card))
      );
    }
  }, []);

  const handleGenerateAll = async () => {
     for (const card of flashcards) {
        if (!card.imageUrl && !card.isLoading) {
            await handleGenerateImage(card.id, card.text);
        }
    }
  };
  
  const handleExport = () => {
    if (flashcards.length === 0) {
        setError("There are no flashcards to export.");
        return;
    }
    const jsonString = JSON.stringify(flashcards, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flashcards-deck.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File could not be read properly.");
        }
        const importedData = JSON.parse(text);

        if (!Array.isArray(importedData) || importedData.some(item => typeof item.id === 'undefined' || typeof item.text === 'undefined')) {
          throw new Error("Invalid JSON structure. Expected an array of flashcard items.");
        }

        setFlashcards(importedData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to import file. Please ensure it's a valid JSON. Error: ${errorMessage}`);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
    };
    reader.readAsText(file);
    
    event.target.value = '';
  };

  const handleImportFromUrl = async () => {
    if (!importUrl) {
      setError("Please enter a URL to import.");
      return;
    }
    setIsImportingUrl(true);
    setError(null);
    try {
      const response = await fetch(importUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${response.statusText}`);
      }
      const importedData = await response.json();

      if (!Array.isArray(importedData) || importedData.some(item => typeof item.id === 'undefined' || typeof item.text === 'undefined')) {
        throw new Error("Invalid JSON structure from URL. Expected an array of flashcard items.");
      }

      setFlashcards(importedData);
      setImportUrl('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to import from URL. Please ensure it's a valid JSON link. Error: ${errorMessage}`);
    } finally {
      setIsImportingUrl(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Audio Flashcard Image Generator
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Generate images, export your deck, or import one from a file or URL.
          </p>
          <div className="mt-6 flex justify-center items-center gap-4 flex-wrap">
             <button
                onClick={handleGenerateAll}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold shadow-lg transition-transform transform hover:scale-105"
                >
                Generate All Missing
            </button>
             <button
                onClick={handleExport}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold shadow-lg transition-transform transform hover:scale-105"
                >
                Export to JSON
            </button>
            <button
                onClick={handleImportClick}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold shadow-lg transition-transform transform hover:scale-105"
                >
                Import from File
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json,application/json"
                className="hidden"
                aria-hidden="true"
            />
          </div>
          <div className="mt-4 flex justify-center items-center gap-2 flex-wrap max-w-xl mx-auto">
            <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="Paste JSON URL to import"
                className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500 min-w-[200px]"
                aria-label="Import from URL"
                onKeyDown={(e) => e.key === 'Enter' && handleImportFromUrl()}
            />
             <button
                onClick={handleImportFromUrl}
                disabled={isImportingUrl || !importUrl}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-semibold shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isImportingUrl ? 'Importing...' : 'Import from URL'}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {flashcards.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>Loading flashcards... or you can import a deck.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {flashcards.map(card => (
              <Card key={card.id} item={card} onGenerateImage={handleGenerateImage} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
