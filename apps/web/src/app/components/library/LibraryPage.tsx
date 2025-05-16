import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScanStatus } from './ScanStatus';
import { ApiService } from '@kanora/data-access';

type LibraryTab = 'scan' | 'upload';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<LibraryTab>('scan');

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPath, setCustomPath] = useState('');
  const [showCustomPath, setShowCustomPath] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>(
    {},
  );
  const [uploadComplete, setUploadComplete] = useState(false);

  // Set active tab based on URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'upload') {
      setActiveTab('upload');
    }
  }, [location.search]);

  // Start a library scan
  const handleStartScan = async (useCustomPath = false) => {
    try {
      setError(null);
      setIsScanning(true);

      const paths = useCustomPath && customPath ? [customPath] : undefined;
      const response = await ApiService.startLibraryScan(paths);

      if (response.success && response.data?.scanId) {
        setScanId(response.data.scanId);
      } else {
        setError(response.error || 'Failed to start library scan');
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Error starting scan:', err);
      setError('An error occurred while starting the scan');
      setIsScanning(false);
    }
  };

  // Handle scan completion
  const handleScanComplete = () => {
    setIsScanning(false);
    setScanId(null);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      // Convert FileList to array and filter for audio files
      const audioFiles = Array.from(selectedFiles).filter(
        (file) =>
          file.type.startsWith('audio/') ||
          ['.mp3', '.flac', '.m4a', '.ogg', '.wav'].some((ext) =>
            file.name.toLowerCase().endsWith(ext),
          ),
      );

      setFiles((prev) => [...prev, ...audioFiles]);

      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove a file from the list
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files to server
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadComplete(false);
    setUploadErrors({});

    // Initialize progress for each file
    const initialProgress: { [key: string]: number } = {};
    files.forEach((file) => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload the file
        const response = await ApiService.uploadMusic(
          formData,
          (progress: number) => {
            // Update progress for this file
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: progress,
            }));
          },
        );

        if (!response.success) {
          setUploadErrors((prev) => ({
            ...prev,
            [file.name]: response.error || `Failed to upload ${file.name}`,
          }));
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        setUploadErrors((prev) => ({
          ...prev,
          [file.name]: `Error uploading ${file.name}`,
        }));
      }
    }

    setIsUploading(false);
    setUploadComplete(true);
  };

  // Clear all files
  const handleClearFiles = () => {
    setFiles([]);
    setUploadProgress({});
    setUploadErrors({});
    setUploadComplete(false);
  };

  // Render tab navigation
  const renderTabs = () => (
    <div className="mb-6 border-b border-gray-200">
      <ul className="flex flex-wrap -mb-px">
        <li className="mr-2">
          <button
            className={`inline-block p-4 rounded-t-lg ${
              activeTab === 'scan'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 border-b-2 border-transparent'
            }`}
            onClick={() => setActiveTab('scan')}
          >
            Scan Directory
          </button>
        </li>
        <li className="mr-2">
          <button
            className={`inline-block p-4 rounded-t-lg ${
              activeTab === 'upload'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 border-b-2 border-transparent'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Files
          </button>
        </li>
      </ul>
    </div>
  );

  // Render scan content
  const renderScanContent = () => (
    <>
      {isScanning && scanId ? (
        <ScanStatus scanId={scanId} onComplete={handleScanComplete} />
      ) : (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800">
            Import Music by Scanning
          </h2>
          <p className="mt-2 text-gray-600">
            Start a scan to find and import music files into your library
          </p>

          <div className="mt-6">
            <button
              onClick={() => handleStartScan(false)}
              className="px-4 py-2 mr-4 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Scan Default Location
            </button>

            <button
              onClick={() => setShowCustomPath(!showCustomPath)}
              className="px-4 py-2 text-primary-600 bg-white border border-primary-600 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {showCustomPath ? 'Hide Custom Path' : 'Specify Custom Path'}
            </button>
          </div>

          {showCustomPath && (
            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Custom Path
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="/path/to/your/music"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={() => handleStartScan(true)}
                  disabled={!customPath}
                  className="px-4 py-2 ml-4 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Scan Custom Path
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter the full path to the directory containing your music files
              </p>
            </div>
          )}

          <div className="p-4 mt-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium text-gray-800">
              About Music Scanning
            </h3>
            <ul className="pl-5 mt-2 space-y-1 text-gray-600 list-disc">
              <li>The scanner will recursively search for audio files</li>
              <li>Supported formats: MP3, FLAC, M4A, OGG, WAV</li>
              <li>Duplicate files (with identical content) will be skipped</li>
              <li>Metadata will be extracted from the audio files</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );

  // Render upload content
  const renderUploadContent = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">
        Upload Music Files
      </h2>
      <p className="mt-2 text-gray-600">
        Upload audio files directly to your library
      </p>

      <div className="mt-6">
        <label
          htmlFor="music-files"
          className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to select files</span> or
              drag and drop
            </p>
            <p className="text-xs text-gray-500">
              MP3, FLAC, M4A, OGG, WAV (Max 10MB per file)
            </p>
          </div>
          <input
            id="music-files"
            type="file"
            className="hidden"
            multiple
            accept=".mp3,.flac,.m4a,.ogg,.wav,audio/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isUploading}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Selected Files ({files.length})
            </h3>
            <div>
              <button
                onClick={handleClearFiles}
                disabled={isUploading}
                className="px-3 py-1.5 mr-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0}
                className="px-3 py-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </div>

          <div className="mt-2 border rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center flex-grow">
                    <div className="mr-3 flex-shrink-0 text-gray-400">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        ></path>
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <p
                        className="text-sm font-medium text-gray-900 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>

                      {/* Show progress bar during upload */}
                      {isUploading &&
                        uploadProgress[file.name] !== undefined && (
                          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                            <div
                              className="h-1.5 bg-primary-600 rounded-full"
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            ></div>
                          </div>
                        )}

                      {/* Show error if any */}
                      {uploadErrors[file.name] && (
                        <p className="text-xs text-red-500 mt-1">
                          {uploadErrors[file.name]}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isUploading && (
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="ml-4 text-gray-400 hover:text-gray-500"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {uploadComplete && (
        <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-lg">
          <div className="flex">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>
              Upload complete! Your music will be processed and added to your
              library.
            </span>
          </div>

          {Object.keys(uploadErrors).length > 0 && (
            <p className="mt-2 text-amber-700">
              Some files encountered errors. Please check the details above.
            </p>
          )}
        </div>
      )}

      <div className="p-4 mt-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800">
          About Music Uploads
        </h3>
        <ul className="pl-5 mt-2 space-y-1 text-gray-600 list-disc">
          <li>Supported formats: MP3, FLAC, M4A, OGG, WAV</li>
          <li>Maximum file size: 10MB per file</li>
          <li>Metadata will be extracted from the uploaded files</li>
          <li>Duplicate files will be automatically skipped</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Music Library</h1>
          <p className="mt-2 text-gray-600">Manage your music collection</p>
        </div>

        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {renderTabs()}

        {activeTab === 'scan' && renderScanContent()}
        {activeTab === 'upload' && renderUploadContent()}

        <div className="mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
