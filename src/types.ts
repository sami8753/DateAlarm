/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Alarm {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24-hour format)
  note: string;
  toneId: string;
  vibration: boolean;
  enabled: boolean;
}

export interface AlarmHistoryItem {
  id: string;
  alarmId: string;
  date: string;
  time: string;
  note: string;
  triggeredAt: string; // ISO string
  status: 'dismissed' | 'snoozed';
}

export interface AlarmSettings {
  theme: 'light' | 'dark';
  defaultToneId: string;
  vibrationEnabled: boolean;
  permissionsGranted: boolean;
  isOnboarded: boolean;
}

export interface AlarmTone {
  id: string;
  name: string;
  description: string;
}

export const ALARM_TONES: AlarmTone[] = [
  { id: 'emergency_siren', name: '🚨 Emergency Siren', description: 'Intense, sweeping high-volume alert siren' },
  { id: 'industrial_claxon', name: '📯 Industrial Claxon', description: 'Deep, buzzing metallic warning klaxon' },
  { id: 'cyber_frenzy', name: '⚡ Cyber Frenzy', description: 'Aggressive rapid high-voltage synth pulses' },
  { id: 'radioactive_alert', name: '☢️ Heavy Pulsar', description: 'Heavy repeating sub-bass and high-frequency warnings' },
  { id: 'zen_chime', name: 'Zen Chime', description: 'Gentle, meditative metallic bowl chime' },
  { id: 'digital_beep', name: 'Digital Beeps', description: 'Classic fast triple beep sequence' },
  { id: 'uplifting_marimba', name: 'Uplifting Marimba', description: 'Bright rhythmic wooden mallet melody' },
  { id: 'cosmic_echo', name: 'Cosmic Echo', description: 'Spacious and warm synth wave' },
  { id: 'sunrise_melody', name: 'Sunrise Melody', description: 'Peaceful acoustic pentatonic rise' },
  { id: 'classic_bell', name: 'Classic Bell', description: 'Bright resonant brass school bell' },
  { id: 'pulsing_synth', name: 'Pulsing Synth', description: 'Warm analog synthesizer sweep' },
];
