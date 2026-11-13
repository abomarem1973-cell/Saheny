import React, { useEffect } from 'react';
import { I18nManager, DevSettings } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold, Cairo_900Black } from '@expo-google-fonts/cairo';
import HomeScreen from './src/screens/HomeScreen';
import AddAlarmScreen from './src/screens/AddAlarmScreen';
import AlarmRingingScreen from './src/screens/AlarmRingingScreen';
import { setupNotifications, ensurePermissions } from './src/notifications';
import { getAlarm } from './src/storage';
import { colors } from './src/theme';

// تفعيل RTL: في APK يُفعَّل أصليًا (scripts/configure.js)، وهنا للتطوير فقط
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  if (__DEV__) DevSettings.reload();
}

setupNotifications();
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

// فتح شاشة الرنين عند وصول إشعار المنبه أو الضغط عليه
async function openRinging(notification) {
  const id = notification?.request?.content?.data?.alarmId;
  const alarm = id && (await getAlarm(id));
  if (!alarm || !navRef.isReady() || navRef.getCurrentRoute()?.name === 'Ringing') return;
  navRef.navigate('Ringing', { alarm });
}

export default function App() {
  const [loaded] = useFonts({ Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold, Cairo_900Black });

  useEffect(() => {
    ensurePermissions();
    const a = Notifications.addNotificationReceivedListener(openRinging);
    const b = Notifications.addNotificationResponseReceivedListener((r) => openRinging(r.notification));
    return () => { a.remove(); b.remove(); };
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer ref={navRef}
        onReady={async () => { const r = await Notifications.getLastNotificationResponseAsync(); if (r) openRinging(r.notification); }}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddAlarm" component={AddAlarmScreen} options={{ presentation: 'modal' }} />
          {/* بدون سحب للرجوع: المنبه لا يُغلق إلا بإنجاز المهمة */}
          <Stack.Screen name="Ringing" component={AlarmRingingScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
