import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Save, Trash2, X } from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { AudioObject } from '../../shared/types';

interface Props {
  stageX: number;
  stageY: number;
  zoom: number;
  onClose: () => void;
}

export const AudioRecorder: React.FC<Props> = ({
  stageX,
  stageY,
  zoom,
  onClose,
}) => {
  const { addObject, username, canvasObjects } = useRoom();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Recording Timer Counter
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Could not access microphone. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSaveAudio = async () => {
    if (!audioBlob) return;

    const file = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', file);

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const posX = (screenWidth / 2 - stageX) / zoom - 120;
    const posY = (screenHeight / 2 - stageY) / zoom - 50;

    let finalUrl = audioUrl || '';
    let finalAssetId = `asset_${Date.now()}`;

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        finalUrl = data.url;
        finalAssetId = data.assetId;
      }
    } catch (err) {
      console.warn('Backend asset upload fallback to local Blob URL:', err);
    }

    const newAudio: AudioObject = {
      id: `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'audio',
      assetId: finalAssetId,
      src: finalUrl,
      audioUrl: finalUrl,
      duration: recordingTime || 3,
      title: `Voice Note (${username || 'Guest'})`,
      x: posX,
      y: posY,
      width: 250,
      height: 110,
      rotation: 0,
      zIndex: canvasObjects.size + 1,
      createdBy: username || 'Guest',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    console.log('🎙️ Creating Audio Object in Yjs:', newAudio);
    addObject(newAudio);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--modal-backdrop)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: 360,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Voice Recorder</h3>
          <button onClick={onClose} className="tool-btn" style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        {/* Recording Visualizer Status */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
            border: isRecording ? '2px solid #ef4444' : '1px solid var(--input-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          <Mic size={36} color={isRecording ? '#ef4444' : 'var(--text-muted)'} />
        </div>

        {/* Timer Output */}
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-heading)' }}>
          00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
        </div>

        {/* Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isRecording && !audioBlob && (
            <button onClick={startRecording} className="btn-primary" style={{ padding: '10px 20px', gap: 8 }}>
              <Mic size={18} />
              <span>Record Voice</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Square size={18} />
              <span>Stop Recording</span>
            </button>
          )}

          {!isRecording && audioBlob && (
            <>
              <button onClick={togglePlayback} className="tool-btn" style={{ width: 44, height: 44 }}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={() => {
                  setAudioBlob(null);
                  setAudioUrl(null);
                  setRecordingTime(0);
                }}
                className="tool-btn"
                title="Discard Recording"
                style={{ width: 44, height: 44, color: '#ef4444' }}
              >
                <Trash2 size={20} />
              </button>
              <button onClick={handleSaveAudio} className="btn-primary" style={{ padding: '10px 20px', gap: 8 }}>
                <Save size={18} />
                <span>Add to Canvas</span>
              </button>
            </>
          )}
        </div>

        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
};
