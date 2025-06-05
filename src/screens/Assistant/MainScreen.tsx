// import React, {
//   useState,
//   useCallback,
//   useEffect,
//   useRef,
//   useContext,
// } from 'react';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ScrollView,
//   TextInput,
//   SafeAreaView,
//   ActivityIndicator,
//   Modal,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import LinearGradient from 'react-native-linear-gradient';
// import Voice from '@react-native-voice/voice';
// import Sound from 'react-native-sound';
// import {Platform, PermissionsAndroid} from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Loader from './Loader';
// import ChildInfoModal from '../ChildInfoModal';
// import {AuthContext, AuthContextType} from '../../context/AuthContext';
// import { useChildrenInfo } from '../../hooks/useChildrenInfo';
// import { Child } from '../../services/ChildrenInfoService';

// interface Tip {
//   id: number;
//   title: string;
//   body: string;
//   details: string;
//   audioUrl: string;
//   categories?: string[];
// }

// const calculateAge = (dateOfBirth: string): number => {
//   const today = new Date();
//   const birthDate = new Date(dateOfBirth);
//   let age = today.getFullYear() - birthDate.getFullYear();
//   const monthDiff = today.getMonth() - birthDate.getMonth();

//   if (
//     monthDiff < 0 ||
//     (monthDiff === 0 && today.getDate() < birthDate.getDate())
//   ) {
//     age--;
//   }
//   return age;
// };

// const detectChildNameInQuery = (query: string, childrenInfo: Child[]) => {
//   if (!childrenInfo || childrenInfo.length === 0) {
//     return null;
//   }
  
//   const normalizedQuery = query.toLowerCase();
  
//   for (const child of childrenInfo) {
//     const nickname = child.nickname?.toLowerCase();
    
//     if (!nickname) continue;
    
//     const patterns = [
//       ` for ${nickname}`,
//       ` ${nickname}'s `,
//       ` ${nickname} `,
//       `^${nickname} `,
//       ` ${nickname}$`,
//       `^${nickname}$`
//     ];
    
//     if (patterns.some(pattern => normalizedQuery.match(pattern))) {
//       return child;
//     }
//   }
  
//   return null;
// };

// const API_BASE_URL = 'http://68.183.102.75:4000';
// const CRUD_API_BASE_URL = 'http://68.183.102.75:1337';

// const RatingButtons: React.FC<{tipId: number}> = ({tipId}) => {
//   const [rating, setRating] = useState<'up' | 'down' | null>(null);
//   const [repeatPreference, setRepeatPreference] = useState<boolean | null>(null);

//   const handleRating = async (type: 'up' | 'down') => {
//     try {
//       const response = await fetch(`${CRUD_API_BASE_URL}/rate`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           tipId,
//           rating: type,
//         }),
//       });

//       if (response.ok) {
//         setRating(type);
//         const shouldRepeat = type === 'up';
//         setRepeatPreference(shouldRepeat);
//         handleRepeatPreference(shouldRepeat);
//       }
//     } catch (error) {
//       console.error('Error sending rating:', error);
//       Alert.alert('Error', 'Failed to submit rating. Please try again.');
//     }
//   };

//   const handleRepeatPreference = async (shouldRepeat: boolean) => {
//     try {
//       const response = await fetch(
//         `${CRUD_API_BASE_URL}/set-repeat-preference`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             tipId,
//             shouldRepeat,
//           }),
//         },
//       );

//       if (!response.ok) {
//         throw new Error('Failed to set repeat preference');
//       }
//     } catch (error) {
//       console.error('Error setting repeat preference:', error);
//       Alert.alert('Error', 'Failed to save preference. Please try again.');
//     }
//   };

//   return (
//     <View style={styles.ratingContainer}>
//       <TouchableOpacity
//         style={[styles.ratingButton, rating === 'up' && styles.ratingActive]}
//         onPress={() => handleRating('up')}>
//         <Icon
//           name="thumb-up"
//           size={20}
//           color={rating === 'up' ? '#007AFF' : '#666'}
//         />
//         <Text
//           style={[
//             styles.ratingText,
//             rating === 'up' && styles.ratingTextActive,
//           ]}>
//           Liked it!
//         </Text>
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={[styles.ratingButton, rating === 'down' && styles.ratingActive]}
//         onPress={() => handleRating('down')}>
//         <Icon
//           name="thumb-down"
//           size={20}
//           color={rating === 'down' ? '#FF3B30' : '#666'}
//         />
//         <Text
//           style={[
//             styles.ratingText,
//             rating === 'down' && styles.ratingTextActive,
//           ]}>
//           Not Helpful
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const MainScreen: React.FC = () => {
//   const navigation = useNavigation();
//   const [isListening, setIsListening] = useState(false);
//   const [searchText, setSearchText] = useState('');
//   const [tips, setTips] = useState<Tip[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
//   const [showAgePrompt, setShowAgePrompt] = useState(false);
//   const [lastQuery, setLastQuery] = useState('');
//   const [hasSearched, setHasSearched] = useState(false);
//   const [showChildInfo, setShowChildInfo] = useState(false);
//   const [contentPreferences, setContentPreferences] = useState<string[]>(['language']);
//   const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);

//   const { userInfo, isLoading: contextLoading, isAdmin } = useContext<AuthContextType>(AuthContext);
//   const currentSound = useRef<Sound | null>(null);
//   const lastResult = useRef<string>('');

//   // Use the enhanced children info hook
//   const {
//     children: childrenInfo,
//     isLoading: childrenLoading,
//     error: childrenError,
//     isFromCache: childrenFromCache,
//     fetchChildren,
//     updateChildren,
//     clearError: clearChildrenError,
//     retryFetch: retryChildrenFetch,
//     needsProfileCompletion,
//   } = useChildrenInfo();

//   const navigateToSettings = () => {
//     // @ts-ignore
//     navigation.navigate('Settings');
//   };

//   // Enhanced fetchContentPreferences with better debugging
//   const fetchContentPreferences = useCallback(async () => {
//     try {
//       setIsPreferencesLoading(true);
//       console.log('Fetching content preferences...');
      
//       const savedPreferences = await AsyncStorage.getItem('contentPreferences');
//       console.log('Raw stored preferences:', savedPreferences);
      
//       if (savedPreferences) {
//         const parsedPreferences = JSON.parse(savedPreferences);
//         console.log('Parsed preferences:', parsedPreferences);
        
//         // Ensure we have a valid array
//         if (Array.isArray(parsedPreferences) && parsedPreferences.length > 0) {
//           setContentPreferences(parsedPreferences);
//           console.log('Set content preferences to:', parsedPreferences);
//         } else {
//           console.log('Invalid preferences array, using default: [language]');
//           setContentPreferences(['language']);
//         }
//       } else {
//         console.log('No saved preferences found, using default: [language]');
//         setContentPreferences(['language']);
//       }
//     } catch (error) {
//       console.error('Error loading content preferences:', error);
//       setContentPreferences(['language']);
//     } finally {
//       setIsPreferencesLoading(false);
//     }
//   }, []);

//   // Use useFocusEffect to refresh preferences when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       console.log('Screen focused, refreshing content preferences...');
//       fetchContentPreferences();
//     }, [fetchContentPreferences])
//   );

//   // Also load preferences on mount (fallback)
//   useEffect(() => {
//     fetchContentPreferences();
//   }, [fetchContentPreferences]);

//   const initializeVoice = async () => {
//     try {
//       await requestMicrophonePermission();
//       Voice.onSpeechResults = onSpeechResults;
//       Voice.onSpeechError = onSpeechError;
//       Voice.onSpeechEnd = () => {
//         if (isListening) {
//           Voice.start('en-US');
//         }
//       };
//     } catch (error) {
//       console.error('Failed to initialize voice:', error);
//     }
//   };

//   const cleanupVoice = () => {
//     Voice.destroy().then(Voice.removeAllListeners);
//   };

//   const cleanupSound = () => {
//     if (currentSound.current) {
//       currentSound.current.stop();
//       currentSound.current.release();
//       currentSound.current = null;
//     }
//     setIsPlaying(false);
//     setActiveAudioIndex(null);
//   };

//   const requestMicrophonePermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//           {
//             title: 'Microphone Permission',
//             message: 'This app needs access to your microphone for voice recognition.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           },
//         );
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           Alert.alert(
//             'Permission Denied',
//             'Voice recognition requires microphone access',
//           );
//         }
//       } catch (err) {
//         Alert.alert('Error', 'Failed to request microphone permission');
//         console.error(err);
//       }
//     }
//   };

//   const onSpeechResults = (e: any) => {
//     if (e.value && e.value[0]) {
//       const newResult = e.value[0];
//       if (newResult !== lastResult.current) {
//         lastResult.current = newResult;
//         setSearchText(newResult);
//       }
//     }
//   };

//   const onSpeechError = (e: any) => {
//     console.error('Speech recognition error:', e);
//     if (isListening) {
//       Voice.start('en-US').catch(error => {
//         console.error('Failed to restart voice recognition:', error);
//         setIsListening(false);
//         Alert.alert(
//           'Error',
//           'Failed to restart voice recognition. Please try again.',
//         );
//       });
//     }
//   };

//   const toggleListening = async () => {
//     try {
//       if (isListening) {
//         await Voice.stop();
//         setIsListening(false);
//         if (searchText.trim()) {
//           await getTips(searchText);
//         }
//         lastResult.current = '';
//       } else {
//         const isAvailable = await Voice.isAvailable();
//         if (isAvailable) {
//           setSearchText('');
//           lastResult.current = '';
//           await Voice.start('en-US');
//           setIsListening(true);
//         } else {
//           Alert.alert(
//             'Error',
//             'Voice recognition is not available on this device.',
//           );
//         }
//       }
//     } catch (error) {
//       console.error('Voice toggle error:', error);
//       Alert.alert('Error', 'Failed to toggle voice recognition');
//       setIsListening(false);
//     }
//   };

//   useEffect(() => {
//     initializeVoice();
//     return () => {
//       cleanupVoice();
//       cleanupSound();
//     };
//   }, []);

//   const speakTip = useCallback(async (audioUrl: string, index: number) => {
//     cleanupSound();

//     setIsPlaying(true);
//     setActiveAudioIndex(index);

//     const fullAudioUrl = `${API_BASE_URL}/audio${audioUrl}`;

//     currentSound.current = new Sound(fullAudioUrl, '', error => {
//       if (error) {
//         console.error('Failed to load sound:', error);
//         Alert.alert('Error', 'Failed to play audio. Please try again.');
//         cleanupSound();
//         return;
//       }

//       currentSound.current?.play(success => {
//         if (!success) {
//           Alert.alert('Error', 'Audio playback failed. Please try again.');
//         }
//         cleanupSound();
//       });
//     });
//   }, []);

//   const renderTipItem = (tip: Tip, index: number) => (
//     <View key={index} style={styles.tipItem}>
//       <LinearGradient
//         colors={['#ffffff', '#f8f9fa']}
//         style={styles.tipGradient}>
//         <View style={styles.tipHeader}>
//           <Icon
//             name="lightbulb"
//             size={24}
//             color="#FFA726"
//             style={styles.tipIcon}
//           />
//           <Text style={styles.tipTitle}>{tip.title}</Text>
//         </View>
//         {tip.categories && tip.categories.length > 0 && renderCategoryBadges(tip.categories)}
//         <Text style={styles.tipBody}>{tip.body}</Text>
//         <Text style={styles.tipDetails}>{tip.details}</Text>
//         <View style={styles.buttonContainerGap}>
//           <TouchableOpacity
//             style={[
//               styles.playButton,
//               activeAudioIndex === index && isPlaying && styles.stopButton,
//             ]}
//             onPress={() => {
//               if (activeAudioIndex === index && isPlaying) {
//                 cleanupSound();
//               } else {
//                 speakTip(tip.audioUrl, index);
//               }
//             }}>
//             <Icon
//               name={
//                 activeAudioIndex === index && isPlaying ? 'stop' : 'play-arrow'
//               }
//               size={20}
//               color="white"
//             />
//             <Text style={styles.buttonText}>
//               {activeAudioIndex === index && isPlaying ? 'Stop' : 'Play Audio'}
//             </Text>
//           </TouchableOpacity>
//           <RatingButtons tipId={tip.id} />
//         </View>
//       </LinearGradient>
//     </View>
//   );

//   const getTips = async (query = searchText) => {
//     if (!query.trim()) {
//       Alert.alert(
//         'Input Required',
//         'Please enter a question or use voice input'
//       );
//       return;
//     }
  
//     // Enhanced child name detection with better error handling
//     const detectedChild = detectChildNameInQuery(query, childrenInfo);
    
//     if (detectedChild) {
//       const age = calculateAge(detectedChild.date_of_birth);
//       query = `${query} for ${age} year old`;
//       console.log(`Detected child: ${detectedChild.nickname}, age: ${age}`);
//     }
  
//     setIsLoading(true);
//     try {
//       console.log('Sending request with preferences:', contentPreferences);
      
//       const response = await fetch(`${API_BASE_URL}/generate-tips`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ 
//           prompt: query, 
//           contentPreferences: contentPreferences
//         }),
//       });
  
//       if (!response.ok) {
//         const errorData = await response.json();
//         if (errorData.error === 'age_required') {
//           setLastQuery(query);
//           setShowAgePrompt(true);
//           return;
//         }
//         throw new Error(`Server responded with ${response.status}`);
//       }
  
//       const data = await response.json();
//       setTips(data.tips);
//       setHasSearched(true);
//     } catch (error) {
//       console.error('Error fetching tips:', error);
//       Alert.alert(
//         'Error',
//         'Failed to fetch tips. Please check your connection and try again.'
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const renderCategoryBadges = (categories: string[] = []) => {
//     if (!categories || categories.length === 0) return null;
    
//     return (
//       <View style={styles.categoryContainer}>
//         {categories.map((category, index) => (
//           <View 
//             key={index}
//             style={[
//               styles.categoryBadge,
//               { backgroundColor: category === 'language' ? '#007AFF' : '#34C759' }
//             ]}
//           >
//             <Text style={styles.categoryText}>
//               {category === 'language' ? 'Language' : 'Science'}
//             </Text>
//           </View>
//         ))}
//       </View>
//     );
//   };

//   // Enhanced ContentPreferenceBanner with better debugging and logic
//   const ContentPreferenceBanner = () => {
//     if (isPreferencesLoading) return null;
    
//     console.log('Rendering ContentPreferenceBanner with preferences:', contentPreferences);
    
//     let focusText = '';
//     let backgroundColor = '#E3F2FD'; // Default blue
//     let textColor = '#0D47A1';
    
//     // Enhanced logic to handle all cases
//     if (contentPreferences.includes('language') && contentPreferences.includes('science')) {
//       focusText = 'Language & Science';
//       backgroundColor = '#E8F5E8'; // Light green
//       textColor = '#2E7D2E';
//     } else if (contentPreferences.includes('language') && !contentPreferences.includes('science')) {
//       focusText = 'Language Development';
//       backgroundColor = '#E3F2FD'; // Light blue
//       textColor = '#0D47A1';
//     } else if (contentPreferences.includes('science') && !contentPreferences.includes('language')) {
//       focusText = 'Science Skills';
//       backgroundColor = '#E8F5E8'; // Light green
//       textColor = '#2E7D2E';
//     } else if (contentPreferences.length === 0) {
//       focusText = 'No Focus Selected';
//       backgroundColor = '#FFF3CD'; // Light yellow
//       textColor = '#856404';
//     } else {
//       // Any other preferences that are not language or science
//       focusText = 'General Tips';
//       backgroundColor = '#F3E5F5'; // Light purple
//       textColor = '#7B1FA2';
//     }
    
//     console.log('Computed focus text:', focusText);
    
//     return (
//       <View style={[styles.preferenceBanner, { backgroundColor }]}>
//         <Icon name="school" size={16} color={textColor} style={styles.bannerIcon} />
//         <Text style={[styles.bannerText, { color: textColor }]}>
//           Focus: <Text style={styles.bannerHighlight}>{focusText}</Text>
//         </Text>
//         <TouchableOpacity 
//           onPress={() => {
//             console.log('Navigating to ContentSelection...');
//             // @ts-ignore
//             navigation.navigate('ContentSelection');
//           }}
//           style={[styles.bannerButton, { backgroundColor: `${textColor}20` }]}
//         >
//           <Text style={[styles.bannerButtonText, { color: textColor }]}>Change</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   // Enhanced children info status banner
//   // const ChildrenInfoBanner = () => {
//   //   if (childrenLoading || !childrenError) return null;
    
//   //   return (
//   //     <View style={styles.childrenErrorBanner}>
//   //       <Icon name="warning" size={16} color="#FF9500" style={styles.bannerIcon} />
//   //       <Text style={styles.childrenErrorText}>
//   //         {childrenFromCache ? 'Using cached children info' : 'Failed to load children info'}
//   //       </Text>
//   //       <TouchableOpacity onPress={retryChildrenFetch} style={styles.bannerButton}>
//   //         <Text style={styles.bannerButtonText}>Retry</Text>
//   //       </TouchableOpacity>
//   //     </View>
//   //   );
//   // };

//   const handleRetry = () => {
//     if (searchText.trim()) {
//       getTips(searchText);
//     }
//   };

//   const handleAgeSubmit = (age: string) => {
//     setShowAgePrompt(false);
//     const queryWithAge = `${lastQuery} for ${age} year old`;
//     setSearchText(queryWithAge);
//     getTips(queryWithAge);
//   };

//   // Fixed: Create wrapper function that matches ChildInfoModal interface
//   const handleChildInfoClose = () => {
//     setShowChildInfo(false);
//     clearChildrenError();
//   };

//   const handleChildrenUpdateWrapper = () => {
//     // This function will be called by ChildInfoModal after it updates children
//     // The actual update logic is handled by the ChildInfoModal itself
//     // We just need to refresh our data after the modal closes
//     fetchChildren(true); // Force refresh after update
//   };

//   const AgePromptModal = () => (
//     <Modal visible={showAgePrompt} transparent={true} animationType="slide">
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <Text style={styles.modalTitle}>Select Child</Text>
//           <Text style={styles.modalText}>
//             Please select which child you're asking about:
//           </Text>
//           {childrenInfo.map(child => {
//             const age = calculateAge(child.date_of_birth);
//             return (
//               <TouchableOpacity
//                 key={child.id}
//                 style={styles.ageButton}
//                 onPress={() => handleAgeSubmit(age.toString())}>
//                 <Text style={styles.ageButtonText}>
//                   {child.nickname || `Child ${child.id}`} ({age} year
//                   {age !== 1 ? 's' : ''} old)
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={() => setShowAgePrompt(false)}>
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <LinearGradient colors={['#f0f2f5', '#ffffff']} style={styles.container}>
//         <View style={styles.headerContainer}>
//           <Text style={styles.headerTitle}>Parenting Assistant</Text>
//           <Text style={styles.headerSubtitle}>Ask any parenting question</Text>
//         </View>
        
//         <ContentPreferenceBanner />
//         {/* <ChildrenInfoBanner /> */}
        
//         <View style={styles.searchContainer}>
//           <View style={styles.searchWrapper}>
//             <Icon
//               name="search"
//               size={20}
//               color="#666"
//               style={styles.searchIcon}
//             />
//             <TextInput
//               style={styles.searchInput}
//               value={searchText}
//               onChangeText={setSearchText}
//               placeholder={
//                 isListening ? 'Listening...' : 'Ask a parenting question...'
//               }
//               returnKeyType="search"
//               onSubmitEditing={() => getTips()}
//               editable={!isListening}
//               placeholderTextColor="#999"
//             />
//           </View>
//           <TouchableOpacity
//             style={[styles.micButton, isListening && styles.micButtonActive]}
//             onPress={toggleListening}>
//             <Icon
//               name={isListening ? 'mic-off' : 'mic'}
//               size={24}
//               color="white"
//             />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={[styles.searchButton, styles.buttonFlex]}
//             onPress={() => getTips()}
//             disabled={isLoading || isListening}>
//             {isLoading ? (
//               <ActivityIndicator color="white" />
//             ) : (
//               <>
//                 <Icon name="psychology" size={20} color="white" />
//                 <Text style={styles.buttonText}>Get Parenting Tips</Text>
//               </>
//             )}
//           </TouchableOpacity>

//           {hasSearched && (
//             <TouchableOpacity
//               style={[styles.retryButton, styles.buttonFlex]}
//               onPress={handleRetry}
//               disabled={isLoading || isListening}>
//               <Icon name="refresh" size={20} color="white" />
//               <Text style={styles.buttonText}>Try Again</Text>
//             </TouchableOpacity>
//           )}
//         </View>

//         <ScrollView
//           style={styles.scrollView}
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}>
//           {tips.map((tip, index) => renderTipItem(tip, index))}
//           <View style={{height: 90}} />
//         </ScrollView>

//         <View style={styles.bottomButtonContainer}>
//           {/* Bottom navigation buttons can be added here if needed */}
//         </View>

//         {/* Fixed: Use wrapper function that matches ChildInfoModal interface */}
//         {userInfo?.access_token ? (
//           <ChildInfoModal
//             visible={showChildInfo}
//             onClose={handleChildInfoClose}
//             children={childrenInfo}
//             userToken={userInfo.access_token}
//             onChildrenUpdate={handleChildrenUpdateWrapper}
//           />
//         ) : (
//           showChildInfo && (
//             <Modal
//               visible={true}
//               transparent={true}
//               animationType="slide"
//               onRequestClose={handleChildInfoClose}>
//               <View style={styles.modalOverlay}>
//                 <View style={styles.modalContent}>
//                   <Text style={styles.modalTitle}>Not Logged In</Text>
//                   <Text style={styles.modalText}>
//                     Please log in to view and manage children information.
//                   </Text>
//                   <TouchableOpacity
//                     style={styles.closeButton}
//                     onPress={handleChildInfoClose}>
//                     <Text style={styles.closeButtonText}>Close</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </Modal>
//           )
//         )}

//         <Loader isLoading={isLoading} />
//         <AgePromptModal />
//       </LinearGradient>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   preferenceBanner: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 8,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   childrenErrorBanner: {
//     backgroundColor: '#FFF3CD',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 8,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   bannerIcon: {
//     marginRight: 8,
//   },
//   bannerText: {
//     flex: 1,
//     fontSize: 14,
//   },
//   bannerHighlight: {
//     fontWeight: 'bold',
//   },
//   bannerButton: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   bannerButtonText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   childrenErrorText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#856404',
//   },
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#f0f2f5',
//   },
//   container: {
//     flex: 1,
//   },
//   headerContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#666',
//   },
//   searchContainer: {
//     paddingHorizontal: 16,
//     marginBottom: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   searchWrapper: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     borderRadius: 25,
//     paddingHorizontal: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     height: 50,
//     fontSize: 16,
//     color: '#333',
//   },
//   micButton: {
//     marginLeft: 12,
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   micButtonActive: {
//     backgroundColor: '#FF3B30',
//   },
//   buttonContainer: {
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     marginBottom: 16,
//   },
//   buttonFlex: {
//     flex: 1,
//     marginHorizontal: 4,
//   },
//   searchButton: {
//     backgroundColor: '#4A90E2',
//     paddingVertical: 14,
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   retryButton: {
//     backgroundColor: '#34C759',
//     paddingVertical: 14,
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: 16,
//   },
//   tipItem: {
//     marginBottom: 16,
//   },
//   tipGradient: {
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   tipHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   tipIcon: {
//     marginRight: 12,
//   },
//   tipTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     flex: 1,
//   },
//   tipBody: {
//     fontSize: 16,
//     color: '#444',
//     lineHeight: 24,
//     marginBottom: 12,
//   },
//   tipDetails: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//     marginBottom: 16,
//   },
//   categoryContainer: {
//     flexDirection: 'row',
//     marginBottom: 12,
//     flexWrap: 'wrap',
//   },
//   categoryBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginRight: 8,
//     marginBottom: 4,
//   },
//   categoryText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   buttonContainerGap: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   playButton: {
//     backgroundColor: '#007AFF',
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     marginRight: 8,
//   },
//   stopButton: {
//     backgroundColor: '#FF3B30',
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//   },
//   ratingButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//     marginLeft: 4,
//     backgroundColor: '#f0f0f0',
//   },
//   ratingActive: {
//     backgroundColor: '#e6f3ff',
//   },
//   ratingText: {
//     marginLeft: 4,
//     fontSize: 12,
//     color: '#666',
//   },
//   ratingTextActive: {
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   bottomButtonContainer: {
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 24,
//     width: '90%',
//     maxWidth: 400,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 16,
//     color: '#333',
//   },
//   modalText: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//     color: '#666',
//     lineHeight: 22,
//   },
//   ageButton: {
//     backgroundColor: '#4A90E2',
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   ageButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   cancelButton: {
//     backgroundColor: '#f0f0f0',
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginTop: 8,
//   },
//   cancelButtonText: {
//     color: '#333',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   closeButton: {
//     backgroundColor: '#007AFF',
//     padding: 12,
//     borderRadius: 8,
//   },
//   closeButtonText: {
//     color: 'white',
//     fontSize: 16,
//     textAlign: 'center',
//     fontWeight: '500',
//   },
// });

// export default MainScreen;
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import {Platform, PermissionsAndroid} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Loader from './Loader';
import ChildInfoModal from '../ChildInfoModal';
import {AuthContext, AuthContextType} from '../../context/AuthContext';
import { useChildrenInfo } from '../../hooks/useChildrenInfo';
import { Child } from '../../services/ChildrenInfoService';

interface Tip {
  id: number;
  title: string;
  body: string;
  details: string;
  audioUrl: string | null;
  categories?: string[];
}

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

const detectChildNameInQuery = (query: string, childrenInfo: Child[]) => {
  if (!childrenInfo || childrenInfo.length === 0) {
    return null;
  }
  
  const normalizedQuery = query.toLowerCase();
  
  for (const child of childrenInfo) {
    const nickname = child.nickname?.toLowerCase();
    
    if (!nickname) continue;
    
    const patterns = [
      ` for ${nickname}`,
      ` ${nickname}'s `,
      ` ${nickname} `,
      `^${nickname} `,
      ` ${nickname}$`,
      `^${nickname}$`
    ];
    
    if (patterns.some(pattern => normalizedQuery.match(pattern))) {
      return child;
    }
  }
  
  return null;
};

const API_BASE_URL = 'http://68.183.102.75:4000';
const CRUD_API_BASE_URL = 'http://68.183.102.75:1337';

const RatingButtons: React.FC<{tipId: number}> = ({tipId}) => {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);

  const handleRating = async (type: 'up' | 'down') => {
    try {
      const response = await fetch(`${CRUD_API_BASE_URL}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipId,
          rating: type,
        }),
      });

      if (response.ok) {
        setRating(type);
      }
    } catch (error) {
      console.error('Error sending rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  return (
    <View style={styles.ratingContainer}>
      <TouchableOpacity
        style={[styles.ratingButton, rating === 'up' && styles.ratingActive]}
        onPress={() => handleRating('up')}>
        <Icon
          name="thumb-up"
          size={20}
          color={rating === 'up' ? '#007AFF' : '#666'}
        />
        <Text
          style={[
            styles.ratingText,
            rating === 'up' && styles.ratingTextActive,
          ]}>
          Liked it!
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.ratingButton, rating === 'down' && styles.ratingActive]}
        onPress={() => handleRating('down')}>
        <Icon
          name="thumb-down"
          size={20}
          color={rating === 'down' ? '#FF3B30' : '#666'}
        />
        <Text
          style={[
            styles.ratingText,
            rating === 'down' && styles.ratingTextActive,
          ]}>
          Not Helpful
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Enhanced Skeleton Loading Component
const TipSkeleton = () => (
  <View style={styles.tipItem}>
    <LinearGradient colors={['#f0f0f0', '#e0e0e0']} style={styles.skeletonGradient}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonTitle} />
      </View>
      <View style={styles.skeletonBody} />
      <View style={styles.skeletonDetails} />
      <View style={styles.skeletonButton} />
    </LinearGradient>
  </View>
);

const MainScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isListening, setIsListening] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(null);
  const [showAgePrompt, setShowAgePrompt] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [contentPreferences, setContentPreferences] = useState<string[]>(['language']);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const { userInfo, isLoading: contextLoading, isAdmin } = useContext<AuthContextType>(AuthContext);
  const currentSound = useRef<Sound | null>(null);
  const lastResult = useRef<string>('');
  const audioCache = useRef<Map<number, string>>(new Map());

  // Use the enhanced children info hook
  const {
    children: childrenInfo,
    isLoading: childrenLoading,
    error: childrenError,
    isFromCache: childrenFromCache,
    fetchChildren,
    updateChildren,
    clearError: clearChildrenError,
    retryFetch: retryChildrenFetch,
    needsProfileCompletion,
  } = useChildrenInfo();

  const navigateToSettings = () => {
    // @ts-ignore
    navigation.navigate('Settings');
  };

  // Simulate loading progress for better UX
  const simulateProgress = useCallback(() => {
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90; // Stop at 90% until real completion
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);

  // Enhanced fetchContentPreferences with better debugging
  const fetchContentPreferences = useCallback(async () => {
    try {
      setIsPreferencesLoading(true);
      console.log('Fetching content preferences...');
      
      const savedPreferences = await AsyncStorage.getItem('contentPreferences');
      console.log('Raw stored preferences:', savedPreferences);
      
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        console.log('Parsed preferences:', parsedPreferences);
        
        if (Array.isArray(parsedPreferences) && parsedPreferences.length > 0) {
          setContentPreferences(parsedPreferences);
        } else {
          setContentPreferences(['language']);
        }
      } else {
        setContentPreferences(['language']);
      }
    } catch (error) {
      console.error('Error loading content preferences:', error);
      setContentPreferences(['language']);
    } finally {
      setIsPreferencesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContentPreferences();
    }, [fetchContentPreferences])
  );

  useEffect(() => {
    fetchContentPreferences();
  }, [fetchContentPreferences]);

  const initializeVoice = async () => {
    try {
      await requestMicrophonePermission();
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechEnd = () => {
        if (isListening) {
          Voice.start('en-US');
        }
      };
    } catch (error) {
      console.error('Failed to initialize voice:', error);
    }
  };

  const cleanupVoice = () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };

  const cleanupSound = () => {
    if (currentSound.current) {
      currentSound.current.stop();
      currentSound.current.release();
      currentSound.current = null;
    }
    setIsPlaying(false);
    setActiveAudioIndex(null);
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for voice recognition.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Voice recognition requires microphone access',
          );
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to request microphone permission');
        console.error(err);
      }
    }
  };

  const onSpeechResults = (e: any) => {
    if (e.value && e.value[0]) {
      const newResult = e.value[0];
      if (newResult !== lastResult.current) {
        lastResult.current = newResult;
        setSearchText(newResult);
      }
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech recognition error:', e);
    if (isListening) {
      Voice.start('en-US').catch(error => {
        console.error('Failed to restart voice recognition:', error);
        setIsListening(false);
        Alert.alert(
          'Error',
          'Failed to restart voice recognition. Please try again.',
        );
      });
    }
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
        if (searchText.trim()) {
          await getTips(searchText);
        }
        lastResult.current = '';
      } else {
        const isAvailable = await Voice.isAvailable();
        if (isAvailable) {
          setSearchText('');
          lastResult.current = '';
          await Voice.start('en-US');
          setIsListening(true);
        } else {
          Alert.alert(
            'Error',
            'Voice recognition is not available on this device.',
          );
        }
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
      Alert.alert('Error', 'Failed to toggle voice recognition');
      setIsListening(false);
    }
  };

  useEffect(() => {
    initializeVoice();
    return () => {
      cleanupVoice();
      cleanupSound();
    };
  }, []);

  // Enhanced audio loading with caching and on-demand generation
  const loadAudio = async (tip: Tip, index: number) => {
    // Check cache first
    if (audioCache.current.has(tip.id)) {
      return audioCache.current.get(tip.id);
    }

    // If audio URL already exists, use it
    if (tip.audioUrl) {
      const fullAudioUrl = `${API_BASE_URL}/audio${tip.audioUrl}`;
      audioCache.current.set(tip.id, fullAudioUrl);
      return fullAudioUrl;
    }

    // Generate audio on-demand
    setAudioLoadingIndex(index);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-tip-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipId: tip.id,
          title: tip.title,
          body: tip.body,
          details: tip.details,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const { audioUrl } = await response.json();
      const fullAudioUrl = `${API_BASE_URL}/audio${audioUrl}`;
      
      // Update tip and cache
      tip.audioUrl = audioUrl;
      audioCache.current.set(tip.id, fullAudioUrl);
      
      return fullAudioUrl;
    } catch (error) {
      console.error('Audio generation error:', error);
      Alert.alert('Error', 'Failed to generate audio. Please try again.');
      return null;
    } finally {
      setAudioLoadingIndex(null);
    }
  };

  const speakTip = useCallback(async (tip: Tip, index: number) => {
    cleanupSound();

    // Show immediate feedback
    setActiveAudioIndex(index);

    try {
      const audioUrl = await loadAudio(tip, index);
      if (!audioUrl) return;

      setIsPlaying(true);

      currentSound.current = new Sound(audioUrl, '', error => {
        if (error) {
          console.error('Failed to load sound:', error);
          Alert.alert('Error', 'Failed to play audio. Please try again.');
          cleanupSound();
          return;
        }

        currentSound.current?.play(success => {
          if (!success) {
            Alert.alert('Error', 'Audio playback failed. Please try again.');
          }
          cleanupSound();
        });
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      cleanupSound();
    }
  }, []);

  const renderTipItem = (tip: Tip, index: number) => (
    <View key={index} style={styles.tipItem}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.tipGradient}>
        <View style={styles.tipHeader}>
          <Icon
            name="lightbulb"
            size={24}
            color="#FFA726"
            style={styles.tipIcon}
          />
          <Text style={styles.tipTitle}>{tip.title}</Text>
        </View>
        {tip.categories && tip.categories.length > 0 && renderCategoryBadges(tip.categories)}
        <Text style={styles.tipBody}>{tip.body}</Text>
        <Text style={styles.tipDetails}>{tip.details}</Text>
        <View style={styles.buttonContainerGap}>
          <TouchableOpacity
            style={[
              styles.playButton,
              activeAudioIndex === index && isPlaying && styles.stopButton,
              audioLoadingIndex === index && styles.loadingButton,
            ]}
            onPress={() => {
              if (activeAudioIndex === index && isPlaying) {
                cleanupSound();
              } else {
                speakTip(tip, index);
              }
            }}
            disabled={audioLoadingIndex === index}>
            {audioLoadingIndex === index ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Icon
                name={
                  activeAudioIndex === index && isPlaying ? 'stop' : 'play-arrow'
                }
                size={20}
                color="white"
              />
            )}
            <Text style={styles.buttonText}>
              {audioLoadingIndex === index 
                ? 'Loading...' 
                : activeAudioIndex === index && isPlaying 
                ? 'Stop' 
                : 'Play Audio'}
            </Text>
          </TouchableOpacity>
          <RatingButtons tipId={tip.id} />
        </View>
      </LinearGradient>
    </View>
  );

  // Enhanced getTips with instant feedback and progressive loading
  const getTips = async (query = searchText) => {
    if (!query.trim()) {
      Alert.alert(
        'Input Required',
        'Please enter a question or use voice input'
      );
      return;
    }

    // Show instant feedback
    setIsLoading(true);
    setTips([]); // Clear previous tips
    setHasSearched(false);
    
    // Start progress simulation
    const cleanupProgress = simulateProgress();

    // Enhanced child name detection
    const detectedChild = detectChildNameInQuery(query, childrenInfo);
    
    if (detectedChild) {
      const age = calculateAge(detectedChild.date_of_birth);
      query = `${query} for ${age} year old`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/generate-tips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: query, 
          contentPreferences: contentPreferences
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'age_required') {
          setLastQuery(query);
          setShowAgePrompt(true);
          return;
        }
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      // Complete the progress
      setLoadingProgress(100);
      
      // Show tips immediately (without audio)
      setTips(data.tips);
      setHasSearched(true);
      
    } catch (error) {
      console.error('Error fetching tips:', error);
      Alert.alert(
        'Error',
        'Failed to fetch tips. Please check your connection and try again.'
      );
    } finally {
      cleanupProgress();
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const renderCategoryBadges = (categories: string[] = []) => {
    if (!categories || categories.length === 0) return null;
    
    return (
      <View style={styles.categoryContainer}>
        {categories.map((category, index) => (
          <View 
            key={index}
            style={[
              styles.categoryBadge,
              { backgroundColor: category === 'language' ? '#007AFF' : '#34C759' }
            ]}
          >
            <Text style={styles.categoryText}>
              {category === 'language' ? 'Language' : 'Science'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const ContentPreferenceBanner = () => {
    if (isPreferencesLoading) return null;
    
    let focusText = '';
    let backgroundColor = '#E3F2FD';
    let textColor = '#0D47A1';
    
    if (contentPreferences.includes('language') && contentPreferences.includes('science')) {
      focusText = 'Language & Science';
      backgroundColor = '#E8F5E8';
      textColor = '#2E7D2E';
    } else if (contentPreferences.includes('language') && !contentPreferences.includes('science')) {
      focusText = 'Language Development';
      backgroundColor = '#E3F2FD';
      textColor = '#0D47A1';
    } else if (contentPreferences.includes('science') && !contentPreferences.includes('language')) {
      focusText = 'Science Skills';
      backgroundColor = '#E8F5E8';
      textColor = '#2E7D2E';
    } else {
      focusText = 'General Tips';
      backgroundColor = '#F3E5F5';
      textColor = '#7B1FA2';
    }
    
    return (
      <View style={[styles.preferenceBanner, { backgroundColor }]}>
        <Icon name="school" size={16} color={textColor} style={styles.bannerIcon} />
        <Text style={[styles.bannerText, { color: textColor }]}>
          Focus: <Text style={styles.bannerHighlight}>{focusText}</Text>
        </Text>
        <TouchableOpacity 
          onPress={() => {
            // @ts-ignore
            navigation.navigate('ContentSelection');
          }}
          style={[styles.bannerButton, { backgroundColor: `${textColor}20` }]}
        >
          <Text style={[styles.bannerButtonText, { color: textColor }]}>Change</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleRetry = () => {
    if (searchText.trim()) {
      getTips(searchText);
    }
  };

  const handleAgeSubmit = (age: string) => {
    setShowAgePrompt(false);
    const queryWithAge = `${lastQuery} for ${age} year old`;
    setSearchText(queryWithAge);
    getTips(queryWithAge);
  };

  const handleChildInfoClose = () => {
    setShowChildInfo(false);
    clearChildrenError();
  };

  const handleChildrenUpdateWrapper = () => {
    fetchChildren(true);
  };

  const AgePromptModal = () => (
    <Modal visible={showAgePrompt} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Child</Text>
          <Text style={styles.modalText}>
            Please select which child you're asking about:
          </Text>
          {childrenInfo.map(child => {
            const age = calculateAge(child.date_of_birth);
            return (
              <TouchableOpacity
                key={child.id}
                style={styles.ageButton}
                onPress={() => handleAgeSubmit(age.toString())}>
                <Text style={styles.ageButtonText}>
                  {child.nickname || `Child ${child.id}`} ({age} year
                  {age !== 1 ? 's' : ''} old)
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowAgePrompt(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#f0f2f5', '#ffffff']} style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Parenting Assistant</Text>
          <Text style={styles.headerSubtitle}>Ask any parenting question</Text>
        </View>
        
        <ContentPreferenceBanner />
        
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Icon
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={
                isListening ? 'Listening...' : 'Ask a parenting question...'
              }
              returnKeyType="search"
              onSubmitEditing={() => getTips()}
              editable={!isListening}
              placeholderTextColor="#999"
            />
            
            {/* Clear button - only show when there's text */}
    {searchText.length > 0 && !isListening && (
      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => {
          setSearchText('');
          // Optional: clear previous tips when clearing search
          // setTips([]);
          // setHasSearched(false);
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon
          name="clear"
          size={20}
          color="#999"
        />
      </TouchableOpacity>
    )}
          </View>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={toggleListening}>
            <Icon
              name={isListening ? 'mic-off' : 'mic'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.searchButton, styles.buttonFlex]}
            onPress={() => getTips()}
            disabled={isLoading || isListening}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="psychology" size={20} color="white" />
                <Text style={styles.buttonText}>Get Parenting Tips</Text>
              </>
            )}
          </TouchableOpacity>

          {hasSearched && (
            <TouchableOpacity
              style={[styles.retryButton, styles.buttonFlex]}
              onPress={handleRetry}
              disabled={isLoading || isListening}>
              <Icon name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
        {hasSearched && (
  <View style={styles.newQuestionContainer}>
    <TouchableOpacity
      style={styles.newQuestionButton}
      onPress={() => {
        setSearchText('');
        setTips([]);
        setHasSearched(false);
      }}
    >
      <Icon name="add" size={20} color="white" />
      <Text style={styles.newQuestionText}>Ask New Question</Text>
    </TouchableOpacity>
  </View>
)}

        {/* Progress bar for better loading feedback */}
        {isLoading && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Show skeleton loading while fetching */}
          {isLoading && tips.length === 0 && (
            <>
              <TipSkeleton />
              <TipSkeleton />
              <TipSkeleton />
            </>
          )}
          
          {tips.map((tip, index) => renderTipItem(tip, index))}
          <View style={{height: 90}} />
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          {/* Bottom navigation buttons can be added here if needed */}
        </View>

        {userInfo?.access_token ? (
          <ChildInfoModal
            visible={showChildInfo}
            onClose={handleChildInfoClose}
            children={childrenInfo}
            userToken={userInfo.access_token}
            onChildrenUpdate={handleChildrenUpdateWrapper}
          />
        ) : (
          showChildInfo && (
            <Modal
              visible={true}
              transparent={true}
              animationType="slide"
              onRequestClose={handleChildInfoClose}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Not Logged In</Text>
                  <Text style={styles.modalText}>
                    Please log in to view and manage children information.
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleChildInfoClose}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )
        )}

        <AgePromptModal />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (keeping all existing styles) ...
  preferenceBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
  },
  bannerHighlight: {
    fontWeight: 'bold',
  },
  bannerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bannerButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
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
  searchIcon: {
    marginRight: 10,
  },
  micButton: {
    marginLeft: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    marginBottom: 16,
  },
  buttonFlex: {
    flex: 1,
    marginHorizontal: 4,
  },
  newQuestionContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  newQuestionButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  newQuestionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingRight: 40, // Add padding for clear button
  },
  // New clear button style
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 15,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  retryButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Progress bar styles
  progressContainer: {
    height: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 1.5,
  },
  // Skeleton loading styles
  skeletonGradient: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#D0D0D0',
    borderRadius: 12,
    marginRight: 12,
  },
  skeletonTitle: {
    flex: 1,
    height: 20,
    backgroundColor: '#D0D0D0',
    borderRadius: 10,
  },
  skeletonBody: {
    height: 16,
    backgroundColor: '#D0D0D0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonDetails: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 7,
    marginBottom: 16,
    width: '80%',
  },
  skeletonButton: {
    height: 40,
    backgroundColor: '#D0D0D0',
    borderRadius: 8,
    width: '60%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  tipItem: {
    marginBottom: 16,
  },
  tipGradient: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  tipBody: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 12,
  },
  tipDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainerGap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  loadingButton: {
    backgroundColor: '#999',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 4,
    backgroundColor: '#f0f0f0',
  },
  ratingActive: {
    backgroundColor: '#e6f3ff',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  ratingTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
  },
  ageButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  ageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MainScreen;