import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Activity } from 'lucide-react';

// Global instances to persist across React StrictMode re-renders
let sharedAudio: HTMLAudioElement | null = null;
let sharedCtx: AudioContext | null = null;
let sharedAnalyser: AnalyserNode | null = null;
let isContextInitializing = false;

export function BackgroundMusic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(true); // Must start muted to bypass browser autoplay block
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sharedAudio) {
      sharedAudio = new Audio(import.meta.env.BASE_URL + 'Sounds/Roulette After Dark.mp3');
      sharedAudio.loop = true;
      sharedAudio.crossOrigin = 'anonymous'; // Required for Web Audio API Analyzer
      sharedAudio.volume = 0.005; // Extremely low volume
      sharedAudio.muted = true; // Required by browsers to autoplay without interaction
    }

    const audio = sharedAudio;

    const setupAudioContext = () => {
      if (sharedCtx || isContextInitializing) return;
      isContextInitializing = true;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        sharedCtx = new AudioContextClass();
        sharedAnalyser = sharedCtx.createAnalyser();
        sharedAnalyser.fftSize = 128;
        
        const source = sharedCtx.createMediaElementSource(audio);
        source.connect(sharedAnalyser);
        sharedAnalyser.connect(sharedCtx.destination);
      } catch (e) {
        console.warn("AudioContext init failed:", e);
      }
      isContextInitializing = false;
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Guaranteed autoplay by starting muted
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Very strict browsers might even block muted autoplay, wait for interaction
    });

    const handleInteraction = () => {
      setupAudioContext();
      if (sharedCtx && sharedCtx.state === 'suspended') {
        sharedCtx.resume();
      }
      if (audio.paused) {
        audio.play().catch(() => {});
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    // Listen for any interaction to bootstrap the AudioContext
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Waveform visualization loop
  useEffect(() => {
    const drawWaveform = () => {
      animationRef.current = requestAnimationFrame(drawWaveform);

      if (!canvasRef.current || !sharedAnalyser) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = sharedAnalyser;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    if (isPlaying) {
      drawWaveform();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const toggleMute = () => {
    if (sharedAudio) {
      if (!sharedCtx) {
        // Bootstrap context if clicking mute before anything else
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        sharedCtx = new AudioContextClass();
        sharedAnalyser = sharedCtx.createAnalyser();
        sharedAnalyser.fftSize = 128;
        const source = sharedCtx.createMediaElementSource(sharedAudio);
        source.connect(sharedAnalyser);
        sharedAnalyser.connect(sharedCtx.destination);
      }
      
      if (sharedCtx.state === 'suspended') {
        sharedCtx.resume();
      }
      
      const newMutedState = !isMuted;
      sharedAudio.muted = newMutedState;
      setIsMuted(newMutedState);
      
      if (sharedAudio.paused) {
        sharedAudio.play().catch(() => {});
      }
    }
  };

  return (
    <div className="absolute top-4 left-24 sm:top-6 sm:left-24 z-30 pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-slate-800 p-2 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
      
      <button
        onClick={toggleMute}
        className={`p-1 transition flex items-center justify-center cursor-pointer ${
          isMuted ? 'text-slate-500 hover:text-slate-400' : 'text-blue-400 hover:text-blue-300'
        }`}
        title={isMuted ? 'Unmute Background Music' : 'Mute Background Music'}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <div className="relative w-24 h-8 bg-slate-950/50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/50">
        {!isPlaying ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 font-mono">
            <Activity size={12} />
            <span>PAUSED</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={96}
            height={32}
            className={`w-full h-full ${isMuted ? 'opacity-30' : 'opacity-100'}`}
          />
        )}
      </div>
    </div>
  );
}
