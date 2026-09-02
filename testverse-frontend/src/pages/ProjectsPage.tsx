import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Search, Edit2, Trash2, X,
    Folder, Calendar, User, Code, CheckCircle,
    Clock, AlertCircle, Eye, Save, GitBranch
} from 'lucide-react';

interface Project {
    id: number;
    name: string;
    description: string;
    category: string;
    status: 'Active' | 'Completed' | 'On Hold' | 'Planning';
    techStack: string[];
    progress: number;
    createdBy?: number;
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
            const response = await fetch('http://localhost:8080/api/projects', {
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
                techStack: formData.techStack ? formData.techStack.split(',').map(s => s.trim()) : [],
                progress: formData.progress || 0,
            };

            const response = await fetch('http://localhost:8080/api/projects', {
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
                const error = await response.json();
                alert('❌ Error: ' + (error.error || 'Failed to create module'));
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

            const response = await fetch(`http://localhost:8080/api/projects/${editingProject.id}`, {
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

    const handleDeleteProject = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this module?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/projects/${id}`, {
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
            case 'Active': return 'bg-green-500/20 text-green-400';
            case 'Completed': return 'bg-blue-500/20 text-blue-400';
            case 'On Hold': return 'bg-yellow-500/20 text-yellow-400';
            case 'Planning': return 'bg-purple-500/20 text-purple-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading modules...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Modules</h1>
                    <p className="text-slate-400 text-sm">Manage your QA modules and projects</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#ff6b00] hover:bg-[#cc5500] text-white rounded-lg transition-colors"
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
                        className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#ff6b00]"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-white focus:outline-none focus:border-[#ff6b00]"
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Planning">Planning</option>
                </select>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                    <Folder className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No modules found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#ff6b00]/30 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#ff6b00]/20 flex items-center justify-center">
                                        <Folder className="w-5 h-5 text-[#ff6b00]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{project.name}</h3>
                                        <p className="text-xs text-slate-400">{project.category}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setViewingProject(project);
                                            setShowViewModal(true);
                                        }}
                                        className="text-slate-400 hover:text-white p-1"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingProject(project);
                                            setShowEditModal(true);
                                        }}
                                        className="text-slate-400 hover:text-[#ff6b00] p-1"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProject(project.id)}
                                        className="text-slate-400 hover:text-red-400 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{project.description}</p>

                            <div className="flex items-center gap-2 mb-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {project.progress}% complete
                                </span>
                            </div>

                            <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                                <div
                                    className="bg-[#ff6b00] h-1.5 rounded-full transition-all"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>

                            <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between text-xs text-slate-500">
                                <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                                <span>{project.techStack?.length || 0} technologies</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Create Module</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Module Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-[#1a1a1a] rounded-lg text-white focus:outline-none focus:border-[#ff6b00]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-[#1a1a1a] rounded-lg text-white focus:outline-none focus:border-[#ff6b00]"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-[#1a1a1a] rounded-lg text-white focus:outline-none focus:border-[#ff6b00]"
                                        placeholder="e.g., Web, Mobile, API"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                                        className="w-full px-4 py-2 bg-black border border-[#1a1a1a] rounded-lg text-white focus:outline-none focus:border-[#ff6b00]"
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tech Stack (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.techStack}
                                        onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-[#1a1a1a] rounded-lg text-white focus:outline-none focus:border-[#ff6b00]"
                                        placeholder="React, TypeScript, Spring Boot"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Progress (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.progress}
                                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-black border border-[#1a1a1a] rounded-lg text-white focus:outline-none focus:border-[#ff6b00]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#ff6b00] hover:bg-[#cc5500] text-white rounded-lg transition-colors"
                                >
                                    Create Module
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg transition-colors"
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