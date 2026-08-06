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

    // Fetch projects
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

    // Apply filters
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

    // Create Project
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
                alert('✅ Project created successfully!');
            } else {
                const error = await response.json();
                alert('❌ Failed to create project: ' + (error.message || 'Please try again.'));
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    // Edit Project
    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name || '',
            description: project.description || '',
            category: project.category || '',
            status: project.status || 'Planning',
            techStack: project.techStack ? project.techStack.join(', ') : '',
            progress: project.progress || 0,
        });
        setShowEditModal(true);
    };

    const handleEditProject = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingProject) return;

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

            const response = await fetch(`http://localhost:8080/api/projects/${editingProject.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(projectData),
            });

            if (response.ok) {
                await loadProjects();
                setShowEditModal(false);
                setEditingProject(null);
                resetForm();
                alert('✅ Project updated successfully!');
            } else {
                const error = await response.json();
                alert('❌ Failed to update project: ' + (error.message || 'Please try again.'));
            }
        } catch (error) {
            console.error('Error updating project:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    // Delete Project
    const handleDeleteProject = async (id: number) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

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
                alert('✅ Project deleted successfully!');
            } else {
                alert('❌ Failed to delete project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    // View Project
    const openViewModal = (project: Project) => {
        setViewingProject(project);
        setShowViewModal(true);
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
        const colors: Record<string, string> = {
            'Active': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Completed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'On Hold': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Planning': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Active': return <CheckCircle size={14} className="text-green-400" />;
            case 'Completed': return <CheckCircle size={14} className="text-blue-400" />;
            case 'On Hold': return <Clock size={14} className="text-yellow-400" />;
            default: return <Clock size={14} className="text-purple-400" />;
        }
    };

    const canCreateProject = isAdmin || isDeveloper;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[#666666]">Loading projects...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-[#666666] text-sm">{projects.length} total projects</p>
                </div>
                {canCreateProject && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                )}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                    />
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff6b00]"
                >
                    <option value="All">All Status</option>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{projects.length}</p>
                    <p className="text-xs text-[#666666]">Total</p>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">
                        {projects.filter(p => p.status === 'Active').length}
                    </p>
                    <p className="text-xs text-[#666666]">Active</p>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                        {projects.filter(p => p.status === 'Completed').length}
                    </p>
                    <p className="text-xs text-[#666666]">Completed</p>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                        {projects.filter(p => p.status === 'On Hold').length}
                    </p>
                    <p className="text-xs text-[#666666]">On Hold</p>
                </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-[#1a1a1a] rounded-xl">
                    <Folder size={48} className="mx-auto mb-3 text-[#444444]" />
                    <p className="text-lg text-white">No projects yet</p>
                    <p className="text-sm text-[#666666]">Create your first project to get started!</p>
                    {canCreateProject && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-4 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Project
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => openViewModal(project)}
                            className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#ff6b00] transition-all cursor-pointer group"
                        >
                            {/* Project Card Content */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg flex items-center justify-center">
                                        <Folder size={18} className="text-[#ff6b00]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium text-sm truncate max-w-[150px]">
                                            {project.name}
                                        </h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${getStatusColor(project.status)}`}>
                                            {getStatusIcon(project.status)}
                                            {project.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {canCreateProject && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditModal(project); }}
                                                className="p-1 rounded hover:bg-[#1a1a1a] text-[#666666] hover:text-[#ff6b00] transition-colors"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                                className="p-1 rounded hover:bg-[#1a1a1a] text-[#666666] hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-[#666666] mt-2 line-clamp-2">
                                {project.description || 'No description'}
                            </p>

                            {/* Progress Bar */}
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-[10px] text-[#666666]">
                                    <span>Progress</span>
                                    <span>{project.progress || 0}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full mt-1 overflow-hidden">
                                    <div
                                        className="h-full bg-[#ff6b00] rounded-full transition-all duration-500"
                                        style={{ width: `${project.progress || 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Tech Stack */}
                            {project.techStack && project.techStack.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {project.techStack.slice(0, 3).map((tech, index) => (
                                        <span key={index} className="text-[8px] px-2 py-0.5 rounded-full bg-[#0a0a0a] text-[#666666] border border-[#1a1a1a]">
                                            {tech}
                                        </span>
                                    ))}
                                    {project.techStack.length > 3 && (
                                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#0a0a0a] text-[#666666] border border-[#1a1a1a]">
                                            +{project.techStack.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Category */}
                            {project.category && (
                                <div className="mt-2 text-[10px] text-[#666666] flex items-center gap-1">
                                    <Code size={10} />
                                    {project.category}
                                </div>
                            )}

                            <div className="mt-2 text-[8px] text-[#444444] flex items-center gap-1">
                                <Eye size={10} />
                                Click to view details
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========== CREATE PROJECT MODAL ========== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#111111] pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Folder size={20} className="text-[#ff6b00]" />
                                Create New Project
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-[#666666] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Project Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Project description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                        placeholder="e.g., Web Development"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Tech Stack</label>
                                <input
                                    type="text"
                                    value={formData.techStack}
                                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="React, Spring Boot, PostgreSQL (comma separated)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Initial Progress</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="0"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Create Project
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== EDIT PROJECT MODAL ========== */}
            {showEditModal && editingProject && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#111111] pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit2 size={20} className="text-[#ff6b00]" />
                                Edit Project
                            </h2>
                            <button onClick={() => { setShowEditModal(false); setEditingProject(null); resetForm(); }} className="text-[#666666] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditProject} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Project Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Project description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                        placeholder="e.g., Web Development"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Tech Stack</label>
                                <input
                                    type="text"
                                    value={formData.techStack}
                                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="React, Spring Boot, PostgreSQL (comma separated)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Progress</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Update Project
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingProject(null); resetForm(); }}
                                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors border border-[#2a2a2a]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== VIEW PROJECT MODAL ========== */}
            {showViewModal && viewingProject && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#111111] border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Folder size={24} className="text-[#ff6b00]" />
                                <h2 className="text-xl font-bold text-white">Project Details</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {canCreateProject && (
                                    <button
                                        onClick={() => { setShowViewModal(false); openEditModal(viewingProject); }}
                                        className="text-[#ff6b00] hover:text-[#ff8c38] p-2 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                                <button onClick={() => { setShowViewModal(false); setViewingProject(null); }} className="text-[#666666] hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{viewingProject.name}</h3>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className={`text-xs px-3 py-1 rounded-full border inline-flex items-center gap-1 ${getStatusColor(viewingProject.status)}`}>
                                        {getStatusIcon(viewingProject.status)}
                                        {viewingProject.status}
                                    </span>
                                    {viewingProject.category && (
                                        <span className="text-xs px-3 py-1 rounded-full bg-[#0a0a0a] text-[#666666] border border-[#1a1a1a]">
                                            {viewingProject.category}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                                <label className="text-xs text-[#666666] uppercase tracking-wider">Description</label>
                                <p className="text-white text-sm mt-1">{viewingProject.description || 'No description'}</p>
                            </div>

                            {/* Progress */}
                            <div>
                                <label className="text-xs text-[#666666] uppercase tracking-wider">Progress</label>
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-sm text-[#666666]">
                                        <span>{viewingProject.progress || 0}% Complete</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#0a0a0a] rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-[#ff6b00] rounded-full transition-all duration-500"
                                            style={{ width: `${viewingProject.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            {viewingProject.techStack && viewingProject.techStack.length > 0 && (
                                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                                    <label className="text-xs text-[#666666] uppercase tracking-wider">Tech Stack</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {viewingProject.techStack.map((tech, index) => (
                                            <span key={index} className="text-xs px-3 py-1 rounded-full bg-[#1a1a1a] text-white border border-[#2a2a2a]">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a1a1a]">
                                <div>
                                    <label className="text-[10px] text-[#666666] uppercase tracking-wider">Created</label>
                                    <p className="text-white text-sm">{new Date(viewingProject.createdAt).toLocaleDateString()}</p>
                                </div>
                                {viewingProject.updatedAt && (
                                    <div>
                                        <label className="text-[10px] text-[#666666] uppercase tracking-wider">Last Updated</label>
                                        <p className="text-white text-sm">{new Date(viewingProject.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[#1a1a1a]">
                                {canCreateProject && (
                                    <button
                                        onClick={() => { setShowViewModal(false); openEditModal(viewingProject); }}
                                        className="flex-1 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={18} />
                                        Edit Project
                                    </button>
                                )}
                                <button
                                    onClick={() => { setShowViewModal(false); }}
                                    className="flex-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;