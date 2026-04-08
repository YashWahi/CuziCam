"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import VideoPlayer from '@/components/VideoPlayer';
import './chat.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  
  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // States
  const [isRevealed, setIsRevealed] = useState(false);
  const [vibeData, setVibeData] = useState<{ icebreaker: string, sharedInterests: string[] } | null>(null);
  const [messages, setMessages] = useState<{text: string, isSelf: boolean}[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // WebRTC
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // Initialize Socket & Media
  useEffect(() => {
    // Note: Use environment variable in production
    const s = io('http://localhost:4000');
    setSocket(s);

    // Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        // Authenticate with real token
        const token = localStorage.getItem('token');
        if (token) {
          s.emit('authenticate', token);
        } else {
          setStatus('Please login first.');
          router.push('/login');
        }
      })
      .catch(err => {
        setStatus('Camera access required.');
      });

    return () => {
      s.disconnect();
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Setup Socket listeners
  useEffect(() => {
    if (!socket || !localStream) return;

    socket.on('auth:success', () => {
      setStatus('Joined Queue...');
      socket.emit('queue:join', {});
    });

    socket.on('queue:waiting', (data) => setStatus(data.message));

    socket.on('match:found', async (data) => {
      setStatus('Matched! Starting Vibe Check...');
      setVibeData({ icebreaker: data.icebreaker, sharedInterests: data.sharedInterests });
      
      // Initialize WebRTC
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;

      // Add local tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc:ice-candidate', { candidate: event.candidate });
        }
      };

      if (data.role === 'caller') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { sdp: offer });
      }
      
      // Clear Vibe Check after 5 seconds to show video
      setTimeout(() => {
        setStatus('Connected');
        setVibeData(null);
      }, 5000);
    });

    socket.on('webrtc:offer', async (data) => {
      const pc = peerConnection.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { sdp: answer });
    });

    socket.on('webrtc:answer', async (data) => {
      const pc = peerConnection.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });

    socket.on('webrtc:ice-candidate', async (data) => {
      const pc = peerConnection.current;
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    socket.on('chat:message', (data) => {
      setMessages(prev => [...prev, { text: data.text, isSelf: false }]);
    });

    socket.on('session:partner-disconnected', () => {
      resetSession('Partner disconnected.');
    });

    socket.on('session:partner-skipped', () => {
      resetSession('Partner skipped.');
    });

    return () => {
      socket.off('auth:success');
      socket.off('queue:waiting');
      socket.off('match:found');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('chat:message');
      socket.off('session:partner-disconnected');
      socket.off('session:partner-skipped');
    };
  }, [socket, localStream]);

  const resetSession = (msg: string) => {
    setStatus(msg);
    setRemoteStream(null);
    setMessages([]);
    setIsRevealed(false);
    peerConnection.current?.close();
    peerConnection.current = null;
    
    setTimeout(() => {
      setStatus('Rejoining queue...');
      socket?.emit('queue:join', {});
    }, 2000);
  };

  const handleSkip = () => {
    socket?.emit('session:skip');
    resetSession('Skipping... looking for someone else');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat:message', { text: chatInput });
    setMessages(prev => [...prev, { text: chatInput, isSelf: true }]);
    setChatInput('');
  };

  const handleStar = () => {
    socket?.emit('session:star');
    alert('Star sent! If they star back, you become connections.');
  };

  return (
    <div className="chat-layout">
      <div className="video-section">
        <div className="status-banner glass animate-fade-in">{status}</div>
        
        {vibeData ? (
          <div className="vibe-card glass animate-fade-in">
            <h2>✨ Vibe Check ✨</h2>
            {vibeData.sharedInterests.length > 0 ? (
              <p>You both like: <strong>{vibeData.sharedInterests.join(', ')}</strong></p>
            ) : (
              <p>Curiosity match! Total opposites attract?</p>
            )}
            <div className="icebreaker">
              <span className="label">AI Icebreaker:</span>
              <p>"{vibeData.icebreaker}"</p>
            </div>
          </div>
        ) : (
          <div className="video-grid">
            <VideoPlayer stream={localStream} isLocal isRevealed={true} />
            <VideoPlayer stream={remoteStream} isRevealed={isRevealed} />
          </div>
        )}

        <div className="controls glass">
          <button className="btn btn-danger" onClick={handleSkip}>
            ⏭ Next
          </button>
          {!isRevealed && status === 'Connected' && (
            <button className="btn btn-secondary" onClick={() => {}}>
              🎭 Reveal Identity
            </button>
          )}
          {status === 'Connected' && (
            <button className="btn btn-primary" onClick={handleStar}>
              ⭐ Star User
            </button>
          )}
        </div>
      </div>

      <div className="chat-section glass">
        <div className="chat-header">
          <h3>Live Chat</h3>
        </div>
        
        <div className="messages-container">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.isSelf ? 'self' : 'remote'}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="input"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={status !== 'Connected'}
          />
          <button type="submit" className="btn btn-primary" disabled={status !== 'Connected'}>Send</button>
        </form>
      </div>
    </div>
  );
}
