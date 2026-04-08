"use client";

import React, { useEffect, useRef } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  muted?: boolean;
  username?: string;
  isRevealed?: boolean;
}

export default function VideoPlayer({ stream, isLocal = false, muted = false, username = 'Anonymous', isRevealed = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`video-container ${isLocal ? 'local-video' : 'remote-video'}`}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`video-element ${isLocal ? 'mirrored' : ''} ${!isRevealed && !isLocal ? 'blurred' : ''}`}
        />
      ) : (
        <div className="video-placeholder">
          <div className="spinner"></div>
          <p>{isLocal ? 'Loading Camera...' : 'Waiting for connection...'}</p>
        </div>
      )}
      
      <div className="video-overlay glass">
        <span className="username">
          {isRevealed ? username : (isLocal ? 'You' : 'Anonymous Student')}
        </span>
      </div>
    </div>
  );
}
