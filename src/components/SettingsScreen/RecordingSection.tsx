import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAudioRecording} from '../../context/AudioRecordingContext';

interface ParentStyles {
  section: ViewStyle;
  sectionTitle: TextStyle;
  menuItem: ViewStyle;
  itemLeft: ViewStyle;
  menuIcon: ViewStyle;
  menuText: TextStyle;
}

interface RecordingSectionProps {
  styles: ParentStyles;
  onViewRecordings: () => void;
}

const RecordingSection: React.FC<RecordingSectionProps> = ({
  styles: parentStyles,
  onViewRecordings,
}) => {
  const {
    isRecording,
    recordingDuration,
    savedRecordings,
    startRecording,
    stopRecording,
    formatDuration,
  } = useAudioRecording();

  const handleRecordPress = () => {
    if (isRecording) {
      Alert.alert(
        'Stop Recording?',
        'Are you sure you want to stop the recording before the 15-minute timer?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Stop', style: 'destructive', onPress: stopRecording},
        ],
      );
    } else {
      Alert.alert(
        'Start Recording',
        'This will record audio for 15 minutes, even if you close the app. Make sure you are in a location where recording is appropriate.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Start', onPress: () => startRecording()},
        ],
      );
    }
  };

  const remainingTime = 15 * 60 - recordingDuration;
  const progressPercent = (recordingDuration / (15 * 60)) * 100;

  return (
    <View style={parentStyles.section}>
      <Text style={parentStyles.sectionTitle}>Research Tools</Text>

      <TouchableOpacity
        style={[
          parentStyles.menuItem,
          isRecording && localStyles.recordingActive,
        ]}
        onPress={handleRecordPress}>
        <View style={parentStyles.itemLeft}>
          <Icon
            name={isRecording ? 'stop-circle' : 'mic'}
            size={22}
            color={isRecording ? '#FF3B30' : '#6366F1'}
            style={parentStyles.menuIcon}
          />
          <View>
            <Text style={parentStyles.menuText}>
              {isRecording ? 'Recording in Progress' : 'Record Audio Session'}
            </Text>
            {isRecording && (
              <Text style={localStyles.timerText}>
                {formatDuration(recordingDuration)} / 15:00
              </Text>
            )}
          </View>
        </View>

        <View style={localStyles.rightContainer}>
          {isRecording ? (
            <View style={localStyles.recordingIndicator}>
              <View style={localStyles.pulseDot} />
              <Text style={localStyles.recordingText}>LIVE</Text>
            </View>
          ) : (
            <Icon name="chevron-right" size={20} color="#1F2937" />
          )}
        </View>
      </TouchableOpacity>

      {isRecording && (
        <View style={localStyles.progressContainer}>
          <View style={localStyles.progressBar}>
            <View
              style={[localStyles.progressFill, {width: `${progressPercent}%`}]}
            />
          </View>
          <Text style={localStyles.progressText}>
            Recording will auto-stop in {formatDuration(remainingTime)}
          </Text>
        </View>
      )}

      {!isRecording && (
        <Text style={localStyles.infoText}>
          Record a 15-minute audio session at the park. Recording continues in
          background.
        </Text>
      )}

      <TouchableOpacity
        style={[parentStyles.menuItem, {borderBottomWidth: 0}]}
        onPress={onViewRecordings}>
        <View style={parentStyles.itemLeft}>
          <Icon
            name="folder"
            size={22}
            color="#6366F1"
            style={parentStyles.menuIcon}
          />
          <Text style={parentStyles.menuText}>View Recordings</Text>
          {savedRecordings.length > 0 && (
            <View style={localStyles.countBadge}>
              <Text style={localStyles.countBadgeText}>
                {savedRecordings.length}
              </Text>
            </View>
          )}
        </View>
        <Icon name="chevron-right" size={20} color="#1F2937" />
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  recordingActive: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  timerText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  recordingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  countBadge: {
    backgroundColor: '#5856D6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RecordingSection;
