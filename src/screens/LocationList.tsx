import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Location } from 'react-native-get-location';
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth } from '../api/auth';
import Spinner from 'react-native-loading-spinner-overlay';

type RootStackParamList = {
  LocationList: {
    locations: Location[];
    details: Array<{
      title: string;
      description: string;
      pinColor: string;
    }>;
  };
};

type LocationListScreenProps = {
  route: RouteProp<RootStackParamList, 'LocationList'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'LocationList'>;
};

const LocationListScreen: React.FC<LocationListScreenProps> = ({
  route,
  navigation,
}) => {
  const { locations, details } = route.params;
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [locationsList, setLocationsList] = useState(locations);
  const [locationDetails, setLocationDetails] = useState(details);
  const [loading, setLoading] = useState(false);
  const { userInfo } = useContext(AuthContext);
  
  const initialRegion = locationsList.length > 0 ? {
    latitude: locationsList[0].latitude,
    longitude: locationsList[0].longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : null;

  const handleLocationPress = (index: number) => {
    setSelectedLocation(index);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: locationsList[index].latitude,
        longitude: locationsList[index].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const deleteLocation = async (index: number) => {
    try {
      setLoading(true);
      
      // Get the location to delete
      const locationToDelete = locationsList[index];
      
      // Make the API call to delete the location
      const response = await fetchWithAuth(
        'http://68.183.102.75:1337/endpoint/deleteLocation',
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({
            latitude: locationToDelete.latitude,
            longitude: locationToDelete.longitude,
          }),
        },
      );
      
      // Check response status and handle accordingly
      if (response.status >= 200 && response.status < 300) {
        // Update local state to remove the deleted location
        const newLocations = [...locationsList];
        newLocations.splice(index, 1);
        setLocationsList(newLocations);
        
        const newDetails = [...locationDetails];
        newDetails.splice(index, 1);
        setLocationDetails(newDetails);
        
        // Reset selected location if needed
        if (selectedLocation === index) {
          setSelectedLocation(null);
        } else if (selectedLocation !== null && selectedLocation > index) {
          setSelectedLocation(selectedLocation - 1);
        }
        
        Alert.alert('Success', 'Location deleted successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      Alert.alert('Error', 'Failed to delete location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const mapRef = React.useRef<MapView>(null);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.locationItem,
        selectedLocation === index && styles.selectedLocation
      ]}
      onPress={() => handleLocationPress(index)}
    >
      <View style={styles.locationHeader}>
        <Icon 
          name="location-on" 
          size={24} 
          color={selectedLocation === index ? '#fff' : '#007AFF'} 
        />
        <Text style={[
          styles.locationTitle,
          selectedLocation === index && styles.selectedText
        ]}>
          {locationDetails[index]?.title || `Location ${index + 1}`}
        </Text>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Location',
              'Are you sure you want to delete this location?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  onPress: () => deleteLocation(index),
                  style: 'destructive',
                },
              ],
              { cancelable: true }
            );
          }}
        >
          <Icon 
            name="delete" 
            size={22} 
            color={selectedLocation === index ? '#fff' : '#FF3B30'} 
          />
        </TouchableOpacity>
      </View>
      <Text style={[
        styles.locationDescription,
        selectedLocation === index && styles.selectedText
      ]}>
        {locationDetails[index]?.description || 'No description available'}
      </Text>
      <Text style={[
        styles.coordinates,
        selectedLocation === index && styles.selectedText
      ]}>
        Lat: {item.latitude.toFixed(6)}, Long: {item.longitude.toFixed(6)}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="location-off" size={50} color="#ccc" />
      <Text style={styles.emptyText}>No locations found</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.addButtonText}>Add New Location</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Spinner visible={loading} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Locations</Text>
      </View>

      {initialRegion && locationsList.length > 0 ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={initialRegion}
          >
            {locationsList.map((location, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={locationDetails[index]?.title || `Location ${index + 1}`}
                description={locationDetails[index]?.description}
                pinColor={selectedLocation === index ? '#007AFF' : '#FF3B30'}
                onPress={() => setSelectedLocation(index)}
              />
            ))}
          </MapView>
        </View>
      ) : null}

      <FlatList
        data={locationsList}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        style={styles.list}
        ListEmptyComponent={renderEmptyList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.4,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  locationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedLocation: {
    backgroundColor: '#007AFF',
  },
  selectedText: {
    color: 'white',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  locationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationListScreen;
