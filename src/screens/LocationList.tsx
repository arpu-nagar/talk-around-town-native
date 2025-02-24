// import {RouteProp} from '@react-navigation/native';
// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   SafeAreaView,
//   TouchableOpacity,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import {NativeStackNavigationProp} from '@react-navigation/native-stack';
// import {Location} from 'react-native-get-location';

// type RootStackParamList = {
//   LocationList: {
//     locations: Location[];
//     details: Array<{
//       title: string;
//       description: string;
//       pinColor: string;
//     }>;
//   };
// };

// type LocationListScreenProps = {
//   route: RouteProp<RootStackParamList, 'LocationList'>;
//   navigation: NativeStackNavigationProp<RootStackParamList, 'LocationList'>;
// };

// const LocationListScreen: React.FC<LocationListScreenProps> = ({
//   route,
//   navigation,
// }) => {
//   const {locations, details} = route.params;
//   React.useEffect(() => {
//     console.log('LocationListScreen');
//     console.log();
//   }, []);
//   const renderItem = ({item, index}: {item: any; index: number}) => (
//     <View style={styles.locationItem}>
//       <View style={styles.locationHeader}>
//         <Icon name="location-on" size={24} color="#007AFF" />
//         <Text style={styles.locationTitle}>
//           {details[index]?.title || `Location ${index + 1}`}
//         </Text>
//       </View>
//       <Text style={styles.locationDescription}>
//         {details[index]?.description || 'No description available'}
//       </Text>
//       <Text style={styles.coordinates}>
//         Lat: {item.latitude.toFixed(6)}, Long: {item.longitude.toFixed(6)}
//       </Text>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}>
//           <Icon name="arrow-back" size={24} color="#007AFF" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>All Locations</Text>
//       </View>
//       <FlatList
//         data={locations}
//         renderItem={renderItem}
//         keyExtractor={(_, index) => index.toString()}
//         contentContainerStyle={styles.listContainer}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f0f2f5',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   backButton: {
//     marginRight: 16,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1a1a1a',
//   },
//   listContainer: {
//     padding: 16,
//   },
//   locationItem: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   locationHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   locationTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1a1a1a',
//     marginLeft: 8,
//   },
//   locationDescription: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 8,
//   },
//   coordinates: {
//     fontSize: 12,
//     color: '#999',
//     fontFamily: 'monospace',
//   },
// });

// export default LocationListScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Location } from 'react-native-get-location';

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
  
  const initialRegion = locations.length > 0 ? {
    latitude: locations[0].latitude,
    longitude: locations[0].longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : null;

  const handleLocationPress = (index: number) => {
    setSelectedLocation(index);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: locations[index].latitude,
        longitude: locations[index].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
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
          {details[index]?.title || `Location ${index + 1}`}
        </Text>
      </View>
      <Text style={[
        styles.locationDescription,
        selectedLocation === index && styles.selectedText
      ]}>
        {details[index]?.description || 'No description available'}
      </Text>
      <Text style={[
        styles.coordinates,
        selectedLocation === index && styles.selectedText
      ]}>
        Lat: {item.latitude.toFixed(6)}, Long: {item.longitude.toFixed(6)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Locations</Text>
      </View>

      {initialRegion && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={initialRegion}
          >
            {locations.map((location, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={details[index]?.title || `Location ${index + 1}`}
                description={details[index]?.description}
                pinColor={selectedLocation === index ? '#007AFF' : '#FF3B30'}
              />
            ))}
          </MapView>
        </View>
      )}

      <FlatList
        data={locations}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        style={styles.list}
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
});

export default LocationListScreen;
