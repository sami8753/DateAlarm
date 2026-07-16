/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar as CalendarIcon, Settings as SettingsIcon, Plus, Clock } from 'lucide-react';

// Imports
import { Alarm, AlarmHistoryItem, AlarmSettings } from './types';
import {
  initScheduler,
  subscribeToAlarms,
  subscribeToSettings,
  subscribeToTriggers,
  addAlarm,
  toggleAlarm,
  deleteAlarm,
  clearHistory,
  getUpcomingAlarmDescription,
  format12Hour,
} from './utils/alarmScheduler';

// Components
import Onboarding from './components/Onboarding';
import AlarmList from './components/AlarmList';
import HistoryList from './components/HistoryList';
import CalendarView from './components/CalendarView';
import SettingsPanel from './components/SettingsPanel';
import AddAlarmForm from './components/AddAlarmForm';
import RingingOverlay from './components/RingingOverlay';

type Tab = 'alarms' | 'calendar' | 'settings';
type AlarmSubTab = 'active' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('alarms');
  const [alarmSubTab, setAlarmSubTab] = useState<AlarmSubTab>('active');
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [history, setHistory] = useState<AlarmHistoryItem[]>([]);
  const [settings, setSettings] = useState<AlarmSettings | null>(null);
  
  // Modal & overlay states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [prefilledAddDate, setPrefilledAddDate] = useState<string | undefined>(undefined);
  const [ringingAlarm, setRingingAlarm] = useState<{
    id: string;
    note: string;
    toneId: string;
    vibration: boolean;
    isSnooze: boolean;
  } | null>(null);

  // Countdown & real-time header helper
  const [countdownStr, setCountdownStr] = useState<string>('No alarms set');

  // 1. Initialize Scheduler & Subscriptions
  useEffect(() => {
    initScheduler();

    const unsubscribeAlarms = subscribeToAlarms((updatedAlarms, updatedHistory) => {
      setAlarms(updatedAlarms);
      setHistory(updatedHistory);
    });

    const unsubscribeSettings = subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
      
      // Initialize theme classes immediately on start
      if (updatedSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    const unsubscribeTriggers = subscribeToTriggers((triggerInfo) => {
      setRingingAlarm(triggerInfo);
    });

    return () => {
      unsubscribeAlarms();
      unsubscribeSettings();
      unsubscribeTriggers();
    };
  }, []);

  // 2. Countdown Timer Banner Tick
  useEffect(() => {
    const updateCountdown = () => {
      setCountdownStr(getUpcomingAlarmDescription());
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 10000); // Check every 10 seconds to keep countdown accurate
    return () => clearInterval(interval);
  }, [alarms]);

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-400">
        <Clock className="w-8 h-8 animate-spin-slow" />
      </div>
    );
  }

  // First-launch Onboarding Screen
  if (!settings.isOnboarded) {
    return (
      <Onboarding
        settings={settings}
        onComplete={() => {
          // Complete onboarding, refresh state
        }}
      />
    );
  }

  // Handle direct navigation to Add Alarm from Calendar View
  const handleAddAlarmForDate = (dateStr: string) => {
    setPrefilledAddDate(dateStr);
    setIsAddOpen(true);
  };

  const handleAddNewAlarm = (date: string, time: string, note: string, toneId: string, vibration: boolean) => {
    addAlarm(date, time, note, toneId, vibration);
    setIsAddOpen(false);
    setPrefilledAddDate(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300 font-sans">
      
      {/* 1. Header Area */}
      <header className="sticky top-0 z-40 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md px-6 py-4 border-b border-neutral-200/40 dark:border-neutral-800/20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">DateAlarm</h1>
            {/* Live Alarm Countdown Banner */}
            <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {countdownStr}
            </p>
          </div>

          {/* Quick Floating Add Button */}
          {activeTab !== 'settings' && (
            <button
              onClick={() => {
                setPrefilledAddDate(undefined);
                setIsAddOpen(true);
              }}
              className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Scrollable Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-5">
        <AnimatePresence mode="wait">
          {activeTab === 'alarms' && (
            <motion.div
              key="alarms"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Segmented Control for Active vs History */}
              <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/40">
                <button
                  onClick={() => setAlarmSubTab('active')}
                  className={`py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    alarmSubTab === 'active'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
                  }`}
                >
                  Active ({alarms.filter((a) => a.enabled).length})
                </button>
                <button
                  onClick={() => setAlarmSubTab('history')}
                  className={`py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    alarmSubTab === 'history'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
                  }`}
                >
                  History ({history.length})
                </button>
              </div>

              {alarmSubTab === 'active' ? (
                <AlarmList
                  alarms={alarms}
                  onToggle={toggleAlarm}
                  onDelete={deleteAlarm}
                />
              ) : (
                <HistoryList history={history} onClear={clearHistory} />
              )}
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <CalendarView
                alarms={alarms}
                onAddAlarmForDate={handleAddAlarmForDate}
                onToggleAlarm={toggleAlarm}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <SettingsPanel
                settings={settings}
                onClearHistory={clearHistory}
                onClearAlarms={() => {
                  alarms.forEach((a) => deleteAlarm(a.id));
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Sliding Add Alarm Sheet Drawer */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-neutral-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md"
            >
              <AddAlarmForm
                onAdd={handleAddNewAlarm}
                onCancel={() => {
                  setIsAddOpen(false);
                  setPrefilledAddDate(undefined);
                }}
                initialDate={prefilledAddDate}
                defaultToneId={settings.defaultToneId}
                defaultVibration={settings.vibrationEnabled}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Fullscreen Active Ringing Overlay */}
      {ringingAlarm && (
        <RingingOverlay
          alarm={ringingAlarm}
          onDismiss={() => setRingingAlarm(null)}
          onSnooze={() => setRingingAlarm(null)}
        />
      )}

      {/* 5. Elegant Bottom Navigation Rail */}
      <footer className="sticky bottom-0 z-40 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-t border-neutral-200/40 dark:border-neutral-800/20 py-2.5 px-6">
        <nav className="max-w-md mx-auto grid grid-cols-3 gap-1">
          
          {/* Alarms Tab Button */}
          <button
            onClick={() => setActiveTab('alarms')}
            className={`flex flex-col items-center gap-1.5 py-1.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'alarms'
                ? 'text-neutral-950 dark:text-white bg-neutral-200/50 dark:bg-neutral-900/60'
                : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Alarms</span>
          </button>

          {/* Calendar Tab Button */}
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1.5 py-1.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'text-neutral-950 dark:text-white bg-neutral-200/50 dark:bg-neutral-900/60'
                : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Calendar</span>
          </button>

          {/* Settings Tab Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1.5 py-1.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'text-neutral-950 dark:text-white bg-neutral-200/50 dark:bg-neutral-900/60'
                : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>

        </nav>
      </footer>
    </div>
  );
}
