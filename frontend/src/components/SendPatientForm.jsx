import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Calendar, User, Loader2, Trash2, Edit2, ChevronDown, ChevronRight, MapPin, AlertCircle, X, Plus, CheckCircle2, Send, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import ThaiDatePicker from './ThaiDatePicker';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const EditModal = ({ appointment, onClose, onSuccess }) => {
    const [date, setDate] = useState(appointment.appointment_date);
    const [note, setNote] = useState(appointment.note || '');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/appointments/${appointment.id}`, {
                appointment_date: date,
                note: note
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert('Failed to update');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800">แก้ไขข้อมูลนัดหมาย</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <ThaiDatePicker
                            label="วันที่นัดหมาย"
                            value={date}
                            onChange={setDate}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-200"
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">ยกเลิก</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">บันทึก</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SendPatientForm = ({ initialPatient }) => {
    // Global Form State
    const [date, setDate] = useState('');
    const [reqBp, setReqBp] = useState(false);
    const [reqBs, setReqBs] = useState(false);
    const [globalNote, setGlobalNote] = useState('');

    // Cart State
    const [cart, setCart] = useState([]);
    const [hnSearch, setHnSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // History List State
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingAppt, setEditingAppt] = useState(null);
    const [filterDate, setFilterDate] = useState('');

    const { token } = useAuth();

    const refreshList = () => setRefreshTrigger(prev => prev + 1);

    // Suggestion State
    const [allPatients, setAllPatients] = useState([]);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        // Load all patients for suggestions
        const loadPatients = async () => {
            try {
                const res = await axios.get(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/patients`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAllPatients(res.data);
            } catch (err) {
                console.error("Failed to load patients list", err);
            }
        };
        loadPatients();
    }, [token]);

    // Load History
    useEffect(() => {
        const fetchAppts = async () => {
            setListLoading(true);
            try {
                const res = await axios.get(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/appointments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const pending = res.data.filter(a => a.status === 'pending');
                const sorted = pending.sort((a, b) => b.id - a.id);
                setAppointments(sorted);
                setFilteredAppointments(sorted);
            } catch (err) {
                console.error("Failed to load appointments", err);
            } finally {
                setListLoading(false);
            }
        };
        fetchAppts();
    }, [refreshTrigger, token]);

    // Filter Logic
    useEffect(() => {
        if (!filterDate) {
            setFilteredAppointments(appointments);
        } else {
            setFilteredAppointments(appointments.filter(a => a.appointment_date === filterDate));
        }
    }, [filterDate, appointments]);

    const handleExport = () => {
        if (filteredAppointments.length === 0) return;

        // Prepare data for Excel
        const data = filteredAppointments.map(a => ({
            "วันที่นัด": dayjs(a.appointment_date).add(543, 'year').format('DD/MM/YYYY'),
            "HN": a.patient?.hn || '',
            "ชื่อ-นามสกุล": a.patient?.name || '',
            "ส่งไปยัง (รพ.สต.)": a.patient?.hc_zone || '',
            "เงื่อนไข": [a.req_bp ? "วัดความดัน" : "", a.req_bs ? "เจาะน้ำตาล" : ""].filter(Boolean).join(", "),
            "หมายเหตุ": a.note || ''
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "PatientList");

        const fileName = filterDate
            ? `รายชื่อผู้ป่วยนัด_${dayjs(filterDate).format('YYYY-MM-DD')}.xlsx`
            : `รายชื่อผู้ป่วยนัด_ทั้งหมด.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    // Handle Initial Data
    useEffect(() => {
        if (initialPatient) {
            addToCart(initialPatient);
        }
    }, [initialPatient]);

    const addToCart = (patient) => {
        if (cart.some(p => p.id === patient.id)) {
            setMsg({ type: 'warning', text: `ผู้ป่วย ${patient.name} อยู่ในรายการแล้ว` });
            setTimeout(() => setMsg(null), 3000);
            return;
        }
        setCart(prev => [...prev, patient]);
        setHnSearch('');
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(p => p.id !== id));
    };

    const searchAndAdd = async (e) => {
        e?.preventDefault();
        if (!hnSearch) return;
        setLoading(true);
        setMsg(null);
        try {
            const res = await axios.get(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const searchTerm = hnSearch.trim();
            const found = res.data.find(p =>
                String(p.hn).trim() === searchTerm ||
                String(p.cid).trim() === searchTerm
            );

            if (found) {
                addToCart(found);
            } else {
                setMsg({ type: 'error', text: 'ไม่พบข้อมูลผู้ป่วย' });
            }
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการค้นหา' });
        } finally {
            setLoading(false);
        }
    };

    const handleBatchSubmit = async () => {
        if (!date) {
            setMsg({ type: 'error', text: 'กรุณาระบุวันที่นัดหมาย' });
            return;
        }
        if (cart.length === 0) {
            setMsg({ type: 'error', text: 'กรุณาเพิ่มผู้ป่วยในรายการ' });
            return;
        }

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        try {
            await Promise.all(cart.map(async (patient) => {
                try {
                    await axios.post(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/appointments`, {
                        patient_id: patient.id,
                        appointment_date: date,
                        note: globalNote,
                        req_bp: reqBp,
                        req_bs: reqBs
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    successCount++;
                } catch (e) {
                    failCount++;
                    console.error(`Failed to send patient ${patient.hn}`, e);
                }
            }));

            setMsg({
                type: successCount > 0 ? 'success' : 'error',
                text: `บันทึกสำเร็จ ${successCount} ราย${failCount > 0 ? `, ล้มเหลว ${failCount} ราย` : ''}`
            });

            if (successCount > 0) {
                setCart([]);
                setGlobalNote('');
                refreshList();
            }

        } catch (err) {
            setMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAppt = async (id) => {
        if (!window.confirm("คุณต้องการลบการนัดหมายนี้ใช่หรือไม่?")) return;
        try {
            await axios.delete(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/appointments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            refreshList();
        } catch (e) {
            alert("ลบไม่สำเร็จ");
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-140px)]">
            {/* Left: Input Form */}
            <div className="w-full md:w-1/3 md:min-w-[350px] flex flex-col gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Calendar className="text-pink-600" />
                        ข้อมูลการนัดหมาย (กลุ่ม)
                    </h3>

                    <div>
                        <ThaiDatePicker
                            label="วันที่นัดหมาย"
                            value={date}
                            onChange={setDate}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="reqBp"
                                checked={reqBp}
                                onChange={(e) => setReqBp(e.target.checked)}
                                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500 border-gray-300"
                            />
                            <label htmlFor="reqBp" className="text-sm text-slate-700 cursor-pointer">ต้องวัดความดันโลหิต 2 รอบ</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="reqBs"
                                checked={reqBs}
                                onChange={(e) => setReqBs(e.target.checked)}
                                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500 border-gray-300"
                            />
                            <label htmlFor="reqBs" className="text-sm text-slate-700 cursor-pointer">ต้องวัดระดับน้ำตาลโลหิต</label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ (รวม)</label>
                        <textarea
                            value={globalNote}
                            onChange={(e) => setGlobalNote(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-200 text-sm"
                            rows={2}
                            placeholder="ระบุหมายเหตุส่งถึง รพ.สต..."
                        />
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">เพิ่มผู้ป่วยในรายการ</label>
                        <form onSubmit={searchAndAdd} className="flex gap-2">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="ระบุ HN / เลขบัตรประชาชน"
                                    value={hnSearch}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setHnSearch(val);
                                        if (val.length > 1) {
                                            const matches = allPatients.filter(p =>
                                                p.hn.includes(val) ||
                                                p.name.includes(val)
                                            ).slice(0, 5);
                                            setSuggestions(matches);
                                        } else {
                                            setSuggestions([]);
                                        }
                                    }}
                                    onFocus={() => {
                                        if (hnSearch.length > 1) {
                                            const matches = allPatients.filter(p =>
                                                p.hn.includes(hnSearch) ||
                                                p.name.includes(hnSearch)
                                            ).slice(0, 5);
                                            setSuggestions(matches);
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setSuggestions([]), 200)} // Delay to allow click
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-200"
                                />
                                {/* Suggestions Dropdown */}
                                {suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {suggestions.map(p => (
                                            <div
                                                key={p.id}
                                                className="px-4 py-2 hover:bg-pink-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                onClick={() => {
                                                    addToCart(p);
                                                    setHnSearch('');
                                                    setSuggestions([]);
                                                }}
                                            >
                                                <div className="font-medium text-slate-800">{p.hn} - {p.name}</div>
                                                <div className="text-xs text-slate-500">{p.hc_zone}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Plus />}
                            </button>
                        </form>
                    </div>

                    {msg && (
                        <div className={cn(
                            "p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1",
                            msg.type === 'error' ? "bg-red-50 text-red-600" :
                                msg.type === 'warning' ? "bg-amber-50 text-amber-600" :
                                    "bg-green-50 text-green-600"
                        )}>
                            <AlertCircle size={16} />
                            {msg.text}
                        </div>
                    )}
                </div>

                {/* Cart List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden min-h-[300px]">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                            <User size={18} className="text-indigo-600" />
                            รายการส่งตัว ({cart.length})
                        </h4>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline"
                            >
                                ล้างรายการ
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                <User size={48} className="mb-2 opacity-20" />
                                <p>ค้นหาและเพิ่มผู้ป่วย</p>
                            </div>
                        ) : (
                            cart.map((p, idx) => (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-pink-100 transition-colors animate-in fade-in slide-in-from-right-2">
                                    <div>
                                        <div className="font-bold text-slate-800">{p.name}</div>
                                        <div className="text-xs text-slate-500">HN: {p.hn} | {p.hc_zone}</div>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(p.id)}
                                        className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={handleBatchSubmit}
                            disabled={cart.length === 0 || loading}
                            className={cn(
                                "w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2",
                                cart.length === 0 || loading
                                    ? "bg-slate-300 shadow-none cursor-not-allowed"
                                    : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:scale-[1.02]"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Send />}
                            ส่งข้อมูลเข้าระบบ ({cart.length} คน)
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: History List */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[500px]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800">ประวัติการส่งตัว (Pending)</h3>
                        <p className="text-xs text-slate-500">รายการที่รอ รพ.สต. รับเรื่อง</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-[180px]">
                            <ThaiDatePicker
                                value={filterDate}
                                onChange={setFilterDate}
                                placeholder="คัดกรองตามวันนัด..."
                            />
                        </div>
                        {filterDate && (
                            <button onClick={() => setFilterDate('')} className="p-2 text-slate-400 hover:text-red-500" title="ล้างตัวกรอง">
                                <X size={16} />
                            </button>
                        )}
                        <button
                            onClick={handleExport}
                            disabled={filteredAppointments.length === 0}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                            <FileSpreadsheet size={14} />
                            Export
                        </button>
                        <button onClick={refreshList} className="text-slate-400 hover:text-slate-600 p-2 transform hover:rotate-180 transition-transform duration-500">
                            <Loader2 size={18} className={cn(listLoading && "animate-spin")} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3">วันที่นัด</th>
                                <th className="px-5 py-3">ผู้ป่วย</th>
                                <th className="px-5 py-3">ส่งไปยัง</th>
                                <th className="px-5 py-3">เงื่อนไข</th>
                                <th className="px-5 py-3 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center text-slate-400">
                                        ไม่มีรายการที่ส่งตัวค้างอยู่
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments.map(appt => (
                                    <tr key={appt.id} className="hover:bg-slate-50 group transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-pink-400" />
                                                <span className="font-medium text-slate-700">{dayjs(appt.appointment_date).add(543, 'year').format('DD/MM/YY')}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-slate-800">{appt.patient?.name}</div>
                                            <div className="text-xs text-slate-500">HN: {appt.patient?.hn}</div>
                                            {appt.note && (
                                                <div className="mt-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block max-w-[200px] truncate">
                                                    Note: {appt.note}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-emerald-600 font-medium text-xs">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} />
                                                {appt.patient?.hc_zone || '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {appt.req_bp && <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">วัดความดัน 2 รอบ</span>}
                                                {appt.req_bs && <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">เจาะน้ำตาล</span>}
                                                {!appt.req_bp && !appt.req_bs && <span className="text-[10px] text-slate-400">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingAppt(appt)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="แก้ไข"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAppt(appt.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                                    title="ยกเลิกการนัด"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingAppt && (
                <EditModal
                    appointment={editingAppt}
                    onClose={() => setEditingAppt(null)}
                    onSuccess={refreshList}
                />
            )}
        </div>
    );
};

export default SendPatientForm;
