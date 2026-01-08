import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Loader2, Plus, Edit2, Trash2, User, Key, Shield, MapPin, X, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming utils exists

const ZONE_OPTIONS = [
    'รพ.หนองหิน',
    'รพ.สต.บ้านหนองหมากแก้ว',
    'รพ.สต.บ้านปวนพุ',
    'รพ.สต.หลักร้อยหกสิบ',
    'สถานีอนามัยเฉลิมพระเกียรติ',
    'รพ.สต.บ้านน้อยสามัคคี'
];

const UserModal = ({ user, onClose, onSuccess }) => {
    const isEdit = !!user;
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        position: '',
        role: 'hc',
        location_name: ZONE_OPTIONS[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        if (isEdit && user) {
            setFormData({
                username: user.username,
                password: '', // Don't fill password on edit
                name: user.name || '',
                position: user.position || '',
                role: user.role,
                location_name: user.location_name || ZONE_OPTIONS[0]
            });
        }
    }, [isEdit, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validatePassword = (pwd) => {
        // >= 6 chars, letters + numbers
        const hasLetter = /[a-zA-Z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const isValidLength = pwd.length >= 6;
        return hasLetter && hasNumber && isValidLength;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!isEdit) {
            if (!formData.username || !formData.password || !formData.name || !formData.position) {
                setError("กรุณากรอกข้อมูลให้ครบถ้วน");
                return;
            }
            if (!validatePassword(formData.password)) {
                setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร และประกอบด้วยตัวอักษรและตัวเลข");
                return;
            }
        } else {
            // Edit mode: password optional
            if (formData.password && !validatePassword(formData.password)) {
                setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร และประกอบด้วยตัวอักษรและตัวเลข");
                return;
            }
        }

        setLoading(true);
        try {
            const url = isEdit
                ? `${import.meta.env.VITE_API_URL}/users/${user.id}`
                : `${import.meta.env.VITE_API_URL}/users`;

            const method = isEdit ? 'put' : 'post';

            // Prepare payload
            const payload = { ...formData };
            if (isEdit && !payload.password) delete payload.password; // Don't send empty pwd

            await axios[method](url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "บันทึกไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="font-bold text-lg text-slate-800">
                        {isEdit ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <span className="font-bold">!</span> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={isEdit} // Username usually shouldn't change or backend logic complexity increases
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-500"
                            placeholder="username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password {isEdit && <span className="text-slate-400 font-normal">(เว้นว่างหากไม่เปลี่ยน)</span>}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder="รหัสผ่าน (6+ ตัวอักษรและตัวเลข)"
                        />
                        <p className="text-xs text-slate-400 mt-1">* ต้องมีอย่างน้อย 6 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder="สมชาย ใจดี"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง</label>
                            <input
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder="พยาบาลวิชาชีพ"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">สิทธิ์ (Role)</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                            >
                                <option value="hc">รพ.สต. (HC)</option>
                                <option value="hospital">โรงพยาบาล</option>
                                <option value="admin">ผู้ดูแลระบบ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">เขต/หน่วยงาน</label>
                            <select
                                name="location_name"
                                value={formData.location_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                            >
                                {ZONE_OPTIONS.map(z => (
                                    <option key={z} value={z}>{z}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
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
                            บันทึก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (e) {
            console.error("Failed to load users", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("คุณต้องการลบผู้ใช้งานนี้หรือไม่?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (e) {
            alert(e.response?.data?.detail || "ลบไม่สำเร็จ");
        }
    };

    return (
        <Layout>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">จัดการผู้ใช้งาน (User Management)</h2>
                    <p className="text-slate-500">เพิ่ม ลบ แก้ไข ข้อมูลผู้ใช้งานระบบ</p>
                </div>
                <button
                    onClick={() => { setEditingUser(null); setModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>เพิ่มผู้ใช้งาน</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-sm">
                        <tr>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Password</th>
                            <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-4">ตำแหน่ง</th>
                            <th className="px-6 py-4">สิทธิ์ (Role)</th>
                            <th className="px-6 py-4">เขต/หน่วยงาน</th>
                            <th className="px-6 py-4 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="animate-spin inline text-slate-400" /></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400">ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-slate-600">{u.username}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        {u.plain_password ? (
                                            <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                {u.plain_password}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">Hidden/Old</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{u.name || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600">{u.position || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold border",
                                            u.role === 'admin' ? "bg-purple-50 text-purple-700 border-purple-200" :
                                                u.role === 'hospital' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        )}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 flex items-center gap-1">
                                        {u.location_name && <MapPin size={14} className="text-slate-400" />}
                                        {u.location_name || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingUser(u); setModalOpen(true); }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="ลบ"
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

            {modalOpen && (
                <UserModal
                    user={editingUser}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => {
                        fetchUsers();
                        setModalOpen(false);
                    }}
                />
            )}
        </Layout>
    );
};

export default UserManagement;
