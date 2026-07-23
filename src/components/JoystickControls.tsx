import { useState, useRef, useEffect, useCallback } from 'react';

interface JoystickControlsProps {
  onMove: (data: { x: number; y: number }) => void;
  onStop: () => void;
  size?: number; // base diameter in px
}

export function JoystickControls({ onMove, onStop, size = 80 }: JoystickControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activeTouchId = useRef<number | null>(null);

  const radius = size / 2;
  const maxDistance = radius - 12; // boundary for knob movement inside base

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        dx = Math.cos(angle) * maxDistance;
        dy = Math.sin(angle) * maxDistance;
      }

      setKnobPos({ x: dx, y: dy });

      // Normalized coordinates: x from -1 to 1, y from -1 (down) to +1 (up)
      const normX = dx / maxDistance;
      const normY = -dy / maxDistance; // Invert screen Y so UP is positive

      onMove({
        x: Math.abs(normX) < 0.05 ? 0 : Number(normX.toFixed(3)),
        y: Math.abs(normY) < 0.05 ? 0 : Number(normY.toFixed(3)),
      });
    },
    [maxDistance, onMove]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (activeTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    activeTouchId.current = touch.identifier;
    setIsDragging(true);
    handlePointer(touch.clientX, touch.clientY);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.stopPropagation();
      if (activeTouchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId.current) {
          handlePointer(touch.clientX, touch.clientY);
          break;
        }
      }
    },
    [handlePointer]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.stopPropagation();
      if (activeTouchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId.current) {
          activeTouchId.current = null;
          setIsDragging(false);
          setKnobPos({ x: 0, y: 0 });
          onStop();
          break;
        }
      }
    },
    [onStop]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    handlePointer(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isDragging && activeTouchId.current === null) {
        handlePointer(e.clientX, e.clientY);
      }
    };

    const handleWindowMouseUp = () => {
      if (isDragging && activeTouchId.current === null) {
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onStop();
      }
    };

    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd, handlePointer, onStop]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onMouseDown={handleMouseDown}
      style={{ width: size, height: size }}
      className="relative rounded-full bg-slate-900/30 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing"
    >
      {/* Outer ring detail */}
      <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />

      {/* Direction indicators */}
      <div className="absolute top-1 text-[9px] font-bold text-white/30 pointer-events-none">▲</div>
      <div className="absolute bottom-1 text-[9px] font-bold text-white/30 pointer-events-none">▼</div>
      <div className="absolute left-1 text-[9px] font-bold text-white/30 pointer-events-none">◄</div>
      <div className="absolute right-1 text-[9px] font-bold text-white/30 pointer-events-none">►</div>

      {/* Joystick Knob */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 border border-blue-300/50 shadow-md transform transition-transform duration-75 ${
          isDragging ? 'scale-110 shadow-blue-500/30' : ''
        }`}
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
    </div>
  );
}
