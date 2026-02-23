import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { authApi } from '../api/authApi';

export default function OtpVerificationScreen({ navigation, route }) {
  const { mobileNumber, userId, emailAddress } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);

  // Mask mobile number: first 2 digits + **** + last 4 digits
  const maskedMobile = mobileNumber ? `${mobileNumber.slice(0, 2)}****${mobileNumber.slice(-4)}` : '';

  // Mask email: first 2 chars + *** + @domain
  const maskedEmail = emailAddress ? `${emailAddress.slice(0, 2)}***${emailAddress.slice(emailAddress.indexOf('@'))}` : '';

  // Timer for resend OTP
  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  // Disable back navigation on this screen (user cannot go back from OTP verification)
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Only prevent back navigation, allow forward navigation (replace, navigate)
        if (e.data.action.type === 'GO_BACK') {
          e.preventDefault();
        }
      });

      return unsubscribe;
    }, [navigation])
  );

  const handleOtpChange = (value, index) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Clear error message when user starts entering OTP
    if (errorMessage) {
      setErrorMessage('');
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(''); // Clear any previous error
      const response = await authApi.verifyOtp(mobileNumber, otpString);

      // Success: Navigate based on whether user is new or existing
      if (response.isNew === false) {
        // Existing user: Fetch user details and navigate to Properties screen
        try {
          const userResp = await fetch(`http://192.168.29.204:5248/api/users/${response.userId}`);
          const userData = await userResp.json();
          if (!userResp.ok) throw new Error(userData.error || 'Failed to fetch user');
          navigation.replace('PropertiesList', {
            userName: userData.userName,
            userId: userData.userId,
          });
        } catch (err) {
          Alert.alert('Error', err.message || 'Failed to fetch user details');
        }
      } else {
        // New user: Navigate to UserTypeSelection screen
        navigation.replace('UserTypeSelection', {
          mobileNumber,
          userId: response.userId,
          emailAddress,
        });
      }
    } catch (error) {
      // Check if it's an invalid OTP error
      if (error.message && (error.message.includes('Invalid') || error.message.includes('expired'))) {
        setErrorMessage('Invalid OTP. Please Retry.');
        setOtp(['', '', '', '', '', '']); // Clear all OTP boxes
        inputRefs.current[0]?.focus(); // Focus on first input
      } else {
        Alert.alert('Error', error.message || 'Failed to verify OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      setResendLoading(true);
      await authApi.sendOtp(mobileNumber, emailAddress);
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Success', 'OTP sent again');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
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
                <Ionicons name="shield-checkmark" size={32} color="#4f39f6" />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1e2939',
                  marginBottom: 8,
                }}
              >
                Enter OTP
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#4a5565',
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                We've sent a 6-digit code to
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#1e2939',
                  textAlign: 'center',
                  marginBottom: emailAddress ? 4 : 0,
                }}
              >
                {maskedMobile}
              </Text>
              {emailAddress && (
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#1e2939',
                    textAlign: 'center',
                  }}
                >
                  {maskedEmail}
                </Text>
              )}
            </View>

            {/* Form Section */}
            <View style={{ gap: 24 }}>
              {/* OTP Input */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#364153',
                    textAlign: 'center',
                  }}
                >
                  OTP Code
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={{
                        width: 48,
                        height: 56,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 14,
                        textAlign: 'center',
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#1e2939',
                        backgroundColor: '#fff',
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      editable={!loading}
                      selectTextOnFocus
                    />
                  ))}
                </View>
                {errorMessage ? (
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#dc2626', // Red color for error
                      textAlign: 'center',
                      marginTop: 8,
                    }}
                  >
                    {errorMessage}
                  </Text>
                ) : null}
              </View>

              {/* Verify Button */}
              <LinearGradient
                colors={['#4f39f6', '#9810fa']}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={handleVerifyOtp}
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
                        Verify OTP
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="white"
                      />
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>

              {/* Resend OTP Section */}
              <View
                style={{
                  alignItems: 'center',
                  paddingTop: 16,
                }}
              >
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={!canResend || resendLoading}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: canResend ? '#4f39f6' : '#9ca3af',
                      textAlign: 'center',
                    }}
                  >
                    {resendLoading
                      ? 'Sending...'
                      : canResend
                      ? "Didn't receive OTP? Resend"
                      : `Resend OTP in ${timer} seconds`}
                  </Text>
                </TouchableOpacity>
              </View>
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
