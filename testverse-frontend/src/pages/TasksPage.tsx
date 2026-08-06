import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Search, Filter, X, Edit2,
    GripVertical, Calendar, User, Clock,
    AlertCircle, Eye, ClipboardList, Trash2, Save
} from 'lucide-react';
import { fetchTasks, createTask, deleteTask, updateTask } from '../services/api';

interface Task {
    id: number;
    title: string;
    description?: string;  // ← Made optional (add ?)
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'To Do' | 'Planning' | 'In Progress' | 'Review' | 'Done';
    dueDate: string;
    assignedStudentId?: number;
    assignedStudentName?: string;
    mentorId?: number;
    mentorName?: string;
    projectId?: number;
    projectName?: string;
    moduleName?: string;
    instructions?: string;
    submissionNotes?: string;
    createdAt: string;
    updatedAt?: string;
}

interface DragState {
    taskId: number | null;
    sourceStatus: string | null;
}

const TasksPage: React.FC = () => {
    const { isAdmin, isDeveloper } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [dateError, setDateError] = useState<string | null>(null);
    const [editDateError, setEditDateError] = useState<string | null>(null);

    const [dragState, setDragState] = useState<DragState>({
        taskId: null,
        sourceStatus: null,
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium' as Task['priority'],
        status: 'To Do' as Task['status'],
        dueDate: '',
        moduleName: '',
        assignedStudentId: '',
        projectId: '',
        instructions: '',
    });

    const getTodayDate = (): string => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const loadTasks = async (): Promise<void> => {
        try {
            setLoading(true);
            const data = await fetchTasks();
            const tasksData = Array.isArray(data) ? data : [];
            const validTasks: Task[] = tasksData.map((task: any) => ({
                ...task,
                createdAt: task.createdAt || new Date().toISOString(),
                status: task.status || 'To Do',
                priority: task.priority || 'Medium',
            }));
            setTasks(validTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks().catch((error) => {
            console.error('Error loading tasks:', error);
            setTasks([]);
        });
    }, []);

    useEffect(() => {
        applyFilters();
    }, [tasks, searchTerm, filterPriority, filterStatus]);

    const applyFilters = (): void => {
        let result = tasks;

        if (searchTerm) {
            result = result.filter(task =>
                task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'All') {
            result = result.filter(task => task.status === filterStatus);
        }

        if (filterPriority !== 'All') {
            result = result.filter(task => task.priority === filterPriority);
        }

        setFilteredTasks(result);
    };

    const validateDate = (date: string): boolean => {
        if (!date) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    };

    // ============ DRAG & DROP ============

    const handleDragStart = (event: React.DragEvent, taskId: number, status: string): void => {
        setDragState({ taskId, sourceStatus: status });
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', `${taskId}`);
        const target = event.target as HTMLElement;
        if (target.classList) {
            target.classList.add('opacity-50');
        }
    };

    const handleDragEnd = (event: React.DragEvent): void => {
        const target = event.target as HTMLElement;
        if (target.classList) {
            target.classList.remove('opacity-50');
        }
        setDragState({ taskId: null, sourceStatus: null });
    };

    const handleDragOver = (event: React.DragEvent): void => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (event: React.DragEvent, targetStatus: string): Promise<void> => {
        event.preventDefault();

        const taskIdStr = event.dataTransfer.getData('text/plain');
        if (!taskIdStr) return;

        const taskId = parseInt(taskIdStr, 10);
        const { sourceStatus } = dragState;

        if (sourceStatus === targetStatus) {
            setDragState({ taskId: null, sourceStatus: null });
            return;
        }

        const draggedTask = tasks.find(t => t.id === taskId);
        if (!draggedTask) {
            setDragState({ taskId: null, sourceStatus: null });
            return;
        }

        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, status: targetStatus as Task['status'] } : t
        );
        setTasks(updatedTasks);
        setDragState({ taskId: null, sourceStatus: null });

        try {
            await updateTask(taskId, { ...draggedTask, status: targetStatus });
            await loadTasks();
            console.log('✅ Task status updated successfully');
        } catch (error) {
            console.error('Error updating task status:', error);
            setTasks(tasks);
            alert('Network error. Please try again.');
        }
    };

    // ============ CREATE TASK ============

    const handleCreateTask = async (formEvent: React.FormEvent): Promise<void> => {
        formEvent.preventDefault();

        if (formData.dueDate && !validateDate(formData.dueDate)) {
            setDateError('❌ Due date cannot be in the past. Please select today or a future date.');
            return;
        }
        setDateError(null);

        try {
            const taskData = {
                title: formData.title,
                description: formData.description || '',
                priority: formData.priority,
                status: 'To Do',
                dueDate: formData.dueDate || getTodayDate(),
                moduleName: formData.moduleName || '',
                assignedStudentId: formData.assignedStudentId ? parseInt(formData.assignedStudentId) : undefined,
                projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
                instructions: formData.instructions || '',
            };

            const newTask = await createTask(taskData);
            setTasks([newTask, ...tasks]);
            setShowModal(false);
            resetForm();
            alert('✅ Task created successfully!');
        } catch (error: any) {
            console.error('Error creating task:', error);
            alert('❌ Failed to create task: ' + (error.message || 'Please try again.'));
        }
    };

    // ============ EDIT TASK ============

    const openEditModal = (task: Task): void => {
        setEditingTask(task);
        setFormData({
            title: task.title || '',
            description: task.description || '',
            priority: task.priority || 'Medium',
            status: task.status || 'To Do',
            dueDate: task.dueDate || '',
            moduleName: task.moduleName || '',
            assignedStudentId: task.assignedStudentId ? String(task.assignedStudentId) : '',
            projectId: task.projectId ? String(task.projectId) : '',
            instructions: task.instructions || '',
        });
        setEditDateError(null);
        setShowEditModal(true);
    };

    const handleEditTask = async (formEvent: React.FormEvent): Promise<void> => {
        formEvent.preventDefault();

        if (formData.dueDate && !validateDate(formData.dueDate)) {
            setEditDateError('❌ Due date cannot be in the past. Please select today or a future date.');
            return;
        }
        setEditDateError(null);

        if (!editingTask) return;

        try {
            const updatedData = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                status: formData.status,
                dueDate: formData.dueDate || getTodayDate(),
                moduleName: formData.moduleName || '',
                instructions: formData.instructions || '',
            };

            await updateTask(editingTask.id, updatedData);
            await loadTasks();
            setShowEditModal(false);
            setEditingTask(null);
            resetForm();
            alert('✅ Task updated successfully!');
        } catch (error) {
            console.error('Error updating task:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    // ============ VIEW TASK ============

    const openViewModal = (task: Task): void => {
        setViewingTask(task);
        setShowViewModal(true);
    };

    // ============ DELETE TASK ============

    const handleDeleteTask = async (id: number): Promise<void> => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await deleteTask(id);
            setTasks(prevTasks => prevTasks.filter(t => t.id !== id));
            alert('✅ Task deleted successfully!');
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('❌ Failed to delete task');
        }
    };

    const resetForm = (): void => {
        setFormData({
            title: '',
            description: '',
            priority: 'Medium',
            status: 'To Do',
            dueDate: '',
            moduleName: '',
            assignedStudentId: '',
            projectId: '',
            instructions: '',
        });
        setDateError(null);
        setEditDateError(null);
    };

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            'To Do': 'bg-[#ff6b00]/20 text-[#ff6b00] border-[#ff6b00]/30',
            'Planning': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Review': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'Done': 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    const getPriorityColor = (priority: string): string => {
        const colors: Record<string, string> = {
            'Critical': 'text-red-500 bg-red-500/10',
            'High': 'text-orange-500 bg-orange-500/10',
            'Medium': 'text-yellow-500 bg-yellow-500/10',
            'Low': 'text-blue-500 bg-blue-500/10',
        };
        return colors[priority] || 'text-gray-500 bg-gray-500/10';
    };

    const getPriorityIcon = (priority: string): JSX.Element => {
        switch (priority) {
            case 'Critical': return <AlertCircle size={14} className="text-red-500" />;
            case 'High': return <AlertCircle size={14} className="text-orange-500" />;
            case 'Medium': return <Clock size={14} className="text-yellow-500" />;
            default: return <Clock size={14} className="text-blue-500" />;
        }
    };

    const statuses: Task['status'][] = ['To Do', 'Planning', 'In Progress', 'Review', 'Done'];
    const canCreateTask = isAdmin || isDeveloper;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[#666666]">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tasks</h1>
                    <p className="text-[#666666] text-sm">Drag and drop tasks to change status • {tasks.length} total tasks</p>
                </div>
                {canCreateTask && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        New Task
                    </button>
                )}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-[#666666]" />

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff6b00]"
                    >
                        <option value="All">All Status</option>
                        <option value="To Do">To Do</option>
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Done">Done</option>
                    </select>

                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff6b00]"
                    >
                        <option value="All">All Priority</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{tasks.length}</p>
                    <p className="text-xs text-[#666666]">Total</p>
                </div>
                {statuses.map((status) => (
                    <div key={status} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
                        <p className={`text-2xl font-bold ${status === 'Done' ? 'text-green-400' : 'text-white'}`}>
                            {tasks.filter(t => t.status === status).length}
                        </p>
                        <p className="text-xs text-[#666666]">{status}</p>
                    </div>
                ))}
            </div>

            {/* Kanban Board */}
            {tasks.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-[#1a1a1a] rounded-xl">
                    <ClipboardList size={48} className="mx-auto mb-3 text-[#444444]" />
                    <p className="text-lg text-white">No tasks yet</p>
                    <p className="text-sm text-[#666666]">Create your first task to get started!</p>
                    {canCreateTask && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-4 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Task
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {statuses.map((status) => {
                        const statusTasks = filteredTasks.filter(t => t.status === status);
                        return (
                            <div
                                key={status}
                                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 min-h-[250px] transition-all"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, status)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(status)}`}>
                                        {status} ({statusTasks.length})
                                    </span>
                                    <span className="text-[10px] text-[#444444]">Drop here</span>
                                </div>
                                <div className="space-y-2">
                                    {statusTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id, task.status)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => openViewModal(task)}
                                            className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 hover:border-[#ff6b00] transition-all group cursor-pointer active:cursor-grabbing relative"
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="mt-0.5 text-[#444444] cursor-grab">
                                                    <GripVertical size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm text-white font-medium truncate">{task.title}</h4>
                                                    {task.description && (
                                                        <p className="text-xs text-[#666666] mt-1 line-clamp-2">{task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                                            {getPriorityIcon(task.priority)}
                                                            {task.priority}
                                                        </span>
                                                        {task.moduleName && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#666666]">
                                                                {task.moduleName}
                                                            </span>
                                                        )}
                                                        {task.dueDate && (
                                                            <span className="text-[10px] text-[#666666] flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                {new Date(task.dueDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.assignedStudentName && (
                                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-[#666666]">
                                                            <User size={10} />
                                                            {task.assignedStudentName}
                                                        </div>
                                                    )}
                                                    <div className="mt-1 text-[8px] text-[#444444] flex items-center gap-1">
                                                        <Eye size={10} />
                                                        Click to view details
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#1a1a1a]">
                                                {canCreateTask && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                            className="text-[10px] px-2 py-0.5 rounded text-[#666666] hover:text-[#ff6b00] hover:bg-[#1a1a1a] transition-colors flex items-center gap-1"
                                                        >
                                                            <Edit2 size={12} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id).catch(console.error); }}                                                            className="text-[10px] px-2 py-0.5 rounded text-[#666666] hover:text-red-500 hover:bg-[#1a1a1a] transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 size={12} />
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {statusTasks.length === 0 && (
                                        <div className="text-center py-6 text-[#444444] text-sm">
                                            No tasks
                                            <br />
                                            <span className="text-[10px]">Drop tasks here</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#111111] pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ClipboardList size={20} className="text-[#ff6b00]" />
                                Create New Task
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-[#666666] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {dateError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
                                {dateError}
                            </div>
                        )}

                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Task Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Enter task title"
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
                                    placeholder="Task description"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Module</label>
                                    <input
                                        type="text"
                                        value={formData.moduleName}
                                        onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                        placeholder="Module name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        if (selectedDate) {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const selected = new Date(selectedDate);
                                            selected.setHours(0, 0, 0, 0);
                                            if (selected < today) {
                                                setDateError('⚠️ Cannot select past date. Please choose today or a future date.');
                                            } else {
                                                setDateError(null);
                                            }
                                        }
                                        setFormData({ ...formData, dueDate: selectedDate });
                                    }}
                                    min={getTodayDate()}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00] [color-scheme:dark]"
                                />
                                <p className="text-[10px] text-[#666666] mt-1">
                                    ⚡ Min date: {new Date().toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Instructions</label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    rows={2}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Additional instructions"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Create Task
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {showEditModal && editingTask && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#111111] pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit2 size={20} className="text-[#ff6b00]" />
                                Edit Task
                            </h2>
                            <button onClick={() => { setShowEditModal(false); setEditingTask(null); resetForm(); }} className="text-[#666666] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {editDateError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
                                {editDateError}
                            </div>
                        )}

                        <form onSubmit={handleEditTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Task Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Enter task title"
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
                                    placeholder="Task description"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Module</label>
                                    <input
                                        type="text"
                                        value={formData.moduleName}
                                        onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                        placeholder="Module name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        if (selectedDate) {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const selected = new Date(selectedDate);
                                            selected.setHours(0, 0, 0, 0);
                                            if (selected < today) {
                                                setEditDateError('⚠️ Cannot select past date. Please choose today or a future date.');
                                            } else {
                                                setEditDateError(null);
                                            }
                                        }
                                        setFormData({ ...formData, dueDate: selectedDate });
                                    }}
                                    min={getTodayDate()}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00] [color-scheme:dark]"
                                />
                                <p className="text-[10px] text-[#666666] mt-1">
                                    ⚡ Min date: {new Date().toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Instructions</label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    rows={2}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Additional instructions"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Update Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingTask(null); resetForm(); }}
                                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors border border-[#2a2a2a]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Task Modal */}
            {showViewModal && viewingTask && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#111111] border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ClipboardList size={24} className="text-[#ff6b00]" />
                                <h2 className="text-xl font-bold text-white">Task Details</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {canCreateTask && (
                                    <button
                                        onClick={() => { setShowViewModal(false); openEditModal(viewingTask); }}
                                        className="text-[#ff6b00] hover:text-[#ff8c38] p-2 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                                <button onClick={() => { setShowViewModal(false); setViewingTask(null); }} className="text-[#666666] hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{viewingTask.title}</h3>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(viewingTask.status)}`}>
                                        {viewingTask.status}
                                    </span>
                                    <span className={`text-xs px-3 py-1 rounded-full ${getPriorityColor(viewingTask.priority)}`}>
                                        {viewingTask.priority}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                                <label className="text-xs text-[#666666] uppercase tracking-wider">Description</label>
                                <p className="text-white text-sm mt-1">{viewingTask.description || 'No description'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                                    <label className="text-xs text-[#666666] uppercase tracking-wider">Module</label>
                                    <p className="text-white text-sm mt-1">{viewingTask.moduleName || 'Unassigned'}</p>
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                                    <label className="text-xs text-[#666666] uppercase tracking-wider">Due Date</label>
                                    <p className="text-white text-sm mt-1">
                                        {viewingTask.dueDate ? new Date(viewingTask.dueDate).toLocaleDateString() : 'Not set'}
                                        {viewingTask.dueDate && new Date(viewingTask.dueDate) < new Date() && (
                                            <span className="ml-2 text-xs text-red-400">⚠️ Past due</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {viewingTask.instructions && (
                                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                                    <label className="text-xs text-[#666666] uppercase tracking-wider">Instructions</label>
                                    <p className="text-white text-sm mt-1 whitespace-pre-wrap">{viewingTask.instructions}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a1a1a]">
                                <div>
                                    <label className="text-[10px] text-[#666666] uppercase tracking-wider">Created</label>
                                    <p className="text-white text-sm">{new Date(viewingTask.createdAt).toLocaleDateString()}</p>
                                </div>
                                {viewingTask.mentorName && (
                                    <div>
                                        <label className="text-[10px] text-[#666666] uppercase tracking-wider">Mentor</label>
                                        <p className="text-white text-sm">{viewingTask.mentorName}</p>
                                    </div>
                                )}
                                {viewingTask.assignedStudentName && (
                                    <div>
                                        <label className="text-[10px] text-[#666666] uppercase tracking-wider">Assigned To</label>
                                        <p className="text-white text-sm">{viewingTask.assignedStudentName}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[#1a1a1a]">
                                {canCreateTask && (
                                    <button
                                        onClick={() => { setShowViewModal(false); openEditModal(viewingTask); }}
                                        className="flex-1 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={18} />
                                        Edit Task
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

export default TasksPage;