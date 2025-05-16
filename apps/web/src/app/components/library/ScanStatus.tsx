import React, { useState, useEffect } from 'react';
import { ApiService } from '@kanora/data-access';

interface ScanStatusProps {
  scanId: string;
  onComplete: () => void;
}

export const ScanStatus: React.FC<ScanStatusProps> = ({
  scanId,
  onComplete,
}) => {
  const [status, setStatus] = useState<string>('PENDING');
  const [progress, setProgress] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [processedFiles, setProcessedFiles] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await ApiService.getScanStatus(scanId);

        if (response.success && response.data) {
          const {
            status,
            progress,
            currentFile,
            totalFiles,
            processedFiles,
            errorCount,
          } = response.data;

          setStatus(status);
          setProgress(progress);
          setCurrentFile(currentFile);
          setTotalFiles(totalFiles || 0);
          setProcessedFiles(processedFiles || 0);
          setErrorCount(errorCount || 0);

          // If scan is completed or failed, stop polling
          if (status === 'COMPLETED' || status === 'FAILED') {
            clearInterval(intervalId);

            // Notify parent component if scan is completed
            if (status === 'COMPLETED') {
              setTimeout(() => onComplete(), 2000); // Wait 2 seconds before completing
            }
          }
        } else {
          setError(response.error || 'Failed to fetch scan status');
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error fetching scan status:', err);
        setError('An error occurred while fetching scan status');
        clearInterval(intervalId);
      }
    };

    // Fetch status immediately and then every 2 seconds
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 2000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [scanId, onComplete]);

  // Render different content based on scan status
  const renderStatusContent = () => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="text-center">
            <div className="w-8 h-8 mx-auto border-4 border-gray-300 rounded-full border-t-primary-600 animate-spin"></div>
            <p className="mt-2 text-gray-600">Preparing scan...</p>
          </div>
        );

      case 'PROCESSING':
        return (
          <div>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-primary-700">
                  {progress}% Complete
                </span>
                <span className="text-sm font-medium text-primary-700">
                  {processedFiles} / {totalFiles} files
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full">
                <div
                  className="h-2.5 bg-primary-600 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {currentFile && (
              <div className="p-3 mb-4 bg-gray-100 rounded-md">
                <span className="text-sm text-gray-600">
                  Currently processing:
                </span>
                <p className="text-sm font-mono truncate">{currentFile}</p>
              </div>
            )}

            {errorCount > 0 && (
              <div className="p-3 mb-4 text-amber-700 bg-amber-100 rounded-md">
                <p>{errorCount} files encountered errors during import</p>
              </div>
            )}
          </div>
        );

      case 'COMPLETED':
        return (
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto text-green-500"
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
            <h3 className="mt-2 text-xl font-medium text-gray-900">
              Scan Completed
            </h3>
            <p className="mt-1 text-gray-600">
              Successfully processed {processedFiles} music files
            </p>
            {errorCount > 0 && (
              <p className="mt-2 text-amber-700">
                {errorCount} files encountered errors during import
              </p>
            )}
          </div>
        );

      case 'FAILED':
        return (
          <div className="text-center text-red-600">
            <svg
              className="w-16 h-16 mx-auto text-red-500"
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
            <h3 className="mt-2 text-xl font-medium">Scan Failed</h3>
            <p className="mt-1">
              An error occurred during the scanning process
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-600">
            <p>Unknown scan status: {status}</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">
        Library Scan Status
      </h2>

      {error ? (
        <div className="p-4 mt-4 text-red-700 bg-red-100 rounded-lg">
          <p>{error}</p>
        </div>
      ) : (
        <div className="mt-6">{renderStatusContent()}</div>
      )}
    </div>
  );
};
