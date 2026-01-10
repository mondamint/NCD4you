
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, X, Loader2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ManualPatientModal = ({ onClose, onSuccess, initialData = null }) => {
    const [formData, setFormData] = useState({
        hn: '',
        name: '',
        cid: '',
        phone: '',
        medical_rights: '',
        clinic: '',
        house_no: '',
        moo: '',
        tumbol: '',
        amphoe: '',
        province: '',
        hc_zone: 'รพ.สต.หลักร้อยหกสิบ' // Default
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth(); // Auth Token

    const zones = [
        'รพ.สต.หลักร้อยหกสิบ',
        'สถานีอนามัยเฉลิมพระเกียรติ',
        'รพ.สต.บ้านน้อยสามัคคี',
        'รพ.สต.บ้านปวนพุ',
        'รพ.สต.บ้านหนองหมากแก้ว'
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (initialData) {
            setFormData({
                hn: initialData.hn || '',
                name: initialData.name || '',
                cid: initialData.cid || '',
                phone: initialData.phone || '',
                medical_rights: initialData.medical_rights || '',
                clinic: initialData.clinic || '',
                house_no: initialData.house_no || '',
                moo: initialData.moo || '',
                tumbol: initialData.tumbol || '',
                amphoe: initialData.amphoe || '',
                province: initialData.province || '',
                hc_zone: initialData.hc_zone || 'รพ.สต.หลักร้อยหกสิบ'
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation
        if (!formData.hn || !formData.name || !formData.cid) {
            setError("กรุณากรอกข้อมูลที่จำเป็น (HN, ชื่อ, เลขบัตรประชาชน)");
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            if (initialData) {
                // UPDATE
                await axios.put(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/patients/${initialData.id}`, formData, config);
            } else {
                // CREATE
                await axios.post(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/patients`, formData, config);
            }
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            let errMsg = "บันทึกข้อมูลไม่สำเร็จ";
            if (e.response?.data?.detail) {
                errMsg = typeof e.response.data.detail === 'string'
                    ? e.response.data.detail
                    : JSON.stringify(e.response.data.detail);
            }
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-indigo-600">
                        <UserPlus size={24} />
                        <h3 className="text-xl font-bold text-slate-800">{initialData ? 'แก้ไขข้อมูลผู้ป่วย' : 'เพิ่มรายชื่อผู้ป่วย'}</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">HN *</label>
                            <input name="hn" required value={formData.hn} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">เลขบัตรประชาชน (CID) *</label>
                            <input name="cid" required value={formData.cid} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
                            <input name="name" required value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">สิทธิการรักษา</label>
                            <select name="medical_rights" value={formData.medical_rights} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200">
                                <option value="">-- เลือกสิทธิการรักษา --</option>
                                <option value="บัตรทอง">บัตรทอง</option>
                                <option value="ประกันสังคม">ประกันสังคม</option>
                                <option value="ข้าราชการ">ข้าราชการ</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">คลินิก</label>
                            <select name="clinic" value={formData.clinic} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200">
                                <option value="">-- เลือกคลินิก --</option>
                                <option value="เบาหวาน">เบาหวาน</option>
                                <option value="ความดัน">ความดัน</option>
                                <option value="เบาหวานและความดัน">เบาหวานและความดัน</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">เขตพื้นที่ (รพ.สต.) *</label>
                            <select name="hc_zone" value={formData.hc_zone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200">
                                {zones.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="font-semibold text-slate-700 mb-3 text-sm">ที่อยู่</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">บ้านเลขที่</label>
                                <input name="house_no" value={formData.house_no} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">หมู่</label>
                                <input name="moo" value={formData.moo} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">ตำบล</label>
                                <input name="tumbol" value={formData.tumbol} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">อำเภอ</label>
                                <input name="amphoe" value={formData.amphoe} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">จังหวัด</label>
                                <input name="province" value={formData.province} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 text-sm" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            <Save size={18} />
                            บันทึกข้อมูล
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualPatientModal;
