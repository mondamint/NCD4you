import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Truck, User, FileText, Search, Loader2, Pill } from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const HomeOPD = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [hnSearch, setHnSearch] = useState('');
    const [foundPatient, setFoundPatient] = useState(null);
    const [cid, setCid] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('patient'); // patient, osm
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/home-opd`);
            setItems(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const searchPatientByHN = async () => {
        if (!hnSearch) return;
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/patients`);
            const p = res.data.find(x => x.hn === hnSearch);
            if (p) {
                setFoundPatient(p);
                setCid(p.cid || '');
                setName(p.name);
            } else {
                alert("ไม่พบข้อมูลผู้ป่วย");
                setFoundPatient(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/home-opd`, {
                patient_id: foundPatient?.id,
                cid: cid,
                name: name,
                type: type,
                note: note
            });
            fetchItems();
            // Reset
            setFoundPatient(null);
            setHnSearch('');
            setCid('');
            setName('');
            setType('patient');
            setNote('');
        } catch (e) {
            console.error(e);
            alert("บันทึกไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Home OPD</h2>
                    <p className="text-slate-500">ติดตามการส่งยาและเยี่ยมบ้าน</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Pill size={20} className="text-indigo-600" />
                        เพิ่มรายการ Home OPD
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">ค้นหา HN (ถ้ามี)</label>
                                <div className="flex gap-2">
                                    <input
                                        value={hnSearch}
                                        onChange={(e) => setHnSearch(e.target.value)}
                                        placeholder="ระบุ HN..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                                        onKeyDown={e => e.key === 'Enter' && searchPatientByHN()}
                                    />
                                    <button type="button" onClick={searchPatientByHN} className="bg-slate-100 p-2 rounded-lg text-slate-500 hover:text-indigo-600">
                                        <Search size={20} />
                                    </button>
                                </div>
                                {foundPatient && (
                                    <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                        <User size={12} /> พบ: {foundPatient.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">เลขบัตรประชาชน (CID) / รหัสอ้างอิง</label>
                                <input
                                    required
                                    value={cid}
                                    onChange={(e) => setCid(e.target.value)}
                                    placeholder="ระบุเลข 13 หลัก"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ชื่อ-นามสกุล"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ประเภท</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="patient"
                                        checked={type === 'patient'}
                                        onChange={(e) => setType(e.target.value)}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">ผู้ป่วย (Patient)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="osm"
                                        checked={type === 'osm'}
                                        onChange={(e) => setType(e.target.value)}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">อสม. (OSM)</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ / รายการยา</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder="รายละเอียด..."
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                                บันทึกรายการ
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center text-slate-400 min-h-[400px]">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                        <Truck size={48} className="text-indigo-200" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-600">ติดตามสถานะ</h4>
                    <p className="text-sm mt-2 max-w-xs">สามารถติดตามสถานะการส่งยาและการลงพื้นที่ของ อสม. ได้ที่ตารางด้านล่าง</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">รายการ Home OPD ล่าสุด</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-slate-500 bg-slate-50 border-b border-slate-200 font-medium">
                            <tr>
                                <th className="px-6 py-3">วันที่</th>
                                <th className="px-6 py-3">ชื่อ-นามสกุล</th>
                                <th className="px-6 py-3">ประเภท</th>
                                <th className="px-6 py-3">เขตพื้นที่</th>
                                <th className="px-6 py-3">ผู้บันทึก</th>
                                <th className="px-6 py-3">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">ยังไม่มีรายการ</td>
                                </tr>
                            ) : (
                                items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 text-slate-500">{new Date(item.created_at || Date.now()).toLocaleDateString('th-TH')}</td>
                                        <td className="px-6 py-3 font-medium text-slate-900">{item.name}</td>
                                        <td className="px-6 py-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-semibold capitalize",
                                                item.type === 'patient' ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                                            )}>
                                                {item.type === 'patient' ? 'ผู้ป่วย' : 'อสม.'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-emerald-600">{item.location || '-'}</td>
                                        <td className="px-6 py-3 text-slate-500 capitalize">{item.source === 'hospital' ? 'โรงพยาบาล' : 'รพ.สต.'}</td>
                                        <td className="px-6 py-3 text-slate-600 max-w-xs truncate">{item.note}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default HomeOPD;
