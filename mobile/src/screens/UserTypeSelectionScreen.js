import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function UserTypeSelectionScreen({ navigation, route }) {
  const { mobileNumber, userId, emailAddress } = route.params;

  const handleOwnerPress = async () => {
    try {
      // Navigate to Owner Property screen
      navigation.navigate('OwnerProperty', {
        mobileNumber,
        userId,
        emailAddress,
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to proceed');
    }
  };

  const handleTenantPress = async () => {
    try {
      // TODO: Navigate to Tenant screen when created
      Alert.alert('Coming Soon', 'Tenant flow will be implemented soon');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to proceed');
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
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <Ionicons name="help-circle" size={28} color="#4f39f6" />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1e2939',
                  marginBottom: 8,
                }}
              >
                Owner or Tenant?
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#4a5565',
                  textAlign: 'center',
                }}
              >
                Choose your role to continue
              </Text>
            </View>

            {/* Options Section */}
            <View style={{ gap: 12 }}>
              {/* Owner Button */}
              <LinearGradient
                colors={['#4f39f6', '#432dd7']}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={handleOwnerPress}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons
                        name="home"
                        size={20}
                        color="white"
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: 'white',
                        }}
                      >
                        Owner
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#e0e7ff',
                          marginTop: 2,
                        }}
                      >
                        I own property
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      color: 'white',
                    }}
                  >
                    →
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Tenant Button */}
              <LinearGradient
                colors={['#00bc7d', '#00a870']}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={handleTenantPress}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons
                        name="key"
                        size={20}
                        color="white"
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: 'white',
                        }}
                      >
                        Tenant
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'rgba(255, 255, 255, 0.8)',
                          marginTop: 2,
                        }}
                      >
                        I'm looking for rent
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      color: 'white',
                    }}
                  >
                    →
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
