// In-memory storage for current session
const sessionStorage: { [key: string]: any } = {};

// Storage utility functions (in-memory for now)
export const saveToStorage = async (key: string, value: any) => {
  try {
    sessionStorage[key] = value;
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const loadFromStorage = async (key: string, defaultValue: any) => {
  try {
    return sessionStorage[key] !== undefined ? sessionStorage[key] : defaultValue;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return defaultValue;
  }
};

export const removeFromStorage = async (key: string) => {
  try {
    delete sessionStorage[key];
  } catch (error) {
    console.error('Error removing from storage:', error);
  }
};

export const clearStorage = async () => {
  try {
    Object.keys(sessionStorage).forEach(key => {
      delete sessionStorage[key];
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// Get all storage keys
export const getStorageKeys = () => {
  return Object.keys(sessionStorage);
};

// Check if key exists in storage
export const hasStorageKey = (key: string) => {
  return sessionStorage[key] !== undefined;
};



