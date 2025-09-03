import React, {useCallback, useMemo} from 'react';
import {Platform, StyleSheet, Text, TextInput, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {ScrollView} from 'react-native';

interface ChildDetail {
  id: string;
  nickname: string;
  birthMonth: string;
  birthYear: string;
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
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({length: 18}, (_, i) => String(currentYear - i)),
    [currentYear],
  );

  const months = useMemo(
    () => [
      {value: '01', label: 'January'},
      {value: '02', label: 'February'},
      {value: '03', label: 'March'},
      {value: '04', label: 'April'},
      {value: '05', label: 'May'},
      {value: '06', label: 'June'},
      {value: '07', label: 'July'},
      {value: '08', label: 'August'},
      {value: '09', label: 'September'},
      {value: '10', label: 'October'},
      {value: '11', label: 'November'},
      {value: '12', label: 'December'},
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

      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="always">
        {childrenDetails.map((child, index) => {
          console.log('child', child);
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

              <View style={styles.dateSelectionContainer}>
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerLabel}>Birth Month</Text>
                  {Platform.OS === 'ios' ? (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={child.birthMonth}
                        onValueChange={value =>
                          handleChildDetailChange('birthMonth', value, child.id)
                        }
                        style={[styles.picker, styles.iosPicker]}
                        itemStyle={styles.iosPickerItem}>
                        {months.map(month => (
                          <Picker.Item
                            key={month.value}
                            label={month.label}
                            value={month.value}
                          />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={child.birthMonth}
                        onValueChange={value =>
                          handleChildDetailChange('birthMonth', value, child.id)
                        }
                        style={styles.picker}>
                        {months.map(month => (
                          <Picker.Item
                            key={month.value}
                            label={month.label}
                            value={month.value}
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                </View>

                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerLabel}>Birth Year</Text>
                  {Platform.OS === 'ios' ? (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={child.birthYear}
                        onValueChange={value =>
                          handleChildDetailChange('birthYear', value, child.id)
                        }
                        style={[styles.picker, styles.iosPicker]}
                        itemStyle={styles.iosPickerItem}>
                        {years.map(year => (
                          <Picker.Item key={year} label={year} value={year} />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={child.birthYear}
                        onValueChange={value =>
                          handleChildDetailChange('birthYear', value, child.id)
                        }
                        style={styles.picker}>
                        {years.map(year => (
                          <Picker.Item key={year} label={year} value={year} />
                        ))}
                      </Picker>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    height: 200, // Increased height for iOS
    color: '#1F2937',
  },
  iosPickerItem: {
    fontSize: 16,
    height: 120, // Taller items for better scrolling
  },
});
