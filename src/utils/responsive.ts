import { Dimensions } from 'react-native';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device size breakpoints
const isTinyDevice = screenWidth < 320; // iPhone SE, small Android
const isSmallDevice = screenWidth >= 320 && screenWidth < 375; // iPhone 12 mini, small Android
const isMediumDevice = screenWidth >= 375 && screenWidth < 414; // iPhone 12, most Android
const isLargeDevice = screenWidth >= 414 && screenWidth < 768; // iPhone 12 Pro Max, large Android
const isTablet = screenWidth >= 768; // iPad, Android tablets

// Enhanced responsive scaling functions
export const scale = (size: number) => {
  if (isTinyDevice) return size * 0.7;
  if (isSmallDevice) return size * 0.8;
  if (isMediumDevice) return size * 0.9;
  if (isLargeDevice) return size * 1.0;
  if (isTablet) return size * 1.2;
  return size;
};

export const scaleFont = (size: number) => {
  if (isTinyDevice) return size - 3;
  if (isSmallDevice) return size - 2;
  if (isMediumDevice) return size - 1;
  if (isLargeDevice) return size;
  if (isTablet) return size + 2;
  return size;
};

// Screen-specific spacing
export const getSpacing = (baseSpacing: number) => {
  if (isTinyDevice) return baseSpacing * 0.6;
  if (isSmallDevice) return baseSpacing * 0.8;
  if (isMediumDevice) return baseSpacing * 0.9;
  if (isLargeDevice) return baseSpacing;
  if (isTablet) return baseSpacing * 1.3;
  return baseSpacing;
};

// Component-specific scaling
export const getHeaderHeight = () => {
  if (isTinyDevice) return 50;
  if (isSmallDevice) return 55;
  if (isMediumDevice) return 60;
  if (isLargeDevice) return 65;
  if (isTablet) return 80;
  return 60;
};

export const getCardPadding = () => {
  if (isTinyDevice) return 12;
  if (isSmallDevice) return 14;
  if (isMediumDevice) return 16;
  if (isLargeDevice) return 18;
  if (isTablet) return 24;
  return 16;
};

// Export screen dimensions for use in other files
export const screenDimensions = {
  width: screenWidth,
  height: screenHeight,
  isTinyDevice,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
};



