// services/ChildrenInfoService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface Child {
  id: number;
  nickname?: string;
  date_of_birth: string;
  age?: number;
}

class ChildrenInfoService {
  private static instance: ChildrenInfoService;
  private cache: Child[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_KEY = 'childrenInfoCache';
  private readonly API_URL = 'http://68.183.102.75:1337/endpoint/children';
  private readonly MAX_RETRY_ATTEMPTS = 3;

  public static getInstance(): ChildrenInfoService {
    if (!ChildrenInfoService.instance) {
      ChildrenInfoService.instance = new ChildrenInfoService();
    }
    return ChildrenInfoService.instance;
  }

  // Check network connectivity - Fixed TypeScript issue
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      // Handle null cases properly
      return Boolean(state.isConnected && state.isInternetReachable);
    } catch (error) {
      console.warn('Network check failed:', error);
      return false;
    }
  }

  // Load children info from cache
  private async loadFromCache(): Promise<Child[] | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        console.log('Loaded children info from cache');
        return data.children || [];
      }
    } catch (error) {
      console.error('Error loading children info from cache:', error);
    }
    return null;
  }

  // Save children info to cache
  private async saveToCache(children: Child[]): Promise<void> {
    try {
      const cacheData = {
        children,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('Children info saved to cache');
    } catch (error) {
      console.error('Error saving children info to cache:', error);
    }
  }

  // Check if cache is still valid
  private isCacheValid(): boolean {
    return this.cache !== null && 
           Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  // Calculate age from date of birth
  private calculateAge(dateOfBirth: string): number {
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    } catch (error) {
      console.warn('Error calculating age:', error);
      return 0;
    }
  }

  // Process children data to add age
  private processChildrenData(children: any[]): Child[] {
    return children.map(child => ({
      ...child,
      age: child.date_of_birth ? this.calculateAge(child.date_of_birth) : undefined,
    }));
  }

  // Fetch children info from API with retry logic
  private async fetchFromAPI(accessToken: string, retryCount = 0): Promise<Child[]> {
    try {
      console.log(`Fetching children info from API (attempt ${retryCount + 1}/${this.MAX_RETRY_ATTEMPTS})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(this.API_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.children)) {
        console.warn('Invalid children data structure:', data);
        return [];
      }

      const processedChildren = this.processChildrenData(data.children);
      
      // Update cache
      this.cache = processedChildren;
      this.cacheTimestamp = Date.now();
      await this.saveToCache(processedChildren);
      
      console.log('Children info fetched successfully:', processedChildren.length, 'children');
      return processedChildren;

    } catch (error) {
      console.error(`API fetch attempt ${retryCount + 1} failed:`, error);
      
      // Retry logic
      if (retryCount < this.MAX_RETRY_ATTEMPTS - 1) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchFromAPI(accessToken, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Main method to get children info
  public async getChildrenInfo(accessToken: string, forceRefresh = false): Promise<{
    children: Child[];
    fromCache: boolean;
    error?: string;
  }> {
    if (!accessToken) {
      return {
        children: [],
        fromCache: false,
        error: 'No access token provided',
      };
    }

    try {
      // Return memory cache if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid()) {
        console.log('Returning children info from memory cache');
        return {
          children: this.cache!,
          fromCache: true,
        };
      }

      // Check network connectivity
      const isConnected = await this.checkNetworkConnectivity();
      
      if (!isConnected) {
        console.log('No network connection, loading from cache');
        const cachedChildren = await this.loadFromCache();
        
        if (cachedChildren) {
          const processedChildren = this.processChildrenData(cachedChildren);
          this.cache = processedChildren;
          this.cacheTimestamp = Date.now();
          
          return {
            children: processedChildren,
            fromCache: true,
            error: 'Using cached data - no network connection',
          };
        }
        
        return {
          children: [],
          fromCache: false,
          error: 'No network connection and no cached data available',
        };
      }

      // Try to fetch from API
      try {
        const children = await this.fetchFromAPI(accessToken);
        return {
          children,
          fromCache: false,
        };
      } catch (apiError) {
        console.error('API fetch failed, trying cache fallback:', apiError);
        
        // Fallback to cache if API fails
        const cachedChildren = await this.loadFromCache();
        
        if (cachedChildren) {
          const processedChildren = this.processChildrenData(cachedChildren);
          this.cache = processedChildren;
          this.cacheTimestamp = Date.now();
          
          return {
            children: processedChildren,
            fromCache: true,
            error: 'Using cached data - API temporarily unavailable',
          };
        }
        
        // No cache available, return error
        return {
          children: [],
          fromCache: false,
          error: this.getErrorMessage(apiError),
        };
      }

    } catch (error) {
      console.error('Unexpected error in getChildrenInfo:', error);
      return {
        children: [],
        fromCache: false,
        error: 'Unexpected error occurred',
      };
    }
  }

  // Get user-friendly error message
  private getErrorMessage(error: any): string {
    if (error.name === 'AbortError') {
      return 'Request timed out. Please try again.';
    }
    
    if (error.message.includes('Network request failed')) {
      return 'Network connection failed. Please check your internet.';
    }
    
    if (error.message.includes('HTTP 401')) {
      return 'Authentication failed. Please log in again.';
    }
    
    if (error.message.includes('HTTP 403')) {
      return 'Access denied. Please check your permissions.';
    }
    
    if (error.message.includes('HTTP 404')) {
      return 'Children information not found.';
    }
    
    if (error.message.includes('HTTP 500')) {
      return 'Server error. Please try again later.';
    }
    
    return 'Failed to fetch children information. Please try again.';
  }

  // Clear cache
  public async clearCache(): Promise<void> {
    try {
      this.cache = null;
      this.cacheTimestamp = 0;
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('Children info cache cleared');
    } catch (error) {
      console.error('Error clearing children info cache:', error);
    }
  }

  // Update children info after modifications
  public async updateChildren(accessToken: string, updatedChildren: any[]): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('http://68.183.102.75:1337/endpoint/updateChildren', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ children: updatedChildren }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Clear cache to force refresh on next fetch
      await this.clearCache();
      
      console.log('Children info updated successfully');
      return { success: true };

    } catch (error) {
      console.error('Error updating children info:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Get cached children (synchronous)
  public getCachedChildren(): Child[] {
    return this.cache || [];
  }

  // Check if children need profile completion
  public needsProfileCompletion(children: Child[]): boolean {
    return children.some(child => !child.nickname || !child.date_of_birth);
  }
}

export default ChildrenInfoService.getInstance();