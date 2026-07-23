import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Activity } from 'lucide-react';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) return;

    // Make the volume much lower
    audioRef.current.volume = 0.02;

    const initAudio = () => {
      if (isInitializedRef.current || !audioRef.current) return;
      
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128; 
        analyserRef.current = analyser;

        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        
        isInitializedRef.current = true;
      } catch (err) {
        console.warn("AudioContext init failed:", err);
      }
    };

    // Initialize Web Audio API immediately to connect the node
    initAudio();

    // Try to play immediately (might be blocked by browser)
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Autoplay blocked, wait for user interaction
    });

    const handleInteraction = () => {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Waveform visualization loop
  useEffect(() => {
    const drawWaveform = () => {
      animationRef.current = requestAnimationFrame(drawWaveform);

      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = analyserRef.current;
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

    drawWaveform();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-slate-800 p-2 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
      <audio
        ref={audioRef}
        src={import.meta.env.BASE_URL + 'Sounds/Roulette After Dark.mp3'}
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
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
