import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions, ActivityIndicator} from 'react-native';

const {width} = Dimensions.get('window');

const facts = [
  'Did you know? Babies can distinguish between languages from birth.',
  'Fun fact: Children learn 5-10 new words per day between ages 2-5.',
  'Interesting: Bilingual children often have better problem-solving skills.',
  'Tip: Reading to your child for just 15 minutes daily significantly boosts vocabulary.',
  'Note: Children learn language best through back-and-forth conversations.',
  'Research shows: Music and singing help children develop language skills faster.',
  'Did you know? Children understand words long before they can speak them.',
  'Fun fact: Gestures are an important precursor to verbal language development.',
];

// @ts-ignore
const Loader = ({isLoading}) => {
  const [currentFact, setCurrentFact] = useState('');

  useEffect(() => {
    if (isLoading) {
      // Set initial fact immediately when loading starts
      setCurrentFact(facts[Math.floor(Math.random() * facts.length)]);
      
      // Change fact every 5 seconds
      const interval = setInterval(() => {
        setCurrentFact(facts[Math.floor(Math.random() * facts.length)]);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Generating tips for you...</Text>
        <Text style={styles.factText}>{currentFact}</Text>
      </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  loaderBox: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
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
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  factText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});

export default Loader;