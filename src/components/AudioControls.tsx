import { useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Upload, FileAudio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioControlsProps {
  isRecording: boolean;
  isAnalyzing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (file: File) => void;
  uploadedFileName?: string;
  className?: string;
}

const AudioControls = memo(({
  isRecording,
  isAnalyzing,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  uploadedFileName,
  className,
}: AudioControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* Main recording button */}
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isAnalyzing}
        className={cn(
          'relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background',
          isRecording 
            ? 'bg-destructive hover:bg-destructive/90 glow-danger' 
            : 'bg-primary hover:bg-primary/90 glow-primary',
          isAnalyzing && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isRecording ? (
          <Square className="w-8 h-8 text-destructive-foreground" />
        ) : (
          <Mic className="w-10 h-10 text-primary-foreground" />
        )}
        
        {/* Pulse rings */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-destructive animate-ping opacity-30" />
            <span className="absolute inset-0 rounded-full border border-destructive/50 animate-pulse" />
          </>
        )}
      </button>
      
      <p className="text-sm text-muted-foreground">
        {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
      </p>
      
      {/* Divider */}
      <div className="flex items-center gap-4 w-full max-w-xs">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground uppercase">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      
      {/* File upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="lg"
        onClick={() => fileInputRef.current?.click()}
        disabled={isRecording || isAnalyzing}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Upload Audio File
      </Button>
      
      {uploadedFileName && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-sm">
          <FileAudio className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground truncate max-w-[200px]">
            {uploadedFileName}
          </span>
        </div>
      )}
    </div>
  );
});

AudioControls.displayName = 'AudioControls';

export default AudioControls;
