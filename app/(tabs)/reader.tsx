import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Camera, 
  Volume2,
  RefreshCw 
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useComicReader } from '@/hooks/useComicReader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── FUNGSI PEMBENTUK TEKS UNTUK SPEECH ────────────────────────────────────────

const formatTextForSpeech = (text: string): string => {
  if (!text) return text;

  let processed = text;

  // 1. Ganti "KAPITAL" (tepat sebagai kata) menjadi "kapital"
  processed = processed.replace(/\bKAPITAL\b/g, 'kapital');

  // 2. Tangani pola URL: WWW.MIAOMI.COM → "www dot miaomi dot com"
  //    Cocok untuk: huruf kapital berulang dipisah titik, minimal 2 bagian
  processed = processed.replace(/\b([A-Z]{2,})(\.[A-Z]{2,})+\b/g, (match) => {
    return match.toLowerCase().replace(/\./g, ' dot ');
  });

  // 3. Tangani kata yang SELURUHNYA huruf kapital (minimal 2 huruf) → ubah jadi lowercase
  //    Jangan sentuh jika hanya 1 huruf (biarkan TTS mengeja, misal: "A", "B")
  processed = processed.replace(/\b([A-Z]{2,})\b/g, (match) => {
    if (match === 'KAPITAL') return 'kapital'; // jaga-jaga
    return match.toLowerCase();
  });

  // 4. Bersihkan spasi berlebih
  processed = processed.replace(/\s+/g, ' ').trim();

  return processed;
};

// ─── KOMPONEN UTAMA ────────────────────────────────────────────────────────────

export default function ComicReaderScreen() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const {
    currentUrl,
    isReading,
    currentText,
    extractedTexts,
    currentIndex,
    startReading,   // Asumsi: ini fungsi yang menerima teks dan membacakannya
    pauseReading,
    nextPanel,
    extractTextFromImage,
    isProcessing,
  } = useComicReader();

  const [showControls, setShowControls] = useState(true);
  
  const dynamicStyles = useMemo(() => StyleSheet.create({
    containerWithInsets: {
      ...styles.container,
      paddingTop: insets.top,
    },
  }), [insets.top]);

  // ─── MODIFIKASI: BUNGKUS START READING DENGAN FORMAT TEXT ───────────────────

  const handleStartReading = () => {
    if (!currentText) return;
    const formattedText = formatTextForSpeech(currentText);
    startReading(formattedText); // Kirim teks yang sudah diformat ke TTS
  };

  // ─── HANDLER LAINNYA ────────────────────────────────────────────────────────

  const handleCapturePanel = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS !== 'web') {
          console.log('Permission needed: Please grant camera roll permissions to capture comic panels.');
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await extractTextFromImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing panel:', error);
      if (Platform.OS !== 'web') {
        console.log('Error: Failed to capture comic panel');
      }
    }
  };

  const handleWebViewLoad = () => {
    const jsCode = `
      (function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          img.style.cursor = 'pointer';
          img.addEventListener('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'imageClick',
              src: this.src,
              alt: this.alt || ''
            }));
          });
        });
      })();
    `;
    
    webViewRef.current?.injectJavaScript(jsCode);
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'imageClick') {
        if (Platform.OS !== 'web') {
          console.log('Extract text from comic panel?');
        }
        extractTextFromImage(data.src);
      }
    } catch (error) {
      console.error('Error handling webview message:', error);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <View style={dynamicStyles.containerWithInsets}>
      <StatusBar style={'light' as const} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pembaca Komik Bersuara</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowControls(!showControls)}
        >
          <Volume2 color="#FF6B6B" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webView}
          onLoad={handleWebViewLoad}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>

      {showControls && (
        <View style={styles.controlsContainer}>
          <View style={styles.textDisplay}>
            <ScrollView style={styles.textScroll}>
              <Text style={styles.currentText}>
                {currentText || 'Ketuk panel komik atau gunakan tombol kamera untuk mengekstrak teks'}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleCapturePanel}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <RefreshCw color="#FFF" size={24} />
              ) : (
                <Camera color="#FFF" size={24} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={isReading ? pauseReading : handleStartReading} // gunakan fungsi baru
              disabled={!currentText}
            >
              {isReading ? (
                <Pause color="#FFF" size={28} />
              ) : (
                <Play color="#FFF" size={28} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={nextPanel}
              disabled={extractedTexts.length === 0}
            >
              <SkipForward color="#FFF" size={24} />
            </TouchableOpacity>
          </View>

          {extractedTexts.length > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Panel {currentIndex + 1} • {extractedTexts.length} panel tersimpan
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  headerButton: {
    padding: 8,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  controlsContainer: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: 20,
  },
  textDisplay: {
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  textScroll: {
    maxHeight: 80,
  },
  currentText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  controlButton: {
    backgroundColor: '#333',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#FF6B6B',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  progressContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  progressText: {
    color: '#999',
    fontSize: 12,
  },
});