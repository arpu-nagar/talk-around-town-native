// import React, { useContext, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   SafeAreaView,
//   ScrollView,
//   ActivityIndicator,
//   StatusBar,
// } from 'react-native';
// import { AuthContext, AuthContextType } from '../context/AuthContext';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { NavigationProp } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ChildInfoModal from './ChildInfoModal';

// interface SettingsScreenProps {
//   navigation: NavigationProp<any>;
// }

// const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
//   const { userInfo, logout, deleteAccount, isAdmin } = useContext<AuthContextType>(AuthContext);
//   const [isDeleting, setIsDeleting] = useState(false);

//   const confirmDeleteAccount = () => {
//     Alert.alert(
//       'Delete Account',
//       'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Delete', 
//           style: 'destructive', 
//           onPress: handleDeleteAccount 
//         }
//       ],
//       { cancelable: true }
//     );
//   };
//   const debugStorage = async () => {
//     try {
//       const generalSetting = await AsyncStorage.getItem('generalRemindersEnabled');
//       const specificSetting = await AsyncStorage.getItem('specificReminders');
      
//       console.log('General reminders enabled:', generalSetting);
//       console.log('Specific reminders:', specificSetting);
      
//       Alert.alert(
//         'Stored Reminders',
//         `General: ${generalSetting}\n\nSpecific: ${JSON.stringify(JSON.parse(specificSetting || '{}'), null, 2)}`,
//         [{ text: 'OK' }]
//       );
//     } catch (error) {
//       console.error('Error reading storage:', error);
//     }
//   };
//   const handleDeleteAccount = async () => {
//     setIsDeleting(true);
//     try {
//       const success = await deleteAccount();
//       if (success) {
//         Alert.alert(
//           'Account Deleted',
//           'Your account has been successfully deleted.',
//           [{ text: 'OK' }]
//         );
//         // No need to call logout as it's handled in deleteAccount
//       }
//     } catch (error) {
//       console.error('Delete account handling error:', error);
//     } finally {
//       setIsDeleting(false);
//     }
//   };
//   return (

//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" />
//       <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.gradientBackground}>
//         <View style={styles.headerContainer}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Icon name="arrow-back" size={24} color="#FFFFFF" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Settings</Text>
//           <View style={styles.placeholderView} />
//         </View>
        
//         <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
//           {/* Admin Section - Only visible to admins */}
//           {isAdmin && (
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Admin Settings</Text>
              
//               <View style={styles.menuItem}>
//                 <Icon name="verified-user" size={24} color="#4CAF50" style={styles.menuIcon} />
//                 <Text style={styles.menuText}>Admin Status</Text>
//                 <View style={styles.adminBadge}>
//                   <Icon name="verified-user" size={16} color="#fff" />
//                   <Text style={styles.adminBadgeText}>Admin</Text>
//                 </View>
//               </View>
              
//               <TouchableOpacity 
//                 style={styles.menuItem}
//                 onPress={() => navigation.navigate('Dashboard')}
//               >
//                 <Icon name="dashboard" size={24} color="#4A90E2" style={styles.menuIcon} />
//                 <Text style={styles.menuText}>Admin Dashboard</Text>
//                 <Icon name="chevron-right" size={24} color="#ccc" />
//               </TouchableOpacity>
              
//               <TouchableOpacity 
//                 style={styles.menuItem}
//                 onPress={() => Alert.alert('Feature Coming Soon', 'User management will be available in the next update.')}
//               >
//                 <Icon name="people" size={24} color="#4A90E2" style={styles.menuIcon} />
//                 <Text style={styles.menuText}>Manage Users</Text>
//                 <Icon name="chevron-right" size={24} color="#ccc" />
//               </TouchableOpacity>
//             </View>
//           )}
          
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Account</Text>
            
//             <TouchableOpacity 
//               style={styles.menuItem}
//               onPress={() => navigation.navigate('ChangePassword')}
//             >
//               <Icon name="lock" size={24} color="#4A90E2" style={styles.menuIcon} />
//               <Text style={styles.menuText}>Change Password</Text>
//               <Icon name="chevron-right" size={24} color="#ccc" />
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.dangerMenuItem}
//               onPress={confirmDeleteAccount}
//               disabled={isDeleting}
//             >
//               <Icon name="delete-forever" size={24} color="#FF3B30" style={styles.menuIcon} />
//               <Text style={styles.dangerMenuText}>
//                 {isDeleting ? 'Deleting Account...' : 'Delete Account'}
//               </Text>
//               {isDeleting ? (
//                 <ActivityIndicator size="small" color="#FF3B30" />
//               ) : (
//                 <Icon name="chevron-right" size={24} color="#FF3B30" />
//               )}
//             </TouchableOpacity>

//           </View>
      
  
  
          
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>App</Text>
            
//             <TouchableOpacity 
//               style={styles.menuItem}
//               onPress={() => navigation.navigate('About')}
//             >
//               <Icon name="info" size={24} color="#4A90E2" style={styles.menuIcon} />
//               <Text style={styles.menuText}>About ENACT</Text>
//               <Icon name="chevron-right" size={24} color="#ccc" />
//             </TouchableOpacity>
//             <TouchableOpacity 
//     style={styles.menuItem}
//     onPress={() => navigation.navigate('ReminderSettings')}
//   >
//     <Icon name="notifications" size={24} color="#4A90E2" style={styles.menuIcon} />
//     <Text style={styles.menuText}>Reminder Settings</Text>
//     <Icon name="chevron-right" size={24} color="#ccc" />
//     {/* <TouchableOpacity 
//   style={styles.debugButton}
//   onPress={debugStorage}
// >
//   <Text style={styles.debugButtonText}>Debug Storage</Text>
// </TouchableOpacity> */}
//   </TouchableOpacity>
//             <TouchableOpacity 
//               style={styles.menuItem}
//               onPress={() => logout()}
//             >
//               <Icon name="logout" size={24} color="#4A90E2" style={styles.menuIcon} />
//               <Text style={styles.menuText}>Logout</Text>
//               <Icon name="chevron-right" size={24} color="#ccc" />
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.versionContainer}>
//             <Text style={styles.versionText}>ENACT v1.0</Text>
//           </View>
//         </ScrollView>
//       </LinearGradient>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#4A90E2',
//   },
//   gradientBackground: {
//     flex: 1,
//   },
//   headerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255,255,255,0.2)',
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   placeholderView: {
//     width: 40, // Same width as back button for centering
//   },
//   scrollView: {
//     flex: 1,
//     paddingHorizontal: 16,
//     paddingTop: 16,
//   },
//   scrollContent: {
//     paddingBottom: 30,
//   },
//   section: {
//     marginBottom: 24,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 16,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   dangerMenuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     borderBottomWidth: 0,
//   },
//   menuIcon: {
//     marginRight: 16,
//   },
//   menuText: {
//     fontSize: 16,
//     color: '#333',
//     flex: 1,
//   },
//   dangerMenuText: {
//     fontSize: 16,
//     color: '#FF3B30',
//     flex: 1,
//     fontWeight: '500',
//   },
//   versionContainer: {
//     alignItems: 'center',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   versionText: {
//     color: 'rgba(255,255,255,0.7)',
//     fontSize: 14,
//   },
//   adminBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#4CAF50',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 15,
//   },
//   adminBadgeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold',
//     marginLeft: 5,
//   },
//   debugButton: {
//     backgroundColor: '#4A90E2',
//     padding: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 16,
//   },
//   debugButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default SettingsScreen;
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChildInfoModal from './ChildInfoModal';

interface SettingsScreenProps {
  navigation: NavigationProp<any>;
}

interface Child {
  id: number;
  nickname?: string;
  date_of_birth: string;
  age?: number;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { userInfo, logout, deleteAccount, isAdmin } = useContext<AuthContextType>(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [childrenInfo, setChildrenInfo] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: handleDeleteAccount 
        }
      ],
      { cancelable: true }
    );
  };
  
  const debugStorage = async () => {
    try {
      const generalSetting = await AsyncStorage.getItem('generalRemindersEnabled');
      const specificSetting = await AsyncStorage.getItem('specificReminders');
      
      console.log('General reminders enabled:', generalSetting);
      console.log('Specific reminders:', specificSetting);
      
      Alert.alert(
        'Stored Reminders',
        `General: ${generalSetting}\n\nSpecific: ${JSON.stringify(JSON.parse(specificSetting || '{}'), null, 2)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error reading storage:', error);
    }
  };
  
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteAccount();
      if (success) {
        Alert.alert(
          'Account Deleted',
          'Your account has been successfully deleted.',
          [{ text: 'OK' }]
        );
        // No need to call logout as it's handled in deleteAccount
      }
    } catch (error) {
      console.error('Delete account handling error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchChildrenInfo = async () => {
    if (!userInfo?.access_token) {
      console.error('No access token available');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        'http://68.183.102.75:1337/endpoint/children',
        {
          headers: {
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.children) {
        setChildrenInfo(data.children);
      } else {
        setChildrenInfo([]);
      }
    } catch (error) {
      console.error('Error fetching children info:', error);
      Alert.alert(
        'Error',
        'Failed to fetch children information. Please try again later.',
      );
      setChildrenInfo([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.access_token) {
      fetchChildrenInfo();
    }
  }, [userInfo?.access_token]);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.gradientBackground}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholderView} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Admin Section - Only visible to admins */}
          {isAdmin && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Admin Settings</Text>
              
              <View style={styles.menuItem}>
                <Icon name="verified-user" size={24} color="#4CAF50" style={styles.menuIcon} />
                <Text style={styles.menuText}>Admin Status</Text>
                <View style={styles.adminBadge}>
                  <Icon name="verified-user" size={16} color="#fff" />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Icon name="dashboard" size={24} color="#4A90E2" style={styles.menuIcon} />
                <Text style={styles.menuText}>Admin Dashboard</Text>
                <Icon name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => Alert.alert('Feature Coming Soon', 'User management will be available in the next update.')}
              >
                <Icon name="people" size={24} color="#4A90E2" style={styles.menuIcon} />
                <Text style={styles.menuText}>Manage Users</Text>
                <Icon name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Icon name="lock" size={24} color="#4A90E2" style={styles.menuIcon} />
              <Text style={styles.menuText}>Change Password</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            
            {/* Added Child Information Button */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setShowChildInfo(true)}
            >
              <Icon name="child-care" size={24} color="#5856D6" style={styles.menuIcon} />
              <Text style={styles.menuText}>Children Information</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dangerMenuItem}
              onPress={confirmDeleteAccount}
              disabled={isDeleting}
            >
              <Icon name="delete-forever" size={24} color="#FF3B30" style={styles.menuIcon} />
              <Text style={styles.dangerMenuText}>
                {isDeleting ? 'Deleting Account...' : 'Delete Account'}
              </Text>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Icon name="chevron-right" size={24} color="#FF3B30" />
              )}
            </TouchableOpacity>
          </View>
      
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('About')}
            >
              <Icon name="info" size={24} color="#4A90E2" style={styles.menuIcon} />
              <Text style={styles.menuText}>About ENACT</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('ReminderSettings')}
            >
              <Icon name="notifications" size={24} color="#4A90E2" style={styles.menuIcon} />
              <Text style={styles.menuText}>Reminder Settings</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => logout()}
            >
              <Icon name="logout" size={24} color="#4A90E2" style={styles.menuIcon} />
              <Text style={styles.menuText}>Logout</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>ENACT v1.0</Text>
          </View>
        </ScrollView>
        
        {userInfo?.access_token ? (
          <ChildInfoModal
            visible={showChildInfo}
            onClose={() => setShowChildInfo(false)}
            children={childrenInfo}
            userToken={userInfo.access_token}
            onChildrenUpdate={fetchChildrenInfo}
          />
        ) : (
          showChildInfo && (
            <Modal
              visible={true}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowChildInfo(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Not Logged In</Text>
                  <Text style={styles.modalText}>
                    Please log in to view and manage children information.
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowChildInfo(false)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  gradientBackground: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholderView: {
    width: 40, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dangerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dangerMenuText: {
    fontSize: 16,
    color: '#FF3B30',
    flex: 1,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  versionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  debugButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
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

export default SettingsScreen;