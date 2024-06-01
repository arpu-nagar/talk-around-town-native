import React from 'react';
import {StatusBar, Text, View} from 'react-native';
import Navigation from './src/components/Navigation';
import {AuthProvider} from './src/context/AuthContext';
import {LocationProvider} from './src/context/LocationContext';

const App = () => {
  return (
    <AuthProvider>
      <LocationProvider>
        <StatusBar backgroundColor="#06bcee" />
        <Navigation />
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;
