// مهمة الصورة: فتح الكاميرا ← التقاط ← تحقق بالذكاء الاصطناعي
import React, { useRef, useState } from 'react';
import { View, Text, Modal, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from './theme';
import { GlassCard, GradientButton } from './ui';
import { verifyPhoto } from './verify';

export default function CameraTask({ target, onSuccess }) {
  const insets = useSafeAreaInsets();
  const cam = useRef(null);
  const [perm, askPerm] = useCameraPermissions();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const openCamera = async () => {
    if (!perm?.granted && !(await askPerm()).granted) { setMsg('نحتاج إذن الكاميرا لإكمال المهمة'); return; }
    setMsg(''); setOpen(true);
  };

  const snap = async () => {
    if (busy || !cam.current) return;
    setBusy(true); setMsg('');
    try {
      const photo = await cam.current.takePictureAsync({ base64: true, quality: 0.4 });
      if (await verifyPhoto(photo.base64, target)) { setOpen(false); onSuccess(); }
      else setMsg(`لم أرَ «${target}» في الصورة، جرّب مرة أخرى`);
    } catch { setMsg('تعذّر التحقق، تأكد من الاتصال بالإنترنت'); }
    setBusy(false);
  };

  return (
    <GlassCard style={{ width: '100%' }}>
      <Ionicons name="camera" size={44} color={colors.sun} style={{ alignSelf: 'center' }} />
      <Text style={s.title}>صوّر: {target}</Text>
      <GradientButton title="افتح الكاميرا" icon="camera" onPress={openCamera} />
      {!!msg && !open && <Text style={s.msg}>{msg}</Text>}
      {__DEV__ && <Pressable onPress={onSuccess}><Text style={s.skip}>تخطّي (للتجربة فقط)</Text></Pressable>}

      <Modal visible={open} animationType="slide" onRequestClose={() => {}}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView ref={cam} style={{ flex: 1 }} facing="back" />
          <View style={[s.bar, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={s.hint}>وجّه الكاميرا نحو: {target}</Text>
            {!!msg && <Text style={s.msg}>{msg}</Text>}
            {busy ? <ActivityIndicator size="large" color={colors.sun} /> : (
              <Pressable onPress={snap} style={s.shutter}><View style={s.shutterIn} /></Pressable>
            )}
          </View>
        </View>
      </Modal>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, textAlign: 'center', marginVertical: 14 },
  msg: { fontFamily: fonts.semi, fontSize: 14, color: '#FF8A8A', textAlign: 'center', marginVertical: 8 },
  skip: { fontFamily: fonts.regular, fontSize: 13, color: colors.textDim, textAlign: 'center', marginTop: 12 },
  bar: { position: 'absolute', bottom: 0, start: 0, end: 0, alignItems: 'center', paddingTop: 16, backgroundColor: 'rgba(26,26,46,0.75)' },
  hint: { fontFamily: fonts.semi, fontSize: 16, color: colors.text, marginBottom: 12 },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: colors.sun, alignItems: 'center', justifyContent: 'center' },
  shutterIn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.coral },
});
