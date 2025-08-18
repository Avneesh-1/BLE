// Data Parsing Utilities for BLE Responses

// Parse device status data from F3 response
export const parseDeviceStatus = (data: string) => {
  try {
    console.log('Raw device status data received:', data);
    
    // Remove { } wrapper and split by comma
    const cleanData = data.replace(/^[{}]+|[{}]+$/g, '');
    console.log('Cleaned data:', cleanData);
    
    const pairs = cleanData.split(',');
    const statusData: any = {};
    
    pairs.forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value !== undefined) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        statusData[cleanKey] = cleanValue;
        console.log(`Parsed: ${cleanKey} = ${cleanValue}`);
      }
    });
    
    console.log('Final parsed status data:', statusData);
    return statusData;
  } catch (error) {
    console.log('Error parsing device status:', error);
    return null;
  }
};

// Parse device configuration data
export const parseDeviceConfig = (data: string) => {
  try {
    console.log('Parsing device config data:', data);
    
    // Remove outer braces and split by comma
    const cleanData = data.replace(/^[{}]+|[{}]+$/g, '');
    console.log('Cleaned config data:', cleanData);
    
    const pairs = cleanData.split(',');
    const configData: any = {};
    
    pairs.forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value !== undefined) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        configData[cleanKey] = cleanValue;
        console.log(`Config parsed: ${cleanKey} = ${cleanValue}`);
      }
    });
    
    console.log('Final parsed config data:', configData);
    return configData;
  } catch (error) {
    console.log('Error parsing device config:', error);
    return null;
  }
};

// Parse sensor configuration data
export const parseSensorConfig = (data: string) => {
  try {
    console.log('Parsing sensor config data:', data);
    
    // Remove outer braces and split by comma
    const cleanData = data.replace(/^[{}]+|[{}]+$/g, '');
    console.log('Cleaned sensor config data:', cleanData);
    
    const pairs = cleanData.split(',');
    const sensorData: any = {};
    
    pairs.forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value !== undefined) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        sensorData[cleanKey] = cleanValue;
        console.log(`Sensor config parsed: ${cleanKey} = ${cleanValue}`);
      }
    });
    
    console.log('Final parsed sensor config data:', sensorData);
    return sensorData;
  } catch (error) {
    console.log('Error parsing sensor config:', error);
    return null;
  }
};

// Extract IMEI from logs data
export const extractIMEIFromLogs = (data: string) => {
  try {
    console.log('Extracting IMEI from logs data:', data);
    
    // Look for IMEI pattern in the data
    const imeiMatch = data.match(/IMEI[:\s]*([0-9]+)/i);
    if (imeiMatch && imeiMatch[1]) {
      const imei = imeiMatch[1];
      console.log('Extracted IMEI:', imei);
      return imei;
    }
    
    // Alternative patterns
    const patterns = [
      /([0-9]{15})/, // 15-digit IMEI
      /IMEI[:\s]*([0-9]{15})/i,
      /Device[:\s]*([0-9]{15})/i,
    ];
    
    for (const pattern of patterns) {
      const match = data.match(pattern);
      if (match && match[1]) {
        console.log('Extracted IMEI using pattern:', match[1]);
        return match[1];
      }
    }
    
    console.log('No IMEI found in logs data');
    return null;
  } catch (error) {
    console.log('Error extracting IMEI:', error);
    return null;
  }
};

// Parse server site name from various formats
export const parseServerSiteName = (configData: any) => {
  const serverSiteName = configData.Servr_name || 
                        configData.Server || 
                        configData.server || 
                        configData.Server_site || 
                        configData.server_site || '';
  
  if (serverSiteName) {
    console.log('Device server site name extracted:', serverSiteName);
  }
  
  return serverSiteName;
};

// Parse SIM name from various formats
export const parseSIMName = (configData: any) => {
  const simName = configData.gsm_sim_name || 
                 configData.gsm_sim || 
                 configData.sim_name || '';
  
  if (simName) {
    console.log('Device SIM name extracted:', simName);
  }
  
  return simName;
};

// Parse data frequency from various formats
export const parseDataFrequency = (configData: any) => {
  const dataFreq = configData.data_freq || 
                  configData.data_frequency || '';
  
  if (dataFreq) {
    console.log('Device data frequency extracted:', dataFreq);
  }
  
  return dataFreq;
};

// Parse date format from various formats
export const parseDateFormat = (configData: any) => {
  const dateFormat = configData.date_fr || 
                    configData.date_format || '';
  
  if (dateFormat) {
    console.log('Device date format extracted:', dateFormat);
  }
  
  return dateFormat;
};

// Parse time format from various formats
export const parseTimeFormat = (configData: any) => {
  const timeFormat = configData.time_fr || 
                    configData.time_format || '';
  
  if (timeFormat) {
    console.log('Device time format extracted:', timeFormat);
  }
  
  return timeFormat;
};

// Parse GPIO extender status
export const parseGPIOStatus = (configData: any) => {
  const gpioEnabled = configData.gpio_extender_enabled || '0';
  
  if (gpioEnabled) {
    console.log('Device GPIO extender status extracted:', gpioEnabled);
  }
  
  return gpioEnabled;
};

// Generic data parser for any BLE response
export const parseBLEResponse = (data: string, type: 'status' | 'config' | 'sensor' | 'logs') => {
  try {
    console.log(`Parsing ${type} data:`, data);
    
    // Remove outer braces and split by comma
    const cleanData = data.replace(/^[{}]+|[{}]+$/g, '');
    console.log(`Cleaned ${type} data:`, cleanData);
    
    const pairs = cleanData.split(',');
    const parsedData: any = {};
    
    pairs.forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value !== undefined) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        parsedData[cleanKey] = cleanValue;
        console.log(`${type} parsed: ${cleanKey} = ${cleanValue}`);
      }
    });
    
    console.log(`Final parsed ${type} data:`, parsedData);
    return parsedData;
  } catch (error) {
    console.log(`Error parsing ${type} data:`, error);
    return null;
  }
};



