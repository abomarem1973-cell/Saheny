import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, gradients } from './theme';

// بطاقة زجاجية شبه شفافة (Glassmorphism)
export function GlassCard({ children, style }) {
  return (
    <View style={[s.glass, style]}>
      <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

// زر متدرج (برتقالي ← أصفر) مع تأثير ضغط
export function GradientButton({ title, icon, onPress, colors: c = gradients.sunrise, style, textColor = colors.bg }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={() => to(0.96)} onPressOut={() => to(1)}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <LinearGradient colors={c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
          {icon && <Ionicons name={icon} size={22} color={textColor} />}
          <Text style={[s.btnText, { color: textColor }]}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  glass: {
    borderRadius: 24, overflow: 'hidden', padding: 16,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
  },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 18 },
  btnText: { fontFamily: fonts.bold, fontSize: 17 },
});
