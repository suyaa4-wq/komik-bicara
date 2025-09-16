import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'comic_reader_settings';

interface ComicSettings {
  speechRate: number;
  speechPitch: number;
  autoRead: boolean;
  language: string;
  voice: string;
}

const DEFAULT_SETTINGS: ComicSettings = {
  speechRate: 0.8,
  speechPitch: 1.1,
  autoRead: true,
  language: 'id-ID',
  voice: 'id-id-x-idf-local',
};

export function useComicSettings() {
  const [settings, setSettings] = useState<ComicSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: ComicSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const setSpeechRate = (rate: number) => {
    const newSettings = { ...settings, speechRate: rate };
    saveSettings(newSettings);
  };

  const setSpeechPitch = (pitch: number) => {
    const newSettings = { ...settings, speechPitch: pitch };
    saveSettings(newSettings);
  };

  const setAutoRead = (autoRead: boolean) => {
    const newSettings = { ...settings, autoRead };
    saveSettings(newSettings);
  };

  const setLanguage = (language: string) => {
    const newSettings = { ...settings, language };
    saveSettings(newSettings);
  };

  const setVoice = (voice: string) => {
    const newSettings = { ...settings, voice };
    saveSettings(newSettings);
  };

  return {
    ...settings,
    setSpeechRate,
    setSpeechPitch,
    setAutoRead,
    setLanguage,
    setVoice,
  };
}