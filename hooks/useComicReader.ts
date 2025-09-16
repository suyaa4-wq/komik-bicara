import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { useComicSettings } from './useComicSettings';

interface ExtractedText {
  text: string;
  timestamp: number;
}

// ─── FUNGSI PEMBENTUK TEKS UNTUK SPEECH ────────────────────────────────────────
// DIPINDAHKAN KE DALAM HOOK AGAR BERLAKU GLOBAL

const formatTextForSpeech = (text: string): string => {
  if (!text) return text;

  let processed = text;

  // 1. Ganti "KAPITAL" (tepat sebagai kata) menjadi "kapital"
  processed = processed.replace(/\bKAPITAL\b/g, 'kapital');

  // 2. Tangani pola URL: WWW.MIAOMI.COM → "www dot miaomi dot com"
  processed = processed.replace(/\b([A-Z]{2,})(\.[A-Z]{2,})+\b/g, (match) => {
    return match.toLowerCase().replace(/\./g, ' dot ');
  });

  // 3. Tangani kata yang SELURUHNYA huruf kapital (minimal 2 huruf) → ubah jadi lowercase
  processed = processed.replace(/\b([A-Z]{2,})\b/g, (match) => {
    if (match === 'KAPITAL') return 'kapital';
    return match.toLowerCase();
  });

  // 4. Bersihkan spasi berlebih
  processed = processed.replace(/\s+/g, ' ').trim();

  return processed;
};

// ─── HOOK UTAMA ────────────────────────────────────────────────────────────────

export function useComicReader() {
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com/search?q=manga+comic+online+read');
  const [isReading, setIsReading] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { speechRate, speechPitch, autoRead, language } = useComicSettings();

  // ─── PREPROCESSOR INDONESIA (TETAP PAKAI, TAPI SETELAH FORMAT SPEECH) ───────

  const preprocessIndonesianText = useCallback((text: string): string => {
    let processedText = text
      // Remove excessive punctuation
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      .replace(/[.]{3,}/g, '...')
      // Handle proper names - add spaces between capital letters for better pronunciation
      // ❗ KITA NON-AKTIFKAN ATAU GANTI LOGIKA INI KARENA BERTENTANGAN DENGAN TUJUAN
      // Sebelumnya: .replace(/\b([A-Z]{2,})\b/g, match => match.split('').join(' '))
      // Sekarang: biarkan utuh — karena sudah ditangani oleh formatTextForSpeech
      // Jadi kita hapus atau override regex ini.
      .replace(/\b([A-Z]{2,})\b/g, '$1') // ← Biarkan utuh, jangan eja!
      // Handle mixed case names (like "Chen", "Master") - keep them as is but add slight pause
      .replace(/\b([A-Z][a-z]+)\b/g, '$1,')
      // Add pauses for better flow
      .replace(/([.!?])\s*([A-Z])/g, '$1 ... $2')
      // Handle common comic expressions
      .replace(/\b(ah|oh|eh|uh|hm|hmm)\b/gi, (match) => match.toLowerCase() + ',')
      // Add natural pauses after commas
      .replace(/,\s*/g, ', ')
      // Handle exclamations more naturally
      .replace(/!/g, '.')
      // Handle question marks with pause
      .replace(/\?/g, '?')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Clean up multiple commas
      .replace(/,+/g, ',')
      .trim();

    // Add natural breathing pauses for long sentences
    if (processedText.length > 100) {
      processedText = processedText.replace(/([,;])\s*/g, '$1 ');
    }

    console.log('📝 Teks diproses untuk TTS:', processedText);
    return processedText;
  }, []);

  // ─── SPEAK TEXT — INTEGRASIKAN FORMAT SEBELUM PREPROCESS ───────────────────

  const speakText = useCallback((text: string) => {
    if (!text) return;

    Speech.stop();

    // ✅ LANGKAH 1: Format teks agar URL & KAPITAL dibaca benar
    const formattedForSpeech = formatTextForSpeech(text);
    console.log('🔤 Teks setelah format speech:', formattedForSpeech);

    // ✅ LANGKAH 2: Proses lebih lanjut untuk pelafalan bahasa Indonesia
    const processedText = preprocessIndonesianText(formattedForSpeech);

    const voiceOptions = {
      language: language,
      pitch: speechPitch,
      rate: speechRate,
      voice: Platform.select({
        ios: 'id-id-x-idf-local',
        android: 'id-id-x-idf-local',
        default: undefined,
      }),
      quality: 'enhanced' as const,
      onStart: () => {
        setIsReading(true);
        console.log('🔊 Mulai membacakan teks dalam bahasa Indonesia dengan suara natural');
      },
      onDone: () => {
        setIsReading(false);
        console.log('✅ Selesai membacakan teks');
      },
      onStopped: () => {
        setIsReading(false);
        console.log('⏹️ Pembacaan dihentikan');
      },
      onError: (error: any) => {
        setIsReading(false);
        console.error('❌ Gagal membacakan teks:', error);
        
        // Fallback
        Speech.speak(processedText, {
          language: 'id-ID',
          pitch: speechPitch * 0.9,
          rate: speechRate * 0.9,
          onStart: () => {
            setIsReading(true);
            console.log('🔊 Menggunakan suara cadangan untuk bahasa Indonesia');
          },
          onDone: () => {
            setIsReading(false);
            console.log('✅ Selesai membacakan dengan suara cadangan');
          },
          onStopped: () => {
            setIsReading(false);
          },
          onError: () => {
            setIsReading(false);
            if (Platform.OS !== 'web') {
              console.log('Error: Gagal membacakan teks. Pastikan TTS bahasa Indonesia tersedia di perangkat Anda.');
            }
          },
        });
      },
    };

    Speech.speak(processedText, voiceOptions);
  }, [language, speechPitch, speechRate, preprocessIndonesianText]);

  // ─── EKSTRAKSI TEKS ─────────────────────────────────────────────────────────

  const extractTextFromImage = useCallback(async (imageUri: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      const ocrResponse = await fetch(' https://toolkit.rork.com/text/llm/ ', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an OCR system specialized in extracting text from comic panels. Extract all readable text from the image, maintaining the reading order (left to right, top to bottom). Only return the extracted text, nothing else.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this comic panel:'
                },
                {
                  type: 'image',
                  image: base64
                }
              ]
            }
          ]
        }),
      });

      if (!ocrResponse.ok) {
        throw new Error('OCR request failed');
      }

      const ocrResult = await ocrResponse.json();
      const extractedText = ocrResult.completion.trim();

      if (extractedText && extractedText.length > 0) {
        const newExtractedText: ExtractedText = {
          text: extractedText,
          timestamp: Date.now(),
        };

        setExtractedTexts(prev => [...prev, newExtractedText]);
        setCurrentText(extractedText);
        setCurrentIndex(extractedTexts.length);

        if (autoRead) {
          speakText(extractedText); // ← Akan diformat otomatis di dalam speakText
        }

        if (Platform.OS !== 'web') {
          console.log(`Text Extracted: Found "${extractedText.substring(0, 50)}${extractedText.length > 50 ? '...' : ''}"`);
        }
      } else {
        if (Platform.OS !== 'web') {
          console.log('No Text Found: Could not extract any text from this image');
        }
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      if (Platform.OS !== 'web') {
        console.log('Error: Failed to extract text from image');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [extractedTexts.length, autoRead, speakText]);

  // ─── FUNGSI KONTROL ─────────────────────────────────────────────────────────

  const startReading = useCallback(() => {
    if (currentText) {
      speakText(currentText); // ← Otomatis diformat di dalam speakText
    }
  }, [currentText, speakText]);

  const pauseReading = useCallback(() => {
    Speech.stop();
    setIsReading(false);
  }, []);

  const nextPanel = useCallback(() => {
    if (extractedTexts.length === 0) return;

    const nextIndex = (currentIndex + 1) % extractedTexts.length;
    setCurrentIndex(nextIndex);
    setCurrentText(extractedTexts[nextIndex].text);

    if (autoRead) {
      speakText(extractedTexts[nextIndex].text); // ← Otomatis diformat
    }
  }, [extractedTexts, currentIndex, autoRead, speakText]);

  // ─── RETURN ─────────────────────────────────────────────────────────────────

  return {
    currentUrl,
    setCurrentUrl,
    isReading,
    currentText,
    extractedTexts,
    currentIndex,
    startReading,
    pauseReading,
    nextPanel,
    extractTextFromImage,
    isProcessing,
  };
}