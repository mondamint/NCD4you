import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Calendar, User, Stethoscope, ArrowRightCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import VisitModal from '../components/VisitModal';
import ReferModal from '../components/ReferModal';
import ManualPatientModal from '../components/ManualPatientModal';
import { cn, formatThaiDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const HCDashboard = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);

    // Modals
    const [visitModalAppt, setVisitModalAppt] = useState(null);
    const [referModalAppt, setReferModalAppt] = useState(null);
    const [showManualModal, setShowManualModal] = useState(false);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/appointments`);
            // Backend filters by HC zone if user is HC
            // We can also filter by date client side or params
            setAppointments(res.data);

            // Set default date to today or first available
            if (!selectedDate && res.data.length > 0) {
                // Sort dates
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // Group by Date
    const grouped = appointments.reduce((acc, appt) => {
        if (!acc[appt.appointment_date]) acc[appt.appointment_date] = [];
        acc[appt.appointment_date].push(appt);
        return acc;
    }, {});

    // Sort Descending (Newest First)
    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // Display appointments for selected date
    const currentList = selectedDate ? grouped[selectedDate] : (dates.length > 0 ? grouped[dates[0]] : []);

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">แดชบอร์ด รพ.สต.</h2>
                    <p className="text-slate-500">เขตพื้นที่: {user?.location || 'ไม่ระบุ'}</p>
                </div>
                <button
                    onClick={() => setShowManualModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <User size={20} />
                    <span>เพิ่มผู้ป่วยใหม่</span>
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Date Selection Panel */}
                <div className="col-span-3 space-y-2">
                    <h3 className="font-semibold text-slate-700 mb-4 px-2">วันที่นัดหมาย</h3>
                    {dates.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-lg text-slate-400 text-sm text-center">ไม่มีรายการนัดหมาย</div>
                    ) : (
                        dates.map(date => (
                            <button
                                key={date}
                                onClick={() => setSelectedDate(date)}
                                className={cn(
                                    "w-full text-left px-4 py-3 rounded-lg border transition-all flex justify-between items-center",
                                    (selectedDate === date || (!selectedDate && date === dates[0]))
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <span>{formatThaiDate(date)}</span>
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full bg-white/20",
                                    (selectedDate === date || (!selectedDate && date === dates[0])) ? "text-white" : "text-slate-500 bg-slate-100"
                                )}>
                                    {grouped[date].length}
                                </span>
                            </button>
                        ))
                    )}
                </div>

                {/* Patient List Panel */}
                <div className="col-span-9">
                    {currentList && currentList.length > 0 ? (
                        <div className="space-y-4">
                            {currentList.map(appt => (
                                <div key={appt.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-indigo-200 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-slate-800">{appt.patient.name}</h4>
                                            <div className="text-sm text-slate-500 flex gap-4 mt-1">
                                                <span>HN: {appt.patient.hn}</span>
                                                <span className="flex items-center gap-1"><Calendar size={14} /> {formatThaiDate(appt.appointment_date)}</span>
                                            </div>
                                            {appt.note && <p className="text-sm text-pink-600 mt-2 italic">หมายเหตุ: {appt.note}</p>}

                                            {appt.status === 'completed' && (() => {
                                                // Select the BP round with the lower systolic value
                                                let displaySys = appt.bp_sys;
                                                let displayDia = appt.bp_dia;

                                                if (appt.bp_sys_2 && appt.bp_dia_2) {
                                                    // If round 2 systolic is lower, use round 2
                                                    if (appt.bp_sys_2 < appt.bp_sys) {
                                                        displaySys = appt.bp_sys_2;
                                                        displayDia = appt.bp_dia_2;
                                                    } else if (appt.bp_sys_2 === appt.bp_sys && appt.bp_dia_2 < appt.bp_dia) {
                                                        // If systolic is equal, compare diastolic
                                                        displaySys = appt.bp_sys_2;
                                                        displayDia = appt.bp_dia_2;
                                                    }
                                                }

                                                return (
                                                    <div className="mt-3 flex gap-4 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg inline-block">
                                                        <span>BP: {displaySys}/{displayDia}</span>
                                                        <span>BS: {appt.blood_sugar}</span>
                                                        <span className="flex items-center gap-1"><CheckCircle2 size={14} /> บันทึกแล้ว</span>
                                                    </div>
                                                );
                                            })()}

                                            {appt.status === 'referred_back' && (
                                                <div className="mt-3 text-sm font-medium text-amber-600 bg-amber-50 px-3 py-2 rounded-lg inline-block">
                                                    ส่งกลับ: {appt.refer_back_note}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {appt.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => setVisitModalAppt(appt)}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-2 shadow-sm"
                                                >
                                                    <Stethoscope size={18} />
                                                    บันทึกผล
                                                </button>
                                                <button
                                                    onClick={() => setReferModalAppt(appt)}
                                                    className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 font-medium flex items-center gap-2"
                                                >
                                                    <ArrowRightCircle size={18} />
                                                    ส่งกลับ รพ.
                                                </button>
                                            </>
                                        )}
                                        {appt.status !== 'pending' && (
                                            <button
                                                onClick={() => setVisitModalAppt(appt)}
                                                className="px-4 py-2 text-slate-400 hover:text-indigo-600 font-medium text-sm underline"
                                            >
                                                แก้ไขข้อมูล
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                            <Calendar size={48} className="mb-4 opacity-50" />
                            <p>ยังไม่ได้เลือกวันที่</p>
                        </div>
                    )}
                </div>
            </div>

            {visitModalAppt && (
                <VisitModal
                    appointment={visitModalAppt}
                    onClose={() => setVisitModalAppt(null)}
                    onSuccess={fetchAppointments}
                />
            )}

            {referModalAppt && (
                <ReferModal
                    appointment={referModalAppt}
                    onClose={() => setReferModalAppt(null)}
                    onSuccess={fetchAppointments}
                />
            )}

            {showManualModal && (
                <ManualPatientModal
                    onClose={() => setShowManualModal(false)}
                    onSuccess={() => {
                        // Just refresh appointments if needed, or maybe list needs refresh?
                        // Actually HCDashboard only shows appointments, not all patients.
                        // But adding a patient is the first step.
                        setShowManualModal(false);
                    }}
                />
            )}
        </Layout>
    );
};

export default HCDashboard;
