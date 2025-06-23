import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

type LocationList = {
    id: number,
    title: string,
    description: string,
    latitude: number,
    longitude: number,
    address: string
}

interface BottomSheetLocationItemProps {
    locations: LocationList;
    lastItem: boolean
}

const BottomSheetLocationItem: React.FC<BottomSheetLocationItemProps> = ({ locations, lastItem }) => {
    return (
        <View>
            <Text style={styles.titleText}>{locations.title}</Text>
            <Text style={styles.descriptionText}>
                {locations.description === "" ? 'Home' : locations.description}
            </Text>
            <Text style={styles.addressText}>
                {locations.address ?? 'Loading address...'}
            </Text>
            {lastItem && <View style={styles.separator} />}
        </View>
    );
};

const styles = StyleSheet.create({
    titleText: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 14,
        color: "#555",
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: "#333",
    },
    separator: {
        height: 1,
        backgroundColor: "#d3d3d3",
        marginHorizontal: 0,
        marginTop: 16,
        marginBottom: 16
    },
});

export default BottomSheetLocationItem;
