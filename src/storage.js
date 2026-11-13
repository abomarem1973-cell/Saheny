// التخزين المحلي للمنبهات (AsyncStorage) + ربطه بالجدولة
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { scheduleAlarm, cancelAlarm } from './notifications';

const KEY = 'wakesnap.alarms';

export async function loadAlarms() {
  try { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
const save = (list) => AsyncStorage.setItem(KEY, JSON.stringify(list));

export async function getAlarm(id) { return (await loadAlarms()).find((a) => a.id === id); }

// إضافة أو تعديل منبه، وإعادة جدولة إشعاراته
export async function upsertAlarm(alarm) {
  const list = await loadAlarms();
  const old = list.find((a) => a.id === alarm.id);
  if (old) await cancelAlarm(old);
  const saved = { ...alarm, notifIds: alarm.enabled ? await scheduleAlarm(alarm) : [] };
  await save(old ? list.map((a) => (a.id === alarm.id ? saved : a)) : [...list, saved]);
  return saved;
}

export async function removeAlarm(id) {
  const list = await loadAlarms();
  const old = list.find((a) => a.id === id);
  if (old) await cancelAlarm(old);
  await save(list.filter((a) => a.id !== id));
}

// تعديل بسيط بدون إعادة جدولة (مثل تعطيل منبه المرة الواحدة بعد إيقافه)
export async function updateAlarm(id, patch) {
  await save((await loadAlarms()).map((a) => (a.id === id ? { ...a, ...patch } : a)));
}

// Hook: يحمّل المنبهات عند كل ظهور للشاشة
export function useAlarms() {
  const [alarms, setAlarms] = useState([]);
  const reload = useCallback(async () => setAlarms(await loadAlarms()), []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  return { alarms, reload };
}
