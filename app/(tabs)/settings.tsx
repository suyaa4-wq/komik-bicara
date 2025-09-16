import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  Volume2, 
  Zap, 
  Globe, 
  Info,
  Play
} from 'lucide-react-native';
import { useComicSettings } from '@/hooks/useComicSettings';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const {
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    autoRead,
    setAutoRead,
    language,
    setLanguage,
  } = useComicSettings();
  
  const insets = useSafeAreaInsets();

  const containerStyle = useMemo(() => ({
    flex: 1,
    backgroundColor: '#000',
    paddingTop: insets.top,
  }), [insets.top]);

  const speechRateOptions = [
    { label: 'Sangat Lambat', value: 0.4, description: 'Untuk pemahaman detail' },
    { label: 'Lambat', value: 0.6, description: 'Santai dan jelas' },
    { label: 'Normal', value: 0.8, description: 'Kecepatan natural' },
    { label: 'Cepat', value: 1.0, description: 'Lebih dinamis' },
    { label: 'Sangat Cepat', value: 1.2, description: 'Untuk pembaca cepat' },
  ];

  const pitchOptions = [
    { label: 'Rendah', value: 0.9, description: 'Suara dalam dan tenang' },
    { label: 'Normal', value: 1.1, description: 'Nada natural Indonesia' },
    { label: 'Tinggi', value: 1.3, description: 'Lebih ekspresif' },
  ];

  const languageOptions = [
    { label: 'Bahasa Indonesia', value: 'id-ID' },
    { label: 'English', value: 'en-US' },
    { label: 'Japanese', value: 'ja-JP' },
    { label: 'Korean', value: 'ko-KR' },
    { label: 'Chinese', value: 'zh-CN' },
    { label: 'Spanish', value: 'es-ES' },
  ];

  return (
    <View style={containerStyle}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pengaturan</Text>
          <Text style={styles.headerSubtitle}>
            Sesuaikan pengalaman membaca komik Anda
          </Text>
        </View>

        {/* Voice Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Volume2 color="#FF6B6B" size={24} />
            <Text style={styles.sectionTitle}>Pengaturan Suara</Text>
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Kecepatan Bicara</Text>
            <Text style={styles.settingDescription}>
              Seberapa cepat teks dibacakan
            </Text>
            <View style={styles.optionsContainer}>
              {speechRateOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    speechRate === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setSpeechRate(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      speechRate === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Nada Suara</Text>
            <Text style={styles.settingDescription}>
              Tinggi rendahnya nada suara
            </Text>
            <View style={styles.optionsContainer}>
              {pitchOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    speechPitch === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setSpeechPitch(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      speechPitch === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Uji Coba Suara</Text>
            <Text style={styles.settingDescription}>
              Dengarkan contoh suara dengan pengaturan saat ini
            </Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                const testText = "Halo! Ini adalah contoh suara pembaca komik dalam bahasa Indonesia. Pengaturan kecepatan dan nada suara dapat disesuaikan sesuai keinginan Anda.";
                Speech.speak(testText, {
                  language: language,
                  pitch: speechPitch,
                  rate: speechRate,
                });
              }}
            >
              <Play color="#FFF" size={20} />
              <Text style={styles.testButtonText}>Putar Contoh Suara</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reading Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap color="#FF6B6B" size={24} />
            <Text style={styles.sectionTitle}>Pengaturan Pembacaan</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.switchSetting}>
              <View style={styles.switchInfo}>
                <Text style={styles.settingLabel}>Mode Baca Otomatis</Text>
                <Text style={styles.settingDescription}>
                  Otomatis membacakan teks saat diekstrak
                </Text>
              </View>
              <Switch
                value={autoRead}
                onValueChange={setAutoRead}
                trackColor={{ false: '#333', true: '#FF6B6B' }}
                thumbColor={autoRead ? '#FFF' : '#999'}
              />
            </View>
          </View>
        </View>

        {/* Language Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe color="#FF6B6B" size={24} />
            <Text style={styles.sectionTitle}>Pengaturan Bahasa</Text>
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Bahasa Suara</Text>
            <Text style={styles.settingDescription}>
              Bahasa untuk text-to-speech
            </Text>
            <View style={styles.optionsContainer}>
              {languageOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    language === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setLanguage(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      language === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info color="#FF6B6B" size={24} />
            <Text style={styles.sectionTitle}>Tentang</Text>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Comic Voice Reader</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Aplikasi inovatif yang menghidupkan komik melalui suara. 
              Ekstrak teks dari panel komik dan dengarkan cerita favorit Anda 
              dibacakan dengan pengaturan suara yang dapat disesuaikan.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  optionButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  optionText: {
    color: '#999',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  switchSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
  },
  aboutCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  aboutTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aboutVersion: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 16,
  },
  aboutDescription: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});