import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import PushNotification from 'react-native-push-notification';
import { PermissionsAndroid, Platform } from 'react-native';

interface ReminderSettingsScreenProps {
  navigation: NavigationProp<any>;
}

interface ReminderTime {
  id: string;
  day: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const ReminderSettingsScreen: React.FC<ReminderSettingsScreenProps> = ({ navigation }) => {
  const [generalRemindersEnabled, setGeneralRemindersEnabled] = useState(false);
  const [specificReminders, setSpecificReminders] = useState<ReminderTime[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentEditingReminder, setCurrentEditingReminder] = useState<ReminderTime | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  useEffect(() => {
    // This runs only once when the component mounts
    const initializeScreen = async () => {
      await requestAlarmPermissions();
      await loadReminderSettings();
    };
    
    console.log("ReminderSettings screen mounted");
    initializeScreen();
  }, []);
  
  // Second useEffect: Save data and schedule notifications when data changes
  useEffect(() => {
    // Skip on initial render when both might be default values
    if (specificReminders.length === 0 && !generalRemindersEnabled) {
      console.log("Skipping initial save with empty values");
      return;
    }
    
    console.log("Data changed, saving settings:", { 
      generalRemindersEnabled, 
      specificReminders: specificReminders.length 
    });
    
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('generalRemindersEnabled', JSON.stringify(generalRemindersEnabled));
        await AsyncStorage.setItem('specificReminders', JSON.stringify(specificReminders));
        
        // Schedule notifications based on saved settings
        scheduleNotifications();
      } catch (error) {
        console.error('Error saving reminder settings:', error);
      }
    };
    
    saveSettings();
  }, [generalRemindersEnabled, specificReminders]);

  // useEffect(() => {
  //   // Request alarm permissions when the component mounts
  //   requestAlarmPermissions();
  // }, []);
  
  // // Update the existing save useEffect to be async
  // useEffect(() => {
  //   const saveSettings = async () => {
  //     try {
  //       await AsyncStorage.setItem('generalRemindersEnabled', JSON.stringify(generalRemindersEnabled));
  //       await AsyncStorage.setItem('specificReminders', JSON.stringify(specificReminders));
        
  //       // Schedule notifications based on saved settings
  //       scheduleNotifications();
  //     } catch (error) {
  //       console.error('Error saving reminder settings:', error);
  //     }
  //   };
    
  //   saveSettings();
  // }, [generalRemindersEnabled, specificReminders]);
    

  // // Load saved reminder settings when the screen mounts
  // useEffect(() => {
  //   loadReminderSettings();
  // }, []);



  const requestAlarmPermissions = async () => {
    // Only need to request on Android 12+ (API level 31+)
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        // For Android 12 (API level 31)
        if (PermissionsAndroid.PERMISSIONS.SCHEDULE_EXACT_ALARM) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SCHEDULE_EXACT_ALARM,
            {
              title: "Exact Alarm Permission",
              message: "This app needs permission to schedule exact reminders",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Exact alarm permission granted");
            return true;
          } else {
            console.log("Exact alarm permission denied");
            Alert.alert(
              "Permission Required",
              "Without exact alarm permission, reminders may not be delivered at the exact time you set them.",
              [{ text: "OK" }]
            );
            return false;
          }
        }
        
        // For Android 13+ (API level 33+)
        if (PermissionsAndroid.PERMISSIONS.USE_EXACT_ALARM) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.USE_EXACT_ALARM,
            {
              title: "Exact Alarm Permission",
              message: "This app needs permission to schedule exact reminders",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Exact alarm permission granted");
            return true;
          } else {
            console.log("Exact alarm permission denied");
            Alert.alert(
              "Permission Required",
              "Without exact alarm permission, reminders may not be delivered at the exact time you set them.",
              [{ text: "OK" }]
            );
            return false;
          }
        }
      } catch (error) {
        console.error("Error requesting alarm permission:", error);
        return false;
      }
    }
    
    // Permission not needed on iOS or older Android versions
    return true;
  };

  const loadReminderSettings = async () => {
    try {
      console.log("Loading reminder settings from storage...");
      const generalSetting = await AsyncStorage.getItem('generalRemindersEnabled');
      const specificSetting = await AsyncStorage.getItem('specificReminders');
      
      console.log("Loaded from storage - General:", generalSetting);
      console.log("Loaded from storage - Specific:", specificSetting);
      
      if (generalSetting !== null) {
        setGeneralRemindersEnabled(JSON.parse(generalSetting));
      }
      
      if (specificSetting !== null) {
        const parsedReminders = JSON.parse(specificSetting);
        console.log("Parsed reminders:", parsedReminders);
        // Make sure we're setting a valid array
        if (Array.isArray(parsedReminders)) {
          setSpecificReminders(parsedReminders);
        } else {
          console.error("Loaded reminders is not an array:", parsedReminders);
        }
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

  const saveReminderSettings = async () => {
    try {
      await AsyncStorage.setItem('generalRemindersEnabled', JSON.stringify(generalRemindersEnabled));
      await AsyncStorage.setItem('specificReminders', JSON.stringify(specificReminders));
      
      // Schedule notifications based on saved settings
      scheduleNotifications();
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  };
  

  // Update the scheduleNotifications function in your ReminderSettingsScreen
const scheduleNotifications = async () => {
    // First request required permissions on Android 12+
    const hasPermission = await requestAlarmPermissions();
    if (!hasPermission && Platform.OS === 'android' && Platform.Version >= 31) {
      Alert.alert(
        "Limited Functionality",
        "Without the required permissions, reminders may not be delivered at the exact time you set them.",
        [{ text: "OK" }]
      );
      // Continue anyway with potential inexact alarms
    }
    
    // Cancel all existing reminder notifications (using a unique ID range for reminders)
    // IDs 1000-1999 reserved for general reminders
    // IDs 2000+ reserved for specific reminders
    for (let i = 1000; i < 3000; i++) {
      PushNotification.cancelLocalNotification(i.toString());
    }
    
    // Schedule general daily reminder if enabled
    if (generalRemindersEnabled) {
      // Set for noon every day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      
      PushNotification.localNotificationSchedule({
        id: "1000", // Use a specific ID for the general reminder
        channelId: 'app-reminders',
        title: 'ENACT App Reminder',
        message: 'Don\'t forget to open ENACT today!',
        date: tomorrow,
        allowWhileIdle: true, // Important for delivery when device is idle
        repeatType: 'day',
        userInfo: {
          type: 'general_reminder'
        }
      });
      
      console.log('Scheduled general daily reminder');
    }
    
    // Schedule specific day/time reminders
    specificReminders.forEach((reminder, index) => {
      if (reminder.enabled) {
        // Calculate next occurrence of this day and time
        const dayIndex = DAYS_OF_WEEK.indexOf(reminder.day);
        const now = new Date();
        const nextDate = new Date();
        const currentDay = now.getDay();
        
        // Calculate days until next occurrence
        let daysUntil = (dayIndex - currentDay + 7) % 7;
        if (daysUntil === 0) {
          // Same day, check if time already passed
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          if (currentHour > reminder.hour || 
              (currentHour === reminder.hour && currentMinute >= reminder.minute)) {
            // Time has passed, schedule for next week
            daysUntil = 7;
          }
        }
        
        // Set the next occurrence date
        nextDate.setDate(now.getDate() + daysUntil);
        nextDate.setHours(reminder.hour, reminder.minute, 0, 0);
        
        // Create unique ID for this reminder (2000 + index)
        const notificationId = (2000 + index).toString();
        
        PushNotification.localNotificationSchedule({
          id: notificationId,
          channelId: 'app-reminders',
          title: 'Scheduled ENACT Reminder',
          message: `It's time to open ENACT as scheduled for ${reminder.day}!`,
          date: nextDate,
          allowWhileIdle: true, // Important for delivery when device is idle
          repeatType: 'week',
          userInfo: {
            type: 'specific_reminder',
            day: reminder.day,
            time: `${reminder.hour}:${reminder.minute}`
          }
        });
        
        console.log(`Scheduled specific reminder for ${reminder.day} at ${reminder.hour}:${reminder.minute}`);
      }
    });
  };
  const addNewReminder = () => {
    const newReminder: ReminderTime = {
      id: Date.now().toString(),
      day: 'Monday',
      hour: 9,
      minute: 0,
      enabled: true,
    };
    
    setSpecificReminders([...specificReminders, newReminder]);
  };

  const deleteReminder = (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setSpecificReminders(specificReminders.filter(reminder => reminder.id !== id));
          }
        }
      ]
    );
  };

  const toggleReminderEnabled = (id: string) => {
    setSpecificReminders(specificReminders.map(reminder => {
      if (reminder.id === id) {
        return { ...reminder, enabled: !reminder.enabled };
      }
      return reminder;
    }));
  };

  const editReminderTime = (reminder: ReminderTime) => {
    setCurrentEditingReminder(reminder);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (selectedDate && currentEditingReminder) {
      const updatedReminders = specificReminders.map(reminder => {
        if (reminder.id === currentEditingReminder.id) {
          return {
            ...reminder,
            hour: selectedDate.getHours(),
            minute: selectedDate.getMinutes(),
          };
        }
        return reminder;
      });
      
      setSpecificReminders(updatedReminders);
    }
  };

  const editReminderDay = (reminder: ReminderTime) => {
    setCurrentEditingReminder(reminder);
    setShowDayPicker(true);
  };

  const selectDay = (day: string) => {
    if (currentEditingReminder) {
      const updatedReminders = specificReminders.map(reminder => {
        if (reminder.id === currentEditingReminder.id) {
          return { ...reminder, day };
        }
        return reminder;
      });
      
      setSpecificReminders(updatedReminders);
      setShowDayPicker(false);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
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
          <Text style={styles.headerTitle}>Reminder Settings</Text>
          <View style={styles.placeholderView} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Reminders</Text>
            
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Icon name="notifications" size={24} color="#4A90E2" style={styles.menuIcon} />
                <Text style={styles.menuText}>Enable Daily Reminders</Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#4A90E2" }}
                thumbColor={generalRemindersEnabled ? "#fff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setGeneralRemindersEnabled}
                value={generalRemindersEnabled}
              />
            </View>
            
            <Text style={styles.helperText}>
              When enabled, you'll receive a daily reminder to open the app.
            </Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Specific Reminders</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addNewReminder}
              >
                <Icon name="add" size={24} color="#4A90E2" />
              </TouchableOpacity>
            </View>
            
            {specificReminders.length === 0 ? (
              <Text style={styles.emptyText}>
                No specific reminders set. Tap the + button to add one.
              </Text>
            ) : (
              specificReminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminderItem}>
                  <Switch
                    trackColor={{ false: "#767577", true: "#4A90E2" }}
                    thumbColor={reminder.enabled ? "#fff" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={() => toggleReminderEnabled(reminder.id)}
                    value={reminder.enabled}
                    style={styles.reminderSwitch}
                  />
                  
                  <TouchableOpacity 
                    style={styles.dayButton}
                    onPress={() => editReminderDay(reminder)}
                  >
                    <Text style={styles.dayButtonText}>{reminder.day}</Text>
                    <Icon name="arrow-drop-down" size={20} color="#4A90E2" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => editReminderTime(reminder)}
                  >
                    <Text style={styles.timeButtonText}>
                      {formatTime(reminder.hour, reminder.minute)}
                    </Text>
                    <Icon name="access-time" size={20} color="#4A90E2" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteReminder(reminder.id)}
                  >
                    <Icon name="delete" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))
            )}
            
            <Text style={styles.helperText}>
              Set specific times to be reminded to use the app. These reminders will occur weekly on the days you select.
            </Text>
          </View>
        </ScrollView>
        
        {showTimePicker && currentEditingReminder && (
          <DateTimePicker
            value={new Date(2025, 0, 1, currentEditingReminder.hour, currentEditingReminder.minute)}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        )}
        
        {showDayPicker && (
          <View style={styles.dayPickerContainer}>
            <View style={styles.dayPickerHeader}>
              <Text style={styles.dayPickerTitle}>Select Day</Text>
              <TouchableOpacity 
                onPress={() => setShowDayPicker(false)}
                style={styles.closeDayPicker}
              >
                <Icon name="close" size={24} color="#4A90E2" />
              </TouchableOpacity>
            </View>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity 
                key={day}
                style={styles.dayPickerItem}
                onPress={() => selectDay(day)}
              >
                <Text style={styles.dayPickerItemText}>{day}</Text>
                {currentEditingReminder?.day === day && (
                  <Icon name="check" size={24} color="#4A90E2" />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reminderSwitch: {
    marginRight: 10,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 8,
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 8,
    flex: 1,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },
  deleteButton: {
    padding: 8,
  },
  dayPickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  dayPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  dayPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeDayPicker: {
    padding: 5,
  },
  dayPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayPickerItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ReminderSettingsScreen;