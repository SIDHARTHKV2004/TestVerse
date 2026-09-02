import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, Filter, AlertCircle, CheckCircle, Clock, XCircle,
  Bug, Image, Upload, X, Trash2, Eye, Edit2, GripVertical,
  Save, FileImage, Maximize2, User, Calendar, Tag, Layers, Info
} from 'lucide-react';
import { createBug, BugReport as ApiBugReport } from '../services/api';

// Extend the API BugReport type to match our local requirements
interface BugReport extends ApiBugReport {
  id: number;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: 'Minor' | 'Major' | 'Critical' | 'Blocker';
}

interface DragState {
  bugId: number | null;
  sourceStatus: string | null;
}

const BugTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [filteredBugs, setFilteredBugs] = useState<BugReport[]>([]);
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
  });

  useEffect(() => {
    fetchBugs();
  }, []);

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
          id: bug.id || 0,
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

  const handleDragStart = (e: React.DragEvent, bugId: number, status: string): void => {
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

    const bugIdStr = e.dataTransfer.getData('text/plain');
    if (!bugIdStr) return;

    const bugId = parseInt(bugIdStr, 10);
    const { sourceStatus } = dragState;

    if (sourceStatus === targetStatus) {
      setDragState({ bugId: null, sourceStatus: null });
      return;
    }

    setBugs(prevBugs =>
        prevBugs.map(b =>
            b.id === bugId ? { ...b, status: targetStatus as BugReport['status'] } : b
        )
    );

    setDragState({ bugId: null, sourceStatus: null });

    try {
      await fetch(`http://localhost:8080/api/bugs/${bugId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch (error) {
      console.error('Error updating bug status:', error);
      // Revert on error
      const revertedBugs = bugs.map(b =>
          b.id === bugId ? { ...b, status: sourceStatus as BugReport['status'] } : b
      );
      setBugs(revertedBugs);
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
        assigneeName: '',
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
        id: newBug.id || 0,
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
    });
    setShowEditModal(true);
  };

  const handleEditBug = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingBug) return;

    try {
      const updatedData = {
        ...formData,
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
          id: updatedBug.id || 0,
          status: updatedBug.status || 'Open',
          priority: updatedBug.priority || 'Medium',
          severity: updatedBug.severity || 'Major',
          reporterId: updatedBug.reporterId || 0,
          createdAt: updatedBug.createdAt || new Date().toISOString(),
        };
        setBugs(bugs.map(b => b.id === editingBug.id ? formattedBug : b));
        setShowEditModal(false);
        setEditingBug(null);
        resetForm();
        alert('✅ Bug updated successfully!');
      } else {
        alert('❌ Failed to update bug');
      }
    } catch (error) {
      console.error('Error updating bug:', error);
      alert('❌ Network error. Please try again.');
    }
  };

  const handleDeleteBug = async (id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/bugs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setBugs(bugs.filter(b => b.id !== id));
        alert('✅ Bug deleted successfully!');
      } else {
        alert('❌ Failed to delete bug');
      }
    } catch (error) {
      console.error('Error deleting bug:', error);
      alert('❌ Network error. Please try again.');
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
      'Open': 'bg-red-500/20 text-red-400 border-red-500/30',
      'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Closed': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
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
      'Critical': 'text-red-500 bg-red-500/10',
      'High': 'text-orange-500 bg-orange-500/10',
      'Medium': 'text-yellow-500 bg-yellow-500/10',
      'Low': 'text-blue-500 bg-blue-500/10',
    };
    return colors[priority] || 'text-gray-500 bg-gray-500/10';
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
          <div className="text-[#666666]">Loading bugs...</div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Bug Tracker</h1>
            <p className="text-[#666666] text-sm">Click on any bug to view full details • Drag to change status</p>
            <p className="text-xs text-[#444444] mt-1">{bugs.length} total bugs</p>
          </div>
          <button
              onClick={() => setShowModal(true)}
              className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Report Bug
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
                type="text"
                placeholder="Search bugs..."
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
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{bugs.length}</p>
            <p className="text-xs text-[#666666]">Total Bugs</p>
          </div>
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{bugs.filter(b => b.status === 'Open').length}</p>
            <p className="text-xs text-[#666666]">Open</p>
          </div>
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{bugs.filter(b => b.status === 'In Progress').length}</p>
            <p className="text-xs text-[#666666]">In Progress</p>
          </div>
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{bugs.filter(b => b.status === 'Resolved').length}</p>
            <p className="text-xs text-[#666666]">Resolved</p>
          </div>
        </div>

        {/* Bug Cards */}
        {bugs.length === 0 ? (
            <div className="text-center py-16 bg-[#111111] border border-[#1a1a1a] rounded-xl">
              <Bug size={48} className="mx-auto mb-3 text-[#444444]" />
              <p className="text-lg text-white">No bugs reported yet</p>
              <p className="text-sm text-[#666666]">Report your first bug to get started!</p>
              <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
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
                        className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 min-h-[250px] transition-all"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                    >
                      <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    {status} ({statusBugs.length})
                  </span>
                        <span className="text-[10px] text-[#444444]">Drop here</span>
                      </div>
                      <div className="space-y-2">
                        {statusBugs.map((bug) => (
                            <div
                                key={bug.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, bug.id, bug.status)}
                                onDragEnd={handleDragEnd}
                                onClick={() => openViewModal(bug)}
                                className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 hover:border-[#ff6b00] transition-all group cursor-pointer active:cursor-grabbing relative"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 text-[#444444] cursor-grab">
                                  <GripVertical size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Bug size={14} className="text-[#ff6b00] flex-shrink-0" />
                                    <h4 className="text-sm text-white font-medium truncate">{bug.title}</h4>
                                  </div>
                                  <p className="text-xs text-[#666666] mt-1 line-clamp-2">{bug.description}</p>

                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(bug.priority)}`}>
                              {bug.priority}
                            </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#666666]">
                              {bug.severity}
                            </span>
                                    {bug.projectName && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#666666]">
                                {bug.projectName}
                              </span>
                                    )}
                                    {bug.screenshotUrl && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff6b00]/20 text-[#ff6b00] flex items-center gap-1">
                                <FileImage size={10} />
                                Image
                              </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-2 text-[10px] text-[#666666]">
                                    <span>By {bug.reporterName || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{formatDate(bug.createdAt)}</span>
                                  </div>

                                  <div className="mt-1 text-[8px] text-[#444444] flex items-center gap-1">
                                    <Eye size={10} />
                                    Click to view details
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#1a1a1a]">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEditModal(bug); }}
                                    className="text-[10px] px-2 py-0.5 rounded text-[#666666] hover:text-[#ff6b00] hover:bg-[#1a1a1a] transition-colors flex items-center gap-1"
                                >
                                  <Edit2 size={12} />
                                  Edit
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteBug(bug.id); }}
                                    className="text-[10px] px-2 py-0.5 rounded text-[#666666] hover:text-red-500 hover:bg-[#1a1a1a] transition-colors flex items-center gap-1"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            </div>
                        ))}
                        {statusBugs.length === 0 && (
                            <div className="text-center py-6 text-[#444444] text-sm">
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
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-8">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-[#111111] border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <Bug size={24} className="text-[#ff6b00]" />
                    <h2 className="text-xl font-bold text-white">Bug Details</h2>
                  </div>
                  <button
                      onClick={() => { setShowViewModal(false); setViewingBug(null); }}
                      className="text-[#666666] hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{viewingBug.title}</h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(viewingBug.status)} flex items-center gap-1`}>
                    {getStatusIcon(viewingBug.status)}
                    {viewingBug.status}
                  </span>
                      <span className={`text-xs px-3 py-1 rounded-full ${getPriorityColor(viewingBug.priority)}`}>
                    Priority: {viewingBug.priority}
                  </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#1a1a1a] text-[#666666]">
                    Severity: {viewingBug.severity}
                  </span>
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <label className="text-xs text-[#666666] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Info size={14} />
                      Description
                    </label>
                    <p className="text-white text-sm leading-relaxed">{viewingBug.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <label className="text-xs text-[#666666] uppercase tracking-wider flex items-center gap-2 mb-2">
                        <Layers size={14} />
                        Steps to Reproduce
                      </label>
                      <p className="text-white text-sm whitespace-pre-wrap">
                        {viewingBug.stepsToReproduce || 'Not provided'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                        <label className="text-xs text-green-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                          <CheckCircle size={14} />
                          Expected Result
                        </label>
                        <p className="text-white text-sm">
                          {viewingBug.expectedResult || 'Not provided'}
                        </p>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                        <label className="text-xs text-red-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                          <XCircle size={14} />
                          Actual Result
                        </label>
                        <p className="text-white text-sm">
                          {viewingBug.actualResult || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {viewingBug.screenshotUrl && (
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                        <label className="text-xs text-[#666666] uppercase tracking-wider flex items-center gap-2 mb-3">
                          <Image size={14} />
                          Screenshot
                        </label>
                        <div className="relative">
                          <img
                              src={viewingBug.screenshotUrl}
                              alt="Bug Screenshot"
                              className="max-h-64 rounded-lg border border-[#1a1a1a] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openScreenshotModal(viewingBug.screenshotUrl || '')}
                          />
                          <button
                              onClick={() => openScreenshotModal(viewingBug.screenshotUrl || '')}
                              className="absolute top-2 right-2 bg-[#1a1a1a] p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                          >
                            <Maximize2 size={16} className="text-[#666666]" />
                          </button>
                        </div>
                      </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[#1a1a1a]">
                    <div>
                      <label className="text-[10px] text-[#666666] uppercase tracking-wider">Reported By</label>
                      <p className="text-white text-sm flex items-center gap-1">
                        <User size={14} className="text-[#666666]" />
                        {viewingBug.reporterName || 'Unknown'}
                      </p>
                    </div>
                    {viewingBug.assigneeName && (
                        <div>
                          <label className="text-[10px] text-[#666666] uppercase tracking-wider">Assigned To</label>
                          <p className="text-white text-sm flex items-center gap-1">
                            <User size={14} className="text-[#666666]" />
                            {viewingBug.assigneeName}
                          </p>
                        </div>
                    )}
                    <div>
                      <label className="text-[10px] text-[#666666] uppercase tracking-wider">Project</label>
                      <p className="text-white text-sm flex items-center gap-1">
                        <Tag size={14} className="text-[#666666]" />
                        {viewingBug.projectName || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#666666] uppercase tracking-wider">Created</label>
                      <p className="text-white text-sm flex items-center gap-1">
                        <Calendar size={14} className="text-[#666666]" />
                        {formatDate(viewingBug.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#1a1a1a]">
                    <button
                        onClick={() => { setShowViewModal(false); openEditModal(viewingBug); }}
                        className="flex-1 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={18} />
                      Edit Bug
                    </button>
                    <button
                        onClick={() => { setShowViewModal(false); setViewingBug(null); }}
                        className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors border border-[#2a2a2a]"
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
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#111111] pb-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bug size={20} className="text-[#ff6b00]" />
                    Report Bug
                  </h2>
                  <button
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className="text-[#666666] hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateBug} className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Bug Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                        placeholder="Enter bug title"
                        required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Description *</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                        placeholder="Describe the bug"
                        required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Priority</label>
                      <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as BugReport['priority'] })}
                          className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Severity</label>
                      <select
                          value={formData.severity}
                          onChange={(e) => setFormData({ ...formData, severity: e.target.value as BugReport['severity'] })}
                          className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                      >
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                        <option value="Critical">Critical</option>
                        <option value="Blocker">Blocker</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Steps to Reproduce</label>
                    <textarea
                        value={formData.stepsToReproduce}
                        onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                        rows={3}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                        placeholder="Step 1: ...\nStep 2: ..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Expected Result</label>
                      <input
                          type="text"
                          value={formData.expectedResult}
                          onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                          placeholder="What should happen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Actual Result</label>
                      <input
                          type="text"
                          value={formData.actualResult}
                          onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                          placeholder="What actually happened"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Screenshot (Optional)</label>
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
                          className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-[#2a2a2a]"
                      >
                        <Upload size={16} />
                        Choose Image
                      </button>
                      {formData.screenshotFile && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-400">✓ Image uploaded</span>
                            <button
                                type="button"
                                onClick={removeImage}
                                className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                      )}
                    </div>
                    <p className="text-[10px] text-[#666666] mt-1">Max 5MB • JPG, PNG, GIF</p>
                    {formData.screenshotFile && (
                        <div className="mt-2">
                          <img
                              src={formData.screenshotFile}
                              alt="Screenshot preview"
                              className="max-h-32 rounded-lg border border-[#1a1a1a] object-contain"
                          />
                        </div>
                    )}
                  </div>

                  <button
                      type="submit"
                      className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Report Bug
                  </button>
                </form>
              </div>
            </div>
        )}

        {/* ========== EDIT BUG MODAL ========== */}
        {showEditModal && editingBug && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#111111] pb-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit2 size={20} className="text-[#ff6b00]" />
                    Edit Bug
                  </h2>
                  <button
                      onClick={() => { setShowEditModal(false); setEditingBug(null); resetForm(); }}
                      className="text-[#666666] hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleEditBug} className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Bug Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                        placeholder="Enter bug title"
                        required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Description *</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                        placeholder="Describe the bug"
                        required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Priority</label>
                      <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as BugReport['priority'] })}
                          className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Severity</label>
                      <select
                          value={formData.severity}
                          onChange={(e) => setFormData({ ...formData, severity: e.target.value as BugReport['severity'] })}
                          className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                      >
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                        <option value="Critical">Critical</option>
                        <option value="Blocker">Blocker</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as BugReport['status'] })}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Steps to Reproduce</label>
                    <textarea
                        value={formData.stepsToReproduce}
                        onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                        rows={3}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                        placeholder="Step 1: ...\nStep 2: ..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Expected Result</label>
                      <input
                          type="text"
                          value={formData.expectedResult}
                          onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                          placeholder="What should happen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Actual Result</label>
                      <input
                          type="text"
                          value={formData.actualResult}
                          onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                          placeholder="What actually happened"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Screenshot</label>
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
                          className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-[#2a2a2a]"
                      >
                        <Upload size={16} />
                        {formData.screenshotFile ? 'Change Image' : 'Upload Image'}
                      </button>
                      {formData.screenshotFile && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-400">✓ Image uploaded</span>
                            <button
                                type="button"
                                onClick={removeImage}
                                className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                      )}
                    </div>
                    <p className="text-[10px] text-[#666666] mt-1">Max 5MB • JPG, PNG, GIF</p>
                    {formData.screenshotFile && (
                        <div className="mt-2">
                          <img
                              src={formData.screenshotFile}
                              alt="Screenshot preview"
                              className="max-h-32 rounded-lg border border-[#1a1a1a] object-contain"
                          />
                        </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                        type="submit"
                        className="flex-1 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Update Bug
                    </button>
                    <button
                        type="button"
                        onClick={() => { setShowEditModal(false); setEditingBug(null); resetForm(); }}
                        className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors border border-[#2a2a2a]"
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
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="relative max-w-4xl w-full mx-4">
                <button
                    onClick={() => { setShowScreenshotModal(false); setSelectedScreenshot(null); }}
                    className="absolute -top-12 right-0 text-white hover:text-[#ff6b00] transition-colors"
                >
                  <X size={32} />
                </button>
                <img
                    src={selectedScreenshot}
                    alt="Bug Screenshot"
                    className="w-full rounded-lg max-h-[80vh] object-contain"
                />
                <p className="text-center text-[#666666] text-sm mt-4">Click outside or press ESC to close</p>
              </div>
            </div>
        )}
      </div>
  );
};

export default BugTrackerPage;