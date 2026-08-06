import React from 'react';

interface PendingApprovalPageProps {
    onNavigate?: (page: string) => void;
}

const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({ onNavigate }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#000000]">
            <div className="w-full max-w-md p-8 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-lg text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-white mb-4">Account Pending Approval</h2>
                <p className="text-[#666666] mb-6">
                    Your account has been created but is waiting for admin approval.
                    <br /><br />
                    You will receive access as soon as the admin approves your request.
                    <br /><br />
                    <span className="text-[#444444] text-sm">Please check back later.</span>
                </p>
                <button
                    onClick={() => onNavigate?.('login')}
                    className="text-[#ff6b00] hover:text-[#ff8c38] transition-colors"
                >
                    ← Back to Login
                </button>
            </div>
        </div>
    );
};

export default PendingApprovalPage;