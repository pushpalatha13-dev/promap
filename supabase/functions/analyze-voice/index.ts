import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Scam/spam keyword patterns
const SCAM_KEYWORDS = {
  urgency: ['urgent', 'immediately', 'right now', 'act fast', 'limited time', 'expires today', 'hurry'],
  financial: ['bank account', 'credit card', 'wire transfer', 'bitcoin', 'cryptocurrency', 'investment', 'money', 'cash prize', 'lottery', 'won'],
  otp: ['otp', 'one time password', 'verification code', 'pin number', 'security code'],
  impersonation: ['irs', 'social security', 'police', 'fbi', 'government', 'microsoft', 'amazon', 'apple', 'tech support'],
  threats: ['arrest', 'warrant', 'legal action', 'lawsuit', 'suspended', 'blocked', 'terminated'],
  pressure: ['dont tell anyone', "don't tell", 'keep this secret', 'stay on the line', 'do not hang up'],
};

const LANGUAGE_CODES: Record<string, string> = {
  'en': 'English',
  'ta': 'Tamil',
  'hi': 'Hindi',
  'te': 'Telugu',
  'ml': 'Malayalam',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Check base64 size (roughly 4/3 of original)
    const estimatedSize = (audio.length * 3) / 4;
    if (estimatedSize > 5 * 1024 * 1024) {
      throw new Error('Audio file too large. Maximum size is 5MB.');
    }

    console.log('Received audio for analysis, mimeType:', mimeType, 'size:', Math.round(estimatedSize / 1024), 'KB');

    // Decode base64 audio more efficiently
    const binaryString = atob(audio);
    const len = binaryString.length;
    const audioBytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      audioBytes[i] = binaryString.charCodeAt(i);
    }
    
    // Determine file extension from mimeType
    const ext = mimeType?.includes('mpeg') ? 'mp3' : mimeType?.includes('wav') ? 'wav' : 'webm';
    const audioBlob = new Blob([audioBytes], { type: mimeType || 'audio/webm' });

    // Create form data for ElevenLabs
    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${ext}`);
    formData.append('model_id', 'scribe_v2');
    formData.append('tag_audio_events', 'true');
    formData.append('diarize', 'true');

    console.log('Sending to ElevenLabs for transcription...');

    // Get transcription from ElevenLabs
    const sttResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!sttResponse.ok) {
      const errorText = await sttResponse.text();
      console.error('ElevenLabs STT error:', errorText);
      throw new Error(`Speech-to-text failed: ${sttResponse.status}`);
    }

    const transcription = await sttResponse.json();
    console.log('Transcription received:', transcription);

    const text = transcription.text?.toLowerCase() || '';
    const words = transcription.words || [];
    const audioEvents = transcription.audio_events || [];

    // Detect language (simplified - checking for common patterns)
    let detectedLanguage = 'English';
    const languageCode = transcription.language_code || 'en';
    detectedLanguage = LANGUAGE_CODES[languageCode] || 'English';

    // Analyze for AI voice patterns
    const aiArtifacts: string[] = [];
    let aiScore = 0;

    // Check for unnatural speech patterns
    if (words.length > 0) {
      // Check timing consistency (AI tends to have very regular timing)
      const timings: number[] = [];
      for (let i = 1; i < words.length; i++) {
        const gap = words[i].start - words[i - 1].end;
        timings.push(gap);
      }
      
      if (timings.length > 2) {
        const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
        const variance = timings.reduce((sum, t) => sum + Math.pow(t - avgTiming, 2), 0) / timings.length;
        const stdDev = Math.sqrt(variance);
        
        // Very low variance suggests AI (unnatural consistency)
        if (stdDev < 0.05 && timings.length > 5) {
          aiArtifacts.push('Unnaturally consistent timing');
          aiScore += 25;
        }
      }

      // Check for lack of natural pauses/hesitations
      const hasNaturalPauses = timings.some(t => t > 0.5 && t < 2);
      if (!hasNaturalPauses && words.length > 10) {
        aiArtifacts.push('No natural hesitations detected');
        aiScore += 15;
      }
    }

    // Check audio events for natural human sounds
    const hasBreathing = audioEvents.some((e: any) => 
      e.type?.toLowerCase().includes('breath') || 
      e.type?.toLowerCase().includes('inhale')
    );
    const hasLaughter = audioEvents.some((e: any) => 
      e.type?.toLowerCase().includes('laugh')
    );
    const hasCoughing = audioEvents.some((e: any) => 
      e.type?.toLowerCase().includes('cough')
    );

    if (!hasBreathing && words.length > 20) {
      aiArtifacts.push('No breath sounds detected');
      aiScore += 20;
    }

    if (hasLaughter || hasCoughing) {
      // Natural human sounds reduce AI score
      aiScore -= 30;
    }

    // Check for robotic patterns in word structure
    const uniqueWords = new Set(text.split(/\s+/));
    const repetitionRatio = uniqueWords.size / text.split(/\s+/).length;
    if (repetitionRatio < 0.3 && text.split(/\s+/).length > 20) {
      aiArtifacts.push('High word repetition pattern');
      aiScore += 15;
    }

    // Scam detection
    const riskIndicators: string[] = [];
    let scamScore = 0;

    for (const [category, keywords] of Object.entries(SCAM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          riskIndicators.push(`${category}: "${keyword}"`);
          scamScore += 15;
        }
      }
    }

    // Determine voice classification
    let voiceType: 'human' | 'ai' | 'uncertain';
    let confidence: number;

    if (aiScore >= 50) {
      voiceType = 'ai';
      confidence = Math.min(95, 50 + aiScore);
    } else if (aiScore >= 25) {
      voiceType = 'uncertain';
      confidence = 50 + (25 - Math.abs(aiScore - 37.5));
    } else {
      voiceType = 'human';
      confidence = Math.min(95, 70 + (25 - aiScore));
    }

    // Determine call classification
    let callClassification: 'safe' | 'spam' | 'fraud' | undefined;
    if (scamScore > 0) {
      if (scamScore >= 60) {
        callClassification = 'fraud';
      } else if (scamScore >= 30) {
        callClassification = 'spam';
      } else {
        callClassification = 'safe';
      }
    }

    // Generate recommendation
    let recommendation: string;
    if (voiceType === 'ai' && callClassification === 'fraud') {
      recommendation = 'HIGH RISK: This appears to be an AI-generated voice with multiple fraud indicators. End the call immediately and do not provide any personal information.';
    } else if (voiceType === 'ai') {
      recommendation = 'This voice shows characteristics of AI generation. Exercise caution and verify the caller\'s identity through official channels.';
    } else if (callClassification === 'fraud') {
      recommendation = 'Multiple fraud indicators detected. Do not share personal or financial information. Verify through official channels.';
    } else if (callClassification === 'spam') {
      recommendation = 'Potential spam call detected. Be cautious about any requests for personal information.';
    } else if (voiceType === 'uncertain') {
      recommendation = 'Unable to determine with high confidence. If suspicious, verify the caller\'s identity independently.';
    } else {
      recommendation = 'No significant concerns detected. Standard verification practices are still recommended for sensitive matters.';
    }

    const result = {
      voiceType,
      confidence: Math.round(confidence),
      language: detectedLanguage,
      artifacts: aiArtifacts,
      recommendation,
      riskIndicators: riskIndicators.length > 0 ? riskIndicators : undefined,
      callClassification,
      transcription: transcription.text,
    };

    console.log('Analysis complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-voice function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Analysis failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
