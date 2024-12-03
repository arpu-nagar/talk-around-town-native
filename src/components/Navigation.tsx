import React, { useContext } from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { navigationRef } from '../ref/NavigationRef';
import RemoteNotification from '../components/RemoteNotification'; // Add this import

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MainScreen from '../screens/MainScreen';
import AssistantScreen from '../screens/Assistant/MainScreen';

// Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Assistant: undefined;
};

// Navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Icon configuration
const getIconName = (routeName: string, focused: boolean): string => {
  if (routeName === 'Home') {
    return focused ? 'home' : 'home-outline';
  } else if (routeName === 'Assistant') {
    return focused ? 'chatbubbles' : 'chatbubbles-outline';
  }
  return 'alert-circle'; // Fallback icon
};

// Wrapper component to include RemoteNotification
const ScreenWithNotification: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flex: 1 }}>
    {children}
    <RemoteNotification />
  </View>
);

// Tab Navigator
const TabNavigator = () => (
  <ScreenWithNotification>
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getIconName(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Platform.OS === 'ios' ? '#007AFF' : '#6200EE',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingVertical: Platform.OS === 'ios' ? 10 : 0,
          height: Platform.OS === 'ios' ? 88 : 60,
        },
      })}
    >
      <MainTab.Screen name="Home" component={MainScreen} />
      <MainTab.Screen name="Assistant" component={AssistantScreen} />
    </MainTab.Navigator>
  </ScreenWithNotification>
);

// Auth Navigator
const AuthNavigator = () => (
  <ScreenWithNotification>
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  </ScreenWithNotification>
);

// Root Navigator
const RootNavigator = () => {
  const { userInfo, splashLoading } = useContext<AuthContextType>(AuthContext);
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {splashLoading ? (
        <RootStack.Screen name="Splash" component={SplashScreen} />
      ) : userInfo.access_token ? (
        <RootStack.Screen name="Main" component={TabNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

// Main Navigation Component
const Navigation = () => (
  <NavigationContainer ref={navigationRef as React.RefObject<NavigationContainerRef<RootStackParamList>>}>
    <RootNavigator />
  </NavigationContainer>
);

export default Navigation;