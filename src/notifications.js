// الإشعارات: الأذونات + جدولة/إلغاء المنبهات
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getNextTrigger } from './utils';

const T = Notifications.SchedulableTriggerInputTypes;
const ch = Platform.OS === 'android' ? { channelId: 'alarm' } : {};

// إظهار الإشعار والصوت حتى والتطبيق مفتوح
export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

// طلب الإذن + إنشاء قناة أندرويد عالية الأولوية
export async function ensurePermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarm', {
      name: 'المنبهات', importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 500, 500, 500], sound: 'default',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const content = (a) => ({ title: `⏰ ${a.label}`, body: 'اضغط لإيقاف المنبه', sound: true, data: { alarmId: a.id } });

// جدولة منبه: مرة واحدة (DATE) أو أسبوعيًا لكل يوم (WEEKLY). تُرجع معرّفات الإشعارات
export async function scheduleAlarm(a) {
  if (a.days.length === 0) {
    const date = getNextTrigger(a);
    return [await Notifications.scheduleNotificationAsync({ content: content(a), trigger: { type: T.DATE, date, ...ch } })];
  }
  return Promise.all(a.days.map((d) =>
    Notifications.scheduleNotificationAsync({
      content: content(a),
      trigger: { type: T.WEEKLY, weekday: d + 1, hour: a.hour, minute: a.minute, ...ch }, // الأحد = 1
    })));
}

export const cancelAlarm = (a) =>
  Promise.all((a.notifIds || []).map((id) => Notifications.cancelScheduledNotificationAsync(id)));

// غفوة: إشعار بعد 5 دقائق
export const scheduleSnooze = (a) =>
  Notifications.scheduleNotificationAsync({
    content: content(a),
    trigger: { type: T.DATE, date: new Date(Date.now() + 5 * 60000), ...ch },
  });
