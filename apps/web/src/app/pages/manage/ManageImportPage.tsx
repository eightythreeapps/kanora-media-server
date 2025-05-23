import React, { useRef, useState } from 'react';
import { ApiService } from '@kanora/data-access';

const ManageImportPage: React.FC = () => {
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

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Import Music</h1>
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
                MP3, FLAC, M4A, OGG, WAV (Max 100MB per file)
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
                                style={{
                                  width: `${uploadProgress[file.name]}%`,
                                }}
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
            {uploadComplete && (
              <div className="mt-4 text-green-600 font-medium">
                Upload complete!
              </div>
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
    </div>
  );
};

export default ManageImportPage;
