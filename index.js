/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import BackgroundFetch from 'react-native-background-fetch';

// Configure background fetch
BackgroundFetch.configure(
  {
    minimumFetchInterval: 1, // Minimum interval in minutes
    stopOnTerminate: false, // Keep running in the background
  },
  async () => {
    // Perform background tasks here
    console.log('hey')
    const response = await fetch('http://localhost:1337/endpoint/locations');
    const newData = await response.json();
    console.log('New data:', newData);
    console.log('Background fetch executed');
    BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
  },
  error => {
    console.error('Background fetch error:', error);
  },
);
AppRegistry.registerComponent(appName, () => App);
