'use strict';
import {
  StatusBar,
} from 'react-native';
import Navigation from './src/components/Navigation';
import {AuthProvider} from './src/context/AuthContext';
import {LocationProvider} from './src/context/LocationContext';
import React from 'react';

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
