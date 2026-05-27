'use client';

import React, { useState, useEffect, useRef } from 'react';
import 'adapterjs';
import DOMPurify from 'dompurify';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Tag } from '@/components/Tag';
import { Modal } from '@/components/Modal';
import { userApi } from '@/lib/api';
import styles from '../page.module.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'underage', label: 'Underage' },
];

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const router = useRouter();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  // Redirect if sessionId is missing or undefined
  useEffect(() => {
    if (!sessionId) {
      router.push('/dashboard');
    }
  }, [sessionId, router]);

  const [status, setStatus] = useState<string>('Initializing...');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [vibeData, setVibeData] = useState<{ icebreaker: string, sharedInterests: string[] } | null>(null);
  const [messages, setMessages] = useState<{text: string, isSelf: boolean, id: number}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Modal States
  const [isMediaErrorModalOpen, setIsMediaErrorModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [isReporting, setIsReporting] = useState(false);

  // Partner Info
  const [partnerName, setPartnerName] = useState('Match');
  const [partnerCollege, setPartnerCollege] = useState('Verified Student');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = sessionStorage.getItem('partnerName');
      const storedCollege = sessionStorage.getItem('partnerCollege');
      if (storedName) setPartnerName(storedName);
      if (storedCollege) setPartnerCollege(storedCollege);
    }
  }, []);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initMedia = async () => {
    try {
      setIsMediaErrorModalOpen(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setLocalStream(stream);
      setStatus('Ready');
    } catch (err: any) {
      if (err?.name === 'OverconstrainedError') {
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setLocalStream(fallback);
          setStatus('Ready');
          return;
        } catch {
          setStatus('Camera unavailable');
        }
      } else if (err?.name === 'NotAllowedError') {
        setStatus('Grant camera permission');
      } else if (err?.name === 'NotFoundError') {
        setStatus('No camera detected');
      } else {
        setStatus('Camera unavailable');
      }
      setIsMediaErrorModalOpen(true);
    }
  };

  // Get Media & Initialize
  useEffect(() => {
    initMedia();

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  // Ensure localStream cleanup when it changes or unmounts
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, [localStream]);

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
        socket.emit('webrtc:ice-candidate', { candidate: event.candidate });
      }
    };

    // Listeners for signaling
    socket.on('webrtc:offer', async (data) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { answer });
    });

    socket.on('webrtc:answer', async (data) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('webrtc:ice-candidate', async (data) => {
      if (data && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
        }
      }
    });

    // Chat listeners
    socket.on('chat:message', (data) => {
      setMessages(prev => [...prev, {
        text: DOMPurify.sanitize(data.content || data.text || ''),
        isSelf: data.senderId === user?.id,
        id: Date.now(),
      }]);
    });

    socket.on('chat:warning', () => {
      setIsBlockedModalOpen(true);
    });

    // Match metadata
    socket.on('match:found', (data) => {
       setVibeData({ icebreaker: data.icebreaker, sharedInterests: data.sharedInterests });
       setTimeout(() => setVibeData(null), 8000);
       
       // Update partner info if provided in the event (as backup to sessionStorage)
       if (data.partnerName) setPartnerName(data.partnerName);
       if (data.partnerCollege) setPartnerCollege(data.partnerCollege);
    });

    socket.on('star:sent', () => {
      setStatus('Star Sent! ⭐');
      setTimeout(() => setStatus('Connected'), 2000);
    });

    socket.on('star:mutual', () => {
      setStatus('MUTUAL STAR! 💖');
    });

    socket.on('session:partner-disconnected', () => {
      setStatus('Partner disconnected.');
      setRemoteStream(null);
    });

    // If I'm the caller, initiate the offer immediately
    if (role === 'caller') {
      const createOffer = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { offer });
      };
      createOffer();
    }

    return () => {
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('chat:message');
      socket.off('chat:warning');
      socket.off('star:sent');
      socket.off('star:mutual');
      socket.off('session:partner-disconnected');
      socket.off('session:summary');
      pc.close();
    };
  }, [socket, isConnected, localStream, role]);

  const handleSkip = () => {
    socket?.emit('chat:leave');
    localStream?.getTracks().forEach(t => t.stop());
    peerConnection.current?.close();
    router.push('/queue');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !isConnected) return;
    socket.emit('chat:message', { sessionId, content: chatInput });
    setChatInput('');
  };

  const toggleAudio = () => {
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = !audioEnabled;
    });
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = !videoEnabled;
    });
    setVideoEnabled(!videoEnabled);
  };

  const handleStar = () => {
    if (!socket || !isConnected) return;
    socket.emit('session:star');
    setIsStarred(true);
  };

  const handleReport = async () => {
    if (!sessionId || isReporting) return;
    setIsReporting(true);
    try {
      const reportedId = sessionStorage.getItem('partnerId');
      if (!reportedId) {
        // toast-style error — fallback since toast isn't imported
        setStatus('Cannot report: session data missing. Please reconnect.');
        setIsReportModalOpen(false);
        return;
      }
      await userApi.report({ 
        reportedId,
        sessionId, 
        reason: reportReason 
      });
      // Chunk F: clean up sessionStorage after report
      sessionStorage.removeItem('partnerId');
      sessionStorage.removeItem('partnerName');
      sessionStorage.removeItem('partnerCollege');
      sessionStorage.removeItem('partnerGender');
      socket?.emit('chat:leave');
      setIsReportModalOpen(false);
      router.push('/home');
    } catch (err) {
    } finally {
      setIsReporting(false);
    }
  };

  if (!sessionId) return null;

  return (
    <div className={styles.chatContainer}>
      {/* Video Main Area */}
      <div className={styles.videoSection}>
        <div className={styles.matchHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Badge variant={status === 'Connected' ? 'primary' : 'neutral'}>{status}</Badge>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              SESSION_ID: {sessionId.slice(0, 8)}...
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <Tag>{partnerCollege}</Tag>
             <Button variant="ghost" size="sm" onClick={() => setIsReportModalOpen(true)} style={{ color: 'var(--accent-red)', borderColor: 'rgba(255,70,70,0.3)' }}>
               🚩 Report
             </Button>
          </div>
        </div>

        <div className={styles.remoteVideoContainer}>
          <VideoPlayer 
            stream={remoteStream} 
            isRevealed={isRevealed} 
            username={partnerName}
          />
        </div>

        <div className={styles.localVideoContainer}>
          <VideoPlayer 
            stream={localStream} 
            isLocal 
            isRevealed 
            username={user?.name || 'You'}
          />
        </div>

        <div className={styles.controls}>
          <Button variant="danger" onClick={handleSkip}>
            ⏭ SKIP
          </Button>
          <Button variant="ghost" onClick={toggleAudio}>
            {audioEnabled ? 'Mute' : 'Unmute'}
          </Button>
          <Button variant="ghost" onClick={toggleVideo}>
            {videoEnabled ? 'Stop Video' : 'Start Video'}
          </Button>
          {!isRevealed && status === 'Connected' && (
            <Button variant="ghost" onClick={() => setIsRevealed(true)}>
              🎭 REVEAL
            </Button>
          )}
          <Button variant="primary" onClick={handleStar} disabled={status !== 'Connected' || isStarred}>
            {isStarred ? '⭐ STARRED' : '⭐ STAR'}
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

      {/* Modals */}
      
      {/* Media Error Modal */}
      <Modal 
        isOpen={isMediaErrorModalOpen} 
        title="Camera Access Required" 
        hideCloseButton
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
            Camera access denied. Please allow camera and microphone permissions in your browser settings.
          </p>
          <Button variant="primary" onClick={initMedia}>
            Try Again
          </Button>
        </div>
      </Modal>

      {/* Blocked Modal */}
      <Modal 
        isOpen={isBlockedModalOpen} 
        title="Session Ended" 
        hideCloseButton
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
            This user has been flagged. The session has ended.
          </p>
          <Button variant="primary" onClick={() => router.push('/queue')}>
            Find New Match
          </Button>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        title="Report User"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Select a reason for reporting this user.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {REPORT_REASONS.map(reason => (
              <label key={reason.value} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                padding: '1rem', 
                backgroundColor: 'rgba(255,255,255,0.03)', 
                borderRadius: '8px',
                cursor: 'pointer',
                border: reportReason === reason.value ? '1px solid var(--accent-primary)' : '1px solid transparent'
              }}>
                <input 
                  type="radio" 
                  name="reportReason" 
                  value={reason.value} 
                  checked={reportReason === reason.value}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                {reason.label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" style={{ flex: 1 }} onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" style={{ flex: 1 }} onClick={handleReport} disabled={isReporting}>
              {isReporting ? 'Reporting...' : 'Confirm Report'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
