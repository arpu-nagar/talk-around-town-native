import React, {useContext, useEffect, useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import {AuthContext} from '../context/AuthContext';

const HomeScreen = ({route}: {route: any}) => {
  const {userInfo, isLoading, logout} = useContext<any>(AuthContext);
  const {notificationTitle} = route.params || {};
  console.log('notificationTitle:', notificationTitle);
  // define a state variable to store tip names and tip descriptions which is an array of size 3
  // create a axios request to fetch the tips from the server
  // store the tips in the state variable
  // display the tips in the UI

  const [tips, setTips] = useState<any>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'http://localhost:1337/api/tips/get-tips',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userInfo.access_token}`,
            },
            body: JSON.stringify({
              type: notificationTitle,
            }),
          },
        );
        const responseJson = await response.json();
        setTips(responseJson);
      } catch (e) {
        console.log(`get-tips error ${e}`);
      }
    };

    fetchData();
  }, []);
  if (tips.length === 0) {
    return (
      <View style={styles.container}>
        <Spinner visible={true} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Hey {userInfo.user.name}, engage with your child with these tips:
      </Text>
      {/* <Button title="Logout" color="red" onPress={logout} /> */}
      {/* Tips as chat messages */}
      <View style={styles.tipContainer}>
        {tips.map((tip: any) => (
          <View key={tip.id}>
            <Text style={styles.tip_title}>
              {' '}
              {'>'} {tip.title}
            </Text>
            <Text style={styles.tip}>{tip.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  welcome: {
    fontSize: 24,
    marginBottom: 8,
    color: 'black',
  },
  tipContainer: {
    marginVertical: 16,
    width: '100%',
  },
  tip_title: {
    fontSize: 22,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tip: {
    backgroundColor: '#4285F4',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    textAlign: 'left',
    fontSize: 18,
  },
});

export default HomeScreen;
