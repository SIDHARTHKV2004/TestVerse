import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Play, CheckCircle, XCircle, Clock, Settings, Rocket, Code,
    X, FileCode, User, Calendar, GitBranch, Terminal
} from 'lucide-react';

interface AutomationScript {
    id: number;
    name: string;
    description: string;
    framework: 'Playwright' | 'Selenium' | 'Cypress';
    status: 'Draft' | 'Ready' | 'Running' | 'Passed' | 'Failed';
    code: string;
    createdBy: {
        id: number;
        name: string;
    };
    projectId: number;
    lastRunAt?: string;
    lastResult?: 'Passed' | 'Failed';
    createdAt: string;
}

const AutomationPage: React.FC = () => {
    const { user, token, isAdmin, isStudent } = useAuth();
    const [scripts, setScripts] = useState<AutomationScript[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedScript, setSelectedScript] = useState<AutomationScript | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        framework: 'Playwright',
        code: '',
        projectId: '',
    });

    useEffect(() => {
        fetchScripts();
    }, []);

    const fetchScripts = async () => {
        try {
            // For students: get their scripts
            // For admin: get all scripts
            const endpoint = isAdmin ? '/api/automation' : '/api/automation/my-scripts';
            const response = await fetch(`http://localhost:8080${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setScripts(data);
            }
        } catch (error) {
            console.error('Error fetching automation scripts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateScript = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/api/automation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    projectId: parseInt(formData.projectId),
                }),
            });

            if (response.ok) {
                const newScript = await response.json();
                setScripts([newScript, ...scripts]);
                setShowModal(false);
                setFormData({
                    name: '',
                    description: '',
                    framework: 'Playwright',
                    code: '',
                    projectId: '',
                });
            }
        } catch (error) {
            console.error('Error creating script:', error);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'Draft': 'bg-gray-500/20 text-gray-400',
            'Ready': 'bg-blue-500/20 text-blue-400',
            'Running': 'bg-yellow-500/20 text-yellow-400',
            'Passed': 'bg-green-500/20 text-green-400',
            'Failed': 'bg-red-500/20 text-red-400',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Running': return <Clock size={14} />;
            case 'Passed': return <CheckCircle size={14} />;
            case 'Failed': return <XCircle size={14} />;
            default: return <Settings size={14} />;
        }
    };

    const getFrameworkIcon = (framework: string) => {
        switch (framework) {
            case 'Playwright': return '🎭';
            case 'Selenium': return '🧪';
            case 'Cypress': return '🔄';
            default: return '💻';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[#666666]">Loading automation scripts...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Automation Hub</h1>
                    <p className="text-[#666666] text-sm">
                        {isAdmin ? 'Manage all automation scripts' : 'Write and manage your automation scripts'}
                    </p>
                    {isStudent && (
                        <p className="text-xs text-[#444444] mt-1">You can create scripts for your assigned project</p>
                    )}
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} />
                    New Script
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
                    <p className="text-sm text-[#666666]">Total Scripts</p>
                    <p className="text-2xl font-bold text-white">{scripts.length}</p>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
                    <p className="text-sm text-[#666666]">Passed</p>
                    <p className="text-2xl font-bold text-green-400">{scripts.filter(s => s.status === 'Passed').length}</p>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
                    <p className="text-sm text-[#666666]">Failed</p>
                    <p className="text-2xl font-bold text-red-400">{scripts.filter(s => s.status === 'Failed').length}</p>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
                    <p className="text-sm text-[#666666]">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-400">{scripts.filter(s => s.status === 'Running').length}</p>
                </div>
            </div>

            {/* Scripts List */}
            {scripts.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-[#1a1a1a] rounded-xl">
                    <Rocket size={48} className="mx-auto mb-3 text-[#444444]" />
                    <p className="text-lg text-white">No automation scripts yet</p>
                    <p className="text-sm text-[#666666]">Create your first automation script!</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create Script
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scripts.map((script) => (
                        <div
                            key={script.id}
                            className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#ff6b00] transition-all cursor-pointer"
                            onClick={() => setSelectedScript(script)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getFrameworkIcon(script.framework)}</span>
                                        <h3 className="text-white font-medium">{script.name}</h3>
                                    </div>
                                    <p className="text-sm text-[#666666] mt-1 line-clamp-2">{script.description}</p>
                                    <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(script.status)}`}>
                      {getStatusIcon(script.status)}
                        {script.status}
                    </span>
                                        <span className="text-xs text-[#666666]">
                      {script.framework}
                    </span>
                                        <span className="text-xs text-[#666666] flex items-center gap-1">
                      <User size={12} />
                                            {script.createdBy?.name || 'Unknown'}
                    </span>
                                    </div>
                                    {script.lastResult && (
                                        <div className="mt-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${
                          script.lastResult === 'Passed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                      }`}>
                        Last run: {script.lastResult}
                      </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Script Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#111111] pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Code size={20} className="text-[#ff6b00]" />
                                Create Automation Script
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-[#666666] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateScript} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Script Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Enter script name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="What does this script do?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Framework</label>
                                    <select
                                        value={formData.framework}
                                        onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                                    >
                                        <option value="Playwright">Playwright</option>
                                        <option value="Selenium">Selenium</option>
                                        <option value="Cypress">Cypress</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Project ID</label>
                                    <input
                                        type="number"
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                        placeholder="Project ID"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Script Code</label>
                                <textarea
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    rows={6}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] font-mono text-sm focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="// Write your automation script here..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Create Script
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* View Script Modal */}
            {selectedScript && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#111111] border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getFrameworkIcon(selectedScript.framework)}</span>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedScript.name}</h2>
                                    <p className="text-sm text-[#666666]">{selectedScript.framework}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedScript(null)} className="text-[#666666] hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-[#666666] uppercase tracking-wider">Description</label>
                                <p className="text-white mt-1">{selectedScript.description || 'No description'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(selectedScript.status)}`}>
                  {getStatusIcon(selectedScript.status)}
                    Status: {selectedScript.status}
                </span>
                                <span className="text-xs text-[#666666] flex items-center gap-1">
                  <User size={14} />
                  Created by: {selectedScript.createdBy?.name || 'Unknown'}
                </span>
                            </div>
                            <div>
                                <label className="text-xs text-[#666666] uppercase tracking-wider">Code</label>
                                <pre className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 mt-1 text-sm font-mono text-white overflow-x-auto">
                  {selectedScript.code || '// No code written yet'}
                </pre>
                            </div>
                            {selectedScript.lastResult && (
                                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                                    <label className="text-xs text-[#666666] uppercase tracking-wider">Last Run Result</label>
                                    <p className={`text-sm font-medium mt-1 ${
                                        selectedScript.lastResult === 'Passed' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {selectedScript.lastResult}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutomationPage;