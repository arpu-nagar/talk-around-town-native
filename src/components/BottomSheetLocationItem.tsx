import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LocationData {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface BottomSheetLocationItemProps {
  locations: LocationData; // Note: This should probably be 'location' for better naming
  lastItem?: boolean;
  onPress?: () => void;
}

const BottomSheetLocationItem: React.FC<BottomSheetLocationItemProps> = ({
  locations,
  lastItem = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, lastItem && styles.lastItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {locations.title}
          </Text>
          <View style={styles.coordinates}>
            <Text style={styles.coordinateText}>
              {locations.latitude.toFixed(4)}, {locations.longitude.toFixed(4)}
            </Text>
          </View>
        </View>
        
        {locations.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {locations.description}
          </Text>
        ) : null}
        
        <Text style={styles.address} numberOfLines={2}>
          {locations.address}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lastItem: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  coordinates: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coordinateText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#4A90E2',
    lineHeight: 20,
  },
});

export default BottomSheetLocationItem;