import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2, ArrowRightCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ReferModal = ({ appointment, onClose, onSuccess }) => {
    const [note, setNote] = useState(appointment.refer_back_note || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!note.trim()) {
            setError("กรุณาระบุเหตุผล");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.put(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/appointments/${appointment.id}/refer-back`, {
                note: note
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            setError("ส่งข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRightCircle className="text-amber-500" />
                        ส่งตัวกลับโรงพยาบาล
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="p-3 bg-amber-50 rounded-lg mb-4 border border-amber-100">
                        <p className="font-semibold text-slate-800">{appointment.patient.name}</p>
                        <p className="text-sm text-slate-600">กำลังส่งคืนผู้ป่วยสู่ความดูแลของโรงพยาบาล</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">เหตุผล / รายละเอียดเพิ่มเติม</label>
                            <textarea
                                required
                                rows={4}
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-200"
                                placeholder="เช่น ความดันสูงผิดปกติ แนะนำให้พบแพทย์..."
                            />
                        </div>

                        {error && (
                            <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2 bg-amber-600 text-white rounded-lg shadow-sm hover:bg-amber-700 font-medium flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                                {loading ? 'กำลังส่ง...' : 'ยืนยันส่งกลับ'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReferModal;
