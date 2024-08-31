import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Button,
  Dimensions,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {LogBox} from 'react-native';
import Sound from 'react-native-sound';
import Loader from './Loader';

LogBox.ignoreLogs(['new NativeEventEmitter()']);
var p = '';
const VoiceTipsApp = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('Get tips...');
  const [transcript1, setTranscript1] = useState('');
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commonQuestions, setCommonQuestions] = useState([]);
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const onSpeechResults = async (e: any) => {
    // setIsListening(false);
    // setIsProcessingSpeech(false);
    console.log('Speech results:', e.value[0]);
    // console.log(transcript)
    p = e.value[0];
    let t = e.value[0];
    setTranscript(t);
    // setTranscript1(t);
    // setTranscript(prev => e.value[0]);
    // console.log(transcript1, t)
    if (isListening) {
      console.log('Listening');
    } else {
      // console.log('Transcript:', transcript);
      // getTips(transcript);
      setIsListening(false);
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = () => {
      setIsProcessingSpeech(false);
      setIsListening(false);
    };
    Voice.onSpeechEnd = async () => {
      console.log('the end');
      console.log('Transcript end:', transcript);
      setIsProcessingSpeech(false);
      setIsListening(false);
      await Voice.stop();
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (currentSound) {
        // @ts-ignore
        currentSound.release();
      }
    };
  }, []);
  const [score, setScore] = useState(0);
  const [starPosition, setStarPosition] = useState({top: 0, left: 0});

  const moveStar = () => {
    setStarPosition({
      top: Math.random() * (Dimensions.get('window').height - 50),
      left: Math.random() * (Dimensions.get('window').width - 50),
    });
  };

  useEffect(() => {
    if (isLoading) {
      moveStar();
    }
  }, [isLoading]);
  // useEffect(() => {
  //   // setTranscript1(transcript);
  //   // setTranscript1(transcript);
  //   console.log('Transcript1:', transcript1);
  //   console.log('Transcript:', transcript);
  // }, [transcript]);

  const startListening = async () => {
    try {
      await Voice.start('en-US');
      setIsListening(true);
      setIsProcessingSpeech(true);

      // Set a timeout to reset the state if no result is received
      setTimeout(async () => {
        console.log('Timeout reached');
        setIsProcessingSpeech(false);
        setIsListening(false);
        console.log('Transcript fun prev:', transcript1, transcript);
        await Voice.stop();
        // getTips(transcript1);
        getTips();
      }, 5000); // 10 seconds timeout
    } catch (e) {
      console.error(e);
    }
  };

  const getTips = async () => {
    // WTF IS GOING ON HERE
    let query = p;
    console.log('Query:', query);
    setIsLoading(true);
    try {
      // console.log('here');
      const response = await fetch('http://68.183.102.75:4000/generate-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({prompt: query}),
      });
      const data = await response.json();
      setTips(data.tips);
      setCommonQuestions(data.commonQuestions);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakTip = (audioUrl: any) => {
    if (currentSound) {
      // @ts-ignore
      currentSound.stop();
      // @ts-ignore
      currentSound.release();
    }
    setIsPlaying(true);
    audioUrl = 'http://68.183.102.75:4000/audio' + audioUrl;
    console.log('Playing audio:', audioUrl);
    const sound = new Sound(audioUrl, '', error => {
      if (error) {
        console.log('Failed to load the sound', error);
        setIsPlaying(false);
        return;
      }
      sound.play(success => {
        setIsPlaying(false);
        if (success) {
          console.log('Successfully finished playing');
        } else {
          console.log('Playback failed due to audio decoding errors');
        }
        sound.release();
      });
    });
    // @ts-ignore
    setCurrentSound(sound);
  };
  // if (isLoading) {
  //   return <Loader isLoading={isLoading} />;
  // }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.transcriptContainer}>
          <Text style={styles.headerText}>{transcript}</Text>
        </View>
        <TouchableOpacity
          onPress={startListening}
          style={[
            styles.micButton,
            isProcessingSpeech && styles.micButtonActive,
          ]}>
          <MaterialCommunityIcons
            name={isListening ? 'microphone' : 'microphone-outline'}
            size={24}
            color={isProcessingSpeech ? 'white' : 'black'}
          />
        </TouchableOpacity>
      </View>
      <>{isLoading && <Loader isLoading={isLoading} />}</>
      <>
        {/* // if not loading display below */}
        {!isLoading && (
          <ScrollView style={styles.tipsContainer}>
            {(tips as any).map((tip: any, index: number) => (
              <View key={index} style={styles.tipBox}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipBody}>{tip.body}</Text>
                <Text style={styles.tipBody}>{tip.details}</Text>
                {/* // add tip details
                 */}

                <TouchableOpacity
                  style={styles.speakButton}
                  onPress={() => speakTip(tip.audioUrl)}
                  disabled={isPlaying}>
                  <MaterialCommunityIcons
                    name="volume-high"
                    size={24}
                    color="black"
                  />
                  <Text style={styles.speakButtonText}>Speak</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </>
      {/* <Button
        title="Common Questions"
        onPress={() => {
          const testUrl =
            '/tip_1721065750188.mp3';
          speakTip(testUrl);
        }}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  transcriptContainer: {
    flex: 1,
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
  },
  micButton: {
    padding: 10,
  },
  tipsContainer: {
    marginTop: 20,
  },
  micButtonActive: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  tipBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tipBody: {
    fontSize: 16,
    marginBottom: 10,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  speakButtonText: {
    marginLeft: 5,
    fontSize: 16,
  },
  gameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  star: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starEmoji: {
    fontSize: 40,
  },
});

export default VoiceTipsApp;
