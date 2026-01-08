import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

const PatientTable = ({ refreshTrigger, onSend, onEdit }) => {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const fetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/patients`);
            setPatients(res.data);
            setFilteredPatients(res.data);
        } catch (error) {
            console.error("Failed to fetch patients", error);
            setError(error.response?.data?.detail || error.message || "ไม่สามารถโหลดข้อมูลผู้ป่วยได้");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (patient) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ป่วย: ${patient.name}?`)) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/patients/${patient.id}`);
            fetchPatients();
        } catch (e) {
            console.error(e);
            alert("ลบไม่สำเร็จ: " + (e.response?.data?.detail || "เกิดข้อผิดพลาด"));
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [refreshTrigger]);

    useEffect(() => {
        if (!search) {
            setFilteredPatients(patients);
        } else {
            const lower = search.toLowerCase();
            setFilteredPatients(patients.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.hn.toLowerCase().includes(lower) ||
                p.hc_zone?.toLowerCase().includes(lower)
            ));
        }
    }, [search, patients]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="ค้นหา HN, ชื่อ, หรือ เลขบัตรประชาชน..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">HN</th>
                            <th className="px-6 py-3">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-3">บัตรประชาชน (CID)</th>
                            <th className="px-6 py-3">สิทธิการรักษา</th>
                            <th className="px-6 py-3">คลินิก</th>
                            <th className="px-6 py-3">เขตพื้นที่</th>
                            <th className="px-6 py-3">ที่อยู่</th>
                            <th className="px-6 py-3 text-center">จัดการ</th>
                            <th className="px-6 py-3 text-center">ส่งตัว</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="9" className="p-4 text-center">กำลังโหลด...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="9" className="p-4 text-center text-red-500">เกิดข้อผิดพลาด: {error} <br /> <button onClick={fetchPatients} className="text-indigo-600 underline mt-2">ลองใหม่</button></td></tr>
                        ) : filteredPatients.length === 0 ? (
                            <tr><td colSpan="9" className="p-4 text-center text-slate-400">ไม่พบข้อมูลผู้ป่วย</td></tr>
                        ) : (
                            filteredPatients.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-mono text-slate-600">{p.hn}</td>
                                    <td className="px-6 py-3 font-medium text-slate-900">{p.name}</td>
                                    <td className="px-6 py-3 text-slate-500">{p.cid}</td>
                                    <td className="px-6 py-3">{p.medical_rights}</td>
                                    <td className="px-6 py-3">
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                                            {p.clinic}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-emerald-600 font-medium">{p.hc_zone}</td>
                                    <td className="px-6 py-3 text-slate-500 truncate max-w-xs" title={`${p.house_no} ${p.moo} ${p.tumbol} ${p.amphoe} ${p.province}`}>
                                        {p.house_no} ม.{p.moo} {p.tumbol} {p.amphoe} {p.province}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onEdit && onEdit(p)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <button
                                            onClick={() => onSend(p)}
                                            className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded shadow-sm flex items-center justify-center transition-colors group"
                                            title="ส่งตัวไปยัง รพ.สต."
                                        >
                                            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5"></div>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center">
                แสดง {filteredPatients.length} รายการ
            </div>
        </div>
    );
};

export default PatientTable;
