import React, { useState, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { AudioObject } from '../../shared/types';
import { Mic, Square, Check, X } from 'lucide-react';

interface Props {
  stageX: number;
  stageY: number;
  zoom: number;
  onClose: () => void;
}

export const AudioRecorder: React.FC<Props> = ({ stageX, stageY, zoom, onClose }) => {
  const { addObject, canvasObjects, username } = useRoom();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSaveAudio = async () => {
    if (!audioBlob) return;

    const file = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const posX = (screenWidth / 2 - stageX) / zoom - 120;
        const posY = (screenHeight / 2 - stageY) / zoom - 50;

        const newAudio: AudioObject = {
          id: `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'audio',
          assetId: data.assetId,
          audioUrl: data.url,
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

        addObject(newAudio);
        onClose();
      }
    } catch (err) {
      console.error('Failed to upload audio asset:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: 340, padding: 24, textAlign: 'center', borderRadius: 20 }}>
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>Record Voice Note</h3>

        <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="btn-primary"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ef4444',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
              }}
            >
              <Mic size={28} color="#fff" />
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="btn-primary"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#dc2626',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <Square size={24} color="#fff" />
            </button>
          )}
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          {isRecording ? `Recording: ${recordingTime}s` : audioBlob ? `Recorded ${recordingTime}s clip` : 'Click microphone to start'}
        </div>

        {audioBlob && (
          <div style={{ marginBottom: 20 }}>
            <audio src={URL.createObjectURL(audioBlob)} controls style={{ width: '100%' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={onClose} style={{ padding: '10px 16px', background: 'transparent', color: 'var(--text-muted)' }}>
            Cancel
          </button>
          {audioBlob && (
            <button onClick={handleSaveAudio} className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={16} />
              <span>Add to Canvas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
