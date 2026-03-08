import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { BLE_UUIDS, BLE_COMMANDS, TIMEOUTS, CHUNK_SIZE } from '../utils/constants';

// Initialize BLE Manager with proper error handling
let manager: BleManager | null = null;

export const initializeBLEManager = () => {
  try {
    if (!manager) {
      manager = new BleManager();
      console.log('BLE Manager created successfully');
      
      // Initialize BLE Manager with error handling
      manager.onStateChange((state: any) => {
        console.log('BLE State:', state);
      }, true);
    }
    return manager;
  } catch (error) {
    console.error('BLE Manager initialization error:', error);
    return null;
  }
};

export const getBLEManager = () => {
  if (!manager) {
    return initializeBLEManager();
  }
  return manager;
};

// BLE Utility Functions
export const chunkString = (str: string, size: number = CHUNK_SIZE) => {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
};

export const stringToBuffer = (str: string) => {
  return Buffer.from(str, 'utf8');
};

export const bufferToString = (buffer: Buffer) => {
  return buffer.toString('utf8');
};

// BLE Connection Functions
// export const connectToDevice = async (deviceId: string) => {
//   const bleManager = getBLEManager();
//   if (!bleManager) {
//     throw new Error('BLE Manager not initialized');
//   }

//   try {
//     const device = await bleManager.connectToDevice(deviceId, {
//       timeout: TIMEOUTS.CONNECTION,
//     });
//     console.log('Connected to device:', device.name);
//     return device;
//   } catch (error) {
//     console.error('Connection error:', error);
//     throw error;
//   }
// };

export async function connectToDevice(deviceId) {
    try {
        const device = await manager.connectToDevice(deviceId, { timeout: 15000 });
        console.log('✅ Connected to device:', device.id);
        let attempts = 3;
        while (attempts > 0) {
            try {
                await device.discoverAllServicesAndCharacteristics();
                const services = await device.services();
                if (services.length === 0) {
                    throw new Error('No services found after discovery');
                }
                console.log('✅ Services discovered:', services.map(s => s.uuid));
                for (const service of services) {
                    const characteristics = await device.characteristicsForService(service.uuid);
                    console.log(`Characteristics for ${service.uuid}:`, characteristics.map(c => ({
                        uuid: c.uuid,
                        isNotifying: c.isNotifying,
                        isReadable: c.isReadable,
                        isWritableWithResponse: c.isWritableWithResponse
                    })));
                }
               
                return device;
            } catch (discoveryError) {
                console.warn(`⚠️ Discovery attempt ${4 - attempts} failed:`, discoveryError);
                attempts--;
                if (attempts === 0) throw discoveryError;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.error('❌ Connection failed:', error);
        
        throw error;
    }
}

export const discoverServices = async (device: any) => {
  try {
    const discoveredDevice = await device.discoverAllServicesAndCharacteristics();
    console.log('Services discovered for device:', discoveredDevice.name);
    return discoveredDevice;
  } catch (error) {
    console.error('Service discovery error:', error);
    throw error;
  }
};

// BLE Communication Functions
export const writeToCharacteristic = async (
  device: any,
  serviceUUID: string,
  characteristicUUID: string,
  data: string
) => {
  try {
    const chunks = chunkString(data);
    console.log(`Writing ${chunks.length} chunks to ${characteristicUUID}`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const buffer = stringToBuffer(chunk);
      
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        buffer.toString('base64')
      );
      
      console.log(`Chunk ${i + 1}/${chunks.length} written:`, chunk);
      
      // Small delay between chunks
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('All chunks written successfully');
  } catch (error) {
    console.error('Write error:', error);
    throw error;
  }
};

export const readFromCharacteristic = async (
  device: any,
  serviceUUID: string,
  characteristicUUID: string
) => {
  try {
    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
    
    if (characteristic.value) {
      const buffer = Buffer.from(characteristic.value, 'base64');
      return bufferToString(buffer);
    }
    
    return null;
  } catch (error) {
    console.error('Read error:', error);
    throw error;
  }
};

export const monitorCharacteristic = async (
  device: any,
  serviceUUID: string,
  characteristicUUID: string,
  callback: (data: string) => void
) => {
  try {
    const subscription = device.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      (error: any, characteristic: any) => {
        if (error) {
          console.error('Monitor error:', error);
          return;
        }
        
        if (characteristic && characteristic.value) {
          const buffer = Buffer.from(characteristic.value, 'base64');
          const data = bufferToString(buffer);
          callback(data);
        }
      }
    );
    
    return subscription;
  } catch (error) {
    console.error('Monitor setup error:', error);
    throw error;
  }
};

// BLE Command Functions
export const sendCommand = async (
  device: any,
  command: string,
  serviceUUID: string = BLE_UUIDS.CUSTOM_SERVICE,
  characteristicUUID: string = BLE_UUIDS.WRITE_CHAR
) => {
  try {
    console.log('Sending command:', command);
    await writeToCharacteristic(device, serviceUUID, characteristicUUID, command);
    return true;
  } catch (error) {
    console.error('Command send error:', error);
    throw error;
  }
};

export const sendDeviceStatusCommand = async (device: any) => {
  return sendCommand(device, BLE_COMMANDS.SEND_DEVICE_STATUS);
};

export const sendDeviceConfigCommand = async (device: any) => {
  return sendCommand(device, BLE_COMMANDS.SEND_DEVICE_CONFIG);
};

export const sendSensorConfigCommand = async (device: any) => {
  return sendCommand(device, BLE_COMMANDS.SEND_SENSOR_CONFIG);
};

export const sendLogsCommand = async (device: any) => {
  return sendCommand(device, BLE_COMMANDS.SEND_LOGS);
};

export const sendSensorDataCommand = async (device: any) => {
  return sendCommand(device, BLE_COMMANDS.SEND_SENSOR_DATA);
};

export const sendIMEICommand = async (device: any) => {
  return sendCommand(device, BLE_COMMANDS.SEND_IMEI);
};

// BLE State Management
export const getBLEState = async () => {
  const bleManager = getBLEManager();
  if (!bleManager) {
    return 'Unavailable';
  }
  
  try {
    return await bleManager.state();
  } catch (error) {
    console.error('Error getting BLE state:', error);
    return 'Unknown';
  }
};

export const isBLESupported = () => {
  return manager !== null;
};

// Cleanup
export const destroyBLEManager = () => {
  if (manager) {
    manager.destroy();
    manager = null;
    console.log('BLE Manager destroyed');
  }
};



