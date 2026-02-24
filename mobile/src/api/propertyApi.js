// Configure the API base URL based on environment
const API_BASE_URL = 'http://192.168.29.204:5248/api';

export const propertyApi = {
  // Get all properties for a specific owner
  getPropertiesByOwner: async (userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/owner/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch properties';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get a single property by ID
  getProperty: async (propertyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch property';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },

  // Get pending amount due for a property
  getPendingAmount: async (propertyId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/pending-amount`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch pending amount';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data.pendingAmount || 0;
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Error fetching pending amount:', error);
      return 0;
    }
  },

  // Get pending amount due for a specific tenant
  getTenantPendingAmount: async (tenantId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/tenants/${tenantId}/pending-amount`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch tenant pending amount';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data.pendingAmount || 0;
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Error fetching tenant pending amount:', error);
      return 0;
    }
  },

  // Get units with tenants for a property
  getUnits: async (propertyId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/units`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch units';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
  },

  // Create a new unit for a property
  createUnit: async (propertyId, unitData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/units`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            unitName: unitData.unitName,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create unit';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return { unitId: null, unitName: unitData.unitName };
      }
    } catch (error) {
      console.error('Error creating unit:', error);
      throw error;
    }
  },

  // Update unit name
  updateUnit: async (unitId, unitData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/units/${unitId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            unitName: unitData.unitName,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update unit';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return { unitId, unitName: unitData.unitName };
      }
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  },

  
  createProperty: async (propertyData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId: propertyData.ownerId,
          propertyName: propertyData.propertyName,
          unitCount: propertyData.unitCount,
          addressText: propertyData.addressText,
          location: propertyData.location,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create property';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return { propertyId: null, propertyName: propertyData.propertyName };
      }
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },

  // Update an existing property
  updateProperty: async (propertyId, updateData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update property';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  // Delete a property
  deleteProperty: async (propertyId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete property';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  // Delete a unit
  deleteUnit: async (unitId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/units/${unitId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete unit';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }
  },

  // Get tenants for a property
  getTenants: async (propertyId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/tenants`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch tenants';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }
  },

  // Get all tenants for a user (across all properties)
  getAllTenants: async (userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tenants/user/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch tenants';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching all tenants:', error);
      throw error;
    }
  },

  // Delete a tenant
  deleteTenant: async (propertyId, tenantId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/tenants/${tenantId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete tenant';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }
  },
};
