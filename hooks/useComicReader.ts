import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { useComicSettings } from './useComicSettings';

interface ExtractedText {
  text: string;
  timestamp: number;
}

export function useComicReader() {
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com/search?q=manga+comic+online+read');
  const [isReading, setIsReading] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { speechRate, speechPitch, autoRead, language } = useComicSettings();

  // Preprocess text for more natural Indonesian pronunciation
  const preprocessIndonesianText = useCallback((text: string): string => {
    let processedText = text
      // Remove excessive punctuation
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      .replace(/[.]{3,}/g, '...')
      // Handle proper names - add spaces between capital letters for better pronunciation
      .replace(/\b([A-Z]{2,})\b/g, (match) => {
        // Split consecutive capital letters with spaces for spelling out names
        return match.split('').join(' ');
      })
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

  const speakText = useCallback((text: string) => {
    if (!text) return;

    // Stop any current speech before starting new one
    Speech.stop();

    const processedText = preprocessIndonesianText(text);

    // Enhanced voice options for Indonesian
    const voiceOptions = {
      language: language,
      pitch: speechPitch,
      rate: speechRate,
      // Try different Indonesian voices based on platform
      voice: Platform.select({
        ios: 'id-id-x-idf-local', // Indonesian female voice on iOS
        android: 'id-id-x-idf-local', // Indonesian voice on Android
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
        
        // Fallback: try with default voice if specific voice fails
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

  const extractTextFromImage = useCallback(async (imageUri: string) => {
    setIsProcessing(true);
    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // Use AI API for OCR
      const ocrResponse = await fetch('https://toolkit.rork.com/text/llm/', {
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
          speakText(extractedText);
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

  const startReading = useCallback(() => {
    if (currentText) {
      speakText(currentText);
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
      speakText(extractedTexts[nextIndex].text);
    }
  }, [extractedTexts, currentIndex, autoRead, speakText]);

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