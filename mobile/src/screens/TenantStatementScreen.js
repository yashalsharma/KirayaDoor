import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Pressable,
  Modal,
  TextInput,
  Keyboard,
  Platform,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { propertyApi } from '../api/propertyApi';
import BottomNavigationFooter from '../components/BottomNavigationFooter';

const { width } = Dimensions.get('window');

function TenantStatementScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { tenantId, unitId, propertyId } = route.params;

  const [statement, setStatement] = useState(null);
  const [tenantDetails, setTenantDetails] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  // Add Expense Form State
  const [expenseTypeId, setExpenseTypeId] = useState(null);
  const [cycleId, setCycleId] = useState(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseComments, setExpenseComments] = useState('');
  const [expenseTypes, setExpenseTypes] = useState([]); // Filtered for Add Expense (Electricity, Water, Others)
  const [allExpenseTypes, setAllExpenseTypes] = useState([]); // All types for Record Payment
  const [expenseCycles, setExpenseCycles] = useState([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  // Record Payment Form State
  const [paymentTypeId, setPaymentTypeId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentComments, setPaymentComments] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Fetch statement and tenant details
  const fetchStatement = useCallback(async () => {
    try {
      setError(null);
      const [statementData, detailsData] = await Promise.all([
        propertyApi.getTenantStatement(tenantId, year, month),
        propertyApi.getTenantDetails(tenantId),
      ]);
      setStatement(statementData);
      setTenantDetails(detailsData);
    } catch (err) {
      console.error('Error fetching statement:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tenantId, year, month]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchStatement();
    }, [fetchStatement])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStatement();
  }, [fetchStatement]);

  // Keyboard visibility listener for Record Payment modal
  React.useEffect(() => {
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

  // Fetch expense types and cycles when modals open
  React.useEffect(() => {
    if (showAddExpenseModal || showRecordPaymentModal) {
      const fetchReferenceData = async () => {
        try {
          const [types, cycles] = await Promise.all([
            propertyApi.getExpenseTypes(),
            propertyApi.getExpenseCycles(),
          ]);
          
          // Store all types for Record Payment modal
          setAllExpenseTypes(types || []);
          
          // Filter expense types to only show Electricity, Water, and Others for add expense modal
          const filteredTypes = (types || []).filter(type => {
            const name = type.expenseTypeName && type.expenseTypeName.toLowerCase();
            return name === 'electricity' || name === 'water' || name === 'others';
          });
          
          setExpenseTypes(filteredTypes);
          setExpenseCycles(cycles || []);
        } catch (err) {
          console.error('Error fetching reference data:', err);
        }
      };
      fetchReferenceData();
    }
  }, [showAddExpenseModal, showRecordPaymentModal]);

  // Filter cycles to only show "One Time" for adding expenses
  const oneTimeCycles = useMemo(() => {
    return expenseCycles.filter(cycle => 
      cycle.expenseCycleName && cycle.expenseCycleName.toLowerCase().includes('onetime')
    );
  }, [expenseCycles]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#4f39f6" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Fixed Header */}
      <Pressable
        onPress={() => {
          // No action on header press
        }}
      >
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

          {/* Tenant Info - Center */}
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#1e2939',
                marginBottom: 2,
              }}
            >
              {tenantDetails?.tenantName ? `${tenantDetails.tenantName}'s Statement` : 'Tenant Statement'}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: '#9ca3af',
              }}
              numberOfLines={1}
            >
              Monthly Ledger
            </Text>
          </View>

          {/* Home Icon */}
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
      </Pressable>

      <ScrollView
        scrollEnabled={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Tenant Details Card */}
        {tenantDetails && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('EditTenantDetails', {
                  tenantId,
                  unitId,
                  propertyId,
                  initialDetails: tenantDetails,
                  onSuccess: fetchStatement,
                })
              }
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 12,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e2939', marginBottom: 4 }}>
                  {tenantDetails.tenantName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="call" size={14} color="#9ca3af" />
                  <Text style={{ fontSize: 13, color: '#4b5563' }}>
                    {tenantDetails.tenantContactNumber}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                  tap to edit tenant details
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Month Navigation and Summary */}
        <View style={{ paddingHorizontal: 16 }}>
          {/* Month Navigation */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <TouchableOpacity onPress={handlePreviousMonth}>
              <Ionicons name="chevron-back" size={28} color="#4f39f6" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e2939' }}>
              {monthName}
            </Text>
            <TouchableOpacity onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={28} color="#4f39f6" />
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          {statement?.summary && (
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                {/* Expected Amount */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#fef3c7',
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Expected</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e2939' }}>
                    ₹{statement.summary.totalExpected?.toFixed(2) || '0.00'}
                  </Text>
                </View>

                {/* Paid Amount */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#dcfce7',
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Paid</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e2939' }}>
                    ₹{statement.summary.totalPaid?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>

              {/* Pending Amounts */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Current Month Pending */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: statement.summary.pendingAmount > 0 ? '#fee2e2' : '#dcfce7',
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>This Month Pending</Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: statement.summary.pendingAmount > 0 ? '#dc2626' : '#16a34a',
                    }}
                  >
                    ₹{statement.summary.pendingAmount?.toFixed(2) || '0.00'}
                  </Text>
                </View>

                {/* Total All-Time Pending */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: statement.summary.totalAllTimePending > 0 ? '#fee2e2' : '#dcfce7',
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Total Pending</Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: statement.summary.totalAllTimePending > 0 ? '#dc2626' : '#16a34a',
                    }}
                  >
                    ₹{statement.summary.totalAllTimePending?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Ledger Title */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginBottom: 12 }}>
            Transaction Ledger
          </Text>

          {/* Ledger Items */}
          {statement?.lineItems && statement.lineItems.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              {statement.lineItems.map((item, index) => {
                const isExpense = item.type === 'Expense';
                return (
                  <View
                    key={index}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeftWidth: 4,
                      borderLeftColor: isExpense ? '#f97316' : '#22c55e',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e2939', marginBottom: 2 }}>
                        {item.description}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: isExpense ? '#f97316' : '#22c55e',
                        }}
                      >
                        {isExpense ? '+' : '-'}₹{Math.abs(item.amount).toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                        Bal: ₹{item.runningBalance?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                );
              })}
              
              {/* Action Bars */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 0 }}>
                {/* Record Payment Placeholder */}
                <TouchableOpacity
                  onPress={() => setShowRecordPaymentModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(249, 250, 251, 0.5)',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#d1d5db',
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="add-circle-outline" size={20} color="#9ca3af" />
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#9ca3af' }}>
                      Record Payment
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Add Expense Placeholder */}
                <TouchableOpacity
                  onPress={() => setShowAddExpenseModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(249, 250, 251, 0.5)',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#d1d5db',
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="add-circle-outline" size={20} color="#9ca3af" />
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#9ca3af' }}>
                      Add Expense
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: '#9ca3af', marginBottom: 12 }}>No transactions this month</Text>
              
              {/* Action Bars */}
              <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                {/* Record Payment Placeholder */}
                <TouchableOpacity
                  onPress={() => setShowRecordPaymentModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(249, 250, 251, 0.5)',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#d1d5db',
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="add-circle-outline" size={20} color="#9ca3af" />
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#9ca3af' }}>
                      Record Payment
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Add Expense Placeholder */}
                <TouchableOpacity
                  onPress={() => setShowAddExpenseModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(249, 250, 251, 0.5)',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#d1d5db',
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="add-circle-outline" size={20} color="#9ca3af" />
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#9ca3af' }}>
                      Add Expense
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddExpenseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddExpenseModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowAddExpenseModal(false)}
            activeOpacity={1}
          />
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' }}>
            {/* Modal Header */}
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e2939' }}>Add One-Time Expense</Text>
              <TouchableOpacity onPress={() => setShowAddExpenseModal(false)}>
                <Ionicons name="close" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
            {/* Expense Type */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginBottom: 8 }}>
                Expense Type
              </Text>
              <FlatList
                data={expenseTypes}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setExpenseTypeId(item.expenseTypeId)}
                    style={{
                      backgroundColor: expenseTypeId === item.expenseTypeId ? '#4f39f6' : '#f3f4f6',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: expenseTypeId === item.expenseTypeId ? 'white' : '#1e2939',
                        fontSize: 12,
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
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginBottom: 8 }}>
                Amount
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#1e2939',
                }}
                placeholder="Enter amount"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />
            </View>

            {/* Comments */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginBottom: 8 }}>
                Comments (Optional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#1e2939',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Enter comments"
                placeholderTextColor="#9ca3af"
                multiline
                value={expenseComments}
                onChangeText={setExpenseComments}
              />
            </View>

            {/* Already Paid Checkbox */}
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setAlreadyPaid(!alreadyPaid)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: alreadyPaid ? '#4f39f6' : '#d1d5db',
                    backgroundColor: alreadyPaid ? '#4f39f6' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  {alreadyPaid && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939' }}>
                  This payment was already made
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Modal Footer Buttons */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
            <TouchableOpacity
              onPress={async () => {
                if (!expenseTypeId) {
                  Alert.alert('Validation', 'Please select an expense type');
                  return;
                }
                if (!expenseAmount.trim()) {
                  Alert.alert('Validation', 'Amount is required');
                  return;
                }

                try {
                  setIsAddingExpense(true);
                  await propertyApi.addTenantExpense(tenantId, {
                    expenseTypeId,
                    cycleId: oneTimeCycles[0]?.expenseCycleId,
                    amount: parseFloat(expenseAmount),
                    comments: expenseComments.trim() || null,
                    isAlreadyPaid: alreadyPaid,
                  });
                  // Close modal and refresh statement without showing alert
                  setShowAddExpenseModal(false);
                  setExpenseTypeId(null);
                  setCycleId(null);
                  setExpenseAmount('');
                  setExpenseComments('');
                  setAlreadyPaid(false);
                  fetchStatement();
                } catch (err) {
                  console.error('Error creating expense:', err);
                  Alert.alert('Error', err.message || 'Failed to add expense');
                } finally {
                  setIsAddingExpense(false);
                }
              }}
              disabled={isAddingExpense}
              style={{
                backgroundColor: '#4f39f6',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: isAddingExpense ? 0.6 : 1,
              }}
            >
              {isAddingExpense ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Add Expense</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAddExpenseModal(false);
                setExpenseTypeId(null);
                setCycleId(null);
                setExpenseAmount('');
                setExpenseComments('');
                setAlreadyPaid(false);
              }}
              disabled={isAddingExpense}
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
        </View>
      </View>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        visible={showRecordPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecordPaymentModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowRecordPaymentModal(false)}
            activeOpacity={1}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ maxHeight: '90%' }}
          >
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            {/* Modal Header */}
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e2939' }}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowRecordPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
            {/* Payment Type */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginBottom: 8 }}>
                Payment Type
              </Text>
              <FlatList
                data={allExpenseTypes}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setPaymentTypeId(item.expenseTypeId)}
                    style={{
                      backgroundColor: paymentTypeId === item.expenseTypeId ? '#4f39f6' : '#f3f4f6',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: paymentTypeId === item.expenseTypeId ? 'white' : '#1e2939',
                        fontSize: 12,
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
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginBottom: 8 }}>
                Amount
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#1e2939',
                }}
                placeholder="Enter amount"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />
            </View>

            {/* Comments */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e2939', marginBottom: 8 }}>
                Reference/Comments (Optional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#1e2939',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Enter reference or comments"
                placeholderTextColor="#9ca3af"
                multiline
                value={paymentComments}
                onChangeText={setPaymentComments}
              />
            </View>
          </ScrollView>

          {/* Modal Footer Buttons - Hide when keyboard is visible */}
          {!isKeyboardVisible && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
              <TouchableOpacity
                onPress={async () => {
                  if (!paymentTypeId) {
                    Alert.alert('Validation', 'Please select a payment type');
                    return;
                  }
                  if (!paymentAmount.trim()) {
                    Alert.alert('Validation', 'Amount is required');
                    return;
                  }

                  try {
                    setIsRecordingPayment(true);
                    await propertyApi.recordPayment(tenantId, {
                      expenseTypeId: paymentTypeId,
                      amount: parseFloat(paymentAmount),
                      linkedExpenseId: null,
                      comments: paymentComments.trim() || null,
                    });
                    // Close modal and refresh statement without showing alert
                    setShowRecordPaymentModal(false);
                    setPaymentTypeId(null);
                    setPaymentAmount('');
                    setPaymentComments('');
                    fetchStatement();
                  } catch (err) {
                    console.error('Error recording payment:', err);
                    Alert.alert('Error', err.message || 'Failed to record payment');
                  } finally {
                    setIsRecordingPayment(false);
                  }
                }}
                disabled={isRecordingPayment}
                style={{
                  backgroundColor: '#4f39f6',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: isRecordingPayment ? 0.6 : 1,
                }}
              >
                {isRecordingPayment ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Record Payment</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowRecordPaymentModal(false);
                  setPaymentTypeId(null);
                  setPaymentAmount('');
                  setPaymentComments('');
                  setIsAlreadyPaid(false);
                  setAlreadyPaidCycleId(null);
                }}
                disabled={isRecordingPayment}
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

          {/* Show dismiss button when keyboard is visible */}
          {isKeyboardVisible && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
              <TouchableOpacity
                onPress={() => Keyboard.dismiss()}
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#4b5563' }}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Footer */}
      <BottomNavigationFooter navigation={navigation} currentScreen="Tenants" />
    </LinearGradient>
  );
}

export default TenantStatementScreen;
