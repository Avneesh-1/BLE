# App Icon Update Guide

## To update the app icon with Safe Water Network logo:

### 1. Android Icons
Replace the following files with your SWN logo in the appropriate sizes:

**Location**: `BLEApp/android/app/src/main/res/`

- `mipmap-hdpi/ic_launcher.png` (72x72 px)
- `mipmap-hdpi/ic_launcher_round.png` (72x72 px)
- `mipmap-mdpi/ic_launcher.png` (48x48 px)
- `mipmap-mdpi/ic_launcher_round.png` (48x48 px)
- `mipmap-xhdpi/ic_launcher.png` (96x96 px)
- `mipmap-xhdpi/ic_launcher_round.png` (96x96 px)
- `mipmap-xxhdpi/ic_launcher.png` (144x144 px)
- `mipmap-xxhdpi/ic_launcher_round.png` (144x144 px)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192 px)
- `mipmap-xxxhdpi/ic_launcher_round.png` (192x192 px)

### 2. iOS Icons
For iOS, you'll need to replace the icons in:
`BLEApp/ios/BLEApp/Images.xcassets/AppIcon.appiconset/`

You can use an online tool like https://appicon.co/ to generate all the required iOS icon sizes from your SWN logo.

### 3. App Name Changes Made
✅ Updated `app.json` - display name changed to "Safe Water Network"
✅ Updated `android/app/src/main/res/values/strings.xml` - app name changed
✅ Updated `ios/BLEApp/Info.plist` - CFBundleDisplayName changed

### 4. After Icon Replacement
Run these commands to rebuild the app:
```bash
cd BLEApp
npx react-native run-android
# or for iOS
npx react-native run-ios
```

The app will now display as "Safe Water Network" with your custom logo! 