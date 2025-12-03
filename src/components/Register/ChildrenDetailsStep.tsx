import React, {useCallback, useMemo} from 'react';
import {Platform, StyleSheet, Text, TextInput, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';

interface ChildDetail {
  id: string;
  nickname: string;
  age: string;
}

interface ChildrenDetailsStepProps {
  childrenDetails: ChildDetail[];
  setChildrenDetails: React.Dispatch<React.SetStateAction<ChildDetail[]>>;
  RenderBackButton: () => React.ReactNode;
}

const ChildrenDetailsStep: React.FC<ChildrenDetailsStepProps> = ({
  childrenDetails,
  setChildrenDetails,
  RenderBackButton,
}) => {
  const ages = useMemo(
    () => [
      {value: '1', label: '1 year'},
      {value: '2', label: '2 years'},
      {value: '3', label: '3 years'},
      {value: '4', label: '4 years'},
      {value: '5', label: '5 years'},
    ],
    [],
  );

  const handleChildDetailChange = useCallback(
    (field: string, value: string, id: string) => {
      setChildrenDetails(prev =>
        prev.map(c => (c.id === id ? {...c, [field]: value} : c)),
      );
    },
    [],
  );

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <RenderBackButton />

        <View style={{flexDirection: 'column', alignItems: 'center'}}>
          <Text style={styles.stepTitle}>Children Details</Text>
          <Text style={styles.stepDescription}>
            Enter details for each child
          </Text>
        </View>

        <View style={{width: 22}} />
      </View>

      <View style={styles.scrollContentContainer}>
        {childrenDetails.map((child, index) => {
          return (
            <View key={child.id} style={styles.childDetailCard}>
              <Text style={styles.childNumber}>Child {index + 1}</Text>

              <TextInput
                style={styles.childInput}
                placeholder="Nickname (optional)"
                value={child.nickname}
                onChangeText={value =>
                  handleChildDetailChange('nickname', value, child.id)
                }
                placeholderTextColor="#A0A0A0"
              />

              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Age</Text>
                {Platform.OS === 'ios' ? (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={child.age}
                      onValueChange={value =>
                        handleChildDetailChange('age', value, child.id)
                      }
                      style={[styles.picker, styles.iosPicker]}
                      itemStyle={styles.iosPickerItem}>
                      <Picker.Item label="Select age" value="" />
                      {ages.map(age => (
                        <Picker.Item
                          key={age.value}
                          label={age.label}
                          value={age.value}
                        />
                      ))}
                    </Picker>
                  </View>
                ) : (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={child.age}
                      onValueChange={value =>
                        handleChildDetailChange('age', value, child.id)
                      }
                      style={styles.picker}>
                      <Picker.Item label="Select age" value="" />
                      {ages.map(age => (
                        <Picker.Item
                          key={age.value}
                          label={age.label}
                          value={age.value}
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ChildrenDetailsStep;

const styles = StyleSheet.create({
  // Children details styles
  scrollContentContainer: {
    paddingVertical: 8,
  },
  childDetailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  childNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  childInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  pickerWrapper: {
    width: '100%',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
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
  iosPicker: {
    height: 150,
    color: '#1F2937',
  },
  iosPickerItem: {
    fontSize: 16,
    height: 120,
  },
});
