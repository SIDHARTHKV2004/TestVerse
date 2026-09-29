import React from 'react';

interface PendingApprovalPageProps {
    onNavigate?: (page: string) => void;
}

const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({ onNavigate }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
            <div className="w-full max-w-md p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl text-center">
                <div className="text-5xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Account Pending Approval</h2>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    Your account has been created successfully and is currently waiting for admin approval.
                    <br /><br />
                    You will be granted full access as soon as an administrator approves your registration.
                    <br /><br />
                    <span className="text-slate-400 text-xs">Please check back later or contact your system administrator.</span>
                </p>
                <button
                    onClick={() => onNavigate?.('login')}
                    className="text-[#0062E0] hover:text-[#0050B8] font-semibold text-sm transition-colors"
                >
                    ← Back to Login
                </button>
            </div>
        </div>
    );
};

export default PendingApprovalPage;