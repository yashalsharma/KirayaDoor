import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Reusable ExpenseForm Component
 * 
 * Props:
 * - expense: expense object (for identification purposes)
 * - typeId: current expense type ID
 * - amount: current amount as string
 * - cycleId: current cycle ID
 * - startDate: current start date
 * - endDate: current end date
 * - comments: current comments
 * - onUpdate: (id, field, value) => void - update expense field
 * - onRemove: (id) => void - remove/delete expense
 * - onToggleExpand: () => void - toggle expand/collapse (for existing expenses)
 * - expenseTypes: array of expense type options
 * - expenseCycles: array of expense cycle options
 * - isExpanded: boolean - whether form is expanded or collapsed
 * - indexLabel: string - label for the expense (e.g., 'Expense 1')
 * - isExistingExpense: boolean - true if this is an existing expense from DB (default: false)
 */
export default function ExpenseForm({
  expense,
  typeId,
  amount,
  cycleId,
  startDate,
  endDate,
  comments,
  onUpdate,
  onRemove,
  expenseTypes,
  expenseCycles,
  isExpanded,
  onToggleExpand,
  indexLabel = 'Expense 1',
  isExistingExpense = false,
}) {
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState(null); // 'start' or 'end'
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [originalDateValue, setOriginalDateValue] = useState(new Date());

  // Helper to get expense ID
  const getExpenseId = () => {
    return isExistingExpense ? expense.tenantExpenseId : expense.id;
  };

  const isOneTimeCycleRequired = (typeId) => typeId === 2 || typeId === 3 || typeId === 4;
  const isMonthCycleRequired = (typeId) => typeId === 1;
  const isCommentMandatory = (typeId) => typeId === 100;

  const getEnforcedCycleId = (typeId) => {
    if (typeId === 1) return 2; // Rent -> Month
    return 1; // Everything else -> OneTime
  };

  const getTodayIST = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'Not set';
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const handleTypeSelect = (typeId) => {
    const expenseId = getExpenseId();
    
    // Only update the typeId - parent handles setting cycleId automatically
    onUpdate(expenseId, 'typeId', typeId);
  };

  const openDatePicker = (mode) => {
    setDatePickerMode(mode);
    const currentDate = mode === 'start' ? startDate : endDate;
    const initialDate = currentDate
      ? (currentDate instanceof Date
          ? new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
          : new Date(currentDate))
      : getTodayIST();
    setDatePickerValue(initialDate);
    setOriginalDateValue(new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()));
    setDatePickerVisible(true);
  };

  const handleDatePickerChange = (event, selectedDate) => {
    if (selectedDate) {
      const adjustedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDatePickerValue(adjustedDate);
    }
  };

  const handleDatePickerConfirm = () => {
    const normalizedDate = new Date(datePickerValue.getFullYear(), datePickerValue.getMonth(), datePickerValue.getDate());
    const expenseId = getExpenseId();
    
    if (datePickerMode === 'start') {
      onUpdate(expenseId, 'startDate', normalizedDate);
    } else {
      onUpdate(expenseId, 'endDate', normalizedDate);
    }
    setDatePickerVisible(false);
    setDatePickerMode(null);
  };

  const handleDatePickerCancel = () => {
    setDatePickerValue(originalDateValue);
    setDatePickerVisible(false);
    setDatePickerMode(null);
  };

  if (!isExpanded) {
    // Collapsed View
    return (
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
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
            marginBottom: 8,
          }}
        >
        <Text
          style={{
            fontSize: 12,
            color: '#6b7280',
          }}
        >
          {expenseTypes.find(t => t.expenseTypeId === typeId)?.expenseTypeName || indexLabel}
        </Text>
        <TouchableOpacity
          onPress={() => onRemove(getExpenseId())}
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
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          {expenseCycles.find(c => c.expenseCycleId === cycleId)?.expenseCycleName} • ₹{isExistingExpense ? Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : amount || '0'}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
        {typeId === 1 ? 'From' : 'Date'}: {formatDateForDisplay(startDate || getTodayIST())}
        {endDate && ` - ${formatDateForDisplay(endDate)}`}
      </Text>
      {comments && (
        <Text
          style={{
            fontSize: 11,
            color: '#9ca3af',
            fontStyle: 'italic',
            marginTop: 6,
          }}
        >
          {comments}
        </Text>
      )}
      </TouchableOpacity>
    );
  }

  // Expanded View - Inline Form
  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e2939' }}>
          {indexLabel}
        </Text>
        <TouchableOpacity onPress={onToggleExpand}>
          <Ionicons name="chevron-up" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <View style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Ionicons name="cash" size={14} color="#4f39f6" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#364153' }}>
            Amount<Text style={{ color: '#fb2c36' }}> *</Text>
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
          placeholder="Enter amount"
          placeholderTextColor="rgba(10,10,10,0.5)"
          value={amount.toString()}
          onChangeText={(val) => onUpdate(getExpenseId(), 'amount', val)}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Type Selection with Button Bar */}
      <View style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Ionicons name="pricetag" size={14} color="#4f39f6" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#364153' }}>
            Type<Text style={{ color: '#fb2c36' }}> *</Text>
          </Text>
        </View>
        <View 
          style={{ marginHorizontal: -14, paddingHorizontal: 14 }}
        >
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }} pointerEvents="box-none">
            {expenseTypes.map((type) => (
              <TouchableOpacity
                key={type.expenseTypeId}
                onPress={() => handleTypeSelect(type.expenseTypeId)}
                activeOpacity={0.6}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: typeId === type.expenseTypeId ? '#4f39f6' : '#f3f4f6',
                  borderWidth: 1,
                  borderColor: typeId === type.expenseTypeId ? '#4f39f6' : '#e5e7eb',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: typeId === type.expenseTypeId ? 'white' : '#1e2939',
                  }}
                >
                  {type.expenseTypeName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Date Fields - Show only after type is selected */}
      {typeId ? (
        typeId === 1 ? (
          // Rent: Show Start Date and End Date side-by-side
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <Ionicons name="calendar" size={14} color="#4f39f6" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#364153' }}>
                  Start Date<Text style={{ color: '#fb2c36' }}> *</Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => openDatePicker('start')}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: 1.108,
                  borderColor: '#e5e7eb',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: startDate ? '#1e2939' : 'rgba(10,10,10,0.5)' }}>
                  {formatDateForDisplay(startDate || getTodayIST())}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <Ionicons name="calendar" size={14} color="#4f39f6" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#364153' }}>
                  End Date
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => openDatePicker('end')}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: 1.108,
                  borderColor: '#e5e7eb',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: endDate ? '#1e2939' : 'rgba(10,10,10,0.5)' }}>
                  {formatDateForDisplay(endDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // OneTime: Show single Expense Date field
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <Ionicons name="calendar" size={14} color="#4f39f6" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#364153' }}>
                Expense Date<Text style={{ color: '#fb2c36' }}> *</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openDatePicker('start')}
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
              <Text style={{ fontSize: 12, color: startDate ? '#1e2939' : 'rgba(10,10,10,0.5)' }}>
                {formatDateForDisplay(startDate || getTodayIST())}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#d1d5db" />
            </TouchableOpacity>
          </View>
        )
      ) : null}

      {/* Comments */}
      <View style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Ionicons name="document-text" size={14} color="#4f39f6" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#364153' }}>
            Comments {isCommentMandatory(typeId) && <Text style={{ color: '#fb2c36' }}> *</Text>}
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
          placeholder={isCommentMandatory(typeId) ? 'Enter comments (required)' : 'Enter comments (optional)'}
          placeholderTextColor="rgba(10,10,10,0.5)"
          value={comments || ''}
          onChangeText={(val) => onUpdate(getExpenseId(), 'comments', val)}
          multiline
        />
      </View>

      {/* Date Picker Modal */}
      {datePickerVisible && (
        <Modal transparent visible={datePickerVisible} animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 }}>
              <View style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e2939', textAlign: 'center' }}>
                  {datePickerMode === 'start' ? 'Select Start Date' : 'Select End Date'}
                </Text>
              </View>
              <View style={{ paddingVertical: 20 }}>
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDatePickerChange}
                  textColor="#1e2939"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
                <TouchableOpacity
                  onPress={handleDatePickerCancel}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: '#f3f4f6',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDatePickerConfirm}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: '#4f39f6',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
