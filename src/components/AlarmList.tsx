/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, Trash2, CalendarDays, Music, Volume2 } from 'lucide-react';
import { Alarm, ALARM_TONES } from '../types';
import { format12Hour } from '../utils/alarmScheduler';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface AlarmListProps {
  alarms: Alarm[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AlarmList({ alarms, onToggle, onDelete }: AlarmListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Alarm | null>(null);

  const handleDeleteClick = (alarm: Alarm, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(alarm);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getToneName = (toneId: string) => {
    return ALARM_TONES.find((t) => t.id === toneId)?.name || 'Default';
  };

  const formatDateLabel = (dateStr: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) {
      return 'Today';
    } else if (dateStr === tomorrowStr) {
      return 'Tomorrow';
    } else {
      // Format as "MMM DD, YYYY"
      const d = new Date(`${dateStr}T00:00:00`);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-4">
        <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600">
          <BellOff className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">No scheduled alarms</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
            Create an alarm to remind you on specific future calendar dates and times.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pb-20">
      <AnimatePresence initial={false}>
        {alarms.map((alarm) => (
          <motion.div
            key={alarm.id}
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`p-4.5 rounded-3xl border transition-all ${
              alarm.enabled
                ? 'bg-white dark:bg-neutral-900 border-neutral-200/50 dark:border-neutral-800/50 shadow-xs'
                : 'bg-neutral-100/50 dark:bg-neutral-900/40 border-neutral-200/20 dark:border-neutral-800/10 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Date & Time */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{formatDateLabel(alarm.date)}</span>
                </div>
                <div className="text-2xl font-bold font-sans tracking-tight text-neutral-900 dark:text-white">
                  {format12Hour(alarm.time)}
                </div>
                {alarm.note && (
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 line-clamp-1 max-w-[200px]">
                    {alarm.note}
                  </p>
                )}
                {/* Meta details */}
                <div className="flex items-center gap-2.5 mt-2 text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    {getToneName(alarm.toneId)}
                  </span>
                  {alarm.vibration && <span>• Vib</span>}
                </div>
              </div>

              {/* Toggle & Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Toggle switch */}
                <button
                  onClick={() => onToggle(alarm.id)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    alarm.enabled ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-50 dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                      alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteClick(alarm, e)}
                  className="p-2 rounded-full hover:bg-rose-500/10 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmationDialog
          alarmNote={deleteTarget.note}
          alarmTime={`${formatDateLabel(deleteTarget.date)} at ${format12Hour(deleteTarget.time)}`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
