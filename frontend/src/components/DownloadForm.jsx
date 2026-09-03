import React, { useState } from 'react';

const DownloadForm = ({ info, url }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!info) return null;

  // Function to map unique qualities for video
  const getUniqueVideoFormats = () => {
    const unique = [];
    const qualities = new Set();
    
    // Sort from highest quality to lowest
    const sorted = [...info.videoFormats].sort((a, b) => {
        const heightA = parseInt(a.qualityLabel) || 0;
        const heightB = parseInt(b.qualityLabel) || 0;
        return heightB - heightA;
    });

    for (const format of sorted) {
      if (format.qualityLabel && !qualities.has(format.qualityLabel)) {
        qualities.add(format.qualityLabel);
        unique.push(format);
      }
    }
    return unique;
  };

  // Get best audio format
  const getBestAudioFormat = () => {
      if (info.audioFormats && info.audioFormats.length > 0) {
          // Sort by bitrate highest to lowest
          const sorted = [...info.audioFormats].sort((a, b) => {
              const bitA = parseInt(a.audioBitrate) || 0;
              const bitB = parseInt(b.audioBitrate) || 0;
              return bitB - bitA;
          });
          return sorted[0];
      }
      return null;
  };

  const videoFormats = getUniqueVideoFormats();
  const bestAudio = getBestAudioFormat();

  const handleDownload = () => {
    if (!selectedFormat) return;
    
    setIsDownloading(true);
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    let downloadUrl = `${backendUrl}/api/download?url=${encodeURIComponent(url)}&itag=${selectedFormat.itag}`;
    
    if (selectedFormat.isMp3) {
        downloadUrl += '&type=mp3';
    }
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
        setIsDownloading(false);
    }, 2000);
  };

  return (
    <>
      {isDownloading && <div className="top-loading-bar"></div>}
      <div className="format-section">
        <div className="format-group">
        <h3>Video (MP4)</h3>
        <div className="resolutions">
          {videoFormats.length > 0 ? videoFormats.map((format) => (
            <button 
              key={format.itag}
              className={`resolution-btn ${selectedFormat?.itag === format.itag ? 'active' : ''}`}
              onClick={() => setSelectedFormat(format)}
            >
              {format.qualityLabel}
            </button>
          )) : (
            <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>No video formats found.</p>
          )}
        </div>
      </div>

      <div className="format-group">
        <h3>Audio (MP3)</h3>
        <div className="resolutions">
          {bestAudio ? (
            <button 
              className={`resolution-btn ${selectedFormat?.itag === bestAudio.itag ? 'active' : ''}`}
              onClick={() => setSelectedFormat(bestAudio)}
            >
              Download MP3 ({bestAudio.audioBitrate} kbps)
            </button>
          ) : (
             <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>No audio formats found.</p>
          )}
        </div>
      </div>

      <div className="download-action">
        <button 
            className="btn btn-primary btn-download" 
            disabled={!selectedFormat || isDownloading}
            onClick={handleDownload}
        >
          {isDownloading ? (
              <><span className="spinner"></span> Starting...</>
          ) : (
              'Download Selected File'
          )}
        </button>
      </div>
    </div>
    </>
  );
};

export default DownloadForm;
