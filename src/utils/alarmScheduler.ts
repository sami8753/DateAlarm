/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Alarm, AlarmHistoryItem, AlarmSettings } from '../types';
import { LocalNotifications } from '@capacitor/local-notifications';

// Constants for localStorage keys
const KEYS = {
  ALARMS: 'date_alarm_list',
  HISTORY: 'date_alarm_history',
  SETTINGS: 'date_alarm_settings',
};

// Initial default settings
const DEFAULT_SETTINGS: AlarmSettings = {
  theme: 'light',
  defaultToneId: 'zen_chime',
  vibrationEnabled: true,
  permissionsGranted: false,
  isOnboarded: false,
};

// In-memory state
let alarms: Alarm[] = [];
let history: AlarmHistoryItem[] = [];
let settings: AlarmSettings = { ...DEFAULT_SETTINGS };

// Runtime state for active triggering and snoozes
export interface SnoozingAlarm {
  id: string; // Original alarm ID
  note: string;
  toneId: string;
  vibration: boolean;
  triggerTime: number; // timestamp ms
  snoozeCount: number;
}

let activeSnoozes: SnoozingAlarm[] = [];
let triggeredAlarmIds = new Set<string>(); // Prevent double-triggering in same session
const notificationIdMap = new Map<string, number>(); // Maps alarm.id -> native notification numeric id

// Subscription lists
type AlarmChangeListener = (alarms: Alarm[], history: AlarmHistoryItem[]) => void;
type AlarmTriggerListener = (alarm: { id: string; note: string; toneId: string; vibration: boolean; isSnooze: boolean }) => void;
type SettingsChangeListener = (settings: AlarmSettings) => void;

const changeListeners = new Set<AlarmChangeListener>();
const triggerListeners = new Set<AlarmTriggerListener>();
const settingsListeners = new Set<SettingsChangeListener>();

// Load from local storage
export function initScheduler(): void {
  try {
    const loadedAlarms = localStorage.getItem(KEYS.ALARMS);
    if (loadedAlarms) {
      alarms = JSON.parse(loadedAlarms);
    } else {
      alarms = [];
    }

    const loadedHistory = localStorage.getItem(KEYS.HISTORY);
    if (loadedHistory) {
      history = JSON.parse(loadedHistory);
    } else {
      history = [];
    }

    const loadedSettings = localStorage.getItem(KEYS.SETTINGS);
    if (loadedSettings) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(loadedSettings) };
    } else {
      settings = { ...DEFAULT_SETTINGS };
    }
  } catch (e) {
    console.error('Failed to initialize local data in alarm scheduler:', e);
  }

  // Start background tick to monitor alarms
  startTick();
}

function saveAlarms(): void {
  try {
    localStorage.setItem(KEYS.ALARMS, JSON.stringify(alarms));
    notifyChange();
  } catch (e) {
    console.error('Failed to save alarms:', e);
  }
}

function saveHistory(): void {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
    notifyChange();
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

export function saveSettings(newSettings: Partial<AlarmSettings>): void {
  settings = { ...settings, ...newSettings };
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    settingsListeners.forEach((listener) => listener(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// Subscriptions
export function subscribeToAlarms(listener: AlarmChangeListener): () => void {
  changeListeners.add(listener);
  // Initial callback
  listener([...alarms], [...history]);
  return () => changeListeners.delete(listener);
}

export function subscribeToSettings(listener: SettingsChangeListener): () => void {
  settingsListeners.add(listener);
  listener({ ...settings });
  return () => settingsListeners.delete(listener);
}

export function subscribeToTriggers(listener: AlarmTriggerListener): () => void {
  triggerListeners.add(listener);
  return () => triggerListeners.delete(listener);
}

function notifyChange() {
  const sortedAlarms = getSortedAlarms();
  const sortedHistory = getSortedHistory();
  changeListeners.forEach((listener) => listener(sortedAlarms, sortedHistory));
}

// Queries
export function getAlarms(): Alarm[] {
  return [...alarms];
}

export function getSortedAlarms(): Alarm[] {
  return [...alarms].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}:00`).getTime();
    const dateTimeB = new Date(`${b.date}T${b.time}:00`).getTime();
    return dateTimeA - dateTimeB;
  });
}

export function getHistory(): AlarmHistoryItem[] {
  return [...history];
}

export function getSortedHistory(): AlarmHistoryItem[] {
  return [...history].sort((a, b) => {
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });
}

export function getSettings(): AlarmSettings {
  return { ...settings };
}

export function getActiveSnoozes(): SnoozingAlarm[] {
  return [...activeSnoozes];
}

// Operations
export function addAlarm(
  date: string,
  time: string,
  note: string,
  toneId: string,
  vibration: boolean
): Alarm {
  const newAlarm: Alarm = {
    id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date,
    time,
    note: note.trim(),
    toneId,
    vibration,
    enabled: true,
  };

  alarms.push(newAlarm);
  saveAlarms();

  // --- Schedule Capacitor Native Hardware Alarm ---
  try {
    const alarmDateTime = new Date(`${date}T${time}:00`);
    const numericId = Math.floor(Math.random() * 10000000);
    notificationIdMap.set(newAlarm.id, numericId);

    LocalNotifications.requestPermissions();

    LocalNotifications.schedule({
      notifications: [
        {
          title: 'DateAlarm Ringing!',
          body: note.trim() || 'Your scheduled alarm is ringing!',
          id: numericId,
          schedule: { at: alarmDateTime, allowWhileIdle: true },
          sound: 'res_bell.wav',
          extra: { vibration },
        },
      ],
    });
  } catch (e) {
    console.warn('Running outside a Capacitor device or permissions missing. Fallback timer active.', e);
  }
  // ------------------------------------------------------

  return newAlarm;
}

export function toggleAlarm(id: string): void {
  const idx = alarms.findIndex((a) => a.id === id);
  if (idx !== -1) {
    alarms[idx].enabled = !alarms[idx].enabled;

    // If we are disabling the alarm, remove any active snooze
    if (!alarms[idx].enabled) {
      activeSnoozes = activeSnoozes.filter((s) => s.id !== id);
      triggeredAlarmIds.delete(id);

      const numId = notificationIdMap.get(id);
      if (numId !== undefined) {
        try {
          LocalNotifications.cancel({ notifications: [{ id: numId }] });
        } catch (e) {
          console.warn('Could not cancel native notification', e);
        }
      }
    }

    saveAlarms();
  }
}

export function deleteAlarm(id: string): void {
  alarms = alarms.filter((a) => a.id !== id);
  activeSnoozes = activeSnoozes.filter((s) => s.id !== id);
  triggeredAlarmIds.delete(id);

  const numId = notificationIdMap.get(id);
  if (numId !== undefined) {
    try {
      LocalNotifications.cancel({ notifications: [{ id: numId }] });
    } catch (e) {
      console.warn('Could not cancel native notification', e);
    }
    notificationIdMap.delete(id);
  }

  saveAlarms();
}

export function updateAlarm(updated: Alarm): void {
  const idx = alarms.findIndex((a) => a.id === updated.id);
  if (idx !== -1) {
    alarms[idx] = { ...updated };
    saveAlarms();
  }
}

export function clearHistory(): void {
  history = [];
  saveHistory();
}

/**
 * Handle alarm triggering: plays the sound, triggers a browser Notification,
 * and alerts registered UI listeners.
 */
function triggerAlarm(alarm: Alarm, isSnooze = false) {
  // Fire browser web notification if allowed
  if (Notification.permission === 'granted') {
    try {
      new Notification('DateAlarm Ringing!', {
        body: `${alarm.note || 'Alarm is ringing!'}\nScheduled for ${alarm.date} at ${format12Hour(alarm.time)}`,
        icon: '/favicon.ico',
        tag: alarm.id,
        requireInteraction: true,
      });
    } catch (e) {
      console.error('Failed to create Web Notification:', e);
    }
  }

  // Notify active listeners (which will pop up the Snooze/Dismiss UI and start playing the synthesized loop)
  triggerListeners.forEach((listener) => {
    listener({
      id: alarm.id,
      note: alarm.note,
      toneId: alarm.toneId,
      vibration: alarm.vibration,
      isSnooze,
    });
  });
}

/**
 * Snooze an active triggering alarm.
 */
export function snoozeAlarm(alarmId: string, minutes: number): void {
  const alarm = alarms.find((a) => a.id === alarmId);
  const snoozeCount = (activeSnoozes.find((s) => s.id === alarmId)?.snoozeCount || 0) + 1;

  // Remove existing snooze if any
  activeSnoozes = activeSnoozes.filter((s) => s.id !== alarmId);

  const triggerTime = Date.now() + minutes * 60 * 1000;

  activeSnoozes.push({
    id: alarmId,
    note: alarm?.note || 'Snoozed alarm',
    toneId: alarm?.toneId || settings.defaultToneId,
    vibration: alarm ? alarm.vibration : settings.vibrationEnabled,
    triggerTime,
    snoozeCount,
  });

  // Record history item
  if (alarm) {
    const historyItem: AlarmHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      alarmId: alarm.id,
      date: alarm.date,
      time: alarm.time,
      note: alarm.note,
      triggeredAt: new Date().toISOString(),
      status: 'snoozed',
    };
    history.push(historyItem);
    saveHistory();
  }

  // Temporarily reset triggered ID so it can fire again when snooze is up
  triggeredAlarmIds.delete(`snooze_${alarmId}`);

  notifyChange();
}

/**
 * Dismiss an active triggering alarm. This turns off the alarm and logs it in history.
 */
export function dismissAlarm(alarmId: string): void {
  const alarm = alarms.find((a) => a.id === alarmId);

  // Remove from active snoozes
  activeSnoozes = activeSnoozes.filter((s) => s.id !== alarmId);

  if (alarm) {
    // Since it's a date-specific alarm, once completed, we disable it.
    alarm.enabled = false;
    saveAlarms();

    const historyItem: AlarmHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      alarmId: alarm.id,
      date: alarm.date,
      time: alarm.time,
      note: alarm.note,
      triggeredAt: new Date().toISOString(),
      status: 'dismissed',
    };
    history.push(historyItem);
    saveHistory();
  }

  // Clear tracking
  triggeredAlarmIds.delete(alarmId);
  triggeredAlarmIds.delete(`snooze_${alarmId}`);

  notifyChange();
}

// Background scheduler tick
let tickIntervalId: any = null;

function startTick() {
  if (tickIntervalId) return;

  tickIntervalId = setInterval(() => {
    const now = Date.now();

    // 1. Check Standard enabled alarms
    alarms.forEach((alarm) => {
      if (!alarm.enabled) return;

      const alarmTime = new Date(`${alarm.date}T${alarm.time}:00`).getTime();

      // If alarm is due or has passed by less than 1 minute (and hasn't been triggered in this tab session yet)
      if (alarmTime <= now && now - alarmTime < 60000) {
        const trackingId = alarm.id;
        if (!triggeredAlarmIds.has(trackingId)) {
          triggeredAlarmIds.add(trackingId);
          triggerAlarm(alarm, false);
        }
      } else if (alarmTime < now - 60000 && alarm.enabled) {
        // Automatically move historical expired alarms to history if we opened the app way later
        alarm.enabled = false;

        // Log it as dismissed/past alarm
        const historyItem: AlarmHistoryItem = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          alarmId: alarm.id,
          date: alarm.date,
          time: alarm.time,
          note: alarm.note,
          triggeredAt: new Date(alarmTime).toISOString(),
          status: 'dismissed',
        };
        history.push(historyItem);
        saveHistory();
        saveAlarms();
      }
    });

    // 2. Check Snoozed alarms
    activeSnoozes.forEach((snooze) => {
      if (snooze.triggerTime <= now && now - snooze.triggerTime < 60000) {
        const trackingId = `snooze_${snooze.id}`;
        if (!triggeredAlarmIds.has(trackingId)) {
          triggeredAlarmIds.add(trackingId);

          // Re-trigger alarm using details
          const tempAlarm: Alarm = {
            id: snooze.id,
            date: new Date(snooze.triggerTime).toISOString().split('T')[0],
            time: new Date(snooze.triggerTime).toTimeString().substring(0, 5),
            note: `${snooze.note} (Snooze #${snooze.snoozeCount})`,
            toneId: snooze.toneId,
            vibration: snooze.vibration,
            enabled: true,
          };

          triggerAlarm(tempAlarm, true);
        }
      }
    });
  }, 1000);
}

// Helpers
export function format12Hour(time24: string): string {
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutesStr} ${ampm}`;
}

/**
 * Get visual description of next upcoming alarm
 */
export function getUpcomingAlarmDescription(): string {
  const enabledAlarms = alarms.filter((a) => a.enabled);

  if (enabledAlarms.length === 0 && activeSnoozes.length === 0) {
    return 'No alarms set';
  }

  const now = Date.now();
  let nextTriggerTime = Infinity;
  let nextAlarmLabel = '';

  // Check active snoozes first (they take priority as they are closest)
  activeSnoozes.forEach((snooze) => {
    if (snooze.triggerTime > now && snooze.triggerTime < nextTriggerTime) {
      nextTriggerTime = snooze.triggerTime;
      nextAlarmLabel = `Snooze: ${snooze.note}`;
    }
  });

  // Check standard alarms
  enabledAlarms.forEach((alarm) => {
    const alarmTime = new Date(`${alarm.date}T${alarm.time}:00`).getTime();
    if (alarmTime > now && alarmTime < nextTriggerTime) {
      nextTriggerTime = alarmTime;
      nextAlarmLabel = alarm.note ? `"${alarm.note}"` : 'Alarm';
    }
  });

  if (nextTriggerTime === Infinity) {
    return 'Alarms exist but are in the past';
  }

  const diffMs = nextTriggerTime - now;
  const diffMinTotal = Math.floor(diffMs / (60 * 1000));
  const diffHrs = Math.floor(diffMinTotal / 60);
  const diffMins = diffMinTotal % 60;
  const diffDays = Math.floor(diffHrs / 24);

  let countdownStr = '';
  if (diffDays > 0) {
    countdownStr = `${diffDays}d ${diffHrs % 24}h remaining`;
  } else if (diffHrs > 0) {
    countdownStr = `${diffHrs}h ${diffMins}m remaining`;
  } else {
    countdownStr = `${diffMins}m remaining`;
  }

  return `Next: ${nextAlarmLabel} in ${countdownStr}`;
}
