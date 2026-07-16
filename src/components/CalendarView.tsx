/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Bell, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Alarm } from '../types';
import { format12Hour } from '../utils/alarmScheduler';

interface CalendarViewProps {
  alarms: Alarm[];
  onAddAlarmForDate: (dateStr: string) => void;
  onToggleAlarm: (id: string) => void;
}

export default function CalendarView({ alarms, onAddAlarmForDate, onToggleAlarm }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map of date string YYYY-MM-DD -> enabled alarms list
  const alarmsMap = useMemo(() => {
    const map: Record<string, Alarm[]> = {};
    alarms.forEach((alarm) => {
      if (!map[alarm.date]) {
        map[alarm.date] = [];
      }
      map[alarm.date].push(alarm);
    });
    return map;
  }, [alarms]);

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid cells
  const gridCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week for 1st of month (0 = Sun)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Days in current month
    const prevTotalDays = new Date(year, month, 0).getDate(); // Days in previous month

    const cells: {
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      hasActiveAlarms: boolean;
      hasDisabledAlarms: boolean;
    }[] = [];

    // 1. Previous Month Padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevTotalDays - i;
      const prevMonthObj = new Date(year, month - 1, dayNum);
      const yStr = prevMonthObj.getFullYear();
      const mStr = String(prevMonthObj.getMonth() + 1).padStart(2, '0');
      const dStr = String(prevMonthObj.getDate()).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;

      const dateAlarms = alarmsMap[dateStr] || [];
      const hasActive = dateAlarms.some((a) => a.enabled);
      const hasDisabled = dateAlarms.length > 0 && !hasActive;

      cells.push({
        day: dayNum,
        dateStr,
        isCurrentMonth: false,
        hasActiveAlarms: hasActive,
        hasDisabledAlarms: hasDisabled,
      });
    }

    // 2. Current Month
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;

      const dateAlarms = alarmsMap[dateStr] || [];
      const hasActive = dateAlarms.some((a) => a.enabled);
      const hasDisabled = dateAlarms.length > 0 && !hasActive;

      cells.push({
        day: dayNum,
        dateStr,
        isCurrentMonth: true,
        hasActiveAlarms: hasActive,
        hasDisabledAlarms: hasDisabled,
      });
    }

    // 3. Next Month Padding
    const remainingCells = 42 - cells.length; // Align to 6 rows grid
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextMonthObj = new Date(year, month + 1, dayNum);
      const yStr = nextMonthObj.getFullYear();
      const mStr = String(nextMonthObj.getMonth() + 1).padStart(2, '0');
      const dStr = String(nextMonthObj.getDate()).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;

      const dateAlarms = alarmsMap[dateStr] || [];
      const hasActive = dateAlarms.some((a) => a.enabled);
      const hasDisabled = dateAlarms.length > 0 && !hasActive;

      cells.push({
        day: dayNum,
        dateStr,
        isCurrentMonth: false,
        hasActiveAlarms: hasActive,
        hasDisabledAlarms: hasDisabled,
      });
    }

    return cells;
  }, [year, month, alarmsMap]);

  // Alarms for selected date
  const selectedDateAlarms = useMemo(() => {
    return alarmsMap[selectedDateStr] || [];
  }, [selectedDateStr, alarmsMap]);

  const formatDateTitle = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between p-1 bg-white dark:bg-neutral-900 border border-neutral-200/55 dark:border-neutral-800/55 rounded-2xl">
        <button
          onClick={prevMonth}
          className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="font-sans font-bold text-base text-neutral-800 dark:text-neutral-100">
          {monthNames[month]} {year}
        </span>

        <button
          onClick={nextMonth}
          className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl shadow-xs">
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <span key={day} className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
              {day}
            </span>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {gridCells.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={idx}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm transition-all cursor-pointer ${
                  !cell.isCurrentMonth
                    ? 'text-neutral-300 dark:text-neutral-700'
                    : 'text-neutral-800 dark:text-neutral-200 font-medium'
                } ${
                  isSelected
                    ? 'bg-neutral-900 dark:bg-neutral-100 !text-white dark:!text-neutral-950 font-bold shadow-sm'
                    : isToday
                    ? 'border-2 border-neutral-900/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-850 font-semibold'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{cell.day}</span>

                {/* Alarm Indicators */}
                <div className="absolute bottom-1.5 flex gap-1 justify-center">
                  {cell.hasActiveAlarms && (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-800 dark:bg-neutral-200'
                      }`}
                    />
                  )}
                  {!cell.hasActiveAlarms && cell.hasDisabledAlarms && (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? 'bg-white/40' : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day's Alarms List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-500">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Alarms for {formatDateTitle(selectedDateStr).split(',')[0]}</span>
          </div>
          
          <button
            onClick={() => onAddAlarmForDate(selectedDateStr)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {selectedDateAlarms.length === 0 ? (
          <div className="p-6 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 text-center text-neutral-400 dark:text-neutral-500 space-y-1 bg-white/30 dark:bg-neutral-900/10">
            <Clock className="w-6 h-6 mx-auto stroke-1" />
            <p className="text-xs font-medium">No alarms scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  alarm.enabled
                    ? 'bg-white dark:bg-neutral-900 border-neutral-200/50 dark:border-neutral-800/50'
                    : 'bg-neutral-50/50 dark:bg-neutral-900/20 border-neutral-200/30 dark:border-neutral-800/20 opacity-75'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-lg font-bold text-neutral-950 dark:text-white">
                    {format12Hour(alarm.time)}
                  </div>
                  {alarm.note && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      {alarm.note}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onToggleAlarm(alarm.id)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    alarm.enabled ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-neutral-50 dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                      alarm.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
