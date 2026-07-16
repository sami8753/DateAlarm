/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sun, Moon, Volume2, ShieldAlert, Trash2, Smartphone, HardDrive, RotateCcw } from 'lucide-react';
import { AlarmSettings, ALARM_TONES } from '../types';
import { playTonePreview, stopActiveSound } from '../utils/audioSynth';
import { saveSettings } from '../utils/alarmScheduler';

interface SettingsPanelProps {
  settings: AlarmSettings;
  onClearHistory: () => void;
  onClearAlarms: () => void;
}

export default function SettingsPanel({ settings, onClearHistory, onClearAlarms }: SettingsPanelProps) {
  const [previewingToneId, setPreviewingToneId] = useState<string | null>(null);

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    saveSettings({ theme: nextTheme });

    // Apply class to body/html
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDefaultToneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveSettings({ defaultToneId: e.target.value });
  };

  const handleToggleVibration = () => {
    const nextVib = !settings.vibrationEnabled;
    saveSettings({ vibrationEnabled: nextVib });
  };

  const handlePreviewTone = (toneId: string) => {
    if (previewingToneId === toneId) {
      stopActiveSound();
      setPreviewingToneId(null);
    } else {
      setPreviewingToneId(toneId);
      playTonePreview(toneId, 4.0, settings.vibrationEnabled);
      setTimeout(() => {
        setPreviewingToneId((curr) => (curr === toneId ? null : curr));
      }, 4000);
    }
  };

  return (
    <div className="space-y-6 pb-24 text-neutral-800 dark:text-neutral-100">
      {/* 1. Theme and Vibration Panel */}
      <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 space-y-4 shadow-xs">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-500">
          Preferences
        </h3>

        {/* Theme Select */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Visual Theme</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Adapt appearance</div>
          </div>
          <button
            onClick={handleToggleTheme}
            className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            {settings.theme === 'light' ? (
              <div className="flex items-center gap-2 text-neutral-800">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium">Light</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium">Dark</span>
              </div>
            )}
          </button>
        </div>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        {/* Vibration Setting */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Default Vibration</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Vibrate during alarm</div>
          </div>
          <button
            onClick={handleToggleVibration}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.vibrationEnabled ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-50 dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        {/* Default Tone Select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Default Alarm Tone</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Chime for new alarms</div>
            </div>
            <button
              onClick={() => handlePreviewTone(settings.defaultToneId)}
              className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <Volume2
                className={`w-4 h-4 ${previewingToneId === settings.defaultToneId ? 'text-emerald-500 animate-bounce' : ''}`}
              />
            </button>
          </div>

          <select
            value={settings.defaultToneId}
            onChange={handleDefaultToneChange}
            className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800/60 text-sm focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-950 dark:focus:border-neutral-100 outline-none cursor-pointer"
          >
            {ALARM_TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. System Architecture Insight */}
      <div className="p-5 rounded-3xl bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-4">
        <h3 className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-500">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Device Portability</span>
        </h3>

        <div className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
          <p>
            <strong>DateAlarm</strong> features a clean, completely isolated alarm scheduling engine designed for native hardware compatibility.
          </p>
          <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800/40 flex items-start gap-2.5">
            <HardDrive className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Capacitor Blueprint Ready</span>
              <p className="mt-0.5 text-[11px]">
                The alarm data structures and triggers are abstracted inside a standalone module (`alarmScheduler.ts`). This lets developers seamlessly bind them to `@capacitor/local-notifications` to trigger real hardware-level alarms on Android/iOS when wrapped, completely bypassing standard JavaScript background limitations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dangerous Actions / Resets */}
      <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 space-y-4 shadow-xs">
        <h3 className="text-xs font-mono uppercase tracking-wider text-rose-500">
          Danger Zone
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Reset Alarm History</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Wipes past trigger logs</div>
          </div>
          <button
            onClick={() => {
              if (confirm('Wipe history logs?')) {
                onClearHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Delete All Alarms</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Permanently clears scheduling</div>
          </div>
          <button
            onClick={() => {
              if (confirm('Delete ALL scheduled alarms? This cannot be undone.')) {
                onClearAlarms();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
