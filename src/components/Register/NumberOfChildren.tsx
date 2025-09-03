import React from 'react';
import {Platform, StyleSheet, Text, TextInput, View} from 'react-native';
import {v4 as uuidv4} from 'uuid';

interface ChildDetail {
  id: string;
  nickname: string;
  birthMonth: string;
  birthYear: string;
}

interface NumberOfChildrenProps {
  numberOfChildren: string;
  setNumberOfChildren: (text: string) => void;
  setChildrenDetails: React.Dispatch<React.SetStateAction<ChildDetail[]>>;
  RenderBackButton: () => React.ReactNode;
}

const NumberOfChildren = ({
  numberOfChildren,
  setNumberOfChildren,
  setChildrenDetails,
  RenderBackButton,
}: NumberOfChildrenProps) => {
  const commonInputStyle = [
    styles.input,
    {borderColor: '#E0E0E0', backgroundColor: '#F5F5F5'},
  ];

  const handleNumberOfChildrenChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setNumberOfChildren(numericValue);

    const num = parseInt(numericValue, 10) || 0;

    setChildrenDetails(prevDetails => {
      const toAdd = Math.max(0, num - prevDetails.length);
      if (toAdd <= 0) return prevDetails.slice(0, num);

      const newItems: ChildDetail[] = Array.from({length: toAdd}, () => ({
        id: uuidv4(),
        nickname: '',
        birthYear: String(new Date().getFullYear()),
        birthMonth: '01',
      }));

      return [...prevDetails, ...newItems];
    });
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <RenderBackButton />

        <View style={{flexDirection: 'column', alignItems: 'center'}}>
          <Text style={styles.stepTitle}>Family Information</Text>
          <Text style={styles.stepDescription}>
            How many children do you have?
          </Text>
        </View>

        <View style={{width: 22}} />
      </View>

      <View style={styles.childrenCountContainer}>
        <TextInput
          style={[commonInputStyle, styles.childrenCountInput]}
          placeholder="Number of children"
          value={numberOfChildren}
          onChangeText={handleNumberOfChildrenChange}
          keyboardType="numeric"
          maxLength={2}
          placeholderTextColor="#A0A0A0"
        />
      </View>
    </View>
  );
};

export default NumberOfChildren;

const styles = StyleSheet.create({
  // Children count styles
  childrenCountContainer: {
    width: '100%',
  },
  childrenCountInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '500',
  },
  stepContainer: {
    width: '100%',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    flexWrap: 'wrap',
    width: 200,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
  },
});
