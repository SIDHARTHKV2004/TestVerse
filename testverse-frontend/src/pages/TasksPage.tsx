import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Search, Filter, X, Edit2,
    GripVertical, Calendar, User, Clock,
    AlertCircle, Eye, ClipboardList, Trash2, Save, Lock
} from 'lucide-react';
import { fetchTasks, createTask, deleteTask, updateTask } from '../services/api';
import { useAttention } from '../context/AttentionContext';

interface Task {
    id: string;
    title: string;
    description?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'To Do' | 'Planning' | 'In Progress' | 'Review' | 'Done';
    dueDate: string;
    assignedStudentId?: string;
    assignedStudentName?: string;
    mentorId?: string;
    mentorName?: string;
    createdById?: string | number;
    createdByName?: string;
    projectId?: string;
    projectName?: string;
    moduleName?: string;
    instructions?: string;
    submissionNotes?: string;
    createdAt: string;
    updatedAt?: string;
    isNewAssignment?: boolean;
}

interface AssignableUser {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    role: 'TESTER' | 'DEVELOPER';
}

interface DragState {
    taskId: string | null;
    sourceStatus: string | null;
}

const TasksPage: React.FC = () => {
    const { user, isAdmin, isMentor, isDeveloper } = useAuth();
    const { markTaskAttentionAsRead, refreshAttention } = useAttention();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

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

    // =========================================================
    // LOAD TASKS
    // =========================================================

    const normalizeTaskStatus = (rawStatus?: string): Task['status'] => {
        if (!rawStatus) return 'To Do';
        const s = rawStatus.trim();
        if (s === 'To Do' || s === 'Planning' || s === 'In Progress' || s === 'Review' || s === 'Done') {
            return s as Task['status'];
        }
        const upper = s.toUpperCase().replace(/[\s-]+/g, '_');
        if (upper === 'TODO' || upper === 'TO_DO' || upper === 'NOT_STARTED') return 'To Do';
        if (upper === 'PLANNING') return 'Planning';
        if (upper === 'IN_PROGRESS' || upper === 'PROGRESS') return 'In Progress';
        if (upper === 'REVIEW' || upper === 'IN_REVIEW' || upper === 'WAITING_FOR_REVIEW') return 'Review';
        if (upper === 'DONE' || upper === 'COMPLETED') return 'Done';
        return 'To Do';
    };

    const loadTasks = async (): Promise<void> => {
        try {
            setLoading(true);

            const data = await fetchTasks();

            const tasksData = Array.isArray(data) ? data : [];

            const validTasks: Task[] = tasksData.map((task: any) => ({
                ...task,
                id: String(task.id),

                assignedStudentId:
                    task.assignedStudentId != null
                        ? String(task.assignedStudentId)
                        : undefined,

                mentorId:
                    task.mentorId != null
                        ? String(task.mentorId)
                        : undefined,

                projectId:
                    task.projectId != null
                        ? String(task.projectId)
                        : undefined,

                createdAt:
                    task.createdAt || new Date().toISOString(),

                status:
                    normalizeTaskStatus(task.status),

                priority:
                    task.priority || 'Medium',

                isNewAssignment:
                    task.isNewAssignment ?? (task as any).newAssignment ?? (task.assignedStudentId ? true : false),
            }));

            setTasks(validTasks);

        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // LOAD ASSIGNABLE USERS
    //
    // Backend endpoint:
    // GET /api/tasks/assignable-users
    //
    // Only ACTIVE TESTER and DEVELOPER users are returned.
    // =========================================================

    const loadAssignableUsers = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                console.warn('No authentication token found.');
                return;
            }

            const apiUrl =
                import.meta.env.VITE_API_URL || 'http://localhost:8080';

            const response = await fetch(
                `${apiUrl}/api/tasks/assignable-users`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to load assignable users: ${response.status}`
                );
            }

            const data = await response.json();

            const users: AssignableUser[] = Array.isArray(data)
                ? data.map((user: any) => ({
                    id: String(user.id),
                    name: user.name || '',
                    username: user.username || '',
                    email: user.email || '',
                    role: user.role,
                }))
                : [];

            setAssignableUsers(users);

            // Auto-resolve current logged-in user ID if not yet present in AuthContext
            if (user) {
                const me = users.find(u =>
                    (user.email && u.email?.toLowerCase() === user.email.toLowerCase()) ||
                    (user.username && u.username?.toLowerCase() === user.username.toLowerCase()) ||
                    (user.name && u.name?.toLowerCase() === user.name.toLowerCase())
                );
                if (me) {
                    setResolvedUserId(String(me.id));
                    if (!user.userId && !user.id) {
                        user.userId = me.id;
                        user.id = me.id;
                    }
                    try {
                        const stored = JSON.parse(localStorage.getItem('user') || '{}');
                        if (!stored.userId && !stored.id) {
                            localStorage.setItem('user', JSON.stringify({ ...stored, userId: me.id, id: me.id }));
                        }
                    } catch (_) {}
                }
            }

            console.log('✅ Assignable users loaded:', users);
            return users;

        } catch (error) {
            console.error('❌ Error loading assignable users:', error);
            setAssignableUsers([]);
            return [];
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        // Hydrate current user ID from localStorage if available
        try {
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            const storedId = stored.userId || stored.id || user?.userId || user?.id;
            if (storedId) {
                setResolvedUserId(String(storedId));
            }
        } catch (_) {}

        void markTaskAttentionAsRead();

        const init = async () => {
            await loadAssignableUsers();
            await loadTasks();
        };

        init().catch((error) => {
            console.error('Error initializing tasks page:', error);
            loadTasks().catch(() => setTasks([]));
        });
    }, []);

    // =========================================================
    // FILTERS
    // =========================================================

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

    // =========================================================
    // DATE VALIDATION
    // =========================================================

    const validateDate = (date: string): boolean => {
        if (!date) return true;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        return selectedDate >= today;
    };

    // =========================================================
    // ASSIGNED USER & STATUS PERMISSIONS
    // =========================================================

    const isCurrentUserAssigned = (task: Task | null | undefined): boolean => {
        if (!task || !user) return false;
        const currentUserId = user.userId || user.id || resolvedUserId;
        if (currentUserId && task.assignedStudentId && String(currentUserId) === String(task.assignedStudentId)) {
            return true;
        }
        if (user.name && task.assignedStudentName && user.name.trim().toLowerCase() === task.assignedStudentName.trim().toLowerCase()) {
            return true;
        }
        return false;
    };

    const isNewAssignmentForCurrentUser = (task: Task | null | undefined): boolean => {
        if (!task || !user) return false;
        // 1. Highlight is ONLY for the assigned user
        if (!isCurrentUserAssigned(task)) {
            return false;
        }
        // 2. Must still be a new assignment (not yet transitioned status)
        const isNew = task.isNewAssignment ?? (task as any).newAssignment;
        return isNew === true || isNew === 'true';
    };

    const canChangeTaskStatus = (task: Task | null | undefined): boolean => {
        if (!task || !user) return false;
        const currentUserId = user.userId || user.id || resolvedUserId;

        // 1. Task creator
        if (currentUserId && task.createdById && String(currentUserId) === String(task.createdById)) {
            return true;
        }
        if (user.name && task.createdByName && user.name.trim().toLowerCase() === task.createdByName.trim().toLowerCase()) {
            return true;
        }

        // 2. Assigned student / user (authorized worker)
        if (isCurrentUserAssigned(task)) {
            return true;
        }

        // 3. Appropriate mentor
        if (currentUserId && task.mentorId && String(currentUserId) === String(task.mentorId)) {
            return true;
        }
        if (user.name && task.mentorName && user.name.trim().toLowerCase() === task.mentorName.trim().toLowerCase()) {
            return true;
        }

        // If user is a mentor, allow attempt and let backend enforce against mentees
        if (user.role === 'MENTOR') {
            return true;
        }

        return false;
    };

    const handleDragStart = (
        event: React.DragEvent,
        taskId: string,
        status: string
    ): void => {

        const task = tasks.find(t => String(t.id) === String(taskId));
        if (task && !canChangeTaskStatus(task)) {
            event.preventDefault();
            alert('🔒 You do not have permission to change the status of this task. Only the task creator, assigned user, or their mentor can change task status.');
            return;
        }

        setDragState({
            taskId,
            sourceStatus: status,
        });

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', `${taskId}`);

        const target = event.target as HTMLElement;

        if (target.classList) {
            target.classList.add('opacity-50');
        }
    };

    const handleDragEnd = (
        event: React.DragEvent
    ): void => {

        const target = event.target as HTMLElement;

        if (target.classList) {
            target.classList.remove('opacity-50');
        }

        setDragState({
            taskId: null,
            sourceStatus: null,
        });
    };

    const handleDragOver = (
        event: React.DragEvent
    ): void => {

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (
        event: React.DragEvent,
        targetStatus: string
    ): Promise<void> => {

        event.preventDefault();

        const taskIdStr =
            event.dataTransfer.getData('text/plain');

        if (!taskIdStr) return;

        const taskId = taskIdStr;

        const { sourceStatus } = dragState;

        if (sourceStatus === targetStatus) {

            setDragState({
                taskId: null,
                sourceStatus: null,
            });

            return;
        }

        const draggedTask =
            tasks.find(t => String(t.id) === String(taskId));

        if (!draggedTask) {

            setDragState({
                taskId: null,
                sourceStatus: null,
            });

            return;
        }

        if (!canChangeTaskStatus(draggedTask)) {
            setDragState({
                taskId: null,
                sourceStatus: null,
            });
            alert('🔒 You do not have permission to change the status of this task. Only the task creator, assigned user, or their mentor can change task status.');
            return;
        }

        const isStatusChange = targetStatus !== draggedTask.status;

        const updatedTasks = tasks.map(t =>
            String(t.id) === String(taskId)
                ? {
                    ...t,
                    status: targetStatus as Task['status'],
                    isNewAssignment: isStatusChange ? false : t.isNewAssignment
                }
                : t
        );

        setTasks(updatedTasks);

        setDragState({
            taskId: null,
            sourceStatus: null,
        });

        try {

            await updateTask(
                taskId,
                {
                    ...draggedTask,
                    status: targetStatus,
                    isNewAssignment: isStatusChange ? false : draggedTask.isNewAssignment
                }
            );

            await loadTasks();

            console.log(
                '✅ Task status updated successfully'
            );

        } catch (error: any) {

            console.error(
                'Error updating task status:',
                error
            );

            setTasks(tasks);

            alert(
                `❌ ${error.message || 'Failed to update task status'}`
            );
        }
    };

    // =========================================================
    // CREATE TASK
    // =========================================================

    const handleCreateTask = async (
        formEvent: React.FormEvent
    ): Promise<void> => {

        formEvent.preventDefault();

        if (!formData.title.trim()) {

            alert(
                '❌ Task title is required!'
            );

            return;
        }

        if (
            formData.dueDate &&
            !validateDate(formData.dueDate)
        ) {

            setDateError(
                '❌ Due date cannot be in the past. Please select today or a future date.'
            );

            return;
        }

        setDateError(null);

        try {

            const taskData = {

                title: formData.title.trim(),

                description:
                    formData.description?.trim() || '',

                priority:
                formData.priority,

                status:
                    'To Do',

                dueDate:
                    formData.dueDate || getTodayDate(),

                moduleName:
                    formData.moduleName?.trim() || '',

                // IMPORTANT:
                // Task IDs are String/UUID values.
                assignedStudentId:
                    formData.assignedStudentId || null,

                // Project ID is also String/UUID.
                projectId:
                    formData.projectId || null,

                instructions:
                    formData.instructions?.trim() || '',
            };

            console.log(
                '📤 Sending task data:',
                taskData
            );

            const newTask =
                await createTask(taskData);

            console.log(
                '✅ Task created successfully:',
                newTask
            );

            const normalizedTask: Task = {

                ...newTask,

                id:
                    String(newTask.id),

                assignedStudentId:
                    newTask.assignedStudentId != null
                        ? String(newTask.assignedStudentId)
                        : undefined,

                mentorId:
                    newTask.mentorId != null
                        ? String(newTask.mentorId)
                        : undefined,

                projectId:
                    newTask.projectId != null
                        ? String(newTask.projectId)
                        : undefined,

                status:
                    normalizeTaskStatus(newTask.status),

                isNewAssignment:
                    newTask.isNewAssignment ?? (newTask as any).newAssignment ?? (newTask.assignedStudentId ? true : false),
            };

            setTasks([
                normalizedTask,
                ...tasks
            ]);

            setShowModal(false);

            resetForm();

            alert(
                '✅ Task created successfully!'
            );

        } catch (error: any) {

            console.error(
                '❌ Error creating task:',
                error
            );

            const errorMessage =
                error.message ||
                'Please check: 1) Backend is running on port 8080, 2) You are logged in, 3) You have admin/mentor role';

            alert(
                `❌ Failed to create task: ${errorMessage}`
            );
        }
    };

    // =========================================================
    // EDIT TASK
    // =========================================================

    const openEditModal = (
        task: Task
    ): void => {

        setEditingTask(task);

        setFormData({

            title:
                task.title || '',

            description:
                task.description || '',

            priority:
                task.priority || 'Medium',

            status:
                task.status || 'To Do',

            dueDate:
                task.dueDate || '',

            moduleName:
                task.moduleName || '',

            assignedStudentId:
                task.assignedStudentId
                    ? String(task.assignedStudentId)
                    : '',

            projectId:
                task.projectId
                    ? String(task.projectId)
                    : '',

            instructions:
                task.instructions || '',
        });

        setEditDateError(null);

        setShowEditModal(true);
    };

    const handleEditTask = async (
        formEvent: React.FormEvent
    ): Promise<void> => {

        formEvent.preventDefault();

        if (
            formData.dueDate &&
            !validateDate(formData.dueDate)
        ) {

            setEditDateError(
                '❌ Due date cannot be in the past. Please select today or a future date.'
            );

            return;
        }

        setEditDateError(null);

        if (!editingTask) return;

        try {

            const updatedData = {

                title:
                formData.title,

                description:
                formData.description,

                priority:
                formData.priority,

                status:
                formData.status,

                dueDate:
                    formData.dueDate || getTodayDate(),

                moduleName:
                    formData.moduleName || '',

                instructions:
                    formData.instructions || '',

                // IMPORTANT:
                // Keep assignment when editing.
                assignedStudentId:
                    formData.assignedStudentId || null,

                projectId:
                    formData.projectId || null,
            };

            await updateTask(
                editingTask.id,
                updatedData
            );

            await loadTasks();

            setShowEditModal(false);

            setEditingTask(null);

            resetForm();

            alert(
                '✅ Task updated successfully!'
            );

        } catch (error) {

            console.error(
                'Error updating task:',
                error
            );

            alert(
                '❌ Network error. Please try again.'
            );
        }
    };

    // =========================================================
    // VIEW TASK
    // =========================================================

    const openViewModal = async (
        task: Task
    ): Promise<void> => {

        try {

            const token = localStorage.getItem('token');

            if (!token) {
                alert('❌ Please login again.');
                return;
            }

            const apiUrl =
                import.meta.env.VITE_API_URL || 'http://localhost:8080';

            const response = await fetch(
                `${apiUrl}/api/tasks/${task.id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            // =====================================================
            // USER DOES NOT HAVE PERMISSION
            // =====================================================

            if (response.status === 403) {

                alert(
                    '🔒 You are not allowed to view the full details of this task.'
                );

                return;
            }

            // =====================================================
            // OTHER SERVER ERROR
            // =====================================================

            if (!response.ok) {

                throw new Error(
                    `Failed to load task details: ${response.status}`
                );
            }

            // =====================================================
            // GET FULL TASK FROM BACKEND
            // =====================================================

            const fullTask = await response.json();

            const normalizedTask: Task = {

                ...fullTask,

                id: String(fullTask.id),

                assignedStudentId:
                    fullTask.assignedStudentId != null
                        ? String(fullTask.assignedStudentId)
                        : undefined,

                mentorId:
                    fullTask.mentorId != null
                        ? String(fullTask.mentorId)
                        : undefined,

                projectId:
                    fullTask.projectId != null
                        ? String(fullTask.projectId)
                        : undefined,

                createdAt:
                    fullTask.createdAt ||
                    new Date().toISOString(),

                status:
                    normalizeTaskStatus(fullTask.status),

                priority:
                    fullTask.priority || 'Medium',

                isNewAssignment:
                    fullTask.isNewAssignment ?? (fullTask as any).newAssignment ?? false,
            };

            // =====================================================
            // ONLY AFTER BACKEND ALLOWS ACCESS
            // OPEN THE FULL DETAILS MODAL
            // =====================================================

            setViewingTask(normalizedTask);

            setShowViewModal(true);

        } catch (error) {

            console.error(
                '❌ Error loading task details:',
                error
            );

            alert(
                '❌ Unable to load task details. Please try again.'
            );
        }
    };

    // =========================================================
    // DELETE TASK
    // =========================================================

    const handleDeleteTask = async (
        id: string
    ): Promise<void> => {

        if (
            !confirm(
                'Are you sure you want to delete this task?'
            )
        ) {
            return;
        }

        try {

            await deleteTask(id as any);

            setTasks(
                prevTasks =>
                    prevTasks.filter(
                        t => t.id !== id
                    )
            );

            alert(
                '✅ Task deleted successfully!'
            );

        } catch (error) {

            console.error(
                'Error deleting task:',
                error
            );

            alert(
                '❌ Failed to delete task'
            );
        }
    };

    // =========================================================
    // RESET FORM
    // =========================================================

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

    // =========================================================
    // UI HELPERS
    // =========================================================

    const getStatusColor = (
        status: string
    ): string => {

        const colors: Record<string, string> = {

            'To Do':
                'bg-[#EFF6FF] text-[#0062E0] border-[#BFDBFE]',

            'Planning':
                'bg-slate-100 text-slate-700 border-slate-200',

            'In Progress':
                'bg-amber-50 text-amber-700 border-amber-200',

            'Review':
                'bg-purple-50 text-purple-700 border-purple-200',

            'Done':
                'bg-[#E6F9F4] text-[#008766] border-[#A7F3D0]',
        };

        return (
            colors[status] ||
            'bg-slate-100 text-slate-600 border-slate-200'
        );
    };

    const getPriorityColor = (
        priority: string
    ): string => {

        const colors: Record<string, string> = {

            'Critical':
                'text-red-700 bg-red-50 border border-red-200',

            'High':
                'text-orange-700 bg-orange-50 border border-orange-200',

            'Medium':
                'text-amber-700 bg-amber-50 border border-amber-200',

            'Low':
                'text-[#0062E0] bg-[#EFF6FF] border border-[#BFDBFE]',
        };

        return (
            colors[priority] ||
            'text-slate-600 bg-slate-50 border border-slate-200'
        );
    };

    const getPriorityIcon = (
        priority: string
    ): React.ReactElement => {

        switch (priority) {

            case 'Critical':
                return (
                    <AlertCircle
                        size={14}
                        className="text-red-500"
                    />
                );

            case 'High':
                return (
                    <AlertCircle
                        size={14}
                        className="text-orange-500"
                    />
                );

            case 'Medium':
                return (
                    <Clock
                        size={14}
                        className="text-yellow-500"
                    />
                );

            default:
                return (
                    <Clock
                        size={14}
                        className="text-blue-500"
                    />
                );
        }
    };

    const getAssignableUserLabel = (
        user: AssignableUser
    ): string => {

        const displayName =
            user.name ||
            user.username ||
            user.email ||
            'Unknown User';

        return `${displayName} (${user.role})`;
    };

    const statuses: Task['status'][] = [
        'To Do',
        'Planning',
        'In Progress',
        'Review',
        'Done'
    ];

    const canCreateTask =
        isAdmin || isMentor || user?.role === 'ADMIN' || user?.role === 'MENTOR';

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-500 font-medium">
                    Loading tasks...
                </div>
            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex items-center justify-between">

                <div>

                    <h1 className="text-2xl font-bold text-[#0F172A]">
                        Tasks
                    </h1>

                    <p className="text-slate-500 text-sm mt-0.5">
                        Drag and drop tasks to change status • {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}{filteredTasks.length !== tasks.length ? ` (filtered from ${tasks.length} total)` : ' total'}
                    </p>

                </div>

                {canCreateTask && (

                    <button
                        onClick={() => {
                            loadAssignableUsers();
                            setShowModal(true);
                        }}
                        className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
                    >

                        <Plus size={18} />

                        Create Task

                    </button>

                )}

            </div>

            {/* =================================================
                SEARCH & FILTERS
            ================================================= */}

            <div className="flex flex-wrap items-center gap-3">

                <div className="flex-1 min-w-[200px] relative">

                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-10 pr-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                    />

                </div>

                <div className="flex items-center gap-2">

                    <Filter
                        size={18}
                        className="text-slate-500"
                    />

                    <select
                        value={filterStatus}
                        onChange={(e) =>
                            setFilterStatus(e.target.value)
                        }
                        className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#0F172A] text-sm focus:outline-none focus:border-[#0062E0]"
                    >

                        <option value="All">
                            All Status
                        </option>

                        <option value="To Do">
                            To Do
                        </option>

                        <option value="Planning">
                            Planning
                        </option>

                        <option value="In Progress">
                            In Progress
                        </option>

                        <option value="Review">
                            Review
                        </option>

                        <option value="Done">
                            Done
                        </option>

                    </select>

                    <select
                        value={filterPriority}
                        onChange={(e) =>
                            setFilterPriority(e.target.value)
                        }
                        className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#0F172A] text-sm focus:outline-none focus:border-[#0062E0]"
                    >

                        <option value="All">
                            All Priority
                        </option>

                        <option value="Critical">
                            Critical
                        </option>

                        <option value="High">
                            High
                        </option>

                        <option value="Medium">
                            Medium
                        </option>

                        <option value="Low">
                            Low
                        </option>

                    </select>

                </div>

            </div>

            {/* =================================================
                STATS SUMMARY
            ================================================= */}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center shadow-sm">

                    <p className="text-2xl font-bold text-[#0F172A]">
                        {filteredTasks.length}
                    </p>

                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Total
                    </p>

                </div>

                {statuses.map((status) => (

                    <div
                        key={status}
                        className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center shadow-sm"
                    >

                        <p
                            className={`text-2xl font-bold ${
                                status === 'Done'
                                    ? 'text-[#008766]'
                                    : status === 'To Do'
                                    ? 'text-[#0062E0]'
                                    : 'text-[#0F172A]'
                            }`}
                        >

                            {
                                filteredTasks.filter(
                                    t => t.status === status
                                ).length
                            }

                        </p>

                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {status}
                        </p>

                    </div>

                ))}

            </div>

            {/* =================================================
                KANBAN BOARD
            ================================================= */}

            {tasks.length === 0 ? (

                <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">

                    <ClipboardList
                        size={48}
                        className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="text-lg font-semibold text-[#0F172A]">
                        No tasks yet
                    </p>

                    <p className="text-sm text-slate-500 mt-0.5">
                        Create your first task to get started!
                    </p>

                    {canCreateTask && (

                        <button
                            onClick={() => {
                                loadAssignableUsers();
                                setShowModal(true);
                            }}
                            className="mt-4 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 font-medium text-sm shadow-sm"
                        >

                            <Plus size={18} />

                            Create Task

                        </button>

                    )}

                </div>

            ) : (

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                    {statuses.map((status) => {

                        const statusTasks =
                            filteredTasks.filter(
                                t => t.status === status
                            );

                        return (

                            <div
                                key={status}
                                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 min-h-[250px] transition-all"
                                onDragOver={handleDragOver}
                                onDrop={(e) =>
                                    handleDrop(e, status)
                                }
                            >

                                <div className="flex items-center justify-between mb-3">

                                    <span
                                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColor(status)}`}
                                    >
                                        {status} ({statusTasks.length})
                                    </span>

                                    <span className="text-[10px] text-slate-400 font-medium">
                                        Drop here
                                    </span>

                                </div>

                                <div className="space-y-2">

                                    {statusTasks.map((task) => {
                                        const canChangeStatus = canChangeTaskStatus(task);
                                        const isNew = isNewAssignmentForCurrentUser(task);
                                        return (
                                        <div
                                            key={task.id}
                                            draggable={canChangeStatus}
                                            onDragStart={(e) => {
                                                if (canChangeStatus) {
                                                    handleDragStart(
                                                        e,
                                                        task.id,
                                                        task.status
                                                    );
                                                } else {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onDragEnd={handleDragEnd}
                                            onClick={() =>
                                                openViewModal(task)
                                            }
                                            className={`rounded-lg p-3 transition-all group cursor-pointer relative ${
                                                isNew
                                                    ? 'bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-400 shadow-[0_2px_14px_rgba(245,158,11,0.22)] ring-1 ring-amber-300 hover:border-amber-500'
                                                    : 'bg-white border border-[#E2E8F0] hover:border-[#0062E0] hover:shadow-md shadow-sm'
                                            } ${canChangeStatus ? 'active:cursor-grabbing' : 'cursor-default'}`}
                                        >

                                            {isNew && (
                                                <div className="mb-2.5 flex items-center justify-between gap-1.5 pb-2 border-b border-amber-200/80">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        NEW ASSIGNMENT
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200">
                                                        Assigned to you
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-2">

                                                <div className="mt-0.5" title={canChangeStatus ? 'Drag to change status' : 'Status change restricted to creator, assigned user, or mentor'}>

                                                    {canChangeStatus ? (
                                                        <span className="text-slate-400 hover:text-slate-600 cursor-grab block">
                                                            <GripVertical size={14} />
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 block">
                                                            <Lock size={13} />
                                                        </span>
                                                    )}

                                                </div>

                                                <div className="flex-1 min-w-0">

                                                    <h4 className="text-sm text-[#0F172A] font-semibold truncate group-hover:text-[#0062E0] transition-colors">
                                                        {task.title}
                                                    </h4>

                                                    {task.description && (

                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                            {task.description}
                                                        </p>

                                                    )}

                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">

                                                        <span
                                                            className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${getPriorityColor(task.priority)}`}
                                                        >

                                                            {getPriorityIcon(
                                                                task.priority
                                                            )}

                                                            {task.priority}

                                                        </span>

                                                        {task.moduleName && (

                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-slate-600 font-medium">
                                                                {task.moduleName}
                                                            </span>

                                                        )}

                                                        {task.dueDate && (

                                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">

                                                                <Calendar
                                                                    size={10}
                                                                />

                                                                {
                                                                    new Date(
                                                                        task.dueDate
                                                                    ).toLocaleDateString()
                                                                }

                                                            </span>

                                                        )}

                                                    </div>

                                                    {task.assignedStudentName && (

                                                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-600 font-medium">

                                                            <User
                                                                size={10}
                                                                className="text-[#0062E0]"
                                                            />

                                                            {task.assignedStudentName}

                                                        </div>

                                                    )}

                                                    <div className="mt-1 text-[9px] text-slate-400 flex items-center gap-1">

                                                        <Eye size={10} />

                                                        Click to view details

                                                    </div>

                                                </div>

                                            </div>

                                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#F1F5F9]">

                                                {canCreateTask && (

                                                    <>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditModal(task);
                                                            }}
                                                            className="text-[10px] px-2 py-0.5 rounded text-slate-500 hover:text-[#0062E0] hover:bg-[#EFF6FF] transition-colors flex items-center gap-1 font-medium"
                                                        >

                                                            <Edit2
                                                                size={12}
                                                            />

                                                            Edit

                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTask(
                                                                    task.id
                                                                ).catch(
                                                                    console.error
                                                                );
                                                            }}
                                                            className="text-[10px] px-2 py-0.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 font-medium"
                                                        >

                                                            <Trash2
                                                                size={12}
                                                            />

                                                            Delete

                                                        </button>

                                                    </>

                                                )}

                                            </div>

                                        </div>
                                    );
                                    })}

                                    {statusTasks.length === 0 && (

                                        <div className="text-center py-6 text-slate-400 text-sm">

                                            No tasks

                                            <br />

                                            <span className="text-[10px]">
                                                Drop tasks here
                                            </span>

                                        </div>

                                    )}

                                </div>

                            </div>

                        );

                    })}

                </div>

            )}

            {/* =================================================
                CREATE TASK MODAL
            ================================================= */}

            {showModal && (

                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">

                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">

                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b border-[#F1F5F9]">

                            <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">

                                <ClipboardList
                                    size={20}
                                    className="text-[#0062E0]"
                                />

                                Create New Task

                            </h2>

                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >

                                <X size={20} />

                            </button>

                        </div>

                        {dateError && (

                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                {dateError}
                            </div>

                        )}

                        <form
                            onSubmit={handleCreateTask}
                            className="space-y-4"
                        >

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Task Title *
                                </label>

                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value
                                        })
                                    }
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                                    placeholder="Enter task title"
                                    required
                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description
                                </label>

                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value
                                        })
                                    }
                                    rows={3}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                                    placeholder="Task description"
                                />

                            </div>

                            <div className="grid grid-cols-2 gap-3">

                                <div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Priority
                                    </label>

                                    <select
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                priority:
                                                    e.target.value as Task['priority']
                                            })
                                        }
                                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] focus:outline-none focus:border-[#0062E0] text-sm"
                                    >

                                        <option value="Low">
                                            Low
                                        </option>

                                        <option value="Medium">
                                            Medium
                                        </option>

                                        <option value="High">
                                            High
                                        </option>

                                        <option value="Critical">
                                            Critical
                                        </option>

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Module
                                    </label>

                                    <input
                                        type="text"
                                        value={formData.moduleName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                moduleName:
                                                e.target.value
                                            })
                                        }
                                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                                        placeholder="Module name"
                                    />

                                </div>

                            </div>

                            {/* =================================================
                                ASSIGN TO
                            ================================================= */}

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Assign To
                                </label>

                                <select
                                    value={
                                        formData.assignedStudentId
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            assignedStudentId:
                                            e.target.value
                                        })
                                    }
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] focus:outline-none focus:border-[#0062E0] text-sm"
                                >

                                    <option value="">
                                        Unassigned
                                    </option>

                                    {assignableUsers.map(
                                        (user) => (

                                            <option
                                                key={user.id}
                                                value={user.id}
                                            >
                                                {getAssignableUserLabel(
                                                    user
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                                <p className="text-[11px] text-slate-500 mt-1">
                                    Only active Testers and Developers can be assigned.
                                </p>

                                {assignableUsers.length === 0 && (

                                    <p className="text-[11px] text-amber-600 mt-1 font-medium">
                                        No active Tester or Developer users available.
                                    </p>

                                )}

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Due Date
                                </label>

                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => {

                                        const selectedDate =
                                            e.target.value;

                                        if (selectedDate) {

                                            const today =
                                                new Date();

                                            today.setHours(
                                                0,
                                                0,
                                                0,
                                                0
                                            );

                                            const selected =
                                                new Date(
                                                    selectedDate
                                                );

                                            selected.setHours(
                                                0,
                                                0,
                                                0,
                                                0
                                            );

                                            if (
                                                selected < today
                                            ) {

                                                setDateError(
                                                    '⚠️ Cannot select past date. Please choose today or a future date.'
                                                );

                                            } else {

                                                setDateError(null);

                                            }

                                        }

                                        setFormData({
                                            ...formData,
                                            dueDate:
                                            selectedDate
                                        });

                                    }}
                                    min={getTodayDate()}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] focus:outline-none focus:border-[#0062E0] text-sm [color-scheme:light]"
                                />

                                <p className="text-[11px] text-slate-500 mt-1">
                                    ⚡ Min date: {new Date().toLocaleDateString()}
                                </p>

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Instructions
                                </label>

                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            instructions:
                                            e.target.value
                                        })
                                    }
                                    rows={2}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                                    placeholder="Additional instructions"
                                />

                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
                            >
                                Create Task
                            </button>

                        </form>

                    </div>

                </div>

            )}

            {/* =================================================
                EDIT TASK MODAL
            ================================================= */}

            {showEditModal && editingTask && (

                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">

                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">

                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b border-[#F1F5F9]">

                            <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">

                                <Edit2
                                    size={20}
                                    className="text-[#0062E0]"
                                />

                                Edit Task

                            </h2>

                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTask(null);
                                    resetForm();
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >

                                <X size={20} />

                            </button>

                        </div>

                        {editDateError && (

                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                {editDateError}
                            </div>

                        )}

                        <form
                            onSubmit={handleEditTask}
                            className="space-y-4"
                        >

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Task Title *
                                </label>

                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value
                                        })
                                    }
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                                    placeholder="Enter task title"
                                    required
                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description
                                </label>

                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description:
                                            e.target.value
                                        })
                                    }
                                    rows={3}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                                    placeholder="Task description"
                                />

                            </div>

                            <div className="grid grid-cols-2 gap-3">

                                <div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Priority
                                    </label>

                                    <select
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                priority:
                                                    e.target.value as Task['priority']
                                            })
                                        }
                                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] focus:outline-none focus:border-[#0062E0] text-sm"
                                    >

                                        <option value="Low">
                                            Low
                                        </option>

                                        <option value="Medium">
                                            Medium
                                        </option>

                                        <option value="High">
                                            High
                                        </option>

                                        <option value="Critical">
                                            Critical
                                        </option>

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Module
                                    </label>

                                    <input
                                        type="text"
                                        value={formData.moduleName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                moduleName:
                                                e.target.value
                                            })
                                        }
                                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                                        placeholder="Module name"
                                    />

                                </div>

                            </div>

                            {/* =================================================
                                ASSIGN TO - EDIT
                            ================================================= */}

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Assign To
                                </label>

                                <select
                                    value={
                                        formData.assignedStudentId
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            assignedStudentId:
                                            e.target.value
                                        })
                                    }
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] focus:outline-none focus:border-[#0062E0] text-sm"
                                >

                                    <option value="">
                                        Unassigned
                                    </option>

                                    {assignableUsers.map(
                                        (user) => (

                                            <option
                                                key={user.id}
                                                value={user.id}
                                            >
                                                {getAssignableUserLabel(
                                                    user
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                                <p className="text-[11px] text-slate-500 mt-1">
                                    Only active Testers and Developers can be assigned.
                                </p>

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Due Date
                                </label>

                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => {

                                        const selectedDate =
                                            e.target.value;

                                        if (selectedDate) {

                                            const today =
                                                new Date();

                                            today.setHours(
                                                0,
                                                0,
                                                0,
                                                0
                                            );

                                            const selected =
                                                new Date(
                                                    selectedDate
                                                );

                                            selected.setHours(
                                                0,
                                                0,
                                                0,
                                                0
                                            );

                                            if (
                                                selected < today
                                            ) {

                                                setEditDateError(
                                                    '⚠️ Cannot select past date. Please choose today or a future date.'
                                                );

                                            } else {

                                                setEditDateError(null);

                                            }

                                        }

                                        setFormData({
                                            ...formData,
                                            dueDate:
                                            selectedDate
                                        });

                                    }}
                                    min={getTodayDate()}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] focus:outline-none focus:border-[#0062E0] text-sm [color-scheme:light]"
                                />

                                <p className="text-[11px] text-slate-500 mt-1">
                                    ⚡ Min date: {new Date().toLocaleDateString()}
                                </p>

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Instructions
                                </label>

                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            instructions:
                                            e.target.value
                                        })
                                    }
                                    rows={2}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
                                    placeholder="Additional instructions"
                                />

                            </div>

                            <div className="flex gap-3">

                                <button
                                    type="submit"
                                    className="flex-1 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm shadow-sm"
                                >

                                    <Save size={18} />

                                    Update Task

                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingTask(null);
                                        resetForm();
                                    }}
                                    className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-700 px-4 py-2 rounded-lg transition-colors border border-[#E2E8F0] font-medium text-sm"
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =================================================
                VIEW TASK MODAL
            ================================================= */}

            {showViewModal && viewingTask && (

                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">

                    <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">

                        <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <ClipboardList
                                    size={24}
                                    className="text-[#0062E0]"
                                />

                                <h2 className="text-xl font-bold text-[#0F172A]">
                                    Task Details
                                </h2>

                            </div>

                            <div className="flex items-center gap-2">

                                {canCreateTask && (

                                    <button
                                        onClick={() => {
                                            setShowViewModal(false);
                                            openEditModal(
                                                viewingTask
                                            );
                                        }}
                                        className="text-[#0062E0] hover:text-[#0050B8] hover:bg-[#EFF6FF] p-2 rounded-lg transition-colors flex items-center gap-1"
                                    >

                                        <Edit2 size={18} />

                                    </button>

                                )}

                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setViewingTask(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-600"
                                >

                                    <X size={24} />

                                </button>

                            </div>

                        </div>

                        <div className="p-6 space-y-5">

                            <div>

                                <h3 className="text-2xl font-bold text-[#0F172A]">
                                    {viewingTask.title}
                                </h3>

                                <div className="flex items-center gap-3 mt-2 flex-wrap">

                                    <span
                                        className={`text-xs px-3 py-1 rounded-full border font-semibold ${getStatusColor(viewingTask.status)}`}
                                    >
                                        {viewingTask.status}
                                    </span>

                                    <span
                                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getPriorityColor(viewingTask.priority)}`}
                                    >
                                        {viewingTask.priority}
                                    </span>

                                    {isNewAssignmentForCurrentUser(viewingTask) && (
                                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            NEW ASSIGNMENT • Assigned to you
                                        </span>
                                    )}

                                </div>

                            </div>

                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">

                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                    Description
                                </label>

                                <p className="text-[#0F172A] text-sm mt-1">
                                    {viewingTask.description ||
                                        'No description'}
                                </p>

                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">

                                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                        Module
                                    </label>

                                    <p className="text-[#0F172A] text-sm mt-1">
                                        {viewingTask.moduleName ||
                                            'Unassigned'}
                                    </p>

                                </div>

                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">

                                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                        Due Date
                                    </label>

                                    <p className="text-[#0F172A] text-sm mt-1">

                                        {viewingTask.dueDate
                                            ? new Date(
                                                viewingTask.dueDate
                                            ).toLocaleDateString()
                                            : 'Not set'}

                                        {viewingTask.dueDate &&
                                            new Date(
                                                viewingTask.dueDate
                                            ) < new Date() && (

                                                <span className="ml-2 text-xs text-red-600 font-medium">
                                                    ⚠️ Past due
                                                </span>

                                            )}

                                    </p>

                                </div>

                            </div>

                            {viewingTask.instructions && (

                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">

                                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                        Instructions
                                    </label>

                                    <p className="text-[#0F172A] text-sm mt-1 whitespace-pre-wrap">
                                        {viewingTask.instructions}
                                    </p>

                                </div>

                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F1F5F9]">

                                <div>

                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                        Created
                                    </label>

                                    <p className="text-[#0F172A] text-sm">
                                        {
                                            new Date(
                                                viewingTask.createdAt
                                            ).toLocaleDateString()
                                        }
                                    </p>

                                </div>

                                {viewingTask.mentorName && (

                                    <div>

                                        <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                            Mentor
                                        </label>

                                        <p className="text-[#0F172A] text-sm">
                                            {viewingTask.mentorName}
                                        </p>

                                    </div>

                                )}

                                {viewingTask.assignedStudentName && (

                                    <div>

                                        <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                            Assigned To
                                        </label>

                                        <p className="text-[#0F172A] text-sm">
                                            {viewingTask.assignedStudentName}
                                        </p>

                                    </div>

                                )}

                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[#F1F5F9]">

                                {canCreateTask && (

                                    <button
                                        onClick={() => {
                                            setShowViewModal(false);
                                            openEditModal(
                                                viewingTask
                                            );
                                        }}
                                        className="flex-1 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm shadow-sm"
                                    >

                                        <Edit2 size={18} />

                                        Edit Task

                                    </button>

                                )}

                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                    }}
                                    className="flex-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-700 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm border border-[#E2E8F0]"
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