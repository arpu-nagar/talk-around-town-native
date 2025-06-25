import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25; // 25% of screen width
const DELETE_BUTTON_WIDTH = 100;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  bounce?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  bounce = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (bounce) {
      // Bounce animation for the first item when sheet opens
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [bounce]);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX < -SWIPE_THRESHOLD) {
        // Swipe to reveal delete button
        Animated.spring(translateX, {
          toValue: -DELETE_BUTTON_WIDTH,
          useNativeDriver: true,
        }).start();
      } else {
        // Snap back to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Snap back to original position
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Animate out then delete
            Animated.timing(translateX, {
              toValue: -screenWidth,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              onDelete();
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Delete button background */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.row,
            {
              transform: [
                { translateX },
                { scale },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  row: {
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: DELETE_BUTTON_WIDTH,
    height: '100%',
    borderRadius: 8,
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SwipeableRow;