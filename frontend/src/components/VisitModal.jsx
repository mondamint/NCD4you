import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const VisitModal = ({ appointment, onClose, onSuccess }) => {
    const [bpSys, setBpSys] = useState(appointment.bp_sys || '');
    const [bpDia, setBpDia] = useState(appointment.bp_dia || '');
    const [bpSys2, setBpSys2] = useState(appointment.bp_sys_2 || '');
    const [bpDia2, setBpDia2] = useState(appointment.bp_dia_2 || '');
    const [bs, setBs] = useState(appointment.blood_sugar || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    // --- Logic Helpers ---
    const getBpLevel = (sys, dia) => {
        if (!sys) return 'none'; // Dia is optional now for logic, but we still capture it.
        const s = parseInt(sys);

        // Red: Systolic >= 160
        if (s >= 160) return 'red';

        // Yellow: Systolic 140-159
        if (s >= 140 && s <= 159) return 'yellow';

        // Green: Systolic < 140
        if (s < 140) return 'green';

        return 'none';
    };

    const getBsLevel = (val) => {
        if (!val) return 'none';
        const v = parseInt(val);
        if (v >= 160) return 'red';
        if (v >= 140) return 'yellow';
        return 'green';
    };

    // Calculate max risk currently entered
    const currentBp1Level = getBpLevel(bpSys, bpDia);
    const currentBp2Level = getBpLevel(bpSys2, bpDia2);
    const currentBsLevel = getBsLevel(bs);

    // Final Risk Logic:
    // If ANY reading (BP2 or BS) is Red -> Red
    // If ANY reading is Yellow (and none Red) -> Yellow
    // Else Green
    const getOverallRisk = () => {
        // Changed: Removed currentBp1Level from risk calculation as per requirement
        // "สำหรับคนไข้ HT แบ่งสีตามการวัดความดันครั้งที่ 2"
        const levels = [currentBp2Level, currentBsLevel];

        if (levels.includes('red')) return 'red';
        if (levels.includes('yellow')) return 'yellow';
        if (levels.includes('green')) return 'green';
        return 'none';
    };

    const risk = getOverallRisk();

    const getColorClass = (level) => {
        switch (level) {
            case 'red': return 'border-red-500 bg-red-50 text-red-900 focus:ring-red-200';
            case 'yellow': return 'border-yellow-500 bg-yellow-50 text-yellow-900 focus:ring-yellow-200';
            case 'green': return 'border-emerald-500 bg-emerald-50 text-emerald-900 focus:ring-emerald-200';
            default: return 'border-slate-200 focus:ring-indigo-200';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation for Requirements
        if (appointment.req_bp) {
            if (!bpSys || !bpDia || !bpSys2 || !bpDia2) {
                alert("กรุณาระบุความดันโลหิตให้ครบทั้ง 2 รอบ");
                return;
            }
        }

        if (appointment.req_bs) {
            if (!bs) {
                alert("กรุณาระบุระดับน้ำตาลในเลือด");
                return;
            }
        }

        setLoading(true);
        setError(null);

        const isRefer = risk === 'red' || risk === 'yellow';

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // 1. Save Visit Data
            await axios.put(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/appointments/${appointment.id}/visit`, {
                bp_sys: parseInt(bpSys),
                bp_dia: parseInt(bpDia),
                bp_sys_2: parseInt(bpSys2) || 0,
                bp_dia_2: parseInt(bpDia2) || 0,
                blood_sugar: parseInt(bs)
            }, config);

            // 2. If Risk is High -> Auto Refer
            if (isRefer) {
                let reason = "ส่งต่ออัตโนมัติ: ";
                if (currentBsLevel !== 'green' && currentBsLevel !== 'none') reason += `ระดับน้ำตาล ${bs} (${currentBsLevel}) `;
                if (currentBp1Level !== 'green' && currentBp1Level !== 'none') reason += `ความดันครั้งที่ 1 (${bpSys}/${bpDia}) `;
                if (getBpLevel(bpSys2, bpDia2) !== 'none' && getBpLevel(bpSys2, bpDia2) !== 'green') {
                    reason += `ความดันครั้งที่ 2 (${bpSys2}/${bpDia2}) `;
                }

                await axios.put(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/appointments/${appointment.id}/refer-back`, {
                    note: reason.trim()
                }, config);
            }

            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            const msg = e.response?.data?.detail || "ส่งข้อมูลไม่สำเร็จ";
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">บันทึกข้อมูลตรวจเยี่ยม</h3>
                        <p className="text-slate-500 text-sm">ผู้ป่วย: {appointment.patient.name} (HN: {appointment.patient.hn})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Status Badge */}
                    <div className="flex justify-center mb-8">
                        <div className={cn(
                            "px-6 py-2 rounded-full font-bold text-lg shadow-sm border transition-all duration-300",
                            risk === 'red' ? "bg-red-100 text-red-600 border-red-200" :
                                risk === 'yellow' ? "bg-yellow-100 text-yellow-600 border-yellow-200" :
                                    risk === 'green' ? "bg-emerald-100 text-emerald-600 border-emerald-200" :
                                        "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                            {risk === 'red' ? "ความเสี่ยงสูง (ส่งตัวกลับ)" :
                                risk === 'yellow' ? "ความเสี่ยงปานกลาง (ส่งตัวกลับ)" :
                                    risk === 'green' ? "ปกติ" : "รอการบันทึก"}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* BP Section */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                ความดันโลหิต (mmHg)
                                {appointment.req_bp && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">บังคับ 2 รอบ</span>}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Round 1 */}
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-500">ครั้งที่ 1</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            placeholder="SYS"
                                            className={cn("w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all text-center text-lg font-medium", getColorClass(currentBp1Level))}
                                            value={bpSys}
                                            onChange={(e) => setBpSys(e.target.value)}
                                        />
                                        <span className="text-slate-300 text-xl">/</span>
                                        <input
                                            type="number"
                                            placeholder="DIA"
                                            className={cn("w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all text-center text-lg font-medium", getColorClass(currentBp1Level))}
                                            value={bpDia}
                                            onChange={(e) => setBpDia(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Round 2 */}
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-500">ครั้งที่ 2</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            placeholder="SYS"
                                            className={cn("w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all text-center text-lg font-medium", getColorClass(currentBp2Level))}
                                            value={bpSys2}
                                            onChange={(e) => setBpSys2(e.target.value)}
                                        />
                                        <span className="text-slate-300 text-xl">/</span>
                                        <input
                                            type="number"
                                            placeholder="DIA"
                                            className={cn("w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all text-center text-lg font-medium", getColorClass(currentBp2Level))}
                                            value={bpDia2}
                                            onChange={(e) => setBpDia2(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BS Section */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                ระดับน้ำตาลในเลือด (mg/dL)
                                {appointment.req_bs && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">บังคับ</span>}
                            </h4>
                            <div className="max-w-[200px]">
                                <input
                                    type="number"
                                    placeholder="Blood Sugar"
                                    className={cn("w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all text-center text-lg font-medium", getColorClass(currentBsLevel))}
                                    value={bs}
                                    onChange={(e) => setBs(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        {(risk === 'red' || risk === 'yellow') && (
                            <div className="flex items-start gap-2 text-amber-800 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <p>ผู้ป่วยมีค่าสัญญาณชีพผิดปกติ ระบบจะทำการส่งตัวกลับโรงพยาบาลโดยอัตโนมัติเมื่อกดบันทึก</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
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
                                className={cn(
                                    "flex-1 py-2 text-white rounded-lg flex items-center justify-center gap-2 transition-colors",
                                    risk === 'red' ? 'bg-red-600 hover:bg-red-700' :
                                        risk === 'yellow' ? 'bg-amber-500 hover:bg-amber-600' :
                                            'bg-emerald-600 hover:bg-emerald-700'
                                )}
                            >
                                {loading && <Loader2 className="animate-spin" size={16} />}
                                {risk === 'green' || risk === 'none' ? 'Save & Complete' : 'บันทึกและส่งตัวกลับ'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VisitModal;
