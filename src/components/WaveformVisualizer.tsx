import { useEffect, useRef, memo } from 'react';

interface WaveformVisualizerProps {
  isRecording: boolean;
  audioData?: number[];
  className?: string;
}

const WaveformVisualizer = memo(({ isRecording, audioData, className }: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const dataRef = useRef<number[]>(new Array(64).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'hsl(187, 100%, 42%)');
      gradient.addColorStop(0.5, 'hsl(265, 100%, 60%)');
      gradient.addColorStop(1, 'hsl(187, 100%, 42%)');
      
      const barCount = 64;
      const barWidth = width / barCount - 2;
      const maxHeight = height * 0.8;
      
      for (let i = 0; i < barCount; i++) {
        let barHeight: number;
        
        if (audioData && audioData.length > 0) {
          const dataIndex = Math.floor(i * audioData.length / barCount);
          barHeight = (audioData[dataIndex] || 0) * maxHeight;
        } else if (isRecording) {
          // Simulate waveform when recording
          const time = Date.now() / 1000;
          const wave1 = Math.sin(time * 2 + i * 0.2) * 0.3;
          const wave2 = Math.sin(time * 3 + i * 0.15) * 0.2;
          const wave3 = Math.sin(time * 5 + i * 0.1) * 0.15;
          barHeight = (0.3 + wave1 + wave2 + wave3 + Math.random() * 0.1) * maxHeight;
        } else {
          // Idle state
          barHeight = (0.05 + Math.sin(Date.now() / 1000 + i * 0.1) * 0.03) * maxHeight;
        }
        
        // Smooth transitions
        dataRef.current[i] = dataRef.current[i] * 0.7 + barHeight * 0.3;
        
        const x = i * (barWidth + 2);
        const y = (height - dataRef.current[i]) / 2;
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, dataRef.current[i], 2);
        ctx.fill();
        
        // Add glow effect
        if (isRecording) {
          ctx.shadowColor = 'hsl(187, 100%, 42%)';
          ctx.shadowBlur = 10;
        }
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioData]);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        className="w-full h-32"
      />
      {isRecording && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-scan-line" />
        </div>
      )}
    </div>
  );
});

WaveformVisualizer.displayName = 'WaveformVisualizer';

export default WaveformVisualizer;
