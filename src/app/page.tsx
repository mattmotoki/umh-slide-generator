'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface Hymn {
  number: string;
  title: string;
  has_text: boolean;
  text_url: string;
  lyrics: string;
  parsed_lyrics: string;
  author?: string;
  composer?: string;
  tune_name?: string;
  text_copyright?: string;
  tune_copyright?: string;
}

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<any>(null);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<any[]>([]);
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [hymnError, setHymnError] = useState<string | null>(null);
  const [hymnSuccess, setHymnSuccess] = useState<string | null>(null);
  const [isGeneratingHymn, setIsGeneratingHymn] = useState(false);

  // Helper function to convert image path to base64
  const fetchImageAsBase64 = async (imagePath: string): Promise<string> => {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  // Function to open background selector
  const openBackgroundSelector = () => {
    setShowBackgroundSelector(true);
  };

  // Create object URL for uploaded image
  const uploadedImageUrl = useMemo(() => {
    if (backgroundImage) {
      return URL.createObjectURL(backgroundImage);
    }
    return null;
  }, [backgroundImage]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  // Load available backgrounds
  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        const response = await fetch('/data/backgrounds.json');
        if (response.ok) {
          const data = await response.json();
          setAvailableBackgrounds(data);
        }
      } catch (err) {
        console.error('Error loading backgrounds:', err);
      }
    };
    loadBackgrounds();
  }, []);

  // Load hymns data from individual files
  useEffect(() => {
    const loadHymns = async () => {
      try {
        // Get list of all hymn files from API
        const indexResponse = await fetch(`/api/list-hymns`);
        if (!indexResponse.ok) {
          throw new Error('Failed to load hymn index');
        }
        const hymnList: string[] = await indexResponse.json();

        // Load each hymn's data
        const hymnPromises = hymnList.map(async (filename: string) => {
          const number = filename.replace('.json', '');
          try {
            const response = await fetch(`/data/hymns/${filename}`);
            if (response.ok) {
              const data = await response.json();
              return {
                number: data.hymn_number || number,
                title: data.title,
                has_text: !!data.lyrics,
                text_url: '',
                lyrics: data.lyrics,  // Keep original format
                parsed_lyrics: data.lyrics,  // Keep original format
                author: data.author || '',
                composer: data.composer || '',
                tune_name: data.tune_name || '',
                text_copyright: data.text_copyright || '',
                tune_copyright: data.tune_copyright || ''
              };
            }
            return null;
          } catch {
            return null;
          }
        });

        const hymnDataArray = await Promise.all(hymnPromises);
        const validHymns = hymnDataArray.filter(h => h !== null);
        setHymns(validHymns);
      } catch (err) {
        console.error('Error loading hymns:', err);
        setHymnError('Failed to load hymn data');
      }
    };

    loadHymns();
  }, []);

  const generateHymnSlides = async () => {
    if (!selectedHymn) {
      setHymnError('Please select a hymn first.');
      return;
    }

    if (!selectedHymn.has_text || (!selectedHymn.parsed_lyrics && !selectedHymn.lyrics)) {
      setHymnError('This hymn does not have lyrics available for slide generation.');
      return;
    }

    setIsGeneratingHymn(true);
    setHymnError(null);
    setHymnSuccess(null);

    try {
      let requestBody: any = {
        hymn: {
          number: selectedHymn.number,
          title: selectedHymn.title,
          hymnal: 'UMH',
          lyrics: selectedHymn.parsed_lyrics || selectedHymn.lyrics,
          author: selectedHymn.author || '',
          composer: selectedHymn.composer || '',
          tune_name: selectedHymn.tune_name || '',
          text_copyright: selectedHymn.text_copyright || '',
          tune_copyright: selectedHymn.tune_copyright || ''
        }
      };

      // Add background image if provided
      if (backgroundImage) {
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(backgroundImage);
        });
        requestBody.background_image = base64Image;
      } else if (selectedBackground) {
        // Convert selected background to base64
        const base64Image = await fetchImageAsBase64(selectedBackground.path);
        requestBody.background_image = base64Image;
      } else {
        // Use default ocean-sunrise background
        const base64Image = await fetchImageAsBase64('/images/ocean-sunrise-golden-worship-background.jpg');
        requestBody.background_image = base64Image;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/generate-hymn-slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `UMH_${selectedHymn.number}_${selectedHymn.title.replace(/[^a-zA-Z0-9]/g, '_')}_slides.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setHymnSuccess(`Successfully generated hymn slides for "${selectedHymn.title}"!`);
      } else {
        const errorData = await response.json();
        setHymnError(errorData.error || 'Failed to generate hymn slides');
      }
    } catch (err) {
      setHymnError('An error occurred while generating hymn slides');
      console.error('Generate hymn slides error:', err);
    } finally {
      setIsGeneratingHymn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                UMH Hymn Slide Generator
              </h1>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">

            {/* Hymn Selection */}
            <div>
              <label htmlFor="hymn-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Hymn
              </label>
              <select
                id="hymn-select"
                value={hymns.findIndex(h => h === selectedHymn)}
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  if (index >= 0 && index < hymns.length) {
                    setSelectedHymn(hymns[index]);
                  } else {
                    setSelectedHymn(null);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="-1">-- Select a hymn --</option>
                {hymns.map((hymn, index) => (
                  <option key={`UMH-${index}`} value={index}>
                    {hymn.number} - {hymn.title} {hymn.has_text ? '✓' : '(no lyrics)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Hymn Info */}
            {selectedHymn && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-semibold text-blue-900">
                  UMH {selectedHymn.number}: {selectedHymn.title}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedHymn.has_text ? (
                    <span className="text-green-600">✓ Lyrics available for slide generation</span>
                  ) : (
                    <span className="text-red-600">✗ No lyrics available for this hymn</span>
                  )}
                </p>
              </div>
            )}

            {/* Generate PowerPoint Button */}
            <div className="mt-6">
              <button
                onClick={generateHymnSlides}
                disabled={isGeneratingHymn || !selectedHymn || !selectedHymn.has_text}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base font-medium"
              >
                {isGeneratingHymn ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Hymn Slides
                  </>
                )}
              </button>
            </div>

            {/* Background Image Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Background Image (Optional)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Choose from our gallery or upload your own background image. If no background is selected, the default &ldquo;Ocean Sunrise Golden&rdquo; background will be used.
              </p>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBackgroundSelector(true)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choose from Gallery
                  </button>
                  <button
                    onClick={() => document.getElementById('hymn-background-input')?.click()}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload New
                  </button>
                </div>

                <input
                  id="hymn-background-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBackgroundImage(file);
                      setSelectedBackground(null);
                      setHymnSuccess(`Image "${file.name}" uploaded successfully!`);
                      setTimeout(() => setHymnSuccess(null), 3000);
                    }
                  }}
                  className="hidden"
                />

                {/* Background Display */}
                {(backgroundImage || selectedBackground) ? (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Selected Background:</p>
                        <p className="text-sm text-blue-700">
                          {backgroundImage ? backgroundImage.name : selectedBackground?.display_name}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setBackgroundImage(null);
                          setSelectedBackground(null);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 relative w-[70%] mx-auto rounded-lg overflow-hidden border border-blue-300" style={{ paddingBottom: '39.375%' }}>
                      {uploadedImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={uploadedImageUrl}
                          alt={backgroundImage?.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : selectedBackground ? (
                        <Image
                          src={selectedBackground.path}
                          alt={selectedBackground.display_name}
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Default Background</p>
                          <p className="text-sm text-gray-500">Ocean Sunrise Golden will be used</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 relative w-[70%] mx-auto rounded-lg overflow-hidden border border-gray-300" style={{ paddingBottom: '39.375%' }}>
                      <Image
                        src="/images/ocean-sunrise-golden-worship-background.jpg"
                        alt="Ocean Sunrise Golden (Default)"
                        fill
                        className="object-cover"
                        sizes="70vw"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {hymnError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{hymnError}</p>
              </div>
            )}

            {hymnSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">{hymnSuccess}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Background Selector Modal */}
      {showBackgroundSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Choose Background Image</h2>
                <button
                  onClick={() => setShowBackgroundSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableBackgrounds.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableBackgrounds.map((bg) => (
                    <div
                      key={bg.id}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        selectedBackground?.id === bg.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedBackground(bg);
                        setBackgroundImage(null);
                        setShowBackgroundSelector(false);
                      }}
                    >
                      <div className="relative w-full h-32">
                        <Image
                          src={bg.path}
                          alt={bg.display_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {bg.display_name}
                        </p>
                        <p className="text-xs text-gray-500">{bg.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No background images available.
                </p>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowBackgroundSelector(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}