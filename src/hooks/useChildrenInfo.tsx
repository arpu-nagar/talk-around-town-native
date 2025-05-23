// hooks/useChildrenInfo.ts
import { useState, useEffect, useCallback, useContext } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ChildrenInfoService, { Child } from '../services/ChildrenInfoService';

interface UseChildrenInfoReturn {
  children: Child[];
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
  fetchChildren: (forceRefresh?: boolean) => Promise<void>;
  updateChildren: (updatedChildren: any[]) => Promise<boolean>;
  clearError: () => void;
  retryFetch: () => Promise<void>;
  needsProfileCompletion: boolean;
}

export const useChildrenInfo = (): UseChildrenInfoReturn => {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const { userInfo } = useContext(AuthContext);

  const fetchChildren = useCallback(async (forceRefresh = false) => {
    if (!userInfo?.access_token) {
      setError('No access token available');
      setChildren([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await ChildrenInfoService.getChildrenInfo(
        userInfo.access_token,
        forceRefresh
      );

      setChildren(result.children);
      setIsFromCache(result.fromCache);
      
      if (result.error) {
        setError(result.error);
        // Don't show alert for cache fallback scenarios
        if (!result.fromCache) {
          console.warn('Children info fetch warning:', result.error);
        }
      }

    } catch (error) {
      console.error('Error in fetchChildren:', error);
      setError('Failed to fetch children information');
      setChildren([]);
      setIsFromCache(false);
    } finally {
      setIsLoading(false);
    }
  }, [userInfo?.access_token]);

  const updateChildren = useCallback(async (updatedChildren: any[]): Promise<boolean> => {
    if (!userInfo?.access_token) {
      Alert.alert('Error', 'No access token available');
      return false;
    }

    try {
      const result = await ChildrenInfoService.updateChildren(
        userInfo.access_token,
        updatedChildren
      );

      if (result.success) {
        // Refresh children data after successful update
        await fetchChildren(true);
        Alert.alert('Success', 'Children information updated successfully');
        return true;
      } else {
        Alert.alert('Error', result.error || 'Failed to update children information');
        return false;
      }
    } catch (error) {
      console.error('Error updating children:', error);
      Alert.alert('Error', 'Failed to update children information');
      return false;
    }
  }, [userInfo?.access_token, fetchChildren]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryFetch = useCallback(async () => {
    await fetchChildren(true); // Force refresh on retry
  }, [fetchChildren]);

  // Auto-fetch on mount and when access token changes
  useEffect(() => {
    if (userInfo?.access_token) {
      fetchChildren();
    } else {
      setChildren([]);
      setError(null);
      setIsFromCache(false);
    }
  }, [userInfo?.access_token, fetchChildren]);

  const needsProfileCompletion = ChildrenInfoService.needsProfileCompletion(children);

  return {
    children,
    isLoading,
    error,
    isFromCache,
    fetchChildren,
    updateChildren,
    clearError,
    retryFetch,
    needsProfileCompletion,
  };
};