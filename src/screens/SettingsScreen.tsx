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
import { useChildrenInfo } from '../hooks/useChildrenInfo';

interface SettingsScreenProps {
  navigation: NavigationProp<any>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { userInfo, logout, deleteAccount, isAdmin } = useContext<AuthContextType>(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [selectedContentAreas, setSelectedContentAreas] = useState<string[]>([]);
  
  // Use the enhanced children info hook
  const {
    children: childrenInfo,
    isLoading: childrenLoading,
    error: childrenError,
    isFromCache,
    fetchChildren,
    updateChildren,
    clearError,
    retryFetch,
    needsProfileCompletion,
  } = useChildrenInfo();

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
      }
    } catch (error) {
      console.error('Delete account handling error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const loadContentPreferences = async () => {
    try {
      const preferences = await AsyncStorage.getItem('contentPreferences');
      if (preferences) {
        setSelectedContentAreas(JSON.parse(preferences));
      }
    } catch (error) {
      console.error('Error loading content preferences:', error);
    }
  };

  useEffect(() => {
    loadContentPreferences();
  }, []);

  // Handle children info button press with error handling
  const handleChildrenInfoPress = () => {
    clearError(); // Clear any previous errors
    setShowChildInfo(true);
  };

  // Enhanced children info modal close handler
  const handleChildInfoClose = () => {
    setShowChildInfo(false);
    clearError();
  };

  // Fixed: Create a wrapper function that matches the expected ChildInfoModal signature
  const handleChildrenUpdateWrapper = () => {
    // This function will be called by ChildInfoModal after it updates children
    // The actual update logic is handled by the ChildInfoModal itself
    // We just need to refresh our data after the modal closes
    fetchChildren(true); // Force refresh after update
  };

  // Render children info menu item with status indicators
  const renderChildrenInfoMenuItem = () => {
    const getStatusIcon = () => {
      if (childrenLoading) return 'hourglass-empty';
      if (childrenError && !isFromCache) return 'error';
      if (isFromCache) return 'cached';
      if (needsProfileCompletion) return 'warning';
      return 'child-care';
    };

    const getStatusColor = () => {
      if (childrenLoading) return '#FF9500';
      if (childrenError && !isFromCache) return '#FF3B30';
      if (isFromCache) return '#FF9500';
      if (needsProfileCompletion) return '#FF9500';
      return '#5856D6';
    };

    return (
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={handleChildrenInfoPress}
        disabled={childrenLoading}
      >
        <Icon 
          name={getStatusIcon()} 
          size={24} 
          color={getStatusColor()} 
          style={styles.menuIcon} 
        />
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuText}>Children Information</Text>
          {childrenError && !isFromCache && (
            <Text style={styles.errorSubtext}>Tap to retry</Text>
          )}
          {isFromCache && (
            <Text style={styles.cacheSubtext}></Text>
          )}
          {needsProfileCompletion && !childrenError && (
            <Text style={styles.warningSubtext}>Profile incomplete</Text>
          )}
          {childrenLoading && (
            <Text style={styles.loadingSubtext}>Loading...</Text>
          )}
        </View>
        <View style={styles.menuRightContainer}>
          {childrenInfo.length > 0 && (
            <View style={styles.childrenCountBadge}>
              <Text style={styles.childrenCountText}>{childrenInfo.length}</Text>
            </View>
          )}
          {childrenLoading ? (
            <ActivityIndicator size="small" color="#5856D6" style={styles.menuLoader} />
          ) : (
            <Icon name="chevron-right" size={24} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
            
            {/* Enhanced Children Information Button */}
            {renderChildrenInfoMenuItem()}
            
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
            
            {/* Content Selection Button */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('ContentSelection')}
            >
              <Icon name="school" size={24} color="#4A90E2" style={styles.menuIcon} />
              <Text style={styles.menuText}>Content Preferences</Text>
              <View style={styles.contentPrefsContainer}>
                {selectedContentAreas.length > 0 ? (
                  <View style={styles.contentBadge}>
                    <Text style={styles.contentBadgeText}>
                      {selectedContentAreas.length} selected
                    </Text>
                  </View>
                ) : (
                  <Icon name="chevron-right" size={24} color="#ccc" />
                )}
              </View>
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
          
          {/* Error banner for children info */}
          {childrenError && !isFromCache && (
            <View style={styles.errorBanner}>
              <Icon name="error" size={20} color="#FF3B30" style={styles.errorIcon} />
              <Text style={styles.errorBannerText}>{childrenError}</Text>
              <TouchableOpacity onPress={retryFetch} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>ENACT v1.0</Text>
          </View>
        </ScrollView>
        
        {/* Fixed: Use wrapper function that matches ChildInfoModal interface */}
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
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  contentPrefsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contentBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  menuRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLoader: {
    marginLeft: 8,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 2,
  },
  cacheSubtext: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 2,
  },
  warningSubtext: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 2,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  childrenCountBadge: {
    backgroundColor: '#5856D6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  childrenCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dangerMenuText: {
    fontSize: 16,
    color: '#FF3B30',
    flex: 1,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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