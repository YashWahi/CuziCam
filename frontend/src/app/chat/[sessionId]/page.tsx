'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const router = useRouter();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [status, setStatus] = useState<string>('Initializing...');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [vibeData, setVibeData] = useState<{ icebreaker: string, sharedInterests: string[] } | null>(null);
  const [messages, setMessages] = useState<{text: string, isSelf: boolean, id: number}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Get Media & Initialize
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const initMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setStatus('Ready');
      } catch (err) {
        console.error(err);
        setStatus('Camera access required to chat.');
      }
    };

    initMedia();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  // WebRTC Signaling Logic
  useEffect(() => {
    if (!socket || !localStream || !isConnected) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setStatus('Connected');
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal:ice', { candidate: event.candidate });
      }
    };

    // Listeners for signaling
    socket.on('signal:offer', async (data) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('signal:answer', { answer });
    });

    socket.on('signal:answer', async (data) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('signal:ice', async (data) => {
      if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('[WebRTC] Error adding ICE candidate', e);
        }
      }
    });

    // Chat listeners
    socket.on('chat:message', (data) => {
      setMessages(prev => [...prev, { text: data.text, isSelf: false, id: Date.now() }]);
    });

    socket.on('chat:blocked', (data) => {
      alert(`Message blocked: ${data.reason}`);
    });

    // Match metadata (redundant but good for safety)
    socket.on('match:found', (data) => {
       setVibeData({ icebreaker: data.icebreaker, sharedInterests: data.sharedInterests });
       setTimeout(() => setVibeData(null), 8000);
    });

    socket.on('star:sent', () => {
      setStatus('Star Sent! ⭐');
      setTimeout(() => setStatus('Connected'), 2000);
    });

    socket.on('star:mutual', () => {
      setStatus('MUTUAL STAR! 💖');
      // Potential celebration effect here
    });

    socket.on('session:partner-disconnected', () => {
      setStatus('Partner disconnected.');
      setRemoteStream(null);
    });

    socket.on('session:summary', (summary) => {
       console.log('Session Summary:', summary);
       // Could redirect to a summary page if needed
    });

    // If I'm the caller, initiate the offer immediately
    if (role === 'caller') {
      const createOffer = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('signal:offer', { offer });
      };
      createOffer();
    }

    return () => {
      socket.off('signal:offer');
      socket.off('signal:answer');
      socket.off('signal:ice');
      socket.off('chat:message');
      socket.off('chat:blocked');
      socket.off('star:sent');
      socket.off('star:mutual');
      socket.off('session:partner-disconnected');
      socket.off('session:summary');
      pc.close();
    };
  }, [socket, isConnected, localStream, role]);

  const handleSkip = () => {
    socket?.emit('session:end');
    router.push('/queue');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !isConnected) return;
    socket.emit('chat:message', { text: chatInput });
    setMessages(prev => [...prev, { text: chatInput, isSelf: true, id: Date.now() }]);
    setChatInput('');
  };

  const handleStar = () => {
    if (!socket || !isConnected) return;
    socket.emit('session:star');
    setIsStarred(true);
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
