import React, { useState } from 'react';
import VideoInfo from './components/VideoInfo';
import DownloadForm from './components/DownloadForm';
import './index.css';

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');

  const handleFetchInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setVideoInfo(null);
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/info?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch video info');
      }

      const data = await response.json();
      setVideoInfo(data);
      
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleFetchInfo();
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="logo-container">
          <div className="logo-icon">▶</div>
          <span>YT-Downloader</span>
        </div>
      </header>

      <section className="hero-section">
        <h1 className="hero-title">YouTube Video Downloader</h1>
        <div className="search-container">
          <input 
            type="text" 
            className="url-input" 
            placeholder="Paste YouTube Link Here..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            className="btn btn-primary" 
            onClick={handleFetchInfo}
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner"></span> : 'Download'}
          </button>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </section>

      <main className="main-content">
        {videoInfo && (
          <div className="result-card">
            <div className="video-info-wrapper">
              <div className="thumbnail-col">
                <VideoInfo info={videoInfo} />
              </div>
              <div className="details-col">
                <h2 className="video-title">{videoInfo.title}</h2>
                <div className="video-meta">
                  <p>By {videoInfo.author}</p>
                </div>
                <DownloadForm info={videoInfo} url={url} />
              </div>
            </div>
          </div>
        )}
      </main>

      {!videoInfo && (
        <section className="features">
          <div className="feature-item">
            <h3>Unlimited</h3>
            <p>Save YouTube videos as much as you need - without any limits or restrictions.</p>
          </div>
          <div className="feature-item">
            <h3>No Software Required</h3>
            <p>Download directly from your browser. No need to install any heavy software.</p>
          </div>
          <div className="feature-item">
            <h3>MP4 and MP3</h3>
            <p>Save files in HD quality, easily convert YouTube videos to MP4 or MP3.</p>
          </div>
        </section>
      )}
    </>
  );
}

export default App;
