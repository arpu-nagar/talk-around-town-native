import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { createContext, useEffect, useState } from 'react';
import { BASE_URL } from '../config';
import { Alert } from 'react-native';

export interface UserInfo {
  access_token?: string;
  number_of_children?: number;
  children?: number[];
}

export interface AuthContextType {
  isLoading: boolean;
  userInfo: UserInfo;
  splashLoading: boolean;
  aiTips: boolean;
  register: (
    name: string, 
    email: string, 
    password: string, 
    location: { latitude: number; longitude: number },
    childrenData?: {
      numberOfChildren: number;
      childrenDetails: Array<{
        nickname: string;
        date_of_birth: string;
      }>;
    }
  ) => Promise<boolean>;
  login: (email: string, password: string) => void;
  logout: () => void;
  setAITips: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [isLoading, setIsLoading] = useState(false);
  const [splashLoading, setSplashLoading] = useState(false);
  const [aiTips, setAITips] = useState<boolean>(false);

  // Modified register function in AuthContext
  const register = async (
    name: string, 
    email: string, 
    password: string, 
    location: { latitude: number; longitude: number },
    childrenData?: {
      numberOfChildren: number;
      childrenDetails: Array<{
        nickname: string;
        date_of_birth: string;
      }>;
    }
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Fix the URL - remove the duplicate /api/auth
      console.log('Sending registration request to:', `${BASE_URL}/register`);
      
      const registrationData = {
        name,
        email,
        password,
        location,
        children: childrenData
      };
  
      console.log('Registration payload:', registrationData);
      
      const res = await axios.post(`${BASE_URL}/register`, registrationData);
      
      console.log('Registration response:', res.data);
      Alert.alert('Success', 'You can now login');
      setIsLoading(false);
      return true;
    } catch (e: any) {
      console.error('Registration error:', e.response?.data || e);
      Alert.alert(
        'Registration Failed', 
        e.response?.data?.error || 'Please check your credentials and try again.'
      );
      setIsLoading(false);
      return false;
    }
  };
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Sending login request to:', `${BASE_URL}/login`);
      const res = await axios.post(`${BASE_URL}/login`, { 
        email, 
        password 
      });
      const userInfo = res.data;
      setUserInfo(userInfo);
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      setIsLoading(false);
    } catch (e: any) {
      console.error('Login error:', e.response?.data || e);
      Alert.alert(
        'Login Failed', 
        e.response?.data?.error || 'Please check your credentials and try again.'
      );
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${userInfo.access_token}` },
        }
      );
      await AsyncStorage.removeItem('userInfo');
      setUserInfo({});
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = async () => {
    try {
      setSplashLoading(true);
      setIsLoading(true);
      let userInfoString = await AsyncStorage.getItem('userInfo');
      let userInfo: UserInfo = userInfoString ? JSON.parse(userInfoString) : {};
      
      if (!userInfo.access_token) {
        setUserInfo({});
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/verify`,
        {
          token: userInfo.access_token,
        },
        {
          headers: {
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        }
      );

      if (res.status === 200) {
        setUserInfo(userInfo);
      } else {
        await AsyncStorage.removeItem('userInfo');
        setUserInfo({});
      }
    } catch (e) {
      console.error('Session verification error:', e);
      await AsyncStorage.removeItem('userInfo');
      setUserInfo({});
    } finally {
      setIsLoading(false);
      setSplashLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userInfo,
        splashLoading,
        register,
        login,
        logout,
        aiTips,
        setAITips,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;