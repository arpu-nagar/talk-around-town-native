import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

const facts = [
  'Did you know? Babies can distinguish between languages from birth.',
  'Fun fact: Children learn 5-10 new words per day between ages 2-5.',
  'Interesting: Bilingual children often have better problem-solving skills.',
  'Did you know? Babies can distinguish between languages from birth.',
  'Fun fact: Children learn 5-10 new words per day between ages 2-5.',
  'Interesting: Bilingual children often have better problem-solving skills.',
  'Did you know? Babies can distinguish between languages from birth.',
  'Fun fact: Children learn 5-10 new words per day between ages 2-5.',
];
// @ts-ignore
const Loader = ({isLoading}) => {
  const [progress, setProgress] = useState(0);
  const [currentFact, setCurrentFact] = useState('');

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 100 /4.5, 100);
          //   if (Math.floor(newProgress) % 20 === 0) {
          setCurrentFact(facts[Math.floor(Math.random() * facts.length)]);
          //   }
          return newProgress;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, {width: `${progress}%`}]} />
      </View>
      <Text style={styles.factText}>{currentFact}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  progressBarContainer: {
    width: width * 0.8,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  factText: {
    marginTop: 20,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default Loader;
