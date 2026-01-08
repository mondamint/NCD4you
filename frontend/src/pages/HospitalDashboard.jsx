import React, { useState } from 'react';
import Layout from '../components/Layout';
import ExcelImport from '../components/ExcelImport';
import PatientTable from '../components/PatientTable';
import SendPatientForm from '../components/SendPatientForm';
import ReceivedDataTable from '../components/ReceivedDataTable';
import ReferBackTable from '../components/ReferBackTable';
import ManualPatientModal from '../components/ManualPatientModal';
import { Users, Send, Download, ArrowLeftCircle, FileText, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const SendPatientSection = ({ initialPatient }) => <SendPatientForm initialPatient={initialPatient} />;
const ReceivedDataSection = () => <ReceivedDataTable />;
const ReferBackSection = () => <ReferBackTable />;

const HospitalDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showManualModal, setShowManualModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const refreshPatientList = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleSendPatient = (patient) => {
        setSelectedPatient(patient);
        setActiveTab('send');
    };

    const handleEditPatient = (patient) => {
        setSelectedPatient(patient);
        setShowManualModal(true);
    };

    const handleAddNewPatient = () => {
        setSelectedPatient(null);
        setShowManualModal(true);
    };

    // ... (tabs config remains same) ...

    const tabs = [
        {
            id: 'profile',
            label: 'ทะเบียนผู้ป่วย',
            icon: Users,
            activeClass: "bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500",
            inactiveClass: "bg-white border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50",
            iconColor: "indigo"
        },
        {
            id: 'send',
            label: 'ส่งคนไข้ตามวันนัด',
            icon: Send,
            activeClass: "bg-rose-50 border-rose-500 shadow-md ring-1 ring-rose-500",
            inactiveClass: "bg-white border-rose-100 hover:border-rose-300 hover:bg-rose-50",
            iconColor: "rose"
        },
        {
            id: 'received',
            label: 'ข้อมูลจาก รพ.สต.',
            icon: Download,
            activeClass: "bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500",
            inactiveClass: "bg-white border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50",
            iconColor: "emerald"
        },
        {
            id: 'refer',
            label: 'ส่งกลับโรงพยาบาล',
            icon: ArrowLeftCircle,
            activeClass: "bg-amber-50 border-amber-500 shadow-md ring-1 ring-amber-500",
            inactiveClass: "bg-white border-amber-100 hover:border-amber-300 hover:bg-amber-50",
            iconColor: "amber"
        },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <ExcelImport onSuccess={refreshPatientList} />
                            <button
                                onClick={handleAddNewPatient}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <User size={20} />
                                <span>เพิ่มผู้ป่วยใหม่</span>
                            </button>
                        </div>
                        <PatientTable
                            refreshTrigger={refreshTrigger}
                            onSend={handleSendPatient}
                            onEdit={handleEditPatient}
                        />
                    </div>
                );
            case 'send':
                return <SendPatientSection initialPatient={selectedPatient} />;
            case 'received':
                return <ReceivedDataSection />;
            case 'refer':
                return <ReferBackSection />;
            default:
                return null;
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">ระบบจัดการผู้ป่วย NCD</h2>
                <p className="text-slate-500">สำหรับโรงพยาบาลและเครือข่าย รพ.สต.</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200",
                                isActive ? tab.activeClass : tab.inactiveClass
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-full mb-3",
                                isActive
                                    ? `bg-${tab.iconColor}-100 text-${tab.iconColor}-600`
                                    : `bg-${tab.iconColor}-50 text-${tab.iconColor}-400`
                            )}>
                                <Icon size={24} />
                            </div>
                            <span className={cn(
                                "font-medium",
                                isActive ? "text-slate-800" : "text-slate-500"
                            )}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderContent()}
            </div>

            {showManualModal && (
                <ManualPatientModal
                    initialData={activeTab === 'profile' ? selectedPatient : null}
                    onClose={() => setShowManualModal(false)}
                    onSuccess={() => {
                        refreshPatientList();
                        setShowManualModal(false);
                    }}
                />
            )}
        </Layout >
    );
};

export default HospitalDashboard;
