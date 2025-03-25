import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {MaterialIcons} from '@expo/vector-icons';

const {width} = Dimensions.get('window');

interface PlacesAutocompleteInputProps {
  placeholder?: string;
  apiKey: string;
  onPlaceSelect?: (place: any) => void;
}

const PlacesAutocompleteInput: React.FC<PlacesAutocompleteInputProps> = ({
  placeholder = 'Search for a location',
  apiKey,
  onPlaceSelect = (place: any) => {},
}) => {
  const [input, setInput] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false); // Flag to track selection in progress
  const [optionSelected, setOptionSelected] = useState(false); // New state to track if option was selected
  const [inputChanged, setInputChanged] = useState(false); // New state to track if input has changed after selection
  const scrollViewRef = useRef(null);
  const inputRef = useRef<TextInput>(null);

  interface PlacePrediction {
    place: string;
    placeId: string;
    text: {
      text: string;
    };
    structuredFormat: {
      mainText: {
        text: string;
      };
      secondaryText: {
        text: string;
      };
    };
    types: string[];
  }

  // In a real app, this would be an actual API call
  const fetchPredictions = (input: any) => {
    setIsLoading(true);

    // Simulate API delay
    setTimeout(async () => {
      // Filter results based on input text for demo
      try {
        // API call to fetch predictions based on input
        // console.log('API KEY:', apiKey);
        const response = await fetch(
          'https://places.googleapis.com/v1/places:autocomplete',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
            },
            body: JSON.stringify({
              input,
            }),
          },
        );
        const data = await response.json();
        // data = {"suggestions": [{"placePrediction": [Object]}, {"placePrediction": [Object]}, {"placePrediction": [Object]}, {"placePrediction": [Object]}, {"placePrediction": [Object]}]}
        // get all preditions out
        if (data.suggestions) {
          const predictions = data.suggestions.map(
            (suggestion: any) => suggestion.placePrediction,
          );
          // tslint:disable-next-line: no-unsafe-any
          setPredictions(predictions);
        }
      } catch (e) {
        console.log(e);
      }

      setIsLoading(false);
    }, 300);
  };

  // Handle input changes
  const handleInputChange = (text: string) => {
    setInput(text);

    // If user has selected an option and now changes the input,
    // mark that input has changed after selection
    if (optionSelected) {
      setInputChanged(true);
    }
  };

  useEffect(() => {
    // Only fetch and show results if we're not currently in the process of selecting an item
    // and the input is at least 2 characters
    if (input.length >= 2 && !isSelecting) {
      fetchPredictions(input);
      setShowResults(true);
    } else if (input.length < 2) {
      setPredictions([]);
      setShowResults(false);
    }
  }, [input, isSelecting]);

  const handleClear = () => {
    setInput('');
    setPredictions([]);
    setShowResults(false);
    setOptionSelected(false);
    setInputChanged(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const fetchCoordinates = async (placeId: any) => {
    try {
      // If Places API didn't return location, fall back to Geocoding API
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${apiKey}`,
      );

      const geocodeData = await geocodeResponse.json();

      if (
        geocodeData.status === 'OK' &&
        geocodeData.results &&
        geocodeData.results[0]?.geometry?.location
      ) {
        const location = geocodeData.results[0].geometry.location;
        const locationData = {
          latitude: location.lat,
          longitude: location.lng,
        };

        console.log;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      throw new Error('Could not retrieve coordinates from either API');
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      throw error;
    }
  };

  const handleSelect = (prediction: any) => {
    // Set the isSelecting flag to prevent dropdown from showing again
    setIsSelecting(true);

    const placeData = prediction;
    setInput(
      prediction.structuredFormat.mainText.text +
        ', ' +
        prediction.structuredFormat.secondaryText.text,
    );

    // Mark that an option has been selected and reset inputChanged
    setOptionSelected(true);
    setInputChanged(false);

    // Immediately hide results
    setShowResults(false);

    // fetch coordinates using placeId
    fetchCoordinates(placeData.placeId)
      .then(coordinates => {
        console.log('Latitude:', coordinates.latitude);
        console.log('Longitude:', coordinates.longitude);
        onPlaceSelect({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });

        // Reset the selecting flag after everything is done
        setTimeout(() => {
          setIsSelecting(false);
        }, 300);
      })
      .catch(error => {
        console.error('Failed to get coordinates:', error);
        setIsSelecting(false); // Reset flag on error
      });
  };

  // Toggle dropdown visibility only when input is tapped
  const handleInputFocus = () => {
    // Only show results on focus if there's meaningful input
    // and we're not in the middle of a selection
    if (input.length >= 2 && !isSelecting) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Optional: You could hide results on blur if needed
    // setShowResults(false);
  };

  // Determine whether to show the clear button
  const shouldShowClearButton = () => {
    return input.length > 0 && (!optionSelected || inputChanged);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Search Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#757575"
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          value={input}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoCapitalize="none"
          returnKeyType="search"
        />

        {
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#757575" />
          </TouchableOpacity>
        }
      </View>

      {/* Results List */}
      {shouldShowClearButton() && showResults && !isSelecting && (
        <View style={styles.resultsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0066FF" />
            </View>
          ) : predictions?.length > 0 ? (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              {predictions.map(suggestion => {
                // tslint:disable-next-line: no-unsafe-any
                const prediction = suggestion;
                return (
                  <TouchableOpacity
                    key={prediction.placeId}
                    style={styles.predictionItem}
                    onPress={() => handleSelect(suggestion)}>
                    <Text>
                      {suggestion.structuredFormat.mainText.text +
                        ', ' +
                        suggestion.structuredFormat.secondaryText.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 2,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
    height: Platform.OS === 'ios' ? 24 : 40,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: 280,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  predictionIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  predictionTextContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 14,
    color: '#757575',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#757575',
  },
});

interface AppProps {
  onLocationChange: (place: any) => void;
  //   onLocationSelected?: () => void;
}

const App = ({onLocationChange}: AppProps) => {
  const handlePlaceSelect = (place: any) => {
    console.log('trigger onLocationChange');
    onLocationChange(place);
  };

  return (
    <PlacesAutocompleteInput
      onPlaceSelect={handlePlaceSelect}
      placeholder="Search for a location"
      apiKey="AIzaSyBczo2yBRbSwa4IVQagZKNfTje0JJ_HEps"
    />
  );
};

export default App;
