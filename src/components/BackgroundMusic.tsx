import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Activity } from 'lucide-react';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize AudioContext and Analyser only after first interaction to comply with browser policies
  const initAudioContext = () => {
    if (audioCtxRef.current || !audioRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Small fftSize for a simple waveform
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (err) {
      console.warn("AudioContext initialization failed:", err);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.08;
    }

    const handleFirstInteraction = async () => {
      if (audioRef.current && audioRef.current.paused) {
        try {
          initAudioContext();
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
          }
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.warn("Autoplay blocked:", e);
        }
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Waveform visualization loop
  useEffect(() => {
    const drawWaveform = () => {
      animationRef.current = requestAnimationFrame(drawWaveform);

      if (!canvasRef.current || !analyserRef.current || !isPlaying) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6'; // Blue-500
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
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const toggleMute = () => {
    if (audioRef.current) {
      // If context is suspended (first click), resume it
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      // If it wasn't playing due to autoplay block, start it now
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn(e));
        initAudioContext();
      }
    }
  };

  return (
    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-slate-800 p-2 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
      <audio
        ref={audioRef}
        src={import.meta.env.BASE_URL + 'Sounds/Roulette After Dark.mp3'}
        loop
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      <button
        onClick={toggleMute}
        className={`p-2 rounded-xl border transition flex items-center justify-center cursor-pointer ${
          isMuted
            ? 'bg-slate-800 text-slate-500 border-slate-700'
            : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
        }`}
        title={isMuted ? 'Unmute Background Music' : 'Mute Background Music'}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
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
