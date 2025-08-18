import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import { ScannerScreen } from '../screens/ScannerScreen';
import { DeviceDashboardScreen } from '../screens/DeviceDashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Import contexts
import { useTheme } from '../contexts/ThemeContext';

// Define navigation types
export type RootStackParamList = {
  Main: undefined;
  DeviceDetails: { device: any };
  DeviceDashboard: { device: any };
  Settings: undefined;
  Splash: undefined;
};

export type MainTabParamList = {
  Scanner: undefined;
  Dashboard: undefined;
  Settings: undefined;
};

export type DeviceDetailsTabParamList = {
  Overview: { device: any };
  Sensors: { device: any };
  Logs: { device: any };
  Calibration: { device: any };
};

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const TopTab = createMaterialTopTabNavigator<DeviceDetailsTabParamList>();

// Main Tab Navigator
function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bluetooth" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DeviceDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Device Details Top Tab Navigator
function DeviceDetailsTopTabNavigator({ route }: { route: any }) {
  const { theme } = useTheme();
  const { device } = route.params;

  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarIndicatorStyle: {
          backgroundColor: theme.primary,
        },
        tabBarStyle: {
          backgroundColor: theme.surface,
          elevation: 4,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          textTransform: 'none',
        },
      }}
    >
      <TopTab.Screen
        name="Overview"
        component={DeviceOverviewScreen}
        initialParams={{ device }}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Icon name="information" color={color} size={size} />
          ),
        }}
      />
      <TopTab.Screen
        name="Sensors"
        component={DeviceSensorsScreen}
        initialParams={{ device }}
        options={{
          tabBarLabel: 'Sensors',
          tabBarIcon: ({ color, size }) => (
            <Icon name="thermometer" color={color} size={size} />
          ),
        }}
      />
      <TopTab.Screen
        name="Logs"
        component={DeviceLogsScreen}
        initialParams={{ device }}
        options={{
          tabBarLabel: 'Logs',
          tabBarIcon: ({ color, size }) => (
            <Icon name="file-document" color={color} size={size} />
          ),
        }}
      />
      <TopTab.Screen
        name="Calibration"
        component={DeviceCalibrationScreen}
        initialParams={{ device }}
        options={{
          tabBarLabel: 'Calibration',
          tabBarIcon: ({ color, size }) => (
            <Icon name="tune" color={color} size={size} />
          ),
        }}
      />
    </TopTab.Navigator>
  );
}

// Placeholder screen components (these would be extracted from the main App.tsx)
function DeviceOverviewScreen({ route }: { route: any }) {
  const { device } = route.params;
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
        Device Overview
      </Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8 }}>
        {device?.name || 'Unknown Device'}
      </Text>
    </View>
  );
}

function DeviceSensorsScreen({ route }: { route: any }) {
  const { device } = route.params;
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
        Sensors
      </Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8 }}>
        Sensor data for {device?.name || 'Unknown Device'}
      </Text>
    </View>
  );
}

function DeviceLogsScreen({ route }: { route: any }) {
  const { device } = route.params;
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
        Device Logs
      </Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8 }}>
        Logs for {device?.name || 'Unknown Device'}
      </Text>
    </View>
  );
}

function DeviceCalibrationScreen({ route }: { route: any }) {
  const { device } = route.params;
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
        Calibration
      </Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8 }}>
        Calibration settings for {device?.name || 'Unknown Device'}
      </Text>
    </View>
  );
}

// Splash Screen
function SplashScreen() {
  const { theme } = useTheme();

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.background, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
        BLE App
      </Text>
      <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 8 }}>
        Loading...
      </Text>
    </View>
  );
}

// Main App Navigator
export function AppNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          notification: theme.error,
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen 
          name="DeviceDetails" 
          component={DeviceDetailsTopTabNavigator}
          options={{
            headerShown: true,
            headerTitle: 'Device Details',
            headerStyle: {
              backgroundColor: theme.surface,
            },
            headerTintColor: theme.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="DeviceDashboard" 
          component={DeviceDashboardScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Import View and Text for placeholder components
import { View, Text } from 'react-native';



