import { Alert, Animated, Dimensions, Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { BottomSheetContext } from "../context/BottomSheetContext";
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth } from '../api/auth';
import Spinner from 'react-native-loading-spinner-overlay';
import { useFocusEffect } from '@react-navigation/native';
// import { FlatList, ScrollView } from "react-native-gesture-handler";
import BottomSheetLocationItem from "./BottomSheetLocationItem";
// import { SwipeableRow } from "./SwipeableRow";
import React from "react";

type LocationList = {
    id: number,
    title: string,
    description: string,
    latitude: number,
    longitude: number,
    address: string
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface LocationBottomSheetProps {
    visible: boolean
    onClose: () => void
}

const LocationBottomSheet: React.FC<LocationBottomSheetProps> = ({
    visible,
    onClose
}) => {
    const { sheetIsOpen, setSheetIsOpen } = useContext(BottomSheetContext);

    const [locationsList, setLocationsList] = useState<LocationList[]>([]);

    const [loading, setLoading] = useState(false);

    const { userInfo } = useContext(AuthContext);

    // Function to fetch locations
    const fetchLocations = async () => {
        try {
            setLoading(true);

            console.log('Fetching locations...');

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
                console.log('Locations response:', data);

                // Check if ids are included in details
                if (data.details && data.details.length > 0) {
                    console.log('First location ID:', data.details[0].id);
                }

                const { details, locations } = data;

                if (Array.isArray(details) && Array.isArray(locations) && details.length === locations.length) {
                    const mergedLocations: LocationList[] = await Promise.all(
                        details.map(async (detail, index) => {
                            const lat = locations[index].latitude;
                            const lng = locations[index].longitude;

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

                    console.log(mergedLocations)

                    setLocationsList(mergedLocations);
                }
            } else {
                console.error('Error fetching locations:', response.status);
            }
        } catch (error) {
            console.error('Exception fetching locations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh locations when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchLocations();
            return () => { };
        }, [userInfo, visible])
    );

    const deleteLocation = async (id: number) => {
        try {
            setLoading(true);

            // Get the ID from locationDetails

            console.log('Attempting to delete location:', {
                id,
            });

            // Check if ID exists
            if (id === undefined) {
                Alert.alert('Error', 'Cannot delete: Missing location ID');
                setLoading(false);
                return;
            }

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
                        id: id
                    }),
                },
            );

            console.log('Delete response status:', response.status);

            let responseData = null;
            try {
                responseData = await response.json();
                console.log('Delete response data:', responseData);
            } catch (e) {
                console.error('Could not parse response JSON:', e);
            }

            // Process response and update UI
            if (response.status >= 200 && response.status < 300) {
                // Update local state to remove the deleted location
                const newLocations = locationsList.filter((loc) => loc.id !== id);
                setLocationsList(newLocations)

                Alert.alert('Success', 'Location deleted successfully');

                // Refresh the locations list to ensure it's up to date
                fetchLocations();
            } else {
                // Construct a more detailed error message
                let errorMessage = 'Failed to delete location';
                if (responseData && responseData.error) {
                    errorMessage = `${responseData.error}`;
                    if (responseData.details) {
                        errorMessage += `\n\nDetails: ${responseData.details}`;
                    }
                    if (responseData.code) {
                        errorMessage += `\n\nCode: ${responseData.code}`;
                    }
                }

                Alert.alert('Error', errorMessage);
            }
        } catch (error) {
            console.error('Exception during deletion:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            Alert.alert('Error', `Failed to delete location: ${errorMessage}`);
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

    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy > 0) {
                    translateY.setValue(gesture.dy);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 100) {
                    // onClose();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    // const handleSheetChange = (index: number) => {
    //     // Update context immediately when sheet starts to close
    //     if (index === -1) {
    //         setSheetIsOpen(false);
    //     } else if (index >= 0) {
    //         setSheetIsOpen(true);
    //     }
    // };

    // // Handle animation start
    // const handleAnimate = (_fromIndex: number, toIndex: number) => {
    //     console.log(_fromIndex, toIndex)
    //     // If closing animation starts, immediately update UI state
    //     if (toIndex === -1) {
    //         setSheetIsOpen(false);
    //     }
    // };

    // return (
    //     <BottomSheet
    //         ref={sheetRef}
    //         index={-1}
    //         snapPoints={["75%"]}
    //         // handleIndicatorStyle={{ display: "none" }}
    //         enablePanDownToClose={true}
    //         // enableContentPanningGesture={true}
    //         // enableHandlePanningGesture={true}
    //         onChange={handleSheetChange}
    //         onAnimate={handleAnimate}
    //     >
    //         <BottomSheetView style={styles.sheetContainer}>
    //             <Text style={styles.sheetTitle}>
    //                 Saved Locations
    //             </Text>

    // <View style={styles.listWrapper}>
    //     <ScrollView>
    //         {locationsList.map((loc, index) => (
    //             <>
    //                 {/* <SwipeableRow
    //                     key={loc.id}
    //                     onDelete={() => deleteLocation(loc.id)}
    //                     bounce={sheetIsOpen && index === 0}
    //                 > */}
    //                     <BottomSheetLocationItem locations={loc} lastItem={locationsList.length === index} />
    //                 {/* </SwipeableRow> */}
    //                 <View style={[styles.separator, index < locationsList.length - 1 && { marginBottom: 16 }]} />
    //             </>
    //         ))}
    //     </ScrollView>
    // </View>
    //         </BottomSheetView>
    //     </BottomSheet>
    // );
    return (
        <Modal visible={visible} transparent animationType="slide" style={styles.sheetContainer}>
            <TouchableWithoutFeedback onPress={() => onClose()}>
                <View style={styles.overlay} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.sheetContainer,
                    { transform: [{ translateY }] },
                ]}
                {...panResponder.panHandlers}
            >
                {locationsList.length === 0 ? (
                    <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={styles.sheetTitle}>No location found</Text>
                    </View>
                ) : (
                    <>
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={styles.sheetTitle}>Saved Locations</Text>
                        </View>
                        <View style={styles.listWrapper}>
                            <ScrollView>
                                {locationsList.map((loc, index) => (
                                    <>
                                        {/* <SwipeableRow
                                    key={loc.id}
                                    onDelete={() => deleteLocation(loc.id)}
                                    bounce={sheetIsOpen && index === 0}
                                > */}
                                        <BottomSheetLocationItem locations={loc} lastItem={locationsList.length === index} onDelete={() => deleteLocation(loc.id)} />
                                        {/* </SwipeableRow> */}
                                        <View style={[styles.separator, index < locationsList.length - 1 && { marginBottom: 16 }]} />
                                    </>
                                ))}
                            </ScrollView>
                        </View>
                    </>
                )}


            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#00000055',
    },
    sheetContainer: {
        padding: 16,
        backgroundColor: "white",
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        height: 0.75 * SCREEN_HEIGHT
    },
    sheetTitle: {
        fontSize: 24,
        fontWeight: "600",
        color: "#4A90E2",
        textAlign: "center",
    },
    listWrapper: {
        backgroundColor: "rgba(74, 144, 226, 0.05)",
        borderRadius: 14,
        padding: 20,
    },
    separator: {
        height: 1,
        backgroundColor: "#d3d3d3",
        marginHorizontal: 0,
        marginTop: 16,
    },
});

export default LocationBottomSheet;