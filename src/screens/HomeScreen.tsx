import React, { useContext } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ route }: { route: any }) => {
  const { userInfo, isLoading, logout } = useContext<any>(AuthContext);
  const { notificationTitle } = route.params || {};
  console.log('notificationTitle:', notificationTitle);
  return (
    <View style={styles.container}>
      <Spinner visible={isLoading} />
      <Text style={styles.welcome}>Hey {userInfo.user.name}, engage with your child with these tips:</Text>
      {/* <Button title="Logout" color="red" onPress={logout} /> */}
      {/* Tips as chat messages */}
      <View style={styles.tipContainer}>
        <Text style={styles.tip}>Tip 1: Tell your child, we are going to learn "Fast, slow, and stop today!" and label each of these speeds on your trip.; Use gestures and the speed of your voice to help our child learn fast, slow, and stop.; Ask your child, "Are we going fast or slow?"</Text>
        <Text style={styles.tip}>Tip 2: Label 💁, "Each house has numbers! Look, that house has the numbers 4-2-3-1."; Ask your child, "Can you point to where the numbers are on another house?" When your child points, say, "Yes, those are numbers they are 5-4-2-3." Give positive attention, and say "Great job!" 👏 ; If your child doesn't point or look, say, "Look, there are the numbers!"</Text>
        <Text style={styles.tip}>Tip 3: While waiting at a stoplight, point to the stoplight in front of you.; Say, 💁 "Look, it's a stoplight! The stoplight is a rectangle. A rectangle has four sides." Count the sides of the rectangle with your child.; Ask your child, "Do you see any other shapes?"; Point to and label other shapes surrounding the area. </Text>
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