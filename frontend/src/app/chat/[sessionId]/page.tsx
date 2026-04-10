'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Tag } from '@/components/Tag';
import styles from '../page.module.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function ChatSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  
  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // States
  const [isRevealed, setIsRevealed] = useState(false);
  const [vibeData, setVibeData] = useState<{ icebreaker: string, sharedInterests: string[] } | null>(null);
  const [messages, setMessages] = useState<{text: string, isSelf: boolean, id: number}[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // WebRTC
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize Socket & Media
  useEffect(() => {
    const s = io('http://localhost:4000');
    setSocket(s);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        const token = localStorage.getItem('cuzicam_token');
        if (token) {
          s.emit('authenticate', token);
        } else {
          setStatus('Authentication required.');
          router.push('/signin');
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('Camera access required to chat.');
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
      setStatus('Waiting for connection...');
      // If we already have a sessionId, the backend should ideally handle reconnection or joining that specific session.
      // For now, we follow the existing flow.
      socket.emit('queue:join', {});
    });

    socket.on('match:found', async (data) => {
      setStatus('Matched!');
      setVibeData({ icebreaker: data.icebreaker, sharedInterests: data.sharedInterests });
      
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

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
      setMessages(prev => [...prev, { text: data.text, isSelf: false, id: Date.now() }]);
    });

    socket.on('session:partner-disconnected', () => {
      setStatus('Partner disconnected.');
      setRemoteStream(null);
    });

    socket.on('session:partner-skipped', () => {
      setStatus('Partner skipped.');
      setRemoteStream(null);
    });

    return () => {
      socket.off('auth:success');
      socket.off('match:found');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('chat:message');
      socket.off('session:partner-disconnected');
      socket.off('session:partner-skipped');
    };
  }, [socket, localStream]);

  const handleSkip = () => {
    socket?.emit('session:skip');
    router.push('/queue');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat:message', { text: chatInput });
    setMessages(prev => [...prev, { text: chatInput, isSelf: true, id: Date.now() }]);
    setChatInput('');
  };

  const handleStar = () => {
    socket?.emit('session:star');
    // Subtle feedback instead of alert
    setStatus('Star Sent! ⭐');
    setTimeout(() => setStatus('Connected'), 2000);
  };

  return (
    <div className={styles.chatContainer}>
      {/* Video Main Area */}
      <div className={styles.videoSection}>
        <div className={styles.matchHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Badge label={status} variant={status === 'Connected' ? 'primary' : 'outline'} />
            <span className="mono" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              SESSION_ID: {sessionId || 'MOCK'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <Tag label="Verified Student" variant="secondary" />
          </div>
        </div>

        <div className={styles.remoteVideoContainer}>
          <VideoPlayer 
            stream={remoteStream} 
            isRevealed={isRevealed} 
            username="Match"
          />
        </div>

        <div className={styles.localVideoContainer}>
          <VideoPlayer 
            stream={localStream} 
            isLocal 
            isRevealed 
            username={user?.name}
          />
        </div>

        <div className={styles.controls}>
          <Button variant="danger" onClick={handleSkip}>
            ⏭ SKIP
          </Button>
          {!isRevealed && status === 'Connected' && (
            <Button variant="outline" onClick={() => setIsRevealed(true)}>
              🎭 REVEAL
            </Button>
          )}
          <Button variant="primary" onClick={handleStar} disabled={status !== 'Connected'}>
            ⭐ STAR
          </Button>
        </div>

        {/* Vibe Check Overlay */}
        <AnimatePresence>
          {vibeData && (
            <motion.div 
              className={styles.vibeOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.vibeCard}>
                <p className="mono" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>// VIBE_CHECK_ACTIVE</p>
                <h2 className="serif" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>
                  You both like <span style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>{vibeData.sharedInterests.join(', ') || 'Exploration'}</span>
                </h2>
                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-light)' }}>
                   <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ICEBREAKER:</p>
                   <p style={{ fontSize: '1.1rem' }}>"{vibeData.icebreaker}"</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 className="serif">Live Chat</h3>
          <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Messages are not stored.</p>
        </div>

        <div className={styles.messageArea} ref={scrollRef}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`${styles.message} ${msg.isSelf ? styles.messageSelf : styles.messageRemote}`}
              >
                {msg.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <form className={styles.inputArea} onSubmit={handleSendMessage}>
          <input 
            className={styles.input} 
            placeholder="Say something..." 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={status !== 'Connected'}
          />
          <Button type="submit" variant="primary" size="sm" disabled={status !== 'Connected' || !chatInput.trim()}>
            SEND
          </Button>
        </form>
      </div>
    </div>
  );
}
