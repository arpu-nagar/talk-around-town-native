import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface Child {
  id: number;
  nickname?: string;
  date_of_birth: string;
  age?: number;
}

interface NewChild {
  nickname: string;
  birthYear: string;
  birthMonth: string;
}

interface ChildInfoModalProps {
  visible: boolean;
  onClose: () => void;
  children: Child[];
  userToken: string;
  onChildrenUpdate: () => void;
}

const ChildInfoModal: React.FC<ChildInfoModalProps> = ({
  visible,
  onClose,
  children,
  userToken,
  onChildrenUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChild, setNewChild] = useState<NewChild>({
    nickname: '',
    birthYear: new Date().getFullYear().toString(),
    birthMonth: '01'
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => String(currentYear - i));
  const months = [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' }
  ];

  const getDateParts = (dateString: string) => {
    const date = new Date(dateString);
    return {
      year: date.getFullYear().toString(),
      month: (date.getMonth() + 1).toString().padStart(2, '0')
    };
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!editingChild) return;
  
    try {
      setIsLoading(true);
      setError(null);
      
      // Log the request data for debugging
      console.log('Updating child with data:', editingChild);
  
      const response = await fetch(`http://localhost:1337/endpoint/updateChildren`, {
        method: 'POST', // Changed from PUT to POST based on your router setup
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          children: [{
            id: editingChild.id,
            nickname: editingChild.nickname,
            date_of_birth: editingChild.date_of_birth
          }]
        })
      });
  
      // Log the response for debugging
      console.log('Server response:', await response.clone().text());
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update child information');
      }
  
      const data = await response.json();
      Alert.alert('Success', 'Child information updated successfully');
      setIsEditing(false);
      setEditingChild(null);
      onChildrenUpdate();
    } catch (error) {
      console.error('Update child error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update child information');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdd = async () => {
    if (!newChild.nickname || !newChild.birthYear || !newChild.birthMonth) {
      Alert.alert('Required Fields', 'Please fill in all fields');
      return;
    }
  
    try {
      setIsLoading(true);
      setError(null);
      
      const childData = {
        nickname: newChild.nickname,
        date_of_birth: `${newChild.birthYear}-${newChild.birthMonth}-01`
      };
      
      console.log('Adding child with data:', childData);
  
      const response = await fetch('http://localhost:1337/endpoint/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(childData)
      });
  
      const responseText = await response.text();
      console.log('Server response:', responseText);
  
      try {
        const data = JSON.parse(responseText);
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to add child');
        }
  
        Alert.alert('Success', data.message || 'Child added successfully');
        setShowAddForm(false);
        setNewChild({
          nickname: '',
          birthYear: new Date().getFullYear().toString(),
          birthMonth: '01'
        });
        onChildrenUpdate();
      } catch (e) {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error('Add child error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add child');
    } finally {
      setIsLoading(false);
    }
  };

  

  const renderChildForm = (isNew: boolean) => {
    if (isNew) {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={newChild.nickname}
            onChangeText={(text) => setNewChild({ ...newChild, nickname: text })}
            placeholder="Enter nickname"
          />

          <View style={styles.dateContainer}>
            <View style={styles.pickerContainer}>
              <Text style={styles.formLabel}>Birth Month</Text>
              <Picker
                selectedValue={newChild.birthMonth}
                style={styles.picker}
                onValueChange={(value) => setNewChild({ ...newChild, birthMonth: value })}
              >
                {months.map((month) => (
                  <Picker.Item key={month.value} label={month.label} value={month.value} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.formLabel}>Birth Year</Text>
              <Picker
                selectedValue={newChild.birthYear}
                style={styles.picker}
                onValueChange={(value) => setNewChild({ ...newChild, birthYear: value })}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleAdd}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!editingChild) return null;

    const dateParts = getDateParts(editingChild.date_of_birth);

    return (
      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>Nickname</Text>
        <TextInput
          style={styles.input}
          value={editingChild.nickname}
          onChangeText={(text) => setEditingChild({ ...editingChild, nickname: text })}
          placeholder="Enter nickname"
        />

        <View style={styles.dateContainer}>
          <View style={styles.pickerContainer}>
            <Text style={styles.formLabel}>Birth Month</Text>
            <Picker
              selectedValue={dateParts.month}
              style={styles.picker}
              onValueChange={(value) => {
                setEditingChild({
                  ...editingChild,
                  date_of_birth: `${dateParts.year}-${value}-01`
                });
              }}
            >
              {months.map((month) => (
                <Picker.Item key={month.value} label={month.label} value={month.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.formLabel}>Birth Year</Text>
            <Picker
              selectedValue={dateParts.year}
              style={styles.picker}
              onValueChange={(value) => {
                setEditingChild({
                  ...editingChild,
                  date_of_birth: `${value}-${dateParts.month}-01`
                });
              }}
            >
              {years.map((year) => (
                <Picker.Item key={year} label={year} value={year} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setIsEditing(false);
              setEditingChild(null);
            }}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleUpdate}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Your Children</Text>
          
          {!isEditing && !showAddForm ? (
            <>
            {isLoading && <ActivityIndicator size="large" color="#007AFF" />}
{error && <Text style={styles.errorText}>{error}</Text>}
{!isLoading && !error && children.length === 0 && (
  <Text style={styles.noChildrenText}>No children added yet</Text>
)}
              <ScrollView style={styles.childrenList}>
                {children.length > 0 ? (
                  children.map((child) => (
                    <View key={child.id} style={styles.childItem}>
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>
                          {child.nickname || `Child ${child.id}`}
                        </Text>
                        <Text style={styles.childDate}>
                          Birth date: {new Date(child.date_of_birth).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(child)}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noChildrenText}>No children added yet</Text>
                )}
              </ScrollView>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.addButton]}
                  onPress={() => setShowAddForm(true)}
                >
                  <Text style={styles.buttonText}>Add Child</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.closeButton]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            renderChildForm(showAddForm)
          )}
        </View>
      </View>
    </Modal>
  )};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  childrenList: {
    maxHeight: 300
  },
  childItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  childInfo: {
    flex: 1
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  childDate: {
    fontSize: 14,
    color: '#666'
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    marginLeft: 10
  },
  editButtonText: {
    color: 'white',
    fontSize: 14
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4
  },
  addButton: {
    backgroundColor: '#34C759'
  },
  closeButton: {
    backgroundColor: '#8E8E93'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500'
  },
  formContainer: {
    padding: 16
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 4
  },
  picker: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    backgroundColor: '#FF3B30'
  },
  saveButton: {
    backgroundColor: '#34C759'
  },
  noChildrenText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'red',
    marginVertical: 20
  }
});

export default ChildInfoModal;