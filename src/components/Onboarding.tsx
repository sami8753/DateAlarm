/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { saveSettings } from '../utils/alarmScheduler';
import { AlarmSettings } from '../types';

interface OnboardingProps {
  settings: AlarmSettings;
  onComplete: () => void;
}

export default function Onboarding({ settings, onComplete }: OnboardingProps) {
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        saveSettings({ permissionsGranted: true });
      } else {
        saveSettings({ permissionsGranted: false });
      }
    } catch (e) {
      console.error('Failed to request notification permission:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    saveSettings({ isOnboarded: true });
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="inline-flex p-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 mb-2"
          >
            <Bell className="w-10 h-10 animate-pulse" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold font-sans tracking-tight"
          >
            DateAlarm
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-500 dark:text-neutral-400 text-sm font-sans"
          >
            Precise calendar-based alarms with native hardware scheduling.
          </motion.p>
        </div>

        {/* Core explanation cards */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 flex gap-4">
            <div className="text-neutral-600 dark:text-neutral-400 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Calendar Alarms</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Schedule alarms for exact future calendar dates. Never forget an anniversary, early morning flight, or deadline.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 flex gap-4">
            <div className="text-neutral-600 dark:text-neutral-400 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Exact Timing & Notifications</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                To alert you accurately on time, we require system notification and high-precision alarm permissions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Permissions Block */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-2xl bg-neutral-200/50 dark:bg-neutral-900/80 border border-neutral-300/40 dark:border-neutral-800/80 text-center space-y-4"
        >
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              System Authorization
            </span>
            <p className="text-xs mt-1 text-neutral-500 dark:text-neutral-400 px-2">
              For standard web usage, please grant browser notification permissions so we can chime even in the background.
            </p>
          </div>

          {notificationPermission === 'granted' ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" /> Permissions Allowed
            </div>
          ) : (
            <button
              onClick={requestPermission}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium text-sm transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              {loading ? 'Requesting...' : 'Request Notification Access'}
            </button>
          )}
        </motion.div>
      </div>

      {/* Footer trigger */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm pt-6"
      >
        <button
          onClick={handleFinish}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-md cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
