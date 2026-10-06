import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Search, Edit2, Trash2, X,
    Folder, Calendar, User, Code, CheckCircle,
    Clock, AlertCircle, Eye, Save, GitBranch
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface Project {
    id: string | number;
    name: string;
    description: string;
    category: string;
    status: 'Active' | 'Completed' | 'On Hold' | 'Planning';
    techStack: string[];
    progress: number;
    createdBy?: any;
    createdAt: string;
    updatedAt?: string;
}

const ProjectsPage: React.FC = () => {
    const { user, isAdmin, isDeveloper } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        status: 'Planning' as Project['status'],
        techStack: '',
        progress: 0,
    });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch projects');
                setProjects([]);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = projects;

        if (searchTerm) {
            result = result.filter(p =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'All') {
            result = result.filter(p => p.status === filterStatus);
        }

        setFilteredProjects(result);
    }, [projects, searchTerm, filterStatus]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const projectData = {
                name: formData.name,
                description: formData.description || '',
                category: formData.category || 'General',
                status: formData.status,
                techStack: formData.techStack ? formData.techStack.split(',').map(s => s.trim()).filter(Boolean) : [],
                progress: formData.progress || 0,
            };

            const response = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(projectData),
            });

            if (response.ok) {
                const newProject = await response.json();
                setProjects([newProject, ...projects]);
                setShowModal(false);
                resetForm();
                alert('✅ Module created successfully!');
            } else {
                const error = await response.json().catch(() => ({}));
                alert('❌ Error: ' + (error.error || error.message || 'Failed to create module'));
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('❌ Error creating module');
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        try {
            const token = localStorage.getItem('token');
            const projectData = {
                name: editingProject.name,
                description: editingProject.description || '',
                category: editingProject.category || 'General',
                status: editingProject.status,
                techStack: editingProject.techStack || [],
                progress: editingProject.progress || 0,
            };

            const response = await fetch(`${API_BASE_URL}/api/projects/${editingProject.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(projectData),
            });

            if (response.ok) {
                const updatedProject = await response.json();
                setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                setShowEditModal(false);
                setEditingProject(null);
                alert('✅ Module updated successfully!');
            } else {
                const error = await response.json();
                alert('❌ Error: ' + (error.error || 'Failed to update module'));
            }
        } catch (error) {
            console.error('Error updating project:', error);
            alert('❌ Error updating module');
        }
    };

    const handleDeleteProject = async (id: string | number) => {
        if (!window.confirm('Are you sure you want to delete this module?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setProjects(projects.filter(p => p.id !== id));
                alert('✅ Module deleted successfully!');
            } else {
                const error = await response.json();
                alert('❌ Error: ' + (error.error || 'Failed to delete module'));
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('❌ Error deleting module');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: '',
            status: 'Planning',
            techStack: '',
            progress: 0,
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium';
            case 'Completed': return 'bg-blue-50 text-blue-700 border border-blue-200 font-medium';
            case 'On Hold': return 'bg-amber-50 text-amber-700 border border-amber-200 font-medium';
            case 'Planning': return 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500 flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0062E0] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading modules...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">Modules</h1>
                    <p className="text-slate-500 text-sm">Manage your QA modules and projects</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg transition-all shadow-sm hover:shadow text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Create Module
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search modules..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Planning">Planning</option>
                </select>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                    <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-[#0F172A] font-semibold">No modules found</p>
                    <p className="text-slate-500 text-sm mt-1">Get started by creating your first module</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center">
                                        <Folder className="w-5 h-5 text-[#0062E0]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#0F172A]">{project.name}</h3>
                                        <p className="text-xs text-slate-500">{project.category}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setViewingProject(project);
                                            setShowViewModal(true);
                                        }}
                                        className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="View Module"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingProject(project);
                                            setShowEditModal(true);
                                        }}
                                        className="text-slate-400 hover:text-[#0062E0] p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Edit Module"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProject(project.id)}
                                        className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Module"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">{project.description}</p>

                            <div className="flex items-center justify-between mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                                <span className="text-xs font-semibold text-slate-700">
                                    {project.progress}% complete
                                </span>
                            </div>

                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-[#0062E0] h-1.5 rounded-full transition-all"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-slate-400">
                                <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                                <span className="font-medium text-slate-500">
                                    {Array.isArray(project.techStack)
                                        ? project.techStack.length
                                        : (typeof project.techStack === 'string' && (project.techStack as string).trim()
                                            ? (project.techStack as string).split(',').filter(Boolean).length
                                            : 0)} technologies
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
                            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                                <Folder className="w-5 h-5 text-[#0062E0]" />
                                Create Module
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Module Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                                        placeholder="e.g., Web, Mobile, API"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                                        className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tech Stack (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.techStack}
                                        onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                                        placeholder="React, TypeScript, Spring Boot"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Progress (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.progress}
                                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow"
                                >
                                    Create Module
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 font-medium text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;