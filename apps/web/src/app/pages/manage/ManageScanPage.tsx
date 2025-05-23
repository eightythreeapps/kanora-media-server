import React, { useState } from 'react';
import { ScanStatus } from '../../components/library/ScanStatus';
import { ApiService } from '@kanora/data-access';

const ManageScanPage: React.FC = () => {
  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPath, setCustomPath] = useState('');
  const [showCustomPath, setShowCustomPath] = useState(false);

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

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Scan Library</h1>
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-lg">
          <p>{error}</p>
        </div>
      )}
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
    </div>
  );
};

export default ManageScanPage;
