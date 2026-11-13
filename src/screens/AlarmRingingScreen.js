import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Animated, Easing, Vibration, BackHandler, Keyboard,
  KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradients } from '../theme';
import { GlassCard, GradientButton } from '../ui';
import CameraTask from '../CameraTask';
import { startAlarmSound, stopAlarmSound } from '../sound';
import { scheduleSnooze } from '../notifications';
import { updateAlarm } from '../storage';
import { toLatinDigits, formatTime, makePuzzle } from '../utils';

// حلقة نبض تتوسع وتتلاشى حول الجرس
function PulseRing({ delay }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop;
    const t = setTimeout(() => {
      loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
      loop.start();
    }, delay);
    return () => { clearTimeout(t); loop && loop.stop(); };
  }, []);
  return (
    <Animated.View style={[s.ring, {
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
    }]} />
  );
}

export default function AlarmRingingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const alarm = route.params?.alarm ?? { label: 'منبه', task: 'math' };

  const [now, setNow] = useState(new Date());
  const [puzzle, setPuzzle] = useState(makePuzzle);
  const [answer, setAnswer] = useState('');
  const [solved, setSolved] = useState(false);
  const bell = useRef(new Animated.Value(0)).current;   // اهتزاز الجرس
  const shake = useRef(new Animated.Value(0)).current; // اهتزاز عند الإجابة الخاطئة

  // ساعة حيّة
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // اهتزاز الجهاز متكررًا حتى إنجاز المهمة
  useEffect(() => {
    if (solved) return;
    Vibration.vibrate([0, 700, 500], true);
    startAlarmSound();
    return () => { Vibration.cancel(); stopAlarmSound(); };
  }, [solved]);

  // منع زر الرجوع في أندرويد قبل إنجاز المهمة
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => !solved);
    return () => sub.remove();
  }, [solved]);

  // حركة رنين الجرس
  useEffect(() => {
    const t = (to, d) => Animated.timing(bell, { toValue: to, duration: d, useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([t(1, 120), t(-1, 240), t(1, 240), t(-1, 240), t(0, 120), Animated.delay(900)]));
    loop.start();
    return () => loop.stop();
  }, []);

  // التحقق من الإجابة
  const check = () => {
    if (parseInt(answer, 10) === puzzle.answer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Keyboard.dismiss();
      setSolved(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAnswer('');
      const m = (to) => Animated.timing(shake, { toValue: to, duration: 60, useNativeDriver: true });
      Animated.sequence([m(12), m(-12), m(8), m(-8), m(0)]).start();
    }
  };

  const newPuzzle = () => { setPuzzle(makePuzzle()); setAnswer(''); };
  const stop = async () => {
    if (alarm.id && alarm.days?.length === 0) await updateAlarm(alarm.id, { enabled: false }); // منبه المرة الواحدة
    navigation.goBack();
  };
  const snooze = async () => { await scheduleSnooze(alarm); navigation.goBack(); };

  const { time, period } = formatTime(now.getHours(), now.getMinutes());

  return (
    <LinearGradient colors={gradients.night} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>

          {/* الجرس + حلقات النبض */}
          <View style={s.bellBox}>
            {!solved && [0, 800, 1600].map((d) => <PulseRing key={d} delay={d} />)}
            <LinearGradient colors={solved ? [colors.success, '#A8E6A1'] : gradients.sunrise} style={s.bellCircle}>
              <Animated.View style={{ transform: [{ rotate: bell.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] }) }] }}>
                <Ionicons name={solved ? 'checkmark' : 'notifications'} size={56} color={colors.bg} />
              </Animated.View>
            </LinearGradient>
          </View>

          {/* الوقت والعنوان */}
          <View style={s.timeRow}>
            <Text style={s.time}>{time}</Text>
            <Text style={s.period}>{period}</Text>
          </View>
          <Text style={s.label}>{alarm.label}</Text>

          {/* المهمة أو شاشة النجاح */}
          {solved ? (
            <GlassCard style={s.card}>
              <Text style={s.title}>أحسنت! أنت مستيقظ الآن 🎉</Text>
              <GradientButton title="إيقاف المنبه" icon="stop-circle" onPress={stop} />
              <Pressable onPress={snooze} style={s.link}>
                <Ionicons name="moon" size={18} color={colors.sun} />
                <Text style={s.linkText}>غفوة 5 دقائق</Text>
              </Pressable>
            </GlassCard>
          ) : alarm.task === 'math' ? (
            <GlassCard style={s.card}>
              <Text style={s.hint}>حل اللغز لإيقاف الرنين</Text>
              <Text style={s.question}>{puzzle.question} = ؟</Text>
              <Animated.View style={{ transform: [{ translateX: shake }] }}>
                <TextInput
                  style={s.input}
                  value={answer}
                  onChangeText={(t) => setAnswer(toLatinDigits(t))}
                  keyboardType="number-pad"
                  placeholder="اكتب الإجابة"
                  placeholderTextColor={colors.textDim}
                  onSubmitEditing={check}
                  returnKeyType="done"
                />
              </Animated.View>
              <GradientButton title="تحقق" icon="checkmark-circle" onPress={check} style={{ marginTop: 14 }} />
              <Pressable onPress={newPuzzle} style={s.link}>
                <Ionicons name="refresh" size={18} color={colors.textDim} />
                <Text style={[s.linkText, { color: colors.textDim }]}>لغز آخر</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <CameraTask target={alarm.photoTarget} onSuccess={() => setSolved(true)} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  content: { alignItems: 'center', paddingHorizontal: 20 },
  bellBox: { width: 120, height: 120, marginTop: 50, marginBottom: 56, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: colors.coral },
  bellCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  time: { fontFamily: fonts.black, fontSize: 72, color: colors.text, lineHeight: 96 },
  period: { fontFamily: fonts.bold, fontSize: 24, color: colors.sun },
  label: { fontFamily: fonts.semi, fontSize: 18, color: colors.textDim, marginBottom: 28 },
  card: { width: '100%', gap: 4 },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.textDim, textAlign: 'center' },
  question: { fontFamily: fonts.black, fontSize: 40, color: colors.sun, textAlign: 'center', marginVertical: 10, lineHeight: 60 },
  input: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, textAlign: 'center', paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: colors.glassBorder },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, textAlign: 'center', marginVertical: 14 },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  linkText: { fontFamily: fonts.semi, fontSize: 15, color: colors.sun },
});
