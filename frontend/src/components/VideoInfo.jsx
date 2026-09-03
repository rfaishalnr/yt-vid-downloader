import React from 'react';

const VideoInfo = ({ info }) => {
  if (!info) return null;

  // Format length in seconds to MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{position: 'relative'}}>
      <img src={info.thumbnail} alt={info.title} loading="lazy" />
      <div style={{
          position: 'absolute', 
          bottom: '8px', 
          right: '8px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: 'bold'
      }}>
          {formatTime(info.lengthSeconds)}
      </div>
    </div>
  );
};

export default VideoInfo;
