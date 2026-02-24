import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';
import { propertyApi } from '../api/propertyApi';

export default function AddTenantScreen({ navigation, route }) {
  const { unitId, unitName, propertyId } = route.params || {};
  const insets = useSafeAreaInsets();
  
  // Step 1: Tenant Info
  const [tenantName, setTenantName] = useState('');
  const [tenantContactNumber, setTenantContactNumber] = useState('');
  
  // Step 2: Expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [expenseCycles, setExpenseCycles] = useState([]);
  
  // UI State
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingReferenceData, setLoadingReferenceData] = useState(false);
  
  // Picker State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'type' or 'cycle'
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  
  // Date Picker State
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState(null); // 'start' or 'end'
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  // Fetch reference data when moving to step 2
  const fetchReferenceData = useCallback(async () => {
    try {
      setLoadingReferenceData(true);
      const [types, cycles] = await Promise.all([
        propertyApi.getExpenseTypes(),
        propertyApi.getExpenseCycles(),
      ]);
      setExpenseTypes(types);
      setExpenseCycles(cycles);
    } catch (error) {
      Alert.alert('Error', 'Failed to load expense types and cycles');
      console.error('Error fetching reference data:', error);
    } finally {
      setLoadingReferenceData(false);
    }
  }, []);

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!tenantName.trim()) {
        Alert.alert('Error', 'Please enter tenant name');
        return;
      }
      if (!tenantContactNumber.trim()) {
        Alert.alert('Error', 'Please enter contact number');
        return;
      }
      
      setCurrentStep(2);
      fetchReferenceData();
    }
  };

  const handleCreateTenant = async () => {
    try {
      setLoading(true);

      // Create tenant first
      const newTenant = await propertyApi.createTenant(unitId, {
        tenantName: tenantName.trim(),
        tenantContactNumber: tenantContactNumber.trim(),
      });

      // Create expenses if any
      if (expenses.length > 0) {
        for (const expense of expenses) {
          try {
            // Format dates to ISO date string (YYYY-MM-DD at UTC)
            const formatDateToUTC = (date) => {
              if (!date) return null;
              const d = date instanceof Date ? date : new Date(date);
              return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
            };

            await propertyApi.createTenantExpense(newTenant.tenantId, {
              tenantExpenseTypeId: expense.typeId,
              tenantExpenseCycleId: expense.cycleId,
              tenantExpenseStartDate: formatDateToUTC(expense.startDate),
              tenantExpenseEndDate: formatDateToUTC(expense.endDate),
              tenantExpenseAmount: parseFloat(expense.amount),
              comments: expense.comments || null,
            });
          } catch (expenseError) {
            console.error('Error creating expense:', expenseError);
            // Continue creating other expenses even if one fails
          }
        }
      }

      Alert.alert('Success', 'Tenant created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const addExpense = () => {
    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        typeId: null,
        cycleId: null,
        startDate: new Date(),
        endDate: null,
        amount: '',
        comments: '',
      },
    ]);
  };

  const removeExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id, field, value) => {
    setExpenses(
      expenses.map(e =>
        e.id === id ? { ...e, [field]: value } : e
      )
    );
  };

  const openTypePicker = (expenseId) => {
    setSelectedExpenseId(expenseId);
    setPickerType('type');
    setPickerVisible(true);
  };

  const openCyclePicker = (expenseId) => {
    setSelectedExpenseId(expenseId);
    setPickerType('cycle');
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerType(null);
    setSelectedExpenseId(null);
  };

  const handleSelectType = (typeId) => {
    updateExpense(selectedExpenseId, 'typeId', typeId);
    closePicker();
  };

  const handleSelectCycle = (cycleId) => {
    updateExpense(selectedExpenseId, 'cycleId', cycleId);
    closePicker();
  };

  const openStartDatePicker = (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    const initialDate = expense?.startDate instanceof Date
      ? new Date(expense.startDate)
      : new Date();
    setDatePickerValue(initialDate);
    setSelectedExpenseId(expenseId);
    setDatePickerMode('start');
    setDatePickerVisible(true);
  };

  const openEndDatePicker = (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    const initialDate = expense?.endDate instanceof Date
      ? new Date(expense.endDate)
      : new Date();
    setDatePickerValue(initialDate);
    setSelectedExpenseId(expenseId);
    setDatePickerMode('end');
    setDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
    setDatePickerMode(null);
    setSelectedExpenseId(null);
  };

  const handleDateSelect = (date) => {
    if (datePickerMode === 'start') {
      updateExpense(selectedExpenseId, 'startDate', date);
    } else if (datePickerMode === 'end') {
      updateExpense(selectedExpenseId, 'endDate', date);
    }
    closeDatePicker();
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'Not set';
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  };

  if (currentStep === 1) {
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
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 16,
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'white',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#1e2939" />
              </TouchableOpacity>
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#1e2939',
                  }}
                >
                  {unitName}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#9ca3af',
                  }}
                >
                  Step 1 of 2
                </Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#1e2939',
                marginBottom: 20,
              }}
            >
              Tenant Details
            </Text>

            {/* Tenant Name Input */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#9ca3af',
                  marginBottom: 6,
                }}
              >
                Tenant Name *
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: '#1e2939',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
                placeholder="Enter tenant name"
                placeholderTextColor="#d1d5db"
                value={tenantName}
                onChangeText={setTenantName}
              />
            </View>

            {/* Contact Number Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#9ca3af',
                  marginBottom: 6,
                }}
              >
                Contact Number *
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: '#1e2939',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
                placeholder="Enter contact number"
                placeholderTextColor="#d1d5db"
                value={tenantContactNumber}
                onChangeText={setTenantContactNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ marginTop: 40 }} />
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 16,
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#e5e7eb',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#9ca3af',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextStep}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: '#4f39f6',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: 'white',
                }}
              >
                Next: Expenses
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // Step 2: Expenses (Optional)
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
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentStep(1)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'white',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={24} color="#1e2939" />
            </TouchableOpacity>
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#1e2939',
                }}
              >
                {unitName}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: '#9ca3af',
                }}
              >
                Step 2 of 2
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        {loadingReferenceData ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#4f39f6" />
            <Text
              style={{
                marginTop: 12,
                fontSize: 14,
                color: '#9ca3af',
              }}
            >
              Loading expense types...
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#1e2939',
                marginBottom: 12,
              }}
            >
              Tenant Expenses
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginBottom: 20,
              }}
            >
              Add expense details (optional)
            </Text>

            {expenses.length === 0 ? (
              <View
                style={{
                  paddingVertical: 40,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
                <Text
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    color: '#9ca3af',
                  }}
                >
                  No expenses added yet
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 16 }}>
                {expenses.map((expense, index) => (
                  <View
                    key={expense.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: '#6b7280',
                        }}
                      >
                        Expense {index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeExpense(expense.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: '#fee2e2',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="trash" size={14} color="#dc2626" />
                      </TouchableOpacity>
                    </View>

                    {/* Amount */}
                    <TextInput
                      style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 13,
                        color: '#1e2939',
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        marginBottom: 10,
                      }}
                      placeholder="Amount (₹)"
                      placeholderTextColor="#d1d5db"
                      value={expense.amount}
                      onChangeText={(value) =>
                        updateExpense(expense.id, 'amount', value)
                      }
                      keyboardType="decimal-pad"
                    />

                    {/* Type & Cycle */}
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: '#6b7280',
                            marginBottom: 4,
                          }}
                        >
                          Type
                        </Text>
                        <TouchableOpacity
                          onPress={() => openTypePicker(expense.id)}
                          style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: expense.typeId ? '#1e2939' : '#d1d5db',
                            }}
                          >
                            {expenseTypes.find(t => t.expenseTypeId === expense.typeId)
                              ?.expenseTypeName || 'Select type'}
                          </Text>
                          <Ionicons name="chevron-down" size={16} color="#d1d5db" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: '#6b7280',
                            marginBottom: 4,
                          }}
                        >
                          Cycle
                        </Text>
                        <TouchableOpacity
                          onPress={() => openCyclePicker(expense.id)}
                          style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: expense.cycleId ? '#1e2939' : '#d1d5db',
                            }}
                          >
                            {expenseCycles.find(c => c.expenseCycleId === expense.cycleId)
                              ?.expenseCycleName || 'Select cycle'}
                          </Text>
                          <Ionicons name="chevron-down" size={16} color="#d1d5db" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Start Date & End Date */}
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: '#6b7280',
                            marginBottom: 4,
                          }}
                        >
                          Start Date *
                        </Text>
                        <TouchableOpacity
                          onPress={() => openStartDatePicker(expense.id)}
                          style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: expense.startDate ? '#1e2939' : '#d1d5db',
                            }}
                          >
                            {formatDateForDisplay(expense.startDate)}
                          </Text>
                          <Ionicons name="calendar" size={16} color="#d1d5db" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: '#6b7280',
                            marginBottom: 4,
                          }}
                        >
                          End Date (Optional)
                        </Text>
                        <TouchableOpacity
                          onPress={() => openEndDatePicker(expense.id)}
                          style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderColor: expense.endDate ? '#e5e7eb' : '#f0f0f0',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: expense.endDate ? '#1e2939' : '#d1d5db',
                            }}
                          >
                            {formatDateForDisplay(expense.endDate)}
                          </Text>
                          <Ionicons
                            name="calendar"
                            size={16}
                            color={expense.endDate ? '#4f39f6' : '#d1d5db'}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Add Expense Button */}
            <TouchableOpacity
              onPress={addExpense}
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#a0a0b8',
                paddingHorizontal: 14,
                paddingVertical: 14,
                marginBottom: 40,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="add" size={20} color="#4f39f6" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#4f39f6',
                }}
              >
                Add Expense
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 16,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#e5e7eb',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#9ca3af',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={handleCreateTenant}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: '#4f39f6',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: 'white',
                }}
              >
                Create Tenant
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={closePicker}
            style={{ flex: 1 }}
          />
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '60%',
              paddingTop: 16,
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#1e2939',
                }}
              >
                {pickerType === 'type' ? 'Select Expense Type' : 'Select Billing Cycle'}
              </Text>
              <TouchableOpacity onPress={closePicker}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView
              contentContainerStyle={{
                paddingVertical: 12,
              }}
              showsVerticalScrollIndicator={false}
            >
              {pickerType === 'type'
                ? expenseTypes.map((type) => (
                    <TouchableOpacity
                      key={type.expenseTypeId}
                      onPress={() => handleSelectType(type.expenseTypeId)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#1e2939',
                        }}
                      >
                        {type.expenseTypeName}
                      </Text>
                      {selectedExpenseId &&
                        expenses.find(e => e.id === selectedExpenseId)?.typeId ===
                          type.expenseTypeId && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#4f39f6"
                          />
                        )}
                    </TouchableOpacity>
                  ))
                : expenseCycles.map((cycle) => (
                    <TouchableOpacity
                      key={cycle.expenseCycleId}
                      onPress={() => handleSelectCycle(cycle.expenseCycleId)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#1e2939',
                        }}
                      >
                        {cycle.expenseCycleName}
                      </Text>
                      {selectedExpenseId &&
                        expenses.find(e => e.id === selectedExpenseId)?.cycleId ===
                          cycle.expenseCycleId && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#4f39f6"
                          />
                        )}
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {datePickerVisible && (
        <Modal
          visible={datePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={closeDatePicker}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: Platform.OS === 'ios' ? 20 : 0,
              }}
            >
              {/* Header */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#e5e7eb',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#1e2939',
                  }}
                >
                  {datePickerMode === 'start' ? 'Select Start Date' : 'Select End Date'}
                </Text>
                <TouchableOpacity onPress={closeDatePicker}>
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Date Picker */}
              <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                <DatePicker
                  date={datePickerValue}
                  onDateChange={setDatePickerValue}
                  mode="date"
                  locale="en"
                  textColor="#1e2939"
                />
              </View>

              {/* Action Buttons */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  onPress={closeDatePicker}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#9ca3af',
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDateSelect(datePickerValue)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: '#4f39f6',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: 'white',
                    }}
                  >
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
}
