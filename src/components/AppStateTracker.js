// src/components/AppStateTracker.js
import React, { useEffect, useRef, useState, useContext } from 'react';
import { AppState, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const AppStateTracker = () => {
  const appState = useRef(AppState.currentState);
  const [sessionId, setSessionId] = useState(null);
  const { userInfo } = useContext(AuthContext);
  
  const API_URL = 'http://68.183.102.75:1337'; 
  
  // Run this effect when userInfo changes (user logs in or out)
  useEffect(() => {
    // If user logs in, start a session
    if (userInfo?.access_token) {
      console.log("User authenticated - starting session tracking");
      recordSessionStart();
    } else if (sessionId) {
      // If user logs out but we have an active session, end it
      console.log("User logged out - ending active session");
      recordSessionEnd();
    }
  }, [userInfo]);
  
  // This effect handles app state changes
  useEffect(() => {
    console.log("AppStateTracker mounted");
    
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log("App state changed:", appState.current, "->", nextAppState);
      
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' &&
        userInfo?.access_token
      ) {
        // App has come to foreground and user is logged in
        console.log("App came to foreground - starting new session");
        recordSessionStart();
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/) &&
        sessionId
      ) {
        // App has gone to background and we have an active session
        console.log("App went to background - ending session", sessionId);
        recordSessionEnd();
      }
      
      appState.current = nextAppState;
    });
    
    // Clean up on component unmount
    return () => {
      console.log("AppStateTracker unmounting");
      subscription.remove();
      if (sessionId) {
        recordSessionEnd();
      }
    };
  }, [sessionId, userInfo]);
  
  const recordSessionStart = async () => {
    try {
      if (!userInfo?.access_token) {
        console.log("No access token, can't start session");
        return;
      }
      
      const deviceInfo = `${Platform.OS} ${Platform.Version}`;
      console.log("Recording session start:", deviceInfo);
      
      const response = await fetch(`${API_URL}/endpoint/session/start`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify({ device_info: deviceInfo }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Session started:", data);
      
      if (data.session_id) {
        setSessionId(data.session_id);
      }
    } catch (error) {
      console.error('Error recording session start:', error);
    }
  };
  
  const recordSessionEnd = async () => {
    try {
      if (!userInfo?.access_token || !sessionId) {
        console.log("No access token or session ID, can't end session");
        return;
      }
      
      console.log("Recording session end for ID:", sessionId);
      
      const response = await fetch(`${API_URL}/endpoint/session/end`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Session ended:", data);
      
      setSessionId(null);
    } catch (error) {
      console.error('Error recording session end:', error);
    }
  };
  
  return null; // This component doesn't render anything
};

export default AppStateTracker;