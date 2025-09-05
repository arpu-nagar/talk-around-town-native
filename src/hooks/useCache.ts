import {useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useCache() {
  const loadFromCache = useCallback(async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`Loaded cached data for ${key}`);
        return data;
      }
    } catch (e) {
      console.warn(`cache load error [${key}]`, e);
    }
    return null;
  }, []);

  const saveToCache = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Cached data for ${key}`);
    } catch (e) {
      console.warn(`cache save error [${key}]`, e);
    }
  }, []);

  return {loadFromCache, saveToCache};
}
