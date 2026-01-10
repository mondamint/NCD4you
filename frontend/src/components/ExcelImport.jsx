
import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';

const ExcelImport = ({ onUploadSuccess }) => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { token } = useAuth(); // Auth Token

    const handleDownloadTemplate = () => {
        // Generate a simple Excel file on the fly
        const headers = ["HN", "Name", "CID", "Phone", "Rights", "Clinic", "HouseNo", "Moo", "Tumbol", "Amphoe", "Province"];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Patients");
        XLSX.writeFile(wb, "patient_template.xlsx");
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post(`${window.globalConfig?.API_URL || import.meta.env.VITE_API_URL}/patients/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setSuccess(res.data.message);
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Upload failed");
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-600" size={20} />
                        นำเข้าข้อมูลผู้ป่วย
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">อัปโหลดไฟล์ Excel เพื่อเพิ่มรายชื่อผู้ป่วยจำนวนมาก</p>
                </div>
                <button
                    onClick={handleDownloadTemplate}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline flex items-center gap-1"
                >
                    <Download size={14} /> ดาวน์โหลด Template
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx, .xls"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        เลือกไฟล์ Excel
                    </button>

                    {loading && <span className="text-sm text-slate-500">กำลังอัปโหลด...</span>}
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-1">
                        <CheckCircle size={16} />
                        {success}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExcelImport;
