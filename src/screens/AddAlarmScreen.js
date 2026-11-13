// إضافة / تعديل منبه
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Platform, Alert, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradients } from '../theme';
import { GlassCard, GradientButton } from '../ui';
import { DAYS, formatTime } from '../utils';
import { upsertAlarm, removeAlarm } from '../storage';
import { ensurePermissions } from '../notifications';

const TARGETS = ['كوب القهوة', 'فرشاة الأسنان', 'حوض الغسيل', 'الثلاجة'];

export default function AddAlarmScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const editing = route.params?.alarm;
  const [time, setTime] = useState(() => { const d = new Date(); if (editing) d.setHours(editing.hour, editing.minute, 0, 0); return d; });
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [label, setLabel] = useState(editing?.label ?? 'منبه');
  const [days, setDays] = useState(editing?.days ?? []);
  const [task, setTask] = useState(editing?.task ?? 'math');
  const [target, setTarget] = useState(editing?.photoTarget ?? TARGETS[0]);

  const toggleDay = (i) => setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const { time: t, period } = formatTime(time.getHours(), time.getMinutes());

  const save = async () => {
    if (!(await ensurePermissions())) { Alert.alert('الإشعارات متوقفة', 'فعّل إذن الإشعارات من إعدادات الجهاز ليعمل المنبه.'); return; }
    await upsertAlarm({
      id: editing?.id ?? Date.now().toString(),
      hour: time.getHours(), minute: time.getMinutes(),
      label: label.trim() || 'منبه', days, task, enabled: true,
      photoTarget: task === 'photo' ? (target.trim() || TARGETS[0]) : undefined,
    });
    navigation.goBack();
  };

  const remove = async () => { await removeAlarm(editing.id); navigation.goBack(); };

  return (
    <LinearGradient colors={gradients.night} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30, gap: 16 }}>
        <View style={s.header}>
          <Text style={s.h1}>{editing ? 'تعديل المنبه' : 'منبه جديد'}</Text>
          <Pressable style={s.close} onPress={() => navigation.goBack()}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
        </View>

        {/* الوقت */}
        <GlassCard>
          <Pressable onPress={() => setShowPicker(true)} style={s.timeRow}>
            <Text style={s.time}>{t}</Text><Text style={s.period}>{period}</Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker value={time} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant="dark"
              onChange={(e, d) => { if (Platform.OS === 'android') setShowPicker(false); if (d && e.type !== 'dismissed') setTime(d); }} />
          )}
        </GlassCard>

        {/* الاسم والأيام */}
        <GlassCard style={{ gap: 12 }}>
          <TextInput style={s.input} value={label} onChangeText={setLabel} placeholder="اسم المنبه" placeholderTextColor={colors.textDim} />
          <Text style={s.sub}>التكرار (بدون اختيار = مرة واحدة)</Text>
          <View style={s.days}>
            {DAYS.map((d, i) => (
              <Pressable key={i} onPress={() => toggleDay(i)} style={[s.day, days.includes(i) && s.dayOn]}>
                <Text style={[s.dayText, days.includes(i) && { color: colors.bg }]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* المهمة */}
        <GlassCard style={{ gap: 12 }}>
          <Text style={s.sub}>مهمة الإيقاف</Text>
          <View style={s.tasks}>
            {[['math', 'calculator', 'لغز رياضي'], ['photo', 'camera', 'التقاط صورة']].map(([k, icon, text]) => (
              <Pressable key={k} onPress={() => setTask(k)} style={[s.task, task === k && s.taskOn]}>
                <Ionicons name={icon} size={26} color={task === k ? colors.bg : colors.sun} />
                <Text style={[s.taskText, task === k && { color: colors.bg }]}>{text}</Text>
              </Pressable>
            ))}
          </View>
          {task === 'photo' && (
            <>
              <View style={s.days}>
                {TARGETS.map((x) => (
                  <Pressable key={x} onPress={() => setTarget(x)} style={[s.chip, target === x && s.dayOn]}>
                    <Text style={[s.dayText, target === x && { color: colors.bg }]}>{x}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={s.input} value={target} onChangeText={setTarget} placeholder="أو اكتب شيئًا آخر" placeholderTextColor={colors.textDim} />
            </>
          )}
        </GlassCard>

        <GradientButton title="حفظ المنبه" icon="checkmark-circle" onPress={save} />
        {editing && (
          <Pressable onPress={remove} style={s.del}><Ionicons name="trash" size={18} color="#FF8A8A" /><Text style={s.delText}>حذف المنبه</Text></Pressable>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { fontFamily: fonts.black, fontSize: 26, color: colors.text },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8 },
  time: { fontFamily: fonts.black, fontSize: 64, color: colors.text, lineHeight: 90 },
  period: { fontFamily: fonts.bold, fontSize: 22, color: colors.sun },
  input: { fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', textAlign: 'right' },
  sub: { fontFamily: fonts.semi, fontSize: 14, color: colors.textDim },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  dayOn: { backgroundColor: colors.sun },
  dayText: { fontFamily: fonts.semi, fontSize: 14, color: colors.text },
  tasks: { flexDirection: 'row', gap: 12 },
  task: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)' },
  taskOn: { backgroundColor: colors.sun },
  taskText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  del: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  delText: { fontFamily: fonts.semi, fontSize: 15, color: '#FF8A8A' },
});
