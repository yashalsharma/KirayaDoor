import React, { useState, useCallback, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { propertyApi } from '../api/propertyApi';

export default function AddTenantScreen({ navigation, route }) {
  const { unitId, unitName, propertyId } = route.params || {};
  const insets = useSafeAreaInsets();
  
  // Tenant Info
  const [tenantName, setTenantName] = useState('');
  const [tenantContactNumber, setTenantContactNumber] = useState('');
  const [governmentId, setGovernmentId] = useState('');
  const [governmentTypeId, setGovernmentTypeId] = useState(null);
  
  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [expenseCycles, setExpenseCycles] = useState([]);
  const [governmentIdTypes, setGovernmentIdTypes] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Picker State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'type', 'cycle', or 'government'
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  
  // Date Picker State
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState(null); // 'start' or 'end'
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [originalDateValue, setOriginalDateValue] = useState(new Date());
  
  // Keyboard State
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Fetch reference data on mount
  useEffect(() => {
    fetchReferenceData();
  }, []);

  // Keyboard visibility listener
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchReferenceData = useCallback(async () => {
    try {
      setLoadingReferenceData(true);
      const [types, cycles, govIdTypes] = await Promise.all([
        propertyApi.getExpenseTypes(),
        propertyApi.getExpenseCycles(),
        propertyApi.getGovernmentIdTypes(),
      ]);
      setExpenseTypes(types);
      setExpenseCycles(cycles);
      setGovernmentIdTypes(govIdTypes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load reference data');
      console.error('Error fetching reference data:', error);
    } finally {
      setLoadingReferenceData(false);
    }
  }, []);

  const handleCreateTenant = async () => {
    // Validate required fields
    if (!tenantName.trim()) {
      Alert.alert('Error', 'Please enter tenant name');
      return;
    }
    if (!tenantContactNumber.trim()) {
      Alert.alert('Error', 'Please enter contact number');
      return;
    }

    try {
      setLoading(true);

      // Create tenant
      const newTenant = await propertyApi.createTenant(unitId, {
        tenantName: tenantName.trim(),
        tenantContactNumber: tenantContactNumber.trim(),
        governmentId: governmentId.trim() || null,
        governmentTypeId: governmentTypeId || null,
      });

      // Create expenses if any
      if (expenses.length > 0) {
        for (const expense of expenses) {
          try {
            // Validate expense
            if (!expense.typeId || !expense.cycleId || !expense.amount) {
              console.warn('Skipping incomplete expense');
              continue;
            }

            await propertyApi.createTenantExpense(newTenant.tenantId, {
              tenantExpenseTypeId: expense.typeId,
              tenantExpenseCycleId: expense.cycleId,
              tenantExpenseStartDate: formatDateToLocalString(expense.startDate),
              tenantExpenseEndDate: formatDateToLocalString(expense.endDate),
              tenantExpenseAmount: parseFloat(expense.amount),
              comments: expense.comments || null,
            });
          } catch (expenseError) {
            console.error('Error creating expense:', expenseError);
            // Continue creating other expenses even if one fails
          }
        }
      }

      setShowSuccessDialog(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    navigation.goBack();
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

  const openGovernmentTypePicker = () => {
    setPickerType('government');
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

  const handleSelectGovernmentType = (govTypeId) => {
    setGovernmentTypeId(govTypeId);
    closePicker();
  };

  const openStartDatePicker = (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    const initialDate = expense?.startDate 
      ? (expense.startDate instanceof Date 
          ? new Date(expense.startDate.getFullYear(), expense.startDate.getMonth(), expense.startDate.getDate())
          : new Date(expense.startDate))
      : new Date();
    setDatePickerValue(initialDate);
    setOriginalDateValue(new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()));
    setSelectedExpenseId(expenseId);
    setDatePickerMode('start');
    setDatePickerVisible(true);
  };

  const openEndDatePicker = (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    const initialDate = expense?.endDate 
      ? (expense.endDate instanceof Date 
          ? new Date(expense.endDate.getFullYear(), expense.endDate.getMonth(), expense.endDate.getDate())
          : new Date(expense.endDate))
      : new Date();
    setDatePickerValue(initialDate);
    setOriginalDateValue(new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()));
    setSelectedExpenseId(expenseId);
    setDatePickerMode('end');
    setDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
    setDatePickerMode(null);
    setSelectedExpenseId(null);
  };

  const handleDatePickerChange = (event, selectedDate) => {
    if (selectedDate) {
      const adjustedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDatePickerValue(adjustedDate);
    }
  };

  const handleDatePickerConfirm = () => {
    const normalizedDate = new Date(datePickerValue.getFullYear(), datePickerValue.getMonth(), datePickerValue.getDate());
    if (datePickerMode === 'start') {
      updateExpense(selectedExpenseId, 'startDate', normalizedDate);
    } else if (datePickerMode === 'end') {
      updateExpense(selectedExpenseId, 'endDate', normalizedDate);
    }
    closeDatePicker();
  };

  const handleDatePickerCancel = () => {
    setDatePickerValue(originalDateValue);
    closeDatePicker();
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'Not set';
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateToLocalString = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isOneTimeCycle = (cycleId) => {
    const cycle = expenseCycles.find(c => c.expenseCycleId === cycleId);
    return cycle && cycle.expenseCycleName.toLowerCase() === 'onetime';
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
        {/* Header - Matching TenantsScreen Style */}
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

          {/* Unit Info - Center */}
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#1e2939',
                marginBottom: 2,
              }}
            >
              {unitName}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: '#9ca3af',
              }}
              numberOfLines={1}
            >
              Add Tenant
            </Text>
          </View>

          {/* Unit Icon */}
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
              Loading form...
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
            {/* TENANT DETAILS SECTION */}
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
                value={tenantContactNumber}
                onChangeText={setTenantContactNumber}
                keyboardType="phone-pad"
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

            {/* Government ID Type Picker */}
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
              <TouchableOpacity
                onPress={openGovernmentTypePicker}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 14,
                  borderWidth: 1.108,
                  borderColor: '#e5e7eb',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: governmentTypeId ? '#1e2939' : 'rgba(10,10,10,0.5)',
                    flex: 1,
                  }}
                >
                  {governmentIdTypes.find(t => t.governmentIdTypeId === governmentTypeId)
                    ?.governmentIdTypeName || 'Select ID type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#d1d5db" />
              </TouchableOpacity>
            </View>

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
                placeholder="Enter government ID"
                placeholderTextColor="rgba(10,10,10,0.5)"
                value={governmentId}
                onChangeText={setGovernmentId}
              />
            </View>

            {/* EXPENSES SECTION */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#1e2939',
                marginBottom: 12,
              }}
            >
              Expenses
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginBottom: 16,
              }}
            >
              Add expense details (optional)
            </Text>

            {expenses.length === 0 ? (
              <View
                style={{
                  paddingVertical: 30,
                  alignItems: 'center',
                  marginBottom: 12,
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
                    <View style={{ marginBottom: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                            <Ionicons name="cash" size={14} color="#4f39f6" />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: '#364153',
                              }}
                            >
                              Amount
                              <Text style={{ color: '#fb2c36' }}> *</Text>
                            </Text>
                          </View>
                      <TextInput
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 12,
                          borderWidth: 1.108,
                          borderColor: '#e5e7eb',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          fontSize: 13,
                          color: '#1e2939',
                        }}
                        placeholder="Enter amount (₹)"
                        placeholderTextColor="rgba(10,10,10,0.5)"
                        value={expense.amount}
                        onChangeText={(value) =>
                          updateExpense(expense.id, 'amount', value)
                        }
                        keyboardType="decimal-pad"
                      />
                    </View>

                    {/* Type & Cycle */}
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                          <Ionicons name="pricetag" size={13} color="#4f39f6" />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: '#364153',
                            }}
                          >
                            Type
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => openTypePicker(expense.id)}
                          style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderWidth: 1.108,
                            borderColor: '#e5e7eb',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: expense.typeId ? '#1e2939' : 'rgba(10,10,10,0.5)',
                              flex: 1,
                            }}
                          >
                            {expenseTypes.find(t => t.expenseTypeId === expense.typeId)
                              ?.expenseTypeName || 'Select type'}
                          </Text>
                          <Ionicons name="chevron-down" size={16} color="#d1d5db" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                          <Ionicons name="calendar" size={13} color="#4f39f6" />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: '#364153',
                            }}
                          >
                            Cycle
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => openCyclePicker(expense.id)}
                          style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderWidth: 1.108,
                            borderColor: '#e5e7eb',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: expense.cycleId ? '#1e2939' : 'rgba(10,10,10,0.5)',
                              flex: 1,
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                          <Ionicons name="calendar" size={13} color="#4f39f6" />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: '#364153',
                            }}
                          >
                            Start Date
                            <Text style={{ color: '#fb2c36' }}> *</Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => openStartDatePicker(expense.id)}
                          style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderWidth: 1.108,
                            borderColor: '#e5e7eb',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: expense.startDate ? '#1e2939' : 'rgba(10,10,10,0.5)',
                              flex: 1,
                            }}
                          >
                            {formatDateForDisplay(expense.startDate)}
                          </Text>
                          <Ionicons name="chevron-down" size={16} color="#d1d5db" />
                        </TouchableOpacity>
                      </View>

                      {!isOneTimeCycle(expense.cycleId) && (
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                            <Ionicons name="calendar" size={13} color="#4f39f6" />
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: '#364153',
                              }}
                            >
                              End Date
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => openEndDatePicker(expense.id)}
                            style={{
                              backgroundColor: '#f9fafb',
                              borderRadius: 12,
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              borderWidth: 1.108,
                              borderColor: '#e5e7eb',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: expense.endDate ? '#1e2939' : 'rgba(10,10,10,0.5)',
                                flex: 1,
                              }}
                            >
                              {formatDateForDisplay(expense.endDate)}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#d1d5db" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {isOneTimeCycle(expense.cycleId) && (
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              backgroundColor: 'white',
                              borderRadius: 14,
                              padding: 14,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.04,
                              shadowRadius: 4,
                              elevation: 2,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                              <Ionicons name="calendar" size={13} color="#d1d5db" />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '700',
                                  color: '#d1d5db',
                                }}
                              >
                                End Date
                              </Text>
                            </View>
                            <View
                              style={{
                                backgroundColor: '#f3f4f6',
                                borderRadius: 12,
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderWidth: 1.108,
                                borderColor: '#e5e7eb',
                                opacity: 0.6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: '#9ca3af',
                                }}
                              >
                                Not applicable
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Comments */}
                    <View
                      style={{
                        backgroundColor: 'white',
                        borderRadius: 14,
                        padding: 14,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                        <Ionicons name="document-attachment" size={13} color="#4f39f6" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: '#364153',
                          }}
                        >
                          Comments
                        </Text>
                      </View>
                      <TextInput
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 12,
                          borderWidth: 1.108,
                          borderColor: '#e5e7eb',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          fontSize: 13,
                          color: '#1e2939',
                          minHeight: 80,
                          textAlignVertical: 'top',
                        }}
                        placeholder="Add any comments here"
                        placeholderTextColor="rgba(10,10,10,0.5)"
                        value={expense.comments}
                        onChangeText={(value) =>
                          updateExpense(expense.id, 'comments', value)
                        }
                        multiline
                      />
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

        {/* Action Button */}
        {!isKeyboardVisible && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <TouchableOpacity
            disabled={loading}
            onPress={handleCreateTenant}
            style={{
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
                Submit Tenant Details
              </Text>
            )}
          </TouchableOpacity>
        </View>
        )}
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
                {pickerType === 'type'
                  ? 'Select Expense Type'
                  : pickerType === 'cycle'
                  ? 'Select Billing Cycle'
                  : 'Select ID Type'}
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
                : pickerType === 'cycle'
                ? expenseCycles.map((cycle) => (
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
                  ))
                : governmentIdTypes.map((govType) => (
                    <TouchableOpacity
                      key={govType.governmentIdTypeId}
                      onPress={() => handleSelectGovernmentType(govType.governmentIdTypeId)}
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
                        {govType.governmentIdTypeName}
                      </Text>
                      {governmentTypeId === govType.governmentIdTypeId && (
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
          onRequestClose={handleDatePickerCancel}
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
                  paddingVertical: 12,
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
              </View>

              {/* Date Picker */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDatePickerChange}
                  textColor="#1e2939"
                />
              </View>

              {/* Action Buttons */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  paddingBottom: insets.bottom + 12,
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  onPress={handleDatePickerCancel}
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
                  onPress={handleDatePickerConfirm}
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
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <Modal
          visible={showSuccessDialog}
          transparent
          animationType="fade"
          onRequestClose={handleSuccessDialogClose}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 20,
                paddingHorizontal: 24,
                paddingTop: 32,
                paddingBottom: 24,
                alignItems: 'center',
                width: '100%',
                maxWidth: 340,
              }}
            >
              {/* Success Icon */}
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#dcfce7',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="checkmark" size={32} color="#22c55e" />
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#1e2939',
                  marginBottom: 8,
                }}
              >
                Tenant Added
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontSize: 14,
                  color: '#6b7280',
                  textAlign: 'center',
                  marginBottom: 24,
                  lineHeight: 20,
                }}
              >
                Tenant has been successfully added to the unit with{' '}
                {expenses.length > 0 ? `${expenses.length} expense(s)` : 'no expenses'}.
              </Text>

              {/* OK Button */}
              <TouchableOpacity
                onPress={handleSuccessDialogClose}
                style={{
                  width: '100%',
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
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
}
