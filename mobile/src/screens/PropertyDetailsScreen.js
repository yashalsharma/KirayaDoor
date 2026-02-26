import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { propertyApi } from '../api/propertyApi';

export default function PropertyDetailsScreen({ navigation, route }) {
  const { userId, property, propertyId } = route.params;
  // Determine if this is a new property - check current route params
  const isNew = route.params?.isNew === true;

  const [propertyName, setPropertyName] = useState(
    isNew ? '' : property?.propertyName || ''
  );
  const [unitCount, setUnitCount] = useState(
    isNew ? '' : property?.unitCount.toString() || ''
  );
  const [addressText, setAddressText] = useState(
    isNew ? '' : property?.address?.addressText || ''
  );
  const [gpsLocation, setGpsLocation] = useState(
    isNew ? null : property?.address?.location || null
  );
  const [loading, setLoading] = useState(false);

  // Listen for location result when returning from LocationPicker
  useEffect(() => {
    if (route.params?.selectedAddress && route.params?.selectedCoordinates) {
      setAddressText(route.params.selectedAddress);
      const { latitude, longitude } = route.params.selectedCoordinates;
      setGpsLocation(`${latitude},${longitude}`);
    }
  }, [route.params?.selectedAddress, route.params?.selectedCoordinates]);

  const isFormValid =
    propertyName.trim().length > 0 &&
    unitCount.trim().length > 0 &&
    (addressText.trim().length > 0 || gpsLocation);

  const handleUseLocation = () => {
    navigation.navigate('LocationPicker', {
      originalRoute: route.params,
    });
  };

  const handleAddressTextChange = (text) => {
    setAddressText(text);
    // If user changes address text, clear GPS location
    if (gpsLocation) {
      setGpsLocation(null);
    }
  };

  const handleContinue = async () => {
    if (!propertyName.trim()) {
      Alert.alert('Error', 'Please enter property name');
      return;
    }

    if (!unitCount.trim()) {
      Alert.alert('Error', 'Please enter number of units');
      return;
    }

    if (parseInt(unitCount) < 1) {
      Alert.alert('Error', 'Units must be at least 1');
      return;
    }

    if (!addressText.trim() && !gpsLocation) {
      Alert.alert('Error', 'Please enter an address or use location');
      return;
    }

    try {
      setLoading(true);

      if (isNew) {
        // Create new property
        const response = await propertyApi.createProperty({
          ownerId: userId,
          propertyName: propertyName.trim(),
          unitCount: parseInt(unitCount),
          addressText: addressText.trim(),
          location: gpsLocation,
        });

        // Use replace instead of navigate so back button goes to PropertiesList
        navigation.replace('Units', {
          propertyId: response.propertyId,
          propertyName: response.propertyName,
          isNew: true,
        });
      } else {
        // Update existing property
        await propertyApi.updateProperty(propertyId, {
          propertyName: propertyName.trim(),
          addressText: addressText.trim(),
          location: gpsLocation,
        });

        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Consistent Header - Figma Style */}
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
          {/* Back Button - Figma Style */}
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

          {/* Header Title - Center */}
          <View style={{ flex: 1, marginHorizontal: 12, justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#1e2939',
              }}
            >
              {isNew ? 'Add Property' : 'Edit Property'}
            </Text>
          </View>

          {/* Header Icon */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#e0e7ff',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="home" size={22} color="#4f39f6" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 24,
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 361,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 25 },
              shadowOpacity: 0.25,
              shadowRadius: 50,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: '#e0e7ff',
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="home" size={28} color="#4f39f6" />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1e2939',
                  marginBottom: 8,
                }}
              >
                {isNew ? 'Property Details' : 'Edit Property'}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#4a5565',
                  textAlign: 'center',
                }}
              >
                {isNew
                  ? 'Add your property information'
                  : 'Update property details'}
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 20 }}>
              {/* Property Name */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                  }}
                >
                  Property Name *
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 14,
                    paddingLeft: 16,
                    height: 50,
                    backgroundColor: '#fff',
                  }}
                >
                  <Ionicons name="home" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1e2939',
                    }}
                    placeholder="Enter property name"
                    placeholderTextColor="rgba(30, 41, 59, 0.5)"
                    value={propertyName}
                    onChangeText={setPropertyName}
                  />
                </View>
              </View>

              {/* Unit Count */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                  }}
                >
                  Number of Units *
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 14,
                    paddingLeft: 16,
                    height: 50,
                    backgroundColor: isNew ? '#fff' : '#f3f4f6',
                  }}
                >
                  <Ionicons name="layers" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1e2939',
                      fontWeight: '500',
                    }}
                    placeholder="Enter number of units"
                    placeholderTextColor="rgba(30, 41, 59, 0.5)"
                    keyboardType="number-pad"
                    value={unitCount}
                    onChangeText={setUnitCount}
                    editable={isNew}
                  />
                </View>
                {!isNew && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                      fontStyle: 'italic',
                    }}
                  >
                    Unit count can be changed from Units screen
                  </Text>
                )}
              </View>

              {/* Address */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                  }}
                >
                  Address *
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 14,
                    paddingLeft: 16,
                    height: 50,
                    backgroundColor: '#fff',
                  }}
                >
                  <Ionicons name="location" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1e2939',
                    }}
                    placeholder="Enter address"
                    placeholderTextColor="rgba(30, 41, 59, 0.5)"
                    value={addressText}
                    onChangeText={handleAddressTextChange}
                  />
                </View>
              </View>

              {/* GPS Location Display */}
              {gpsLocation && (
                <View
                  style={{
                    backgroundColor: '#f0fdf4',
                    borderLeftWidth: 4,
                    borderLeftColor: '#22c55e',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#16a34a',
                      fontWeight: '500',
                    }}
                  >
                    📍 GPS Location Set: {gpsLocation}
                  </Text>
                </View>
              )}

              {/* Use Location Button */}
              <TouchableOpacity
                onPress={handleUseLocation}
                style={{
                  borderWidth: 1,
                  borderColor: '#4f39f6',
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="map" size={20} color="#4f39f6" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#4f39f6',
                  }}
                >
                  Use Location
                </Text>
              </TouchableOpacity>

              {/* Continue Button */}
              <TouchableOpacity
                onPress={handleContinue}
                disabled={!isFormValid || loading}
                style={{
                  backgroundColor: isFormValid ? '#4f39f6' : '#d1d5db',
                  borderRadius: 14,
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: isFormValid ? 'white' : '#999',
                  }}
                >
                  {loading ? 'Processing...' : 'Continue'}
                </Text>
                {!loading && (
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={isFormValid ? 'white' : '#999'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

