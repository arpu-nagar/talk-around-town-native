// ChildrenDetailsStep.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface ChildDetail {
  nickname: string;
  birthYear: string;
  birthMonth: string;
}

interface Props {
  numberOfChildren: string;
  childrenDetails: ChildDetail[];
  onChildDetailChange: (index: number, field: string, value: string) => void;
}

const { height } = Dimensions.get('window');

const ChildrenDetailsStep: React.FC<Props> = ({
  numberOfChildren,
  childrenDetails,
  onChildDetailChange,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => String(currentYear - i));
  
  const months = [
    {label: 'January', value: '01'},
    {label: 'February', value: '02'},
    {label: 'March', value: '03'},
    {label: 'April', value: '04'},
    {label: 'May', value: '05'},
    {label: 'June', value: '06'},
    {label: 'July', value: '07'},
    {label: 'August', value: '08'},
    {label: 'September', value: '09'},
    {label: 'October', value: '10'},
    {label: 'November', value: '11'},
    {label: 'December', value: '12'},
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Children Details</Text>
      <Text style={styles.stepDescription}>Tell us about your children</Text>
      <ScrollView 
        style={styles.childrenScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: parseInt(numberOfChildren) || 0 }).map((_, index) => (
          <View key={index} style={styles.childDetailCard}>
            <Text style={styles.childNumber}>Child {index + 1}</Text>
            
            <TextInput
              style={styles.childInput}
              placeholder="Nickname (optional)"
              value={childrenDetails[index]?.nickname || ''}
              onChangeText={(text) => onChildDetailChange(index, 'nickname', text)}
              maxLength={50}
              placeholderTextColor="#A0A0A0"
            />

            <View style={styles.dateSelectionContainer}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Birth Month</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={childrenDetails[index]?.birthMonth || '01'}
                    style={styles.picker}
                    onValueChange={(value) => onChildDetailChange(index, 'birthMonth', value)}
                  >
                    {months.map((month) => (
                      <Picker.Item 
                        key={month.value} 
                        label={month.label} 
                        value={month.value}
                        color="#333333"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Birth Year</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={childrenDetails[index]?.birthYear || currentYear.toString()}
                    style={styles.picker}
                    onValueChange={(value) => onChildDetailChange(index, 'birthYear', value)}
                  >
                    {years.map((year) => (
                      <Picker.Item 
                        key={year} 
                        label={year} 
                        value={year}
                        color="#333333"
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  childrenScrollView: {
    maxHeight: height * 0.5,
    width: '100%',
  },
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
  },
  dateSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerWrapper: {
    flex: 1,
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
  },
});

export default ChildrenDetailsStep;