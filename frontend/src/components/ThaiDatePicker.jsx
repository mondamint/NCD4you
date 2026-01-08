import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

const ThaiDatePicker = ({ value, onChange, label, required = false }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            const date = dayjs(value);
            if (date.isValid()) {
                setCurrentMonth(date);
            }
        }

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value]);

    const handleDateClick = (date) => {
        onChange(date.format('YYYY-MM-DD'));
        setShowCalendar(false);
    };

    const nextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
    const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));

    // Generate days
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');

    const calendarDays = [];
    let day = startDate;
    while (day.isBefore(endDate)) {
        calendarDays.push(day);
        day = day.add(1, 'day');
    }

    const displayValue = value ? dayjs(value).format('DD/MM/BBBB') : '';

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
            <div
                className="relative cursor-pointer group"
                onClick={() => setShowCalendar(!showCalendar)}
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-slate-400 group-hover:text-pink-500 transition-colors" />
                </div>
                <input
                    type="text"
                    readOnly
                    required={required}
                    value={displayValue}
                    placeholder="วว/ดด/ปปปป"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-200 outline-none bg-white cursor-pointer select-none font-medium text-slate-700"
                />
            </div>

            {showCalendar && (
                <div className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-xl border border-slate-100 w-[320px] animate-in fade-in zoom-in-95 origin-top-left">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-slate-800 text-lg">
                            {currentMonth.format('MMMM BBBB')}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
                            <span key={i} className={`text-xs font-semibold ${i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-500'}`}>
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((d, i) => {
                            const isCurrentMonth = d.month() === currentMonth.month();
                            const isSelected = value && d.isSame(dayjs(value), 'day');
                            const isToday = d.isSame(dayjs(), 'day');

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDateClick(d)}
                                    className={`
                                        h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                        ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700 hover:bg-pink-50 hover:text-pink-600'}
                                        ${isSelected ? 'bg-pink-600 text-white shadow-md shadow-pink-200 hover:bg-pink-700 hover:text-white' : ''}
                                        ${isToday && !isSelected ? 'border border-pink-500 text-pink-600 font-bold' : ''}
                                    `}
                                >
                                    {d.date()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThaiDatePicker;
