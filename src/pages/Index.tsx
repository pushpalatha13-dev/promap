import { useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import AudioControls from '@/components/AudioControls';
import AnalysisResult from '@/components/AnalysisResult';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { toast } from 'sonner';
import { Shield, Lock, Zap, Globe } from 'lucide-react';

const Index = () => {
  const { 
    isRecording, 
    audioBlob, 
    audioData, 
    startRecording, 
    stopRecording, 
    error: recorderError 
  } = useAudioRecorder();
  
  const { 
    analyze, 
    isAnalyzing, 
    result, 
    error: analysisError,
    reset 
  } = useAudioAnalysis();

  // Handle recorder errors
  useEffect(() => {
    if (recorderError) {
      toast.error(recorderError);
    }
  }, [recorderError]);

  // Handle analysis errors
  useEffect(() => {
    if (analysisError) {
      toast.error(analysisError);
    }
  }, [analysisError]);

  // Auto-analyze when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording) {
      analyze(audioBlob);
    }
  }, [audioBlob, isRecording, analyze]);

  const handleFileUpload = useCallback((file: File) => {
    reset();
    const blob = new Blob([file], { type: file.type });
    analyze(blob);
    toast.success(`Analyzing: ${file.name}`);
  }, [analyze, reset]);

  const handleStartRecording = useCallback(async () => {
    reset();
    await startRecording();
  }, [reset, startRecording]);

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_70%)]" />
      </div>

      <div className="relative container max-w-4xl mx-auto px-4 py-6">
        <Header />

        <main className="mt-8 space-y-8">
          {/* Main Analysis Card */}
          <div className="glass-card p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Controls */}
              <div className="space-y-6">
                <AudioControls
                  isRecording={isRecording}
                  isAnalyzing={isAnalyzing}
                  onStartRecording={handleStartRecording}
                  onStopRecording={stopRecording}
                  onFileUpload={handleFileUpload}
                />
              </div>

              {/* Right: Confidence Meter */}
              <div className="flex items-center justify-center">
                <ConfidenceMeter
                  confidence={result?.confidence || 0}
                  classification={result?.voiceType || null}
                />
              </div>
            </div>

            {/* Waveform */}
            <div className="mt-8">
              <WaveformVisualizer 
                isRecording={isRecording}
                audioData={audioData}
                className="bg-secondary/30 rounded-xl"
              />
            </div>
          </div>

          {/* Results */}
          <AnalysisResult 
            data={result}
            isLoading={isAnalyzing}
          />

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Privacy First"
              description="No audio stored"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Real-Time"
              description="Instant analysis"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Multi-Language"
              description="5+ languages"
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              title="Secure"
              description="End-to-end encrypted"
            />
          </div>

          {/* Footer */}
          <footer className="text-center py-8 text-sm text-muted-foreground">
            <p>VoiceGuard — AI Voice Detection & Scam Protection</p>
            <p className="mt-1 text-xs">
              Your audio is processed securely and never stored without consent.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="glass-card p-4 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
      {icon}
    </div>
    <h3 className="font-medium text-sm">{title}</h3>
    <p className="text-xs text-muted-foreground mt-1">{description}</p>
  </div>
);

export default Index;
