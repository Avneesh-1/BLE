// Global date format state
export let globalDateFormat = 'DD/MM/YYYY HH:mm:ss';

// Storage keys for persistent settings
export const STORAGE_KEYS = {
  SENSOR_STATES: 'sensor_states',
  SERVER_SITE_NAME: 'server_site_name',
  SELECTED_SIM: 'selected_sim',
  SELECTED_SENSOR: 'selected_sensor',
  SELECTED_DATE_FORMAT: 'selected_date_format',
  THEME: 'theme',
  TIMER_INTERVAL: 'timer_interval',
  AUTO_REFRESH_ENABLED: 'auto_refresh_enabled',
  AUTO_REFRESH_INTERVAL: 'auto_refresh_interval',
  NOTIFICATION_SETTINGS: 'notification_settings',
  DEVICE_SETTINGS: 'device_settings',
  USER_PREFERENCES: 'user_preferences',
};

// BLE Service and Characteristic UUIDs
export const BLE_UUIDS = {
  // Service UUIDs
  CUSTOM_SERVICE: '00000180-0000-1000-8000-00805f9b34fb',
  GENERIC_ACCESS: '00001800-0000-1000-8000-00805f9b34fb',
  
  // Characteristic UUIDs
  DEVICE_NAME: '00002a00-0000-1000-8000-00805f9b34fb',
  WRITE_CHAR: '0000fff1-0000-1000-8000-00805f9b34fb', // F1
  READ_CHAR: '0000fff2-0000-1000-8000-00805f9b34fb',  // F2
  NOTIFY_CHAR: '0000fff3-0000-1000-8000-00805f9b34fb', // F3
};

// BLE Commands
export const BLE_COMMANDS = {
  SEND_DEVICE_STATUS: '{$send_device_status}',
  SEND_DEVICE_CONFIG: '{$send_device_config}',
  SEND_SENSOR_CONFIG: '{$send_sensor_config}',
  SEND_LOGS: '{$send_logs}',
  SEND_SENSOR_DATA: '{$send_sensor_data}',
  SEND_IMEI: '4',
};

// Timeout values
export const TIMEOUTS = {
  CONNECTION: 15000,
  COMMAND: 10000,
  DISCOVERY: 5000,
  MONITORING: 30000,
};

// Chunk size for BLE data transmission
export const CHUNK_SIZE = 18;

// Default values
export const DEFAULTS = {
  DATE_FORMAT: 'DD/MM/YYYY HH:mm:ss',
  THEME: 'system',
  TIMER_INTERVAL: 1000,
  AUTO_REFRESH_INTERVAL: 30000,
};



