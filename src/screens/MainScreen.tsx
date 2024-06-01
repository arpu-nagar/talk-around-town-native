import React, {useContext, useState} from 'react';
import {View, Text, TextInput, StyleSheet, Pressable, Button} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {LocationContext} from '../context/LocationContext';
import { AuthContext } from '../context/AuthContext';
import Spinner from 'react-native-loading-spinner-overlay';
const MainScreen: React.FC = () => {
  const {location, loading} = useContext(LocationContext)!;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const {userInfo, isLoading, logout} = useContext<any>(AuthContext);
  if (loading) {
    return <Spinner visible={loading} />;
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView style={styles.map} initialRegion={location}>
          <Marker coordinate={location} />
        </MapView>
      )}
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={name}
        onChange={e => setName(e.nativeEvent.text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.nativeEvent.text)}
      />
      <Spinner visible={isLoading} />
      <Text style={styles.welcome}>Welcome {userInfo.user.name}</Text>
      <Button title="Logout" color="red" onPress={logout} />
      <Pressable
        style={styles.button}
        onPress={() => console.log('Add location')}>
        <Text style={styles.buttonText}>Add location</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  map: {
    height: '70%',
  },
  welcome: {
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
  },
});

export default MainScreen;
