// export default HomeScreen;
import React, {useContext, useEffect, useState} from 'react';
import {Button, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import {AuthContext} from '../context/AuthContext';
import Tts from 'react-native-tts';

const HomeScreen = ({route}: {route: any}) => {
  const {userInfo, isLoading, logout} = useContext<any>(AuthContext);
  const {notificationTitle} = route.params || {};
  const {aiTips} = useContext<any>(AuthContext);

  const [tips, setTips] = useState<any>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'http://68.183.102.75:1337/api/tips/get-tips',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userInfo.access_token}`,
            },
            body: JSON.stringify({
              type: notificationTitle,
              AI: aiTips,
            }),
          },
        );
        const responseJson = await response.json();
        setTips(responseJson);
      } catch (e) {
        console.log(`get-tips error ${e}`);
      }
    };

    fetchData();

    // Initialize TTS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);

    // Cleanup TTS when component unmounts
    return () => {
      Tts.stop();
    };
  }, []);

  const speakTip = (tip: any) => {
    setIsSpeaking(true);
    Tts.speak(`${tip.title}. ${tip.description}`);
    setIsSpeaking(false);
  };

  const speakAllTips = () => {
    if (isSpeaking) {
      Tts.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      tips.forEach((tip: any, index: number) => {
        Tts.speak(`Tip ${index + 1}. ${tip.title}. ${tip.description}`);
      });
      Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
    }
  };

  if (tips.length === 0) {
    return (
      <View style={styles.container}>
        <Spinner visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Hey {userInfo.user.name}, engage with your child with these tips:
      </Text>
      <TouchableOpacity style={styles.speakButton} onPress={speakAllTips}>
        <Text style={styles.speakButtonText}>
          {isSpeaking ? 'Stop Speaking' : 'Speak All Tips'}
        </Text>
      </TouchableOpacity>
      <View style={styles.tipContainer}>
        {tips.map((tip: any) => (
          <TouchableOpacity key={tip.id} onPress={() => speakTip(tip)}>
            <Text style={styles.tip_title}>
              {'▶️'} {tip.title}
            </Text>
            <Text style={styles.tip}>{tip.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  welcome: {
    fontSize: 24,
    marginBottom: 8,
    color: 'black',
  },
  tipContainer: {
    marginVertical: 16,
    width: '100%',
  },
  tip_title: {
    fontSize: 22,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tip: {
    backgroundColor: '#4285F4',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    textAlign: 'left',
    fontSize: 18,
  },
  speakButton: {
    backgroundColor: '#34A853',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  speakButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default HomeScreen;
