import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { propertyApi } from '../api/propertyApi';
import ConfirmDialog from '../components/ConfirmDialog';
import ExpenseForm from '../components/ExpenseForm';

function EditTenantDetailsSheet({ route, navigation }) {
  const { tenantId, unitId, unitName, propertyId, initialDetails, onSuccess } = route.params;

  const [tenantName, setTenantName] = useState(initialDetails?.tenantName || '');
  const [contactNumber, setContactNumber] = useState(initialDetails?.tenantContactNumber || '');
  const [governmentId, setGovernmentId] = useState(initialDetails?.governmentId || '');
  const [governmentTypeId, setGovernmentTypeId] = useState(initialDetails?.governmentTypeId || null);
  const [governmentTypes, setGovernmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isActive, setIsActive] = useState(initialDetails?.isActive || false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [moveOutDialogVisible, setMoveOutDialogVisible] = useState(false);
  const [moveInDialogVisible, setMoveInDialogVisible] = useState(false);
  
  // Expense state
  const [existingExpenses, setExistingExpenses] = useState([]);
  const [newExpenses, setNewExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [expenseCycles, setExpenseCycles] = useState([]);
  const [deleteExpenseDialogVisible, setDeleteExpenseDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'type' or 'cycle'
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [inlineEditAmount, setInlineEditAmount] = useState('');
  const [inlineEditComments, setInlineEditComments] = useState('');
  const [inlineEditTypeId, setInlineEditTypeId] = useState(null);
  const [inlineEditCycleId, setInlineEditCycleId] = useState(null);
  const [inlineEditStartDate, setInlineEditStartDate] = useState(null);
  const [inlineEditEndDate, setInlineEditEndDate] = useState(null);
  const [modifiedExpenses, setModifiedExpenses] = useState({}); // Track which expenses have been modified
  
  // Date Picker State
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState(null); // 'start' or 'end'
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [originalDateValue, setOriginalDateValue] = useState(new Date());

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
      const [governmentTypes, expenseTypes, expenseCycles, tenantExpenses] = await Promise.all([
        propertyApi.getGovernmentIdTypes(),
        propertyApi.getExpenseTypes(),
        propertyApi.getExpenseCycles(),
        propertyApi.getTenantExpenses(tenantId),
      ]);
      setGovernmentTypes(governmentTypes || []);
      setExpenseTypes(expenseTypes || []);
      setExpenseCycles(expenseCycles || []);
      setExistingExpenses(tenantExpenses || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new expense form
  const addNewExpense = () => {
    const todayDate = getTodayIST();
    setNewExpenses([
      ...newExpenses,
      {
        id: Date.now(),
        typeId: null,
        cycleId: null,
        startDate: todayDate,
        endDate: null,
        amount: '',
        comments: '',
      },
    ]);
  };

  // Remove new expense form
  const removeNewExpense = (id) => {
    setNewExpenses(newExpenses.filter(e => e.id !== id));
  };

  // Update new expense form
  const updateNewExpense = (id, field, value) => {
    setNewExpenses(
      newExpenses.map(e => {
        if (e.id === id) {
          const updated = { ...e, [field]: value };
          // If typeId is being updated, also auto-set the cycleId
          if (field === 'typeId') {
            updated.cycleId = getEnforcedCycleId(value);
          }
          return updated;
        }
        return e;
      })
    );
  };

  // Update existing expense (inline edit) - updates inline edit state
  const updateExistingExpense = (expenseId, field, value) => {
    if (field === 'amount') {
      setInlineEditAmount(value);
    } else if (field === 'typeId') {
      setInlineEditTypeId(value);
      // Auto-set cycleId when typeId changes
      setInlineEditCycleId(getEnforcedCycleId(value));
    } else if (field === 'cycleId') {
      setInlineEditCycleId(value);
    } else if (field === 'startDate') {
      setInlineEditStartDate(value);
    } else if (field === 'endDate') {
      setInlineEditEndDate(value);
    } else if (field === 'comments') {
      setInlineEditComments(value);
    }
  };

  // Open type picker
  const openTypePicker = (expenseId) => {
    setSelectedExpenseId(expenseId);
    setPickerType('type');
    setPickerVisible(true);
  };

  // Open cycle picker
  const openCyclePicker = (expenseId) => {
    setSelectedExpenseId(expenseId);
    setPickerType('cycle');
    setPickerVisible(true);
  };

  // Close picker
  const closePicker = () => {
    setPickerVisible(false);
    setPickerType(null);
    setSelectedExpenseId(null);
  };

  // Helper function to determine if expense type requires OneTime cycle
  const isOneTimeCycleRequired = (expenseTypeId) => {
    // SecurityDeposit (2), Electricity (3), Water (4) - must be OneTime
    return expenseTypeId === 2 || expenseTypeId === 3 || expenseTypeId === 4;
  };

  // Helper function to determine if expense type requires Month cycle
  const isMonthCycleRequired = (expenseTypeId) => {
    // Rent (1) - must be Month
    return expenseTypeId === 1;
  };

  // Helper function to check if comment is mandatory for expense type
  const isCommentMandatory = (expenseTypeId) => {
    // Others (100) - comment is mandatory
    return expenseTypeId === 100;
  };

  // Get the enforced cycle ID for an expense type, or null if no enforcement
  const getEnforcedCycleId = (expenseTypeId) => {
    // Rent (1) -> Month (2), Everything else -> OneTime (1)
    if (expenseTypeId === 1) return 2; // Rent -> Month
    return 1; // Everything else -> OneTime
  };

  // Validate rent conflicts - check that no active rent exists for the same date range
  const validateRentConflict = (newRent, excludeExpenseId = null) => {
    // Only validate for Rent type (1)
    if (newRent.typeId !== 1) return null;

    const newStartDate = newRent.startDate || getTodayIST();
    const newEndDate = newRent.endDate;

    // Get all rent expenses (existing + new, excluding the current one being validated)
    const allRents = [
      ...existingExpenses.filter(e => e.tenantExpenseTypeId === 1 && e.tenantExpenseId !== excludeExpenseId),
      ...newExpenses.filter(e => e.typeId === 1 && e.id !== newRent.id),
    ];

    // Check for conflicts with existing rents
    for (const existingRent of allRents) {
      // Handle both property naming conventions (DB: tenantExpenseStartDate vs in-memory: startDate)
      const existingStartDate = new Date(existingRent.tenantExpenseStartDate || existingRent.startDate);
      const existingEndDate = (existingRent.tenantExpenseEndDate || existingRent.endDate) ? new Date(existingRent.tenantExpenseEndDate || existingRent.endDate) : null;

      // Case 1: Existing rent has no end date (ongoing/active)
      if (!existingEndDate) {
        // New rent cannot start on or after the existing rent's start date
        if (newStartDate >= existingStartDate) {
          return `Active rent exists from ${formatDateForDisplay(existingStartDate)}. Cannot add overlapping rent.`;
        }
      }
      // Case 2: Existing rent has an end date
      else {
        // New rent start date cannot fall within or overlap with existing rent dates
        // Valid new rent must start on or after (endDate + 1 day)
        if (newStartDate >= existingStartDate && newStartDate <= existingEndDate) {
          return `Rent conflict: existing rent from ${formatDateForDisplay(existingStartDate)} to ${formatDateForDisplay(existingEndDate)}. New rent must start from ${formatDateForDisplay(new Date(existingEndDate.getTime() + 86400000))}.`;
        }
      }
    }

    return null; // No conflicts
  };

  // Sort expenses: Rent first, then by date (latest first)
  const getSortedExpenses = (expenses) => {
    return [...expenses].sort((a, b) => {
      // Rent (typeId 1) always comes first
      const aIsRent = a.tenantExpenseTypeId === 1;
      const bIsRent = b.tenantExpenseTypeId === 1;
      
      if (aIsRent && !bIsRent) return -1;
      if (!aIsRent && bIsRent) return 1;
      
      // For non-rent or both rent, sort by date (latest first)
      const aDate = new Date(a.tenantExpenseStartDate || a.startDate);
      const bDate = new Date(b.tenantExpenseStartDate || b.startDate);
      return bDate - aDate; // Latest first
    });
  };

  // Handle expense type selection (automatically sets cycle)
  const handleExpenseTypeSelect = (typeId, isNewExpense = false, expenseId = null) => {
    const cycleId = getEnforcedCycleId(typeId);
    
    if (isNewExpense && expenseId) {
      // Adding new expense with bar selection - single batched update
      setNewExpenses(
        newExpenses.map(e => {
          if (e.id === expenseId) {
            return {
              ...e,
              typeId: typeId,
              cycleId: cycleId,
            };
          }
          return e;
        })
      );
    } else if (expandedExpenseId) {
      // Editing existing expense
      setInlineEditTypeId(typeId);
      setInlineEditCycleId(cycleId);
    }
  };

  // Select from picker (only for type now, picker is simplified)
  const selectFromPicker = (value) => {
    if (expandedExpenseId) {
      // Inline editing existing expense
      handleExpenseTypeSelect(value);
    } else {
      // Editing new expense
      handleExpenseTypeSelect(value, true, selectedExpenseId);
    }
    closePicker();
  };

  const handleSave = async () => {
    // Validate input
    if (!tenantName.trim()) {
      Alert.alert('Validation', 'Tenant name is required');
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert('Validation', 'Contact number is required');
      return;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      Alert.alert('Validation', 'Contact number must be 10 digits');
      return;
    }

    // Validate tenantId
    if (!tenantId || tenantId === 0 || isNaN(tenantId)) {
      Alert.alert('Error', 'Invalid tenant ID');
      return;
    }

    try {
      setIsSaving(true);
      await propertyApi.updateTenantDetails(tenantId, {
        tenantName: tenantName.trim(),
        tenantContactNumber: contactNumber.trim(),
        governmentId: governmentId?.trim() || null,
        governmentTypeId: governmentTypeId || null,
      });

      // Close without showing alert
      if (onSuccess) onSuccess();
      navigation.goBack();
    } catch (err) {
      console.error('Error updating tenant:', err);
      Alert.alert('Error', err.message || 'Failed to update tenant details');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteTenant = async () => {
    try {
      setIsSaving(true);
      setDeleteDialogVisible(false);
      await propertyApi.deleteTenant(tenantId);
      // Navigate back to the Tenants screen for this unit
      navigation.navigate('Tenants', {
        unitId,
        unitName,
        propertyId,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to delete tenant');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelDeleteTenant = () => {
    setDeleteDialogVisible(false);
  };

  const confirmMoveOutTenant = async () => {
    try {
      setIsSaving(true);
      setMoveOutDialogVisible(false);
      await propertyApi.markTenantAsInactive(tenantId);
      // Navigate back to the Tenants screen for this unit
      navigation.navigate('Tenants', {
        unitId,
        unitName,
        propertyId,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to mark tenant as moved out');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelMoveOutTenant = () => {
    setMoveOutDialogVisible(false);
  };

  const confirmMoveInTenant = async () => {
    try {
      setIsSaving(true);
      setMoveInDialogVisible(false);
      await propertyApi.markTenantAsActive(tenantId);
      // Update local state to show Move Out button instead
      setIsActive(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to mark tenant as moved in');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelMoveInTenant = () => {
    setMoveInDialogVisible(false);
  };

  // Expense handlers
  const handleAddExpense = () => {
    setExpenseTypeId(null);
    setCycleId(null);
    setExpenseAmount('');
    setExpenseComments('');
    setEditingExpense(null);
    setShowAddExpenseModal(true);
  };

  // Delete existing expense
  const handleDeleteExistingExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteExpenseDialogVisible(true);
  };

  // Edit existing expense - toggle inline form
  const toggleEditExistingExpense = (expense) => {
    if (expandedExpenseId === expense.tenantExpenseId) {
      // Closing the edit form - auto save
      closeEditExistingExpense();
    } else {
      setExpandedExpenseId(expense.tenantExpenseId);
      setInlineEditAmount(expense.tenantExpenseAmount.toString());
      setInlineEditComments(expense.comments || '');
      setInlineEditTypeId(expense.tenantExpenseTypeId);
      setInlineEditCycleId(expense.tenantExpenseCycleId);
      setInlineEditStartDate(expense.tenantExpenseStartDate ? new Date(expense.tenantExpenseStartDate) : null);
      setInlineEditEndDate(expense.tenantExpenseEndDate ? new Date(expense.tenantExpenseEndDate) : null);
    }
  };

  // Auto-save when closing an edited expense
  const closeEditExistingExpense = async () => {
    if (!inlineEditAmount.trim()) {
      Alert.alert('Validation', 'Amount is required');
      return;
    }

    // Business Validation: Cycle type constraints
    if (isOneTimeCycleRequired(inlineEditTypeId) && inlineEditCycleId !== 1) {
      const typeName = expenseTypes.find(t => t.expenseTypeId === inlineEditTypeId)?.expenseTypeName;
      Alert.alert('Validation', `${typeName} expense can only be OneTime`);
      return;
    }

    if (isMonthCycleRequired(inlineEditTypeId) && inlineEditCycleId !== 2) {
      Alert.alert('Validation', 'Rent expense can only be Monthly');
      return;
    }

    // Business Validation: Comments mandatory for Others
    if (isCommentMandatory(inlineEditTypeId)) {
      if (!inlineEditComments.trim()) {
        Alert.alert('Validation', 'Comments are mandatory for "Others" expense type');
        return;
      }
    }

    // Business Validation: Rent conflict check
    const rentConflictError = validateRentConflict(
      {
        typeId: inlineEditTypeId,
        startDate: inlineEditStartDate,
        endDate: inlineEditEndDate,
        id: expandedExpenseId,
      },
      expandedExpenseId // Exclude current expense from conflict check
    );
    if (rentConflictError) {
      Alert.alert('Validation', rentConflictError);
      return;
    }

    try {
      setIsAddingExpense(true);
      const expenseToUpdate = existingExpenses.find(e => e.tenantExpenseId === expandedExpenseId);
      
      await propertyApi.updateTenantExpense(tenantId, expandedExpenseId, {
        amount: parseFloat(inlineEditAmount),
        typeId: inlineEditTypeId,
        cycleId: inlineEditCycleId,
        startDate: inlineEditStartDate,
        endDate: inlineEditEndDate,
        comments: inlineEditComments.trim() || null,
      });
      
      // Update the expenses list
      setExistingExpenses(
        existingExpenses.map(e =>
          e.tenantExpenseId === expandedExpenseId
            ? {
                ...e,
                tenantExpenseAmount: parseFloat(inlineEditAmount),
                tenantExpenseTypeId: inlineEditTypeId,
                tenantExpenseCycleId: inlineEditCycleId,
                tenantExpenseStartDate: inlineEditStartDate,
                tenantExpenseEndDate: inlineEditEndDate,
                expenseTypeName: expenseTypes.find(t => t.expenseTypeId === inlineEditTypeId)?.expenseTypeName || e.expenseTypeName,
                cycleName: expenseCycles.find(c => c.expenseCycleId === inlineEditCycleId)?.expenseCycleName || e.cycleName,
                comments: inlineEditComments.trim() || null,
              }
            : e
        )
      );
      
      setExpandedExpenseId(null);
      setInlineEditAmount('');
      setInlineEditComments('');
      setInlineEditTypeId(null);
      setInlineEditCycleId(null);
      setInlineEditStartDate(null);
      setInlineEditEndDate(null);
    } catch (err) {
      console.error('Error updating expense:', err);
      Alert.alert('Error', err.message || 'Failed to update expense');
    } finally {
      setIsAddingExpense(false);
    }
  };

  const cancelInlineEditExpense = () => {
    setExpandedExpenseId(null);
    setInlineEditAmount('');
    setInlineEditComments('');
    setInlineEditTypeId(null);
    setInlineEditCycleId(null);
    setInlineEditStartDate(null);
    setInlineEditEndDate(null);
  };

  // Date picker handlers for expense editing
  const openDatePicker = (mode) => {
    setDatePickerMode(mode);
    if (expandedExpenseId) {
      // Inline editing existing expense
      if (mode === 'start') {
        setOriginalDateValue(inlineEditStartDate || new Date());
        setDatePickerValue(inlineEditStartDate || new Date());
      } else if (mode === 'end') {
        // For end date, default to start date if not yet set
        setOriginalDateValue(inlineEditEndDate || inlineEditStartDate);
        setDatePickerValue(inlineEditEndDate || inlineEditStartDate);
      } else if (mode === 'expenseDate') {
        // For OneTime expenses, use start date
        setOriginalDateValue(inlineEditStartDate || new Date());
        setDatePickerValue(inlineEditStartDate || new Date());
      }
    }
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
    
    if (expandedExpenseId) {
      // Inline editing existing expense
      if (datePickerMode === 'start') {
        setInlineEditStartDate(normalizedDate);
      } else if (datePickerMode === 'end') {
        setInlineEditEndDate(normalizedDate);
      } else if (datePickerMode === 'expenseDate') {
        // For OneTime expenses, set both start and end date to the same value
        setInlineEditStartDate(normalizedDate);
        setInlineEditEndDate(normalizedDate);
      }
    } else if (selectedExpenseId) {
      // Adding/editing new expense
      if (datePickerMode === 'start') {
        updateNewExpense(selectedExpenseId, 'startDate', normalizedDate);
      } else if (datePickerMode === 'end') {
        updateNewExpense(selectedExpenseId, 'endDate', normalizedDate);
      } else if (datePickerMode === 'expenseDate') {
        // For OneTime expenses, set both startDate and endDate to the same date
        setNewExpenses(
          newExpenses.map(e =>
            e.id === selectedExpenseId
              ? { ...e, startDate: normalizedDate, endDate: normalizedDate }
              : e
          )
        );
      }
    }
    closeDatePicker();
  };

  const handleDatePickerCancel = () => {
    setDatePickerValue(originalDateValue);
    closeDatePicker();
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
    setDatePickerMode(null);
  };

  const getTodayIST = () => {
    const now = new Date();
    // Create a date normalized to just the date portion (no time)
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

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setIsAddingExpense(true);
      setDeleteExpenseDialogVisible(false);
      await propertyApi.deleteTenantExpense(tenantId, expenseToDelete.tenantExpenseId);
      setExistingExpenses(existingExpenses.filter(e => e.tenantExpenseId !== expenseToDelete.tenantExpenseId));
      setExpenseToDelete(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to delete expense');
      setExpenseToDelete(null);
    } finally {
      setIsAddingExpense(false);
    }
  };

  const cancelDeleteExpense = () => {
    setDeleteExpenseDialogVisible(false);
    setExpenseToDelete(null);
  };

  // Save new expenses to database
  const saveNewExpenses = async () => {
    if (newExpenses.length === 0) return;

    // Validate tenantId
    if (!tenantId || tenantId === 0 || isNaN(tenantId)) {
      Alert.alert('Error', 'Invalid tenant ID. Please reload the tenant details.');
      return;
    }

    try {
      setIsAddingExpense(true);
      for (const expense of newExpenses) {
        
        if (!expense.typeId) {
          Alert.alert('Validation', 'Please select an expense type for all expenses');
          setIsAddingExpense(false);
          return;
        }
        if (!expense.amount.trim()) {
          Alert.alert('Validation', 'Please enter amount for all expenses');
          setIsAddingExpense(false);
          return;
        }


        // Business Validation: Cycle type constraints (using helper functions for clarity)
        if (isOneTimeCycleRequired(expense.typeId) && expense.cycleId !== 1) {
          const typeName = expenseTypes.find(t => t.expenseTypeId === expense.typeId)?.expenseTypeName;
          Alert.alert('Validation', `${typeName} expense can only be OneTime`);
          setIsAddingExpense(false);
          return;
        }

        if (isMonthCycleRequired(expense.typeId) && expense.cycleId !== 2) {
          Alert.alert('Validation', 'Rent expense must be Monthly (automatically set)');
          setIsAddingExpense(false);
          return;
        }

        // Business Validation: Comments mandatory for Others
        if (isCommentMandatory(expense.typeId)) {
          if (!expense.comments.trim()) {
            Alert.alert('Validation', 'Comments are mandatory for "Others" expense type');
            setIsAddingExpense(false);
            return;
          }
        }

        // Business Validation: Rent conflict check
        const rentConflictError = validateRentConflict(expense);
        if (rentConflictError) {
          Alert.alert('Validation', rentConflictError);
          setIsAddingExpense(false);
          return;
        }

        await propertyApi.addTenantExpense(tenantId, {
          expenseTypeId: expense.typeId,
          cycleId: expense.cycleId,
          amount: parseFloat(expense.amount),
          startDate: expense.startDate || getTodayIST(),
          endDate: expense.endDate,
          comments: expense.comments.trim() || null,
          isAlreadyPaid: false,
        });
      }
      // Fetch updated expenses list
      const updatedExpenses = await propertyApi.getTenantExpenses(tenantId);
      setExistingExpenses(updatedExpenses || []);
      setNewExpenses([]);
    } catch (err) {
      console.error('Error saving expenses:', err);
      Alert.alert('Error', err.message || 'Failed to save expenses');
    } finally {
      setIsAddingExpense(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="#4f39f6" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Header */}
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
        {/* Back Button */}
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

        {/* Title */}
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#1e2939',
              textAlign: 'center',
            }}
          >
            Edit Tenant Details
          </Text>
        </View>

        {/* Placeholder Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
          }}
        />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexGrow: 1,
          paddingBottom: isKeyboardVisible ? 20 : 100,
        }}
        showsVerticalScrollIndicator={true}
      >
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
            editable={true}
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
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            maxLength={10}
            editable={true}
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

        {/* Government ID Type Buttons */}
        {governmentTypes.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
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
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {governmentTypes.map((type) => (
                <TouchableOpacity
                  key={type.governmentIdTypeId}
                  onPress={() => {
                    if (governmentTypeId === type.governmentIdTypeId) {
                      setGovernmentTypeId(null);
                    } else {
                      setGovernmentTypeId(type.governmentIdTypeId);
                    }
                  }}
                  style={{
                    backgroundColor: governmentTypeId === type.governmentIdTypeId ? '#4f39f6' : '#f3f4f6',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: governmentTypeId === type.governmentIdTypeId ? 'white' : '#1e2939',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {type.governmentIdTypeName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
            placeholder="Enter ID number"
            placeholderTextColor="rgba(10,10,10,0.5)"
            value={governmentId}
            onChangeText={setGovernmentId}
          />
        </View>

        {/* EXPENSES SECTION */}
        <View style={{ marginTop: 12, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#1e2939',
              marginBottom: 6,
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

          {/* Existing Expenses */}
          {existingExpenses.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              {getSortedExpenses(existingExpenses).map((expense) => (
                <ExpenseForm
                  key={expense.tenantExpenseId}
                  expense={expense}
                  isExistingExpense={true}
                  isExpanded={expandedExpenseId === expense.tenantExpenseId}
                  onToggleExpand={() => toggleEditExistingExpense(expense)}
                  onUpdate={updateExistingExpense}
                  onRemove={handleDeleteExistingExpense}
                  expenseTypes={expenseTypes}
                  expenseCycles={expenseCycles}
                  indexLabel={expense.expenseTypeName}
                  // Props for inline edit state
                  typeId={expandedExpenseId === expense.tenantExpenseId ? inlineEditTypeId : expense.tenantExpenseTypeId}
                  amount={expandedExpenseId === expense.tenantExpenseId ? inlineEditAmount : expense.tenantExpenseAmount}
                  cycleId={expandedExpenseId === expense.tenantExpenseId ? inlineEditCycleId : expense.tenantExpenseCycleId}
                  startDate={expandedExpenseId === expense.tenantExpenseId ? inlineEditStartDate : expense.tenantExpenseStartDate}
                  endDate={expandedExpenseId === expense.tenantExpenseId ? inlineEditEndDate : expense.tenantExpenseEndDate}
                  comments={expandedExpenseId === expense.tenantExpenseId ? inlineEditComments : expense.comments}
                />
              ))}
            </View>
          )}

          {/* New Expenses */}
          {newExpenses.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              {newExpenses.map((expense, index) => (
                <ExpenseForm
                  key={expense.id}
                  expense={expense}
                  isExistingExpense={false}
                  isExpanded={true}
                  onToggleExpand={() => {}} // New expenses are always expanded
                  onUpdate={updateNewExpense}
                  onRemove={removeNewExpense}
                  expenseTypes={expenseTypes}
                  expenseCycles={expenseCycles}
                  indexLabel={`Expense ${existingExpenses.length + index + 1}`}
                  // Props for direct expense object properties
                  typeId={expense.typeId}
                  amount={expense.amount}
                  cycleId={expense.cycleId}
                  startDate={expense.startDate}
                  endDate={expense.endDate}
                  comments={expense.comments}
                />
              ))}
            </View>
          )}

          {/* Add Expense Button */}
          <TouchableOpacity
            onPress={addNewExpense}
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
        </View>

      </ScrollView>

      {/* Action Buttons */}
      {!isKeyboardVisible && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          {/* Moved Out / Move In and Delete Buttons (side by side) */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Move Out / Move In Button */}
            <TouchableOpacity
              onPress={() => {
                if (isActive) {
                  setMoveOutDialogVisible(true);
                } else {
                  setMoveInDialogVisible(true);
                }
              }}
              disabled={isSaving}
              style={{
                flex: 1,
                backgroundColor: isActive ? '#fed7aa' : '#d1fae5',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: isActive ? '#b45309' : '#059669' }}>
                {isActive ? 'Moved Out' : 'Move In'}
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => setDeleteDialogVisible(true)}
              disabled={isSaving}
              style={{
                flex: 1,
                backgroundColor: '#fecaca',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#dc2626' }}>Delete Tenant</Text>
            </TouchableOpacity>
          </View>

          {/* Save Changes Button (full width) */}
          <TouchableOpacity
            onPress={async () => {
              // Save currently editing expense (if any)
              if (expandedExpenseId) {
                await closeEditExistingExpense();
              }
              // Save new expenses
              await saveNewExpenses();
              // Save tenant details
              handleSave();
            }}
            disabled={isSaving || isAddingExpense}
            style={{
              backgroundColor: '#4f39f6',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: isSaving || isAddingExpense ? 0.6 : 1,
            }}
          >
            {isSaving || isAddingExpense ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Tenant"
        message="This will permanently delete this tenant and all associated records. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteTenant}
        onCancel={cancelDeleteTenant}
        isDangerous={true}
      />

      {/* Move Out Confirmation Dialog */}
      <ConfirmDialog
        visible={moveOutDialogVisible}
        title="Confirm Move Out"
        message="Mark this tenant as moved out (inactive)?"
        confirmText="Move Out"
        cancelText="Cancel"
        onConfirm={confirmMoveOutTenant}
        onCancel={cancelMoveOutTenant}
        isDangerous={true}
      />

      {/* Move In Confirmation Dialog */}
      <ConfirmDialog
        visible={moveInDialogVisible}
        title="Confirm Move In"
        message="Mark this tenant as moved in (active)?"
        confirmText="Move In"
        cancelText="Cancel"
        onConfirm={confirmMoveInTenant}
        onCancel={cancelMoveInTenant}
        isDangerous={false}
      />

      {/* Delete Expense Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteExpenseDialogVisible}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteExpense}
        onCancel={cancelDeleteExpense}
        isDangerous={true}
      />



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
                  paddingBottom: 12,
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
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e2939' }}>
                Select {pickerType === 'type' ? 'Type' : 'Cycle'}
              </Text>
              <TouchableOpacity onPress={closePicker}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <FlatList
              data={
                pickerType === 'type'
                  ? expenseTypes
                  : expenseCycles
              }
              keyExtractor={(item) =>
                pickerType === 'type'
                  ? item.expenseTypeId.toString()
                  : item.expenseCycleId.toString()
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    selectFromPicker(
                      pickerType === 'type'
                        ? item.expenseTypeId
                        : item.expenseCycleId
                    )
                  }
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
                  <Text style={{ fontSize: 14, color: '#1e2939', fontWeight: '500' }}>
                    {pickerType === 'type'
                      ? item.expenseTypeName
                      : item.expenseCycleName}
                  </Text>
                  {(selectedExpenseId &&
                    ((pickerType === 'type' &&
                      newExpenses.find(e => e.id === selectedExpenseId)?.typeId ===
                        item.expenseTypeId) ||
                      (pickerType === 'cycle' &&
                        newExpenses.find(e => e.id === selectedExpenseId)?.cycleId ===
                          item.expenseCycleId))) && (
                    <Ionicons name="checkmark" size={20} color="#4f39f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

export default EditTenantDetailsSheet;
