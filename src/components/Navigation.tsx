import React, {useContext} from 'react';
import {Text, View} from 'react-native';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen.tsx';
import LoginScreen from '../screens/LoginScreen.tsx';
import RegisterScreen from '../screens/RegisterScreen.tsx';
import {AuthContext} from '../context/AuthContext.tsx';
import SplashScreen from '../screens/SplashScreen.tsx';
import MainScreen from '../screens/MainScreen.tsx';
import {navigationRef} from '../ref/NavigationRef.tsx';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Assistant from '../screens/Assistant/MainScreen.tsx';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {MaterialIcons} from '@expo/vector-icons'
// import material icon
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
const Stack = createNativeStackNavigator();

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'MainScreen') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Assistant') {
            iconName = focused ? 'chat' : 'chat';
          }

          return <MaterialIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="MainScreen" 
        component={MainScreen} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Assistant" 
        component={Assistant} 
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const {userInfo, splashLoading} = useContext<any>(AuthContext);
  return (
    <NavigationContainer ref={navigationRef as any}>
      <Stack.Navigator>
        {splashLoading ? (
          <Stack.Screen
            name="Splash Screen"
            component={SplashScreen}
            options={{headerShown: false}}
          />
        ) : userInfo.access_token ? (
          <>
            <Stack.Screen
              name="TabNavigator"
              component={TabNavigator}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{headerShown: false}}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{headerShown: false}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
