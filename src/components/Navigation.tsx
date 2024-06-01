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

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const {userInfo, splashLoading} = useContext<any>(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {splashLoading ? (
          <Stack.Screen
            name="Splash Screen"
            component={SplashScreen}
            options={{headerShown: false}}
          />
        ) : userInfo.access_token ? (
          <Stack.Screen name="Home" component={MainScreen} />
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