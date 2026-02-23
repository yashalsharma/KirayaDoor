import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api/authApi';

export default function OwnerPropertyScreen({ navigation, route }) {
  const { mobileNumber, userId, emailAddress } = route.params;
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState(emailAddress || '');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [loading, setLoading] = useState(false);

  const isFormValid = ownerName.trim().length > 0;

  const handleAddProperty = async () => {
    if (!ownerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setLoading(true);

      // Call API to update user preferences
      const response = await authApi.updateUserPreferences({
        userId,
        userTypeId: 1, // Owner
        userName: ownerName,
        emailAddress: email || null,
        preferredLanguage,
      });

      // Navigate to Properties List screen
      navigation.navigate('PropertiesList', {
        userName: ownerName,
        userId,
      });
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
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
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
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
            {/* Header Section */}
            <View
              style={{
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  backgroundColor: '#e0e7ff',
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <Ionicons name="home" size={32} color="#4f39f6" />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1e2939',
                  marginBottom: 8,
                }}
              >
                Add Your Property
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#4a5565',
                  textAlign: 'center',
                }}
              >
                Tell us a bit about yourself
              </Text>
            </View>

            {/* Form Section */}
            <View style={{ gap: 20 }}>
              {/* Owner Name */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                  }}
                >
                  Your Name *
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
                  <Ionicons name="person" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1e2939',
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(30, 41, 59, 0.5)"
                    value={ownerName}
                    onChangeText={setOwnerName}
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                  }}
                >
                  Mobile Number
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
                    backgroundColor: '#f3f4f6',
                  }}
                >
                  <Ionicons name="call" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1e2939',
                      fontWeight: '500',
                    }}
                    value={mobileNumber}
                    editable={false}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                  }}
                >
                  Email Address (Optional)
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
                    backgroundColor: emailAddress ? '#f3f4f6' : '#fff',
                  }}
                >
                  <Ionicons name="mail" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1e2939',
                    }}
                    placeholder="your.email@example.com"
                    placeholderTextColor="rgba(30, 41, 59, 0.5)"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={!emailAddress}
                  />
                </View>
              </View>

              {/* Language Preference */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                  }}
                >
                  Preferred Language
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    height: 48,
                  }}
                >
                  {/* English Button */}
                  <TouchableOpacity
                    onPress={() => setPreferredLanguage('en')}
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: preferredLanguage === 'en' ? '#4f39f6' : '#f3f4f6',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: preferredLanguage === 'en' ? 'white' : '#364153',
                      }}
                    >
                      English
                    </Text>
                  </TouchableOpacity>

                  {/* Hindi Button */}
                  <TouchableOpacity
                    onPress={() => setPreferredLanguage('hi')}
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: preferredLanguage === 'hi' ? '#4f39f6' : '#f3f4f6',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: preferredLanguage === 'hi' ? 'white' : '#364153',
                      }}
                    >
                      हिंदी
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Add Property Button */}
              <LinearGradient
                colors={isFormValid ? ['#4f39f6', '#9810fa'] : ['#d1d5db', '#d1d5db']}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginTop: 8,
                }}
              >
                <TouchableOpacity
                  onPress={handleAddProperty}
                  disabled={loading || !isFormValid}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: isFormValid ? 1 : 0.6,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={isFormValid ? "white" : "#666"} />
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: isFormValid ? 'white' : '#666',
                        }}
                      >
                        Add Your Property
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={isFormValid ? "white" : "#666"}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          {/* Security Note */}
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 14,
                color: '#4a5565',
                textAlign: 'center',
              }}
            >
              🔒 Your information is secure with us
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
