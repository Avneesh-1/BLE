import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

interface DeviceCardProps {
  device: any;
  onConnect: (device: any) => Promise<void>;
  onDisconnect: (device: any) => Promise<void>;
  onPress: (device: any) => void;
  onDashboardPress: (device: any) => void;
}

export const DeviceCard = React.memo(({ 
  device, 
  onConnect, 
  onDisconnect, 
  onPress, 
  onDashboardPress 
}: DeviceCardProps) => {
  const [connecting, setConnecting] = useState(false);
  const { theme } = useTheme();
  
  // Calculate color and text for RSSI
  const rssiInfo = useMemo(() => {
    let rssiColor = theme.textSecondary;
    let rssiBg = theme.isDark ? '#2a2a2a' : '#f0f0f0';
    if (device.rssi >= -60) { rssiColor = theme.text; rssiBg = theme.success; }
    else if (device.rssi >= -80) { rssiColor = theme.text; rssiBg = '#8bc34a'; }
    else if (device.rssi < -80) { rssiColor = theme.text; rssiBg = '#9c27b0'; }
    return { rssiColor, rssiBg };
  }, [device.rssi, theme]);

  // Approximate distance (very rough, for demo)
  const distance = useMemo(() => {
    const dist = device.rssi ? Math.abs((27.55 - (20 * Math.log10(2400)) + Math.abs(device.rssi)) / 20.0) : 0;
    return dist.toFixed(2);
  }, [device.rssi]);

  // Use device's connectability status
  const isConnectable = device.isConnectable || false;
  const isConnected = device.isConnected || false;

  const handleConnectDisconnect = useCallback(async () => {
    if (!isConnectable || connecting) return;
    setConnecting(true);
    try {
      if (isConnected) {
        await onDisconnect(device);
      } else {
        await onConnect(device);
      }
    } catch (error) {
      console.error('Connection/Disconnection error:', error);
    } finally {
      setConnecting(false);
    }
  }, [isConnectable, connecting, isConnected, onConnect, onDisconnect, device]);

  return (
    <TouchableOpacity 
      onPress={() => isConnected ? onDashboardPress(device) : null} 
      activeOpacity={isConnected ? 0.7 : 1} 
      style={{ 
        flex: 1, 
        opacity: isConnected ? 1 : 0.8,
        transform: [{ scale: connecting ? 0.98 : 1 }],
      }}
    >
      <View style={{
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        elevation: 4,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: isConnected ? theme.success : theme.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {/* RSSI Indicator */}
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: rssiInfo.rssiBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            elevation: 2,
          }}> 
            <Text style={{ color: rssiInfo.rssiColor, fontWeight: 'bold', fontSize: 16 }}>
              {device.rssi || '--'}
            </Text>
            <Text style={{ color: rssiInfo.rssiColor, fontSize: 10, fontWeight: '500' }}>
              dBm
            </Text>
          </View>

          {/* Device Info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: theme.text,
                flex: 1,
              }}>
                {device.name || 'Unknown Device'}
              </Text>
              {isConnected && (
                <View style={{
                  backgroundColor: theme.success,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 10, color: theme.text, fontWeight: '600' }}>
                    CONNECTED
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={{ 
              fontSize: 12, 
              color: theme.textSecondary, 
              marginBottom: 8,
              fontFamily: 'monospace',
            }}>
              {device.id}
            </Text>

            {/* Device Stats */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon name="map-marker-distance" size={14} color={theme.textSecondary} />
              <Text style={{ 
                fontSize: 12, 
                color: theme.textSecondary, 
                marginLeft: 6 
              }}>
                Distance: {distance} m
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="wifi" size={14} color={theme.textSecondary} />
              <Text style={{ 
                fontSize: 12, 
                color: theme.textSecondary, 
                marginLeft: 6 
              }}>
                Signal: {device.rssi || '--'} dBm
              </Text>
            </View>

            {!isConnected && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                backgroundColor: theme.isDark ? '#2a2a2a' : '#fff3e0',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}>
                <Icon name="lock" size={12} color={theme.warning} />
                <Text style={{ 
                  fontSize: 11, 
                  color: theme.warning, 
                  marginLeft: 6, 
                  fontWeight: '500' 
                }}>
                  Connect to access dashboard
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.info,
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 2,
              }}
              onPress={() => onPress(device)}
              activeOpacity={0.8}
            >
              <Icon name="information" size={16} color={theme.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: theme.isDark ? '#2a2a2a' : '#f0f0f0',
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 2,
              }}
              activeOpacity={0.8}
            >
              <Icon name="chart-line" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: connecting ? theme.warning : (isConnected ? theme.error : (isConnectable ? theme.success : theme.border)),
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              elevation: 2,
              shadowColor: connecting ? theme.warning : (isConnected ? theme.error : (isConnectable ? theme.success : theme.border)),
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
            }}
            disabled={!isConnectable || connecting}
            onPress={handleConnectDisconnect}
            activeOpacity={0.8}
          >
            {connecting ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <Text style={{ 
                color: theme.text, 
                fontWeight: 'bold',
                fontSize: 12,
                textAlign: 'center',
              }}>
                {isConnected ? 'DISCONNECT' : (isConnectable ? 'CONNECT' : 'Not Available')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});



