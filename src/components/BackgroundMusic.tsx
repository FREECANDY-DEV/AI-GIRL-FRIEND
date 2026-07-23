import { useEffect, useRef } from 'react';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.08; // Set low volume
    }
  }, []);

  return (
    <audio
      ref={audioRef}
      src={import.meta.env.BASE_URL + 'Sounds/Roulette After Dark.mp3'}
      autoPlay
      loop
    />
  );
}
