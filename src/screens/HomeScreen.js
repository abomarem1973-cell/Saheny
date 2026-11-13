import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradients } from '../theme';
import { GlassCard, GradientButton } from '../ui';
import { useAlarms, upsertAlarm } from '../storage';
import { DAYS, formatTime, getNextTrigger, countdownText } from '../utils';

const taskInfo = (a) =>
  a.task === 'math'
    ? { icon: 'calculator', text: 'حل لغز رياضي' }
    : { icon: 'camera', text: `صوّر: ${a.photoTarget}` };

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { alarms, reload } = useAlarms(); // من التخزين المحلي
  const [now, setNow] = useState(new Date());

  // تحديث الوقت كل 30 ثانية لتحديث العد التنازلي
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const toggle = async (id) => {
    const a = alarms.find((x) => x.id === id);
    await upsertAlarm({ ...a, enabled: !a.enabled }); // يعيد الجدولة أو يلغيها
    reload();
  };

  // أقرب منبه مفعّل
  const next = alarms
    .filter((a) => a.enabled)
    .map((a) => ({ alarm: a, at: getNextTrigger(a, now) }))
    .filter((x) => x.at)
    .sort((x, y) => x.at - y.at)[0];

  const h = now.getHours();
  const greeting = h < 12 ? 'صباح الخير' : h < 18 ? 'مساء النور' : 'ليلة سعيدة';
  const dateText = now.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <LinearGradient colors={gradients.night} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110, paddingHorizontal: 20 }}>
        {/* الترحيب */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting} ☀️</Text>
            <Text style={s.date}>{dateText}</Text>
          </View>
          <Pressable style={s.iconBtn} onPress={() => Alert.alert('الإعدادات', 'قريبًا')}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* بطاقة المنبه القادم */}
        <LinearGradient colors={gradients.sunrise} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <Ionicons name="alarm" size={110} color="rgba(26,26,46,0.12)" style={s.heroBg} />
          {next ? (
            <>
              <Text style={s.heroLabel}>المنبه القادم</Text>
              <View style={s.timeRow}>
                <Text style={s.heroTime}>{formatTime(next.alarm.hour, next.alarm.minute).time}</Text>
                <Text style={s.heroPeriod}>{formatTime(next.alarm.hour, next.alarm.minute).period}</Text>
              </View>
              <Text style={s.heroCount}>{countdownText(next.at, now)}</Text>
              <View style={s.chip}>
                <Ionicons name={taskInfo(next.alarm).icon} size={16} color={colors.bg} />
                <Text style={s.chipText}>{taskInfo(next.alarm).text}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={s.heroLabel}>لا توجد منبهات مفعّلة</Text>
              <Text style={s.heroCount}>فعّل منبهًا أو أضف واحدًا جديدًا</Text>
            </>
          )}
        </LinearGradient>

        {/* قائمة المنبهات */}
        <Text style={s.section}>منبهاتك</Text>
        {alarms.length === 0 && <Text style={s.empty}>لا توجد منبهات بعد، اضغط + لإضافة أول منبه</Text>}
        {alarms.map((a) => {
          const { time, period } = formatTime(a.hour, a.minute);
          const info = taskInfo(a);
          return (
            <Pressable key={a.id} onPress={() => navigation.navigate('AddAlarm', { alarm: a })}>
            <GlassCard style={[s.card, !a.enabled && { opacity: 0.55 }]}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <View style={s.timeRow}>
                    <Text style={s.cardTime}>{time}</Text>
                    <Text style={s.cardPeriod}>{period}</Text>
                  </View>
                  <Text style={s.cardLabel}>{a.label}</Text>
                  {/* أيام التكرار */}
                  <View style={s.days}>
                    {DAYS.map((d, i) => (
                      <View key={i} style={[s.day, a.days.includes(i) && s.dayOn]}>
                        <Text style={[s.dayText, a.days.includes(i) && { color: colors.bg }]}>{d}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={s.task}>
                    <Ionicons name={info.icon} size={14} color={colors.sun} />
                    <Text style={s.taskText}>{info.text}</Text>
                  </View>
                </View>
                <Switch
                  value={a.enabled}
                  onValueChange={() => toggle(a.id)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.coral }}
                  thumbColor={a.enabled ? colors.sun : '#ddd'}
                />
              </View>
            </GlassCard>
            </Pressable>
          );
        })}

        {/* زر تجربة الرنين (للتطوير فقط) */}
        <GradientButton
          title="جرّب رنين المنبه"
          icon="play-circle"
          style={{ marginTop: 12 }}
          onPress={() => navigation.navigate('Ringing', { alarm: alarms[0] })}
        />
      </ScrollView>

      {/* زر إضافة منبه */}
      <Pressable style={[s.fab, { bottom: insets.bottom + 24 }]} onPress={() => navigation.navigate('AddAlarm')}>
        <LinearGradient colors={gradients.sunrise} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.fabInner}>
          <Ionicons name="add" size={32} color={colors.bg} />
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontFamily: fonts.black, fontSize: 28, color: colors.text },
  date: { fontFamily: fonts.regular, fontSize: 15, color: colors.textDim },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },

  hero: { borderRadius: 28, padding: 22, overflow: 'hidden' },
  heroBg: { position: 'absolute', start: -10, bottom: -20 },
  heroLabel: { fontFamily: fonts.semi, fontSize: 15, color: colors.bg },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  heroTime: { fontFamily: fonts.black, fontSize: 64, color: colors.bg, lineHeight: 84 },
  heroPeriod: { fontFamily: fonts.bold, fontSize: 22, color: colors.bg },
  heroCount: { fontFamily: fonts.semi, fontSize: 16, color: colors.bg, marginBottom: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  chipText: { fontFamily: fonts.semi, fontSize: 13, color: colors.bg },

  section: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginTop: 28, marginBottom: 12 },
  card: { marginBottom: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.textDim, textAlign: 'center', marginVertical: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTime: { fontFamily: fonts.black, fontSize: 34, color: colors.text, lineHeight: 50 },
  cardPeriod: { fontFamily: fonts.bold, fontSize: 16, color: colors.sun },
  cardLabel: { fontFamily: fonts.regular, fontSize: 15, color: colors.textDim },
  days: { flexDirection: 'row', gap: 6, marginTop: 10 },
  day: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  dayOn: { backgroundColor: colors.sun },
  dayText: { fontFamily: fonts.semi, fontSize: 12, color: colors.textDim },
  task: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  taskText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textDim },

  fab: { position: 'absolute', end: 20, elevation: 8 },
  fabInner: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
