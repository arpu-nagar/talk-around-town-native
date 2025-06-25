import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { fetchWithAuth } from '../api/auth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationData {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface CustomBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  userInfo: any;
}

const CustomBottomSheet: React.FC<CustomBottomSheetProps> = ({
  visible,
  onClose,
  userInfo,
}) => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    if (visible) {
      fetchLocations();
      // Animate in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate out
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchLocations = async () => {
    if (!userInfo?.access_token) return;

    try {
      setLoading(true);
      const response = await fetchWithAuth(
        'http://68.183.102.75:1337/endpoint/locations',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          }
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        const { details, locations: coords } = data;

        if (Array.isArray(details) && Array.isArray(coords) && details.length === coords.length) {
          const mergedLocations: LocationData[] = await Promise.all(
            details.map(async (detail, index) => {
              const lat = coords[index].latitude;
              const lng = coords[index].longitude;
              const address = await getAddressFromCoords(lat, lng);

              return {
                id: detail.id,
                title: detail.title,
                description: detail.description ?? '',
                latitude: lat,
                longitude: lng,
                address,
              };
            })
          );

          setLocations(mergedLocations);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBczo2yBRbSwa4IVQagZKNfTje0JJ_HEps`
      );
      const json = await res.json();
      return json.results[0]?.formatted_address || 'Address not found';
    } catch (error) {
      console.error('Geocoding error:', error);
      return 'Address lookup failed';
    }
  };

  const deleteLocation = async (id: number) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetchWithAuth(
                'http://68.183.102.75:1337/endpoint/deleteLocation',
                {
                  method: 'DELETE',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.access_token}`,
                  },
                  body: JSON.stringify({ id }),
                }
              );

              if (response.status >= 200 && response.status < 300) {
                setLocations(prev => prev.filter(loc => loc.id !== id));
                Alert.alert('Success', 'Location deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete location');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete location');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderLocationItem = (location: LocationData, index: number) => (
    <View key={location.id} style={[styles.locationItem, index === locations.length - 1 && styles.lastItem]}>
      <View style={styles.locationContent}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationTitle}>{location.title}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteLocation(location.id)}>
            <MaterialIcons name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.locationDescription}>{location.description}</Text>
        <Text style={styles.locationAddress}>{location.address}</Text>
        
        <View style={styles.coordinates}>
          <Text style={styles.coordinateText}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Saved Locations</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading locations...</Text>
              </View>
            ) : locations.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {locations.map((location, index) => renderLocationItem(location, index))}
                <View style={{ height: 20 }} />
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="location-off" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No Saved Locations</Text>
                <Text style={styles.emptyText}>
                  Search and add locations to see them here
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.75,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A90E2',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  locationItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  lastItem: {
    marginBottom: 0,
  },
  locationContent: {
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  locationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  locationAddress: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 12,
    lineHeight: 20,
  },
  coordinates: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  coordinateText: {
    fontSize: 12,
    color: '#4A90E2',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CustomBottomSheet;