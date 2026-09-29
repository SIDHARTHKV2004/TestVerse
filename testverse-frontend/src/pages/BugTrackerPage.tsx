import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, Filter, AlertCircle, CheckCircle, Clock, XCircle,
  Bug, Image, Upload, X, Trash2, Eye, Edit2, GripVertical,
  Save, FileImage, Maximize2, User, Calendar, Tag, Layers, Info, Lock
} from 'lucide-react';
import { createBug, BugReport as ApiBugReport, fetchDevelopers } from '../services/api';

// Extend the API BugReport type to match our local requirements
interface BugReport extends ApiBugReport {
  id: string | number;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: 'Minor' | 'Major' | 'Critical' | 'Blocker';
}

interface DragState {
  bugId: string | number | null;
  sourceStatus: string | null;
}

const BugTrackerPage: React.FC = () => {
  const { user, isAdmin, isMentor } = useAuth();
  const token = localStorage.getItem('token');
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [filteredBugs, setFilteredBugs] = useState<BugReport[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingBug, setViewingBug] = useState<BugReport | null>(null);
  const [editingBug, setEditingBug] = useState<BugReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [dragState, setDragState] = useState<DragState>({
    bugId: null,
    sourceStatus: null,
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as BugReport['priority'],
    severity: 'Major' as BugReport['severity'],
    status: 'Open' as BugReport['status'],
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    screenshotFile: '',
    assigneeId: '',
  });

  useEffect(() => {
    fetchBugs();
    loadDevelopers();
  }, []);

  const loadDevelopers = async (): Promise<void> => {
    try {
      const devs = await fetchDevelopers();
      setDevelopers(Array.isArray(devs) ? devs : []);
    } catch (err) {
      console.error('Failed to load developers:', err);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [bugs, searchTerm, filterStatus, filterPriority]);

  const fetchBugs = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/bugs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure each bug has an id and convert status/priority/severity to match
        const formattedBugs: BugReport[] = (Array.isArray(data) ? data : []).map((bug: any) => ({
          ...bug,
          id: bug.id || '',
          status: bug.status || 'Open',
          priority: bug.priority || 'Medium',
          severity: bug.severity || 'Major',
          reporterId: bug.reporterId || 0,
          createdAt: bug.createdAt || new Date().toISOString(),
        }));
        setBugs(formattedBugs);
      } else {
        setBugs([]);
      }
    } catch (error) {
      console.error('Error fetching bugs:', error);
      setBugs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (): void => {
    let result = bugs;

    if (searchTerm) {
      result = result.filter(bug =>
          bug.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bug.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'All') {
      result = result.filter(bug => bug.status === filterStatus);
    }

    if (filterPriority !== 'All') {
      result = result.filter(bug => bug.priority === filterPriority);
    }

    setFilteredBugs(result);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, screenshotFile: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, screenshotFile: base64String });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (): void => {
    setFormData({ ...formData, screenshotFile: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const openScreenshotModal = (imageData: string): void => {
    setSelectedScreenshot(imageData);
    setShowScreenshotModal(true);
  };

  const openViewModal = (bug: BugReport): void => {
    setViewingBug(bug);
    setShowViewModal(true);
  };

  const canChangeBugStatus = (bug: BugReport | null): boolean => {
    if (!bug || !user) return false;
    const currentUserId = user.userId || user.id;
    if (!currentUserId) return false;

    // 1. Bug creator/reporter
    if (bug.reporterId && String(currentUserId) === String(bug.reporterId)) return true;

    // 2. Assigned developer
    if (bug.assigneeId && String(currentUserId) === String(bug.assigneeId)) return true;

    // 3. Appropriate mentor
    if (bug.reporterMentorId && String(currentUserId) === String(bug.reporterMentorId)) return true;
    if (bug.assigneeMentorId && String(currentUserId) === String(bug.assigneeMentorId)) return true;

    // If user has MENTOR role, allow attempt and let backend enforce
    if (user.role === 'MENTOR') return true;

    return false;
  };

  // Determine if current user can edit/update a bug:
  // 1. ADMIN -> can edit any bug
  // 2. The Tester who created/reported the bug -> can edit only their own created bugs
  // 3. The Mentor of the Tester who created/reported the bug -> can edit that tester's bugs
  // Assigned developer and other users are NOT allowed to edit.
  const canEditBug = (bug: BugReport | null): boolean => {
    if (!bug || !user) return false;
    if (isAdmin || user.role === 'ADMIN') return true;

    const currentUserId = user.userId || user.id;
    if (!currentUserId) return false;

    // 2. The Tester who created/reported the bug
    if (bug.reporterId && String(currentUserId) === String(bug.reporterId)) {
      return true;
    }

    // 3. The Mentor of the Tester who created/reported the bug
    if (bug.reporterMentorId && String(currentUserId) === String(bug.reporterMentorId)) {
      return true;
    }

    // If reporterMentorId is not set on the bug, but user is a MENTOR, allow attempt and let backend enforce
    if (!bug.reporterMentorId && (user.role === 'MENTOR' || isMentor)) {
      return true;
    }

    return false;
  };

  const handleDragStart = (e: React.DragEvent, bugId: string | number, status: string): void => {
    const bug = bugs.find(b => String(b.id) === String(bugId));
    if (bug && !canChangeBugStatus(bug)) {
      e.preventDefault();
      alert('🔒 You do not have permission to change the status of this bug. Only the bug creator, assigned developer, or their mentor can change bug status.');
      return;
    }
    setDragState({ bugId, sourceStatus: status });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${bugId}`);
  };

  const handleDragEnd = (): void => {
    setDragState({ bugId: null, sourceStatus: null });
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string): Promise<void> => {
    e.preventDefault();

    const bugId = e.dataTransfer.getData('text/plain');
    if (!bugId) return;

    const { sourceStatus } = dragState;

    if (sourceStatus === targetStatus) {
      setDragState({ bugId: null, sourceStatus: null });
      return;
    }

    const draggedBug = bugs.find(b => String(b.id) === String(bugId));
    if (draggedBug && !canChangeBugStatus(draggedBug)) {
      setDragState({ bugId: null, sourceStatus: null });
      alert('🔒 You do not have permission to change the status of this bug. Only the bug creator, assigned developer, or their mentor can change bug status.');
      return;
    }

    setBugs(prevBugs =>
        prevBugs.map(b =>
            String(b.id) === String(bugId) ? { ...b, status: targetStatus as BugReport['status'] } : b
        )
    );

    setDragState({ bugId: null, sourceStatus: null });

    try {
      const response = await fetch(`http://localhost:8080/api/bugs/${bugId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update bug status');
      }
    } catch (error: any) {
      console.error('Error updating bug status:', error);
      // Revert on error
      const revertedBugs = bugs.map(b =>
          String(b.id) === String(bugId) ? { ...b, status: sourceStatus as BugReport['status'] } : b
      );
      setBugs(revertedBugs);
      alert(`❌ ${error.message || 'Failed to update bug status'}`);
    }
  };

  // ============ CREATE BUG ============

  const handleCreateBug = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      // Format the bug data for backend
      const bugData = {
        title: formData.title?.trim() || '',
        description: formData.description?.trim() || '',
        status: formData.status || 'OPEN',
        priority: formData.priority || 'MEDIUM',
        severity: formData.severity || 'MEDIUM',
        stepsToReproduce: formData.stepsToReproduce?.trim() || '',
        expectedResult: formData.expectedResult?.trim() || '',
        actualResult: formData.actualResult?.trim() || '',
        projectName: '',
        reporterName: user?.name || 'Unknown',
        assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
        screenshotUrl: formData.screenshotFile || '',
      };

      console.log('📤 Sending bug data:', bugData);

      // Validate required fields
      if (!bugData.title) {
        alert('❌ Bug title is required!');
        return;
      }

      if (!bugData.description) {
        alert('❌ Bug description is required!');
        return;
      }

      const newBug = await createBug(bugData);
      console.log('✅ Bug created successfully:', newBug);

      // Update the bugs list with proper type
      const formattedBug: BugReport = {
        ...newBug,
        id: newBug.id || '',
        status: (newBug.status as BugReport['status']) || 'Open',
        priority: (newBug.priority as BugReport['priority']) || 'Medium',
        severity: (newBug.severity as BugReport['severity']) || 'Major',
        reporterId: newBug.reporterId || 0,
        createdAt: newBug.createdAt || new Date().toISOString(),
      };

      setBugs([formattedBug, ...bugs]);
      setShowModal(false);
      resetForm();
      alert('✅ Bug reported successfully!');
    } catch (error: any) {
      console.error('❌ Error creating bug:', error);
      const errorMessage = error.message || 'Please check: 1) Backend is running on port 8080, 2) You are logged in, 3) You have admin or tester role';
      alert(`❌ Failed to create bug: ${errorMessage}`);
    }
  };

  const openEditModal = (bug: BugReport): void => {
    if (!canEditBug(bug)) {
      alert('🔒 You do not have permission to edit this bug. Only Admin, the bug creator, or their mentor can edit bug details.');
      return;
    }
    setEditingBug(bug);
    setFormData({
      title: bug.title,
      description: bug.description || '',
      priority: bug.priority,
      severity: bug.severity,
      status: bug.status,
      stepsToReproduce: bug.stepsToReproduce || '',
      expectedResult: bug.expectedResult || '',
      actualResult: bug.actualResult || '',
      screenshotFile: bug.screenshotUrl || '',
      assigneeId: bug.assigneeId ? String(bug.assigneeId) : '',
    });
    setShowEditModal(true);
  };

  const handleEditBug = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingBug) return;

    try {
      const updatedData = {
        ...formData,
        assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
        screenshotUrl: formData.screenshotFile || editingBug.screenshotUrl,
      };

      const response = await fetch(`http://localhost:8080/api/bugs/${editingBug.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedBug = await response.json();
        const formattedBug: BugReport = {
          ...updatedBug,
          id: updatedBug.id || editingBug.id,
          status: updatedBug.status || 'Open',
          priority: updatedBug.priority || 'Medium',
          severity: updatedBug.severity || 'Major',
          reporterId: updatedBug.reporterId || 0,
          createdAt: updatedBug.createdAt || new Date().toISOString(),
        };
        setBugs(bugs.map(b => String(b.id) === String(editingBug.id) ? formattedBug : b));
        setShowEditModal(false);
        setEditingBug(null);
        resetForm();
        alert('✅ Bug updated successfully!');
      } else {
        const errText = await response.text();
        alert(`❌ Failed to update bug: ${errText || response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error updating bug:', error);
      alert(`❌ Error: ${error.message || 'Network error. Please try again.'}`);
    }
  };

  const handleDeleteBug = async (id: string | number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/bugs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setBugs(bugs.filter(b => String(b.id) !== String(id)));
        alert('✅ Bug deleted successfully!');
      } else {
        const errText = await response.text();
        alert(`❌ Failed to delete bug: ${errText || response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error deleting bug:', error);
      alert(`❌ Error: ${error.message || 'Network error. Please try again.'}`);
    }
  };

  const resetForm = (): void => {
    setFormData({
      title: '',
      description: '',
      priority: 'Medium',
      severity: 'Major',
      status: 'Open',
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
      screenshotFile: '',
      assigneeId: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Open': 'bg-red-50 text-red-700 border-red-200',
      'In Progress': 'bg-[#EFF6FF] text-[#0062E0] border-[#BFDBFE]',
      'Resolved': 'bg-[#E6F9F4] text-[#008766] border-[#A7F3D0]',
      'Closed': 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'Open': return <AlertCircle size={14} />;
      case 'In Progress': return <Clock size={14} />;
      case 'Resolved': return <CheckCircle size={14} />;
      case 'Closed': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'Critical': 'text-red-700 bg-red-50 border border-red-200',
      'High': 'text-orange-700 bg-orange-50 border border-orange-200',
      'Medium': 'text-amber-700 bg-amber-50 border border-amber-200',
      'Low': 'text-[#0062E0] bg-[#EFF6FF] border border-[#BFDBFE]',
    };
    return colors[priority] || 'text-slate-600 bg-slate-50 border border-slate-200';
  };

  const statuses: BugReport['status'][] = ['Open', 'In Progress', 'Resolved', 'Closed'];

  // Helper function to safely format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-500 font-medium">Loading bugs...</div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Bug Tracker</h1>
            <p className="text-slate-500 text-sm mt-0.5">Click on any bug to view full details • Drag to change status</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{bugs.length} total bugs</p>
          </div>
          <button
              onClick={() => setShowModal(true)}
              className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus size={18} />
            Report Bug
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder="Search bugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-10 pr-4 py-2 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />

            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#0F172A] text-sm focus:outline-none focus:border-[#0062E0]"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#0F172A] text-sm focus:outline-none focus:border-[#0062E0]"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#0F172A]">{bugs.length}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Total Bugs</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-red-600">{bugs.filter(b => b.status === 'Open').length}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Open</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#0062E0]">{bugs.filter(b => b.status === 'In Progress').length}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">In Progress</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#008766]">{bugs.filter(b => b.status === 'Resolved').length}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Resolved</p>
          </div>
        </div>

        {/* Bug Cards */}
        {bugs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
              <Bug size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-semibold text-[#0F172A]">No bugs reported yet</p>
              <p className="text-sm text-slate-500 mt-0.5">Report your first bug to get started!</p>
              <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 font-medium text-sm shadow-sm"
              >
                <Plus size={18} />
                Report Bug
              </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statuses.map((status) => {
                const statusBugs = filteredBugs.filter(b => b.status === status);
                return (
                    <div
                        key={status}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 min-h-[250px] transition-all"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                    >
                      <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColor(status)} flex items-center gap-1.5`}>
                    {getStatusIcon(status)}
                    {status} ({statusBugs.length})
                  </span>
                        <span className="text-[10px] text-slate-400 font-medium">Drop here</span>
                      </div>
                      <div className="space-y-2">
                        {statusBugs.map((bug) => {
                          const canChangeStatus = canChangeBugStatus(bug);
                          return (
                            <div
                                key={bug.id}
                                draggable={canChangeStatus}
                                onDragStart={(e) => canChangeStatus ? handleDragStart(e, bug.id, bug.status) : e.preventDefault()}
                                onDragEnd={handleDragEnd}
                                onClick={() => openViewModal(bug)}
                                className={`bg-white border border-[#E2E8F0] rounded-lg p-3 hover:border-[#0062E0] hover:shadow-md transition-all group cursor-pointer ${canChangeStatus ? 'active:cursor-grabbing' : ''} relative shadow-sm`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5" title={canChangeStatus ? 'Drag to change status' : 'Status change restricted to creator, assigned dev, or mentor'}>
                                  {canChangeStatus ? (
                                    <span className="text-slate-400 hover:text-slate-600 cursor-grab block"><GripVertical size={14} /></span>
                                  ) : (
                                    <span className="text-slate-400 block"><Lock size={13} /></span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Bug size={14} className="text-[#0062E0] flex-shrink-0" />
                                    <h4 className="text-sm text-[#0F172A] font-semibold truncate group-hover:text-[#0062E0] transition-colors">{bug.title}</h4>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{bug.description}</p>

                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityColor(bug.priority)}`}>
                                      {bug.priority}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-slate-600 font-medium">
                                      {bug.severity}
                                    </span>
                                    {bug.assigneeName && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0062E0] border border-[#BFDBFE] flex items-center gap-1 font-medium">
                                        <User size={10} />
                                        {bug.assigneeName}
                                      </span>
                                    )}
                                    {bug.projectName && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-slate-600 font-medium">
                                        {bug.projectName}
                                      </span>
                                    )}
                                    {bug.screenshotUrl && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#0062E0] border border-[#BFDBFE] flex items-center gap-1 font-medium">
                                        <FileImage size={10} />
                                        Image
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium">
                                    <span>By {bug.reporterName || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{formatDate(bug.createdAt)}</span>
                                  </div>

                                  <div className="mt-1 text-[9px] text-slate-400 flex items-center gap-1">
                                    <Eye size={10} />
                                    Click to view details
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#F1F5F9]">
                                {canEditBug(bug) && (
                                  <button
                                      onClick={(e) => { e.stopPropagation(); openEditModal(bug); }}
                                      className="text-[10px] px-2 py-0.5 rounded text-slate-500 hover:text-[#0062E0] hover:bg-[#EFF6FF] transition-colors flex items-center gap-1 font-medium"
                                  >
                                    <Edit2 size={12} />
                                    Edit
                                  </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteBug(bug.id); }}
                                    className="text-[10px] px-2 py-0.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 font-medium"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {statusBugs.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-sm">
                              No bugs
                              <br />
                              <span className="text-[10px]">Drop bugs here</span>
                            </div>
                        )}
                      </div>
                    </div>
                );
              })}
            </div>
        )}

        {/* ========== VIEW BUG DETAILS MODAL ========== */}
        {showViewModal && viewingBug && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
              <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <Bug size={24} className="text-[#0062E0]" />
                    <h2 className="text-xl font-bold text-[#0F172A]">Bug Details</h2>
                  </div>
                  <button
                      onClick={() => { setShowViewModal(false); setViewingBug(null); }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F172A]">{viewingBug.title}</h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(viewingBug.status)} flex items-center gap-1 font-semibold`}>
                    {getStatusIcon(viewingBug.status)}
                    {viewingBug.status}
                  </span>
                      <span className={`text-xs px-3 py-1 rounded-full ${getPriorityColor(viewingBug.priority)} font-semibold`}>
                    Priority: {viewingBug.priority}
                  </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#F1F5F9] text-slate-600 font-semibold">
                    Severity: {viewingBug.severity}
                  </span>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-2 mb-2">
                      <Info size={14} />
                      Description
                    </label>
                    <p className="text-[#0F172A] text-sm leading-relaxed">{viewingBug.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                      <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-2 mb-2">
                        <Layers size={14} />
                        Steps to Reproduce
                      </label>
                      <p className="text-[#0F172A] text-sm whitespace-pre-wrap">
                        {viewingBug.stepsToReproduce || 'Not provided'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                        <label className="text-xs text-emerald-700 uppercase tracking-wider font-semibold flex items-center gap-2 mb-2">
                          <CheckCircle size={14} />
                          Expected Result
                        </label>
                        <p className="text-[#0F172A] text-sm">
                          {viewingBug.expectedResult || 'Not provided'}
                        </p>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                        <label className="text-xs text-red-600 uppercase tracking-wider font-semibold flex items-center gap-2 mb-2">
                          <XCircle size={14} />
                          Actual Result
                        </label>
                        <p className="text-[#0F172A] text-sm">
                          {viewingBug.actualResult || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {viewingBug.screenshotUrl && (
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-2 mb-3">
                          <Image size={14} />
                          Screenshot
                        </label>
                        <div className="relative">
                          <img
                              src={viewingBug.screenshotUrl}
                              alt="Bug Screenshot"
                              className="max-h-64 rounded-lg border border-[#E2E8F0] object-contain cursor-pointer hover:opacity-90 transition-opacity bg-white"
                              onClick={() => openScreenshotModal(viewingBug.screenshotUrl || '')}
                          />
                          <button
                              onClick={() => openScreenshotModal(viewingBug.screenshotUrl || '')}
                              className="absolute top-2 right-2 bg-white/90 border border-[#E2E8F0] p-1.5 rounded-lg hover:bg-white transition-colors shadow-sm"
                          >
                            <Maximize2 size={16} className="text-slate-600" />
                          </button>
                        </div>
                      </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[#F1F5F9]">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Reported By</label>
                      <p className="text-[#0F172A] text-sm flex items-center gap-1 font-medium mt-0.5">
                        <User size={14} className="text-[#0062E0]" />
                        {viewingBug.reporterName || 'Unknown'}
                      </p>
                    </div>
                    {viewingBug.assigneeName && (
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Assigned To</label>
                          <p className="text-[#0F172A] text-sm flex items-center gap-1 font-medium mt-0.5">
                            <User size={14} className="text-[#00B388]" />
                            {viewingBug.assigneeName}
                          </p>
                        </div>
                    )}
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Project</label>
                      <p className="text-[#0F172A] text-sm flex items-center gap-1 font-medium mt-0.5">
                        <Tag size={14} className="text-slate-400" />
                        {viewingBug.projectName || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Created</label>
                      <p className="text-[#0F172A] text-sm flex items-center gap-1 font-medium mt-0.5">
                        <Calendar size={14} className="text-slate-400" />
                        {formatDate(viewingBug.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#F1F5F9]">
                    {canEditBug(viewingBug) && (
                      <button
                          onClick={() => { setShowViewModal(false); openEditModal(viewingBug); }}
                          className="flex-1 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm shadow-sm"
                      >
                        <Edit2 size={18} />
                        Edit Bug
                      </button>
                    )}
                    <button
                        onClick={() => { setShowViewModal(false); setViewingBug(null); }}
                        className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-700 px-4 py-2.5 rounded-lg transition-colors border border-[#E2E8F0] flex-1 font-medium text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* ========== CREATE BUG MODAL ========== */}
        {showModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b border-[#F1F5F9]">
                  <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                    <Bug size={20} className="text-[#0062E0]" />
                    Report Bug
                  </h2>
                  <button
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateBug} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bug Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                        placeholder="Enter bug title"
                        required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                        placeholder="Describe the bug"
                        required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                      <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as BugReport['priority'] })}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                      <select
                          value={formData.severity}
                          onChange={(e) => setFormData({ ...formData, severity: e.target.value as BugReport['severity'] })}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                      >
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                        <option value="Critical">Critical</option>
                        <option value="Blocker">Blocker</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Steps to Reproduce</label>
                    <textarea
                        value={formData.stepsToReproduce}
                        onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                        rows={3}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                        placeholder="Step 1: ...&#10;Step 2: ..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expected Result</label>
                      <input
                          type="text"
                          value={formData.expectedResult}
                          onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                          placeholder="What should happen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Actual Result</label>
                      <input
                          type="text"
                          value={formData.actualResult}
                          onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                          placeholder="What actually happened"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign Developer (Optional)</label>
                    <select
                        value={formData.assigneeId}
                        onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                    >
                      <option value="">Select Developer (Unassigned)</option>
                      {developers.map((dev) => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name} ({dev.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Screenshot (Optional)</label>
                    <div className="flex items-center gap-3">
                      <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                      />
                      <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-[#E2E8F0] text-sm font-medium"
                      >
                        <Upload size={16} />
                        Choose Image
                      </button>
                      {formData.screenshotFile && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#008766] font-medium">✓ Image uploaded</span>
                            <button
                                type="button"
                                onClick={removeImage}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Remove
                            </button>
                          </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
                    {formData.screenshotFile && (
                        <div className="mt-2">
                          <img
                              src={formData.screenshotFile}
                              alt="Screenshot preview"
                              className="max-h-32 rounded-lg border border-[#E2E8F0] object-contain shadow-sm"
                          />
                        </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-lg transition-all font-medium shadow-sm hover:shadow"
                    >
                      Report Bug
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* ========== EDIT BUG MODAL ========== */}
        {showEditModal && editingBug && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b border-[#F1F5F9]">
                  <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                    <Edit2 size={20} className="text-[#0062E0]" />
                    Edit Bug
                  </h2>
                  <button
                      onClick={() => { setShowEditModal(false); setEditingBug(null); resetForm(); }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleEditBug} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bug Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                        placeholder="Enter bug title"
                        required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                        placeholder="Describe the bug"
                        required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                      <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as BugReport['priority'] })}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                      <select
                          value={formData.severity}
                          onChange={(e) => setFormData({ ...formData, severity: e.target.value as BugReport['severity'] })}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                      >
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                        <option value="Critical">Critical</option>
                        <option value="Blocker">Blocker</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      <span>Status</span>
                      {editingBug && !canChangeBugStatus(editingBug) && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 font-medium">
                          <Lock size={12} /> Status restricted
                        </span>
                      )}
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as BugReport['status'] })}
                        disabled={editingBug ? !canChangeBugStatus(editingBug) : false}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                    {editingBug && !canChangeBugStatus(editingBug) && (
                      <p className="text-[11px] text-slate-500 mt-1">Status can only be changed by the creator, assigned developer, or their mentor.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign Developer</label>
                    <select
                        value={formData.assigneeId}
                        onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                    >
                      <option value="">Unassigned (No Developer)</option>
                      {developers.map((dev) => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name} ({dev.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Steps to Reproduce</label>
                    <textarea
                        value={formData.stepsToReproduce}
                        onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                        rows={3}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                        placeholder="Step 1: ...&#10;Step 2: ..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expected Result</label>
                      <input
                          type="text"
                          value={formData.expectedResult}
                          onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                          placeholder="What should happen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Actual Result</label>
                      <input
                          type="text"
                          value={formData.actualResult}
                          onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                          placeholder="What actually happened"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Screenshot</label>
                    <div className="flex items-center gap-3">
                      <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageUpload}
                          className="hidden"
                      />
                      <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-[#E2E8F0] text-sm font-medium"
                      >
                        <Upload size={16} />
                        {formData.screenshotFile ? 'Change Image' : 'Upload Image'}
                      </button>
                      {formData.screenshotFile && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#008766] font-medium">✓ Image uploaded</span>
                            <button
                                type="button"
                                onClick={removeImage}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Remove
                            </button>
                          </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
                    {formData.screenshotFile && (
                        <div className="mt-2">
                          <img
                              src={formData.screenshotFile}
                              alt="Screenshot preview"
                              className="max-h-32 rounded-lg border border-[#E2E8F0] object-contain shadow-sm"
                          />
                        </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="flex-1 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow"
                    >
                      <Save size={18} />
                      Update Bug
                    </button>
                    <button
                        type="button"
                        onClick={() => { setShowEditModal(false); setEditingBug(null); resetForm(); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition-colors border border-[#E2E8F0] font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* ========== SCREENSHOT VIEW MODAL ========== */}
        {showScreenshotModal && selectedScreenshot && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="relative max-w-4xl w-full bg-white rounded-2xl p-4 shadow-2xl border border-slate-200">
                <button
                    onClick={() => { setShowScreenshotModal(false); setSelectedScreenshot(null); }}
                    className="absolute -top-3 -right-3 bg-white text-slate-600 hover:text-slate-900 rounded-full p-2 shadow-lg border border-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
                <img
                    src={selectedScreenshot}
                    alt="Bug Screenshot"
                    className="w-full rounded-xl max-h-[80vh] object-contain"
                />
                <p className="text-center text-slate-500 text-xs mt-3">Click close or press ESC to exit</p>
              </div>
            </div>
        )}
      </div>
  );
};

export default BugTrackerPage;