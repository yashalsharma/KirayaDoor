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

export default function SelectionScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    // Validation
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      Alert.alert('Error', 'Mobile number must be 10 digits');
      return;
    }

    if (emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      Alert.alert('Error', 'Invalid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.sendOtp(
        mobileNumber,
        emailAddress || null
      );

      // Save mobile number and userId to AsyncStorage or context for verification
      // TODO: Implement AsyncStorage or context to store these values
      
      // Navigate to OTP verification screen
      navigation.replace('OtpVerification', {
        mobileNumber,
        userId: response.userId,
        emailAddress: emailAddress || null,
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
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
                <Ionicons name="person" size={32} color="#4f39f6" />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1e2939',
                  marginBottom: 8,
                }}
              >
                Welcome!
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#4a5565',
                  textAlign: 'center',
                }}
              >
                Enter your details to receive OTP
              </Text>
            </View>

            {/* Form Section */}
            <View style={{ gap: 16 }}>
              {/* Mobile Number Input */}
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
                    backgroundColor: '#fff',
                  }}
                >
                  <Ionicons name="call" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1e2939',
                    }}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="rgba(10, 10, 10, 0.5)"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                  }}
                >
                  Email Address
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
                  <Ionicons name="mail" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1e2939',
                    }}
                    placeholder="Enter your email address"
                    placeholderTextColor="rgba(10, 10, 10, 0.5)"
                    keyboardType="email-address"
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Send OTP Button */}
              <LinearGradient
                colors={['#4f39f6', '#9810fa']}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginTop: 8,
                }}
              >
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={loading}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: 'white',
                        }}
                      >
                        Send OTP
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          {/* Footer Text */}
          <Text
            style={{
              fontSize: 14,
              color: '#4a5565',
              textAlign: 'center',
              marginTop: 20,
              maxWidth: 361,
            }}
          >
            You'll receive an OTP on both mobile and email
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
