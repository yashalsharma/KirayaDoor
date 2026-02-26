import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { propertyApi } from '../api/propertyApi';

function RecordPaymentSheet({ route, navigation }) {
  const { tenantId, unitId, propertyId, onSuccess } = route.params;

  const [expenseTypeId, setExpenseTypeId] = useState(null);
  const [amount, setAmount] = useState('');
  const [comments, setComments] = useState('');
  const [expenseTypes, setExpenseTypes] = useState([]);
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
      const typesData = await propertyApi.getExpenseTypes();
      setExpenseTypes(typesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      Alert.alert('Error', 'Failed to load expense types');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecord = async () => {
    // Validate input
    if (!expenseTypeId) {
      Alert.alert('Validation', 'Please select an expense type');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Validation', 'Amount is required');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Validation', 'Amount must be a positive number');
      return;
    }

    try {
      setIsSaving(true);
      await propertyApi.recordPayment(tenantId, {
        expenseTypeId,
        amount: amountValue,
        linkedExpenseId: null,
        comments: comments.trim() || null,
      });

      Alert.alert('Success', 'Payment recorded successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (onSuccess) onSuccess();
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      console.error('Error recording payment:', err);
      Alert.alert('Error', err.message || 'Failed to record payment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e2939' }}>Record Payment</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4f39f6" />
          </View>
        ) : (
          <>
            {/* Expense Type Selection */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginBottom: 8 }}>
                Payment Type <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <FlatList
                scrollEnabled={false}
                data={expenseTypes}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setExpenseTypeId(item.expenseTypeId)}
                    style={{
                      backgroundColor: expenseTypeId === item.expenseTypeId ? '#4f39f6' : '#f3f4f6',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: expenseTypeId === item.expenseTypeId ? 'white' : '#1e2939',
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      {item.expenseTypeName}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.expenseTypeId.toString()}
              />
            </View>

            {/* Amount */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#f3f4f6',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="cash" size={16} color="#4f39f6" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginLeft: 8 }}>
                    Payment Amount <Text style={{ color: '#dc2626' }}>*</Text>
                  </Text>
                </View>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter payment amount"
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: '#1e2939',
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Comments */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#f3f4f6',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="document-text" size={16} color="#4f39f6" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginLeft: 8 }}>
                    Payment Reference <Text style={{ color: '#9ca3af' }}>(Optional)</Text>
                  </Text>
                </View>
                <TextInput
                  value={comments}
                  onChangeText={setComments}
                  placeholder="e.g., UPI transaction ID, cheque number"
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: '#1e2939',
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Info Box */}
            <View
              style={{
                backgroundColor: '#fef3c7',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={{ flex: 1, fontSize: 12, color: '#92400e', lineHeight: 16 }}>
                  Payment will be recorded against this expense type. No specific expense link required.
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Action Buttons */}
      {!isKeyboardVisible && !isLoading && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          <TouchableOpacity
            onPress={handleRecord}
            disabled={isSaving}
            style={{
              backgroundColor: '#10b981',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Record Payment</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            style={{
              backgroundColor: '#f3f4f6',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#4b5563' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default RecordPaymentSheet;
