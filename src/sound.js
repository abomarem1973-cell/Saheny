// صوت الرنين المتكرر (ضع ملف assets/alarm.wav أو استبدله بنغمتك)
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let player = null;

export async function startAlarmSound() {
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    player = createAudioPlayer(require('../assets/alarm.wav'));
    player.loop = true;
    player.play();
  } catch (e) { console.warn('sound', e); }
}

export function stopAlarmSound() {
  try { player?.pause(); player?.remove(); } catch {}
  player = null;
}
