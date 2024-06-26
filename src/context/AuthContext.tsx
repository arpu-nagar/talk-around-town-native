import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, {createContext, useEffect, useState} from 'react';
import {BASE_URL} from '../config';
import { Alert } from 'react-native';

export const AuthContext = createContext({});

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [userInfo, setUserInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [splashLoading, setSplashLoading] = useState(false);

  const register = (name: any, email: any, password: any) => {
    setIsLoading(true);
    console.log(BASE_URL);
    axios
      .post(`${BASE_URL}/register`, {
        name,
        email,
        password,
      })
      .then((res: {data: any}) => {
        let userInfo = res.data;
        setUserInfo(userInfo);
        AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
        setIsLoading(false);
        console.log(userInfo);
        Alert.alert('Registration Successful', 'You can now login');
      })
      .catch((e: any) => {
        Alert.alert('Error', 'Check Username/Password or contact sys admin.');
        console.log(`register error ${e}`);
        setIsLoading(false);
      });
  };

  const login = (email: any, password: any) => {
    setIsLoading(true);
    console.log('login');
    axios
      .post(`${BASE_URL}/login`, {
        email,
        password,
      })
      .then(res => {
        let userInfo = res.data;
        console.log(userInfo);
        setUserInfo(userInfo);
        AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
        setIsLoading(false);
      })
      .catch(e => {
        Alert.alert('Error', 'Check Username/Password or contact sys admin.');
        console.log(`login error ${e}`);
        setIsLoading(false);
      });
  };

  const logout = () => {
    setIsLoading(true);
    axios
      .post(
        `${BASE_URL}/logout`,
        {},
        {
          headers: {Authorization: `Bearer ${(userInfo as any).access_token}`},
        },
      )
      .then(res => {
        console.log(res.data);
        AsyncStorage.removeItem('userInfo');
        setUserInfo({});
        setIsLoading(false);
      })
      .catch(e => {
        console.log(`logout error ${e}`);
        setIsLoading(false);
      });
  };

  const isLoggedIn = async () => {
    try {
      setSplashLoading(true);
      setIsLoading(true);
      // console.log('is logged in function');
      let userInfo = await AsyncStorage.getItem('userInfo');
      userInfo = JSON.parse(userInfo as string); // Add type assertion here
      if (!userInfo) {
        AsyncStorage.removeItem('userInfo');
        setUserInfo({});
        setIsLoading(false);
        setSplashLoading(false);
        return;
      }
      axios
        .post(`${BASE_URL}/verify`, {
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${(userInfo as any).access_token}`,
          },
          body: {
            token: (userInfo as any).access_token,
          },
        })
        .then(res => {
          console.log('token verified');
          if (res.status !== 200) {
            AsyncStorage.removeItem('userInfo');
            setUserInfo({});
            setIsLoading(false);
            setSplashLoading(false);
            console.log('token expired');
            return;
          }
          console.log('token valid');
          setUserInfo(userInfo || {}); // Handle null case by setting it to an empty object
          // console.log((userInfo as any).access_token);
          setIsLoading(false);
          setSplashLoading(false);
        })
        .catch((e): void => {
          console.log('error', e);
          AsyncStorage.removeItem('userInfo');
          setUserInfo({});
          setIsLoading(false);
          setSplashLoading(false);
        });
      // } else {
      //   AsyncStorage.removeItem('userInfo');
      //   setUserInfo({});
      //   setIsLoading(false);
      //   setSplashLoading(false);
      // }
    } catch (e) {
      setSplashLoading(false);
      console.log(`is logged in error ${e}`);
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
      }}>
      {children}
    </AuthContext.Provider>
  );
};
