import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Download, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import ThaiDatePicker from './ThaiDatePicker';

const ReceivedDataTable = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        // Initial load
        fetchData();
    }, [token]);

    const fetchData = async (start = '', end = '') => {
        setLoading(true);
        try {
            let url = `${import.meta.env.VITE_API_URL}/appointments`;
            const params = {};
            if (start) params.start_date = start;
            if (end) params.end_date = end;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                params: params
            });
            // Filter locally for status if backend doesn't support mult-status or if we want to be safe
            setVisits(res.data.filter(app => app.status === 'completed'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchData(startDate, endDate);
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        fetchData('', '');
    };

    const handleExport = () => {
        import('xlsx').then(XLSX => {
            // Sort by Appointment Date
            const sortedVisits = [...visits].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

            const data = sortedVisits.map(v => ({
                'วันที่': v.appointment_date,
                'HN': v.patient?.hn || '-',
                'ชื่อ-นามสกุล': v.patient?.name || '-',
                'เขต รพ.สต.': v.patient?.hc_zone || '-',
                'BP ครั้งที่ 1': (v.bp_sys && v.bp_dia) ? `${v.bp_sys}/${v.bp_dia}` : '-',
                'BP ครั้งที่ 2': (v.bp_sys_2 && v.bp_dia_2) ? `${v.bp_sys_2}/${v.bp_dia_2}` : '-',
                'ค่าน้ำตาลในเลือด': v.blood_sugar || '-'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลตอบกลับ");
            XLSX.writeFile(wb, `received_data_${new Date().toISOString().split('T')[0]}.xlsx`);
        });
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-emerald-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-emerald-900 whitespace-nowrap">ข้อมูลผู้ป่วยจากสถานพยาบาล</h3>
                </div>

                <div className="flex flex-wrap items-end gap-2 w-full sm:w-auto">
                    <div className="w-40">
                        <ThaiDatePicker
                            value={startDate}
                            onChange={setStartDate}
                            placeholder="จากวันที่"
                        />
                    </div>
                    <span className="text-slate-400 pb-2">-</span>
                    <div className="w-40">
                        <ThaiDatePicker
                            value={endDate}
                            onChange={setEndDate}
                            placeholder="ถึงวันที่"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium text-sm"
                    >
                        ค้นหา
                    </button>
                    {(startDate || endDate) && (
                        <button
                            onClick={handleClear}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="ล้างตัวกรอง"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Download size={16} />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                    <thead className="bg-emerald-50 text-emerald-800 font-medium border-b border-emerald-100">
                        <tr>
                            <th className="px-6 py-3">วันที่</th>
                            <th className="px-6 py-3">HN</th>
                            <th className="px-6 py-3">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-3">เขตพื้นที่</th>
                            <th className="px-6 py-3">ความดัน (BP)</th>
                            <th className="px-6 py-3">น้ำตาล (BS)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visits.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400">
                                {loading ? 'กำลังโหลด...' : 'ไม่พบข้อมูลตามเงื่อนไขที่ระบุ'}
                            </td></tr>
                        ) : (
                            visits.map(v => (
                                <tr key={v.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-500">{v.appointment_date}</td>
                                    <td className="px-6 py-3 font-mono text-slate-600">{v.patient.hn}</td>
                                    <td className="px-6 py-3 font-medium text-slate-900">{v.patient.name}</td>
                                    <td className="px-6 py-3 text-emerald-600">{v.patient.hc_zone}</td>
                                    <td className="px-6 py-3 font-mono">
                                        <div className="flex flex-col gap-1">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded w-fit",
                                                v.bp_sys > 140 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"
                                            )}>
                                                1: {v.bp_sys}/{v.bp_dia}
                                            </span>
                                            {(v.bp_sys_2 || v.bp_dia_2) && (
                                                <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 w-fit">
                                                    2: {v.bp_sys_2}/{v.bp_dia_2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-mono">
                                        {v.blood_sugar}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default ReceivedDataTable;
