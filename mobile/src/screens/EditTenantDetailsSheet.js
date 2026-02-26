import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { propertyApi } from '../api/propertyApi';

function EditTenantDetailsSheet({ route, navigation }) {
  const { tenantId, unitId, propertyId, initialDetails, onSuccess } = route.params;

  const [tenantName, setTenantName] = useState(initialDetails?.tenantName || '');
  const [contactNumber, setContactNumber] = useState(initialDetails?.tenantContactNumber || '');
  const [governmentId, setGovernmentId] = useState(initialDetails?.governmentId || '');
  const [governmentTypeId, setGovernmentTypeId] = useState(initialDetails?.governmentTypeId || null);
  const [governmentTypes, setGovernmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    fetchData();
    const keyboardWillShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardWillHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(keyboardWillShow, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(keyboardWillHide, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const types = await propertyApi.getGovernmentIdTypes();
      setGovernmentTypes(types || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate input
    if (!tenantName.trim()) {
      Alert.alert('Validation', 'Tenant name is required');
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert('Validation', 'Contact number is required');
      return;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      Alert.alert('Validation', 'Contact number must be 10 digits');
      return;
    }

    try {
      setIsSaving(true);
      await propertyApi.updateTenantDetails(tenantId, {
        tenantName: tenantName.trim(),
        tenantContactNumber: contactNumber.trim(),
        governmentId: governmentId?.trim() || null,
        governmentTypeId: governmentTypeId || null,
      });

      Alert.alert('Success', 'Tenant details updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (onSuccess) onSuccess();
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      console.error('Error updating tenant:', err);
      Alert.alert('Error', err.message || 'Failed to update tenant details');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="#4f39f6" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: 'white',
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#e8e5ff',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#4f39f6" />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#1e2939',
              textAlign: 'center',
            }}
          >
            Edit Tenant Details
          </Text>
        </View>

        {/* Placeholder Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
          }}
        />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexGrow: 1,
          paddingBottom: isKeyboardVisible ? 20 : 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tenant Name Input */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <Ionicons name="person" size={16} color="#4f39f6" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#364153',
              }}
            >
              Tenant Name
              <Text style={{ color: '#fb2c36' }}> *</Text>
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: 14,
              borderWidth: 1.108,
              borderColor: '#e5e7eb',
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 14,
              color: '#1e2939',
            }}
            placeholder="Enter full name"
            placeholderTextColor="rgba(10,10,10,0.5)"
            value={tenantName}
            onChangeText={setTenantName}
          />
        </View>

        {/* Contact Number Input */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <Ionicons name="call" size={16} color="#4f39f6" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#364153',
              }}
            >
              Contact Number
              <Text style={{ color: '#fb2c36' }}> *</Text>
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: 14,
              borderWidth: 1.108,
              borderColor: '#e5e7eb',
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 14,
              color: '#1e2939',
            }}
            placeholder="Enter contact number"
            placeholderTextColor="rgba(10,10,10,0.5)"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* GOVERNMENT ID SECTION */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 12 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#1e2939',
            }}
          >
            Government ID
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#9ca3af',
              marginLeft: 6,
            }}
          >
            (Optional)
          </Text>
        </View>

        {/* Government ID Type Buttons */}
        {governmentTypes.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
              <Ionicons name="document-text" size={16} color="#4f39f6" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#364153',
                }}
              >
                ID Type
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {governmentTypes.map((type) => (
                <TouchableOpacity
                  key={type.governmentIdTypeId}
                  onPress={() => {
                    if (governmentTypeId === type.governmentIdTypeId) {
                      setGovernmentTypeId(null);
                    } else {
                      setGovernmentTypeId(type.governmentIdTypeId);
                    }
                  }}
                  style={{
                    backgroundColor: governmentTypeId === type.governmentIdTypeId ? '#4f39f6' : '#f3f4f6',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: governmentTypeId === type.governmentIdTypeId ? 'white' : '#1e2939',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {type.governmentIdTypeName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Government ID Input */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <Ionicons name="shield-checkmark" size={16} color="#4f39f6" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#364153',
              }}
            >
              ID Number
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: 14,
              borderWidth: 1.108,
              borderColor: '#e5e7eb',
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 14,
              color: '#1e2939',
            }}
            placeholder="Enter ID number"
            placeholderTextColor="rgba(10,10,10,0.5)"
            value={governmentId}
            onChangeText={setGovernmentId}
          />
        </View>

      </ScrollView>

      {/* Action Buttons */}
      {!isKeyboardVisible && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: '#4f39f6',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* Move Out Button */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Confirm Move Out',
                'Mark this tenant as moved out (inactive)?',
                [
                  { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                  {
                    text: 'Move Out',
                    onPress: async () => {
                      try {
                        setIsSaving(true);
                        await propertyApi.markTenantAsInactive(tenantId);
                        // Navigate back to the Tenants screen for this unit
                        navigation.navigate('Tenants', {
                          unitId,
                          propertyId,
                        });
                      } catch (err) {
                        Alert.alert('Error', err.message || 'Failed to mark tenant as moved out');
                      } finally {
                        setIsSaving(false);
                      }
                    },
                    style: 'destructive',
                  },
                ]
              );
            }}
            disabled={isSaving}
            style={{
              backgroundColor: '#fed7aa',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#b45309' }}>Moved Out</Text>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Delete Tenant',
                'This will permanently delete this tenant and all associated records. This action cannot be undone.',
                [
                  { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                  {
                    text: 'Delete',
                    onPress: async () => {
                      try {
                        setIsSaving(true);
                        await propertyApi.deleteTenant(tenantId);
                        // Navigate back to the Tenants screen for this unit
                        navigation.navigate('Tenants', {
                          unitId,
                          propertyId,
                        });
                      } catch (err) {
                        Alert.alert('Error', err.message || 'Failed to delete tenant');
                      } finally {
                        setIsSaving(false);
                      }
                    },
                    style: 'destructive',
                  },
                ]
              );
            }}
            disabled={isSaving}
            style={{
              backgroundColor: '#fecaca',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#dc2626' }}>Delete Tenant</Text>
          </TouchableOpacity>
        </View>
      )}

    </LinearGradient>
  );
}

export default EditTenantDetailsSheet;
