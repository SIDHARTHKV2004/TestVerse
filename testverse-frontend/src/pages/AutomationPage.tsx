import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  History,
  Shield,
  ShieldCheck,
  Check,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3,
  Save,
  Trash2,
  Copy,
  Plus,
  Search,
  RefreshCw,
  Laptop,
  Key,
  Users,
  Lock,
  Unlock,
  ExternalLink,
  Clock,
  Settings,
  Rocket,
  Code,
  X,
  User as UserIcon,
  Layers,
  Eye,
  FileUp,
  FolderPlus,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  automationHubApi,
  AutomationProject,
  AutomationFile,
  AutomationFileVersion,
  AutomationAccessRequest,
  IdeStatusResponse
} from '../services/automationHubApi';
import { API_BASE_URL } from '../services/api';

// Legacy script interface for backward compatibility
interface LegacyScript {
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

// File Tree Structure
interface TreeNode {
  name: string;
  fullPath: string;
  type: 'folder' | 'file';
  file?: AutomationFile;
  children: { [key: string]: TreeNode };
}

export const AutomationPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Role Gate check: DEVELOPER and DEVELOPMENT MENTOR cannot access AutomationHub
  const isDevMentor = (user?.role === 'MENTOR') && (
    user?.department === 'DEVELOPMENT' ||
    user?.department?.toUpperCase() === 'DEVELOPMENT' ||
    user?.email?.toLowerCase().includes('devmentor') ||
    user?.name?.toLowerCase().includes('development')
  );
  const isRestrictedDev = !isAdmin && (user?.role === 'DEVELOPER' || isDevMentor);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'source' | 'ide' | 'access' | 'scripts'>('source');

  // Projects & Files state
  const [projects, setProjects] = useState<AutomationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<AutomationProject | null>(null);
  const [files, setFiles] = useState<AutomationFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AutomationFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<{ [path: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // In-browser editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [savingFile, setSavingFile] = useState(false);

  // Modals state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    framework: 'Playwright',
    language: 'Java',
    testverseProjectId: '',
    testverseProjectName: ''
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'files' | 'manual'>('files');
  const [uploadForm, setUploadForm] = useState({
    filePath: '',
    language: 'Java',
    content: '',
    commitMessage: 'Initial file upload'
  });
  const [stagedFiles, setStagedFiles] = useState<
    Array<{ fileName: string; filePath: string; content: string; language: string }>
  >([]);

  // Version History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState<AutomationFileVersion[]>([]);
  const [selectedVersionPreview, setSelectedVersionPreview] = useState<AutomationFileVersion | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Access Requests state
  const [accessRequests, setAccessRequests] = useState<AutomationAccessRequest[]>([]);
  const [requestingAccess, setRequestingAccess] = useState(false);

  // IDE status state
  const [ideInfo, setIdeInfo] = useState<IdeStatusResponse | null>(null);
  const [testingIdeConnection, setTestingIdeConnection] = useState(false);

  // Legacy scripts state
  const [legacyScripts, setLegacyScripts] = useState<LegacyScript[]>([]);
  const [showLegacyModal, setShowLegacyModal] = useState(false);
  const [selectedLegacyScript, setSelectedLegacyScript] = useState<LegacyScript | null>(null);
  const [legacyFormData, setLegacyFormData] = useState({
    name: '',
    description: '',
    framework: 'Playwright',
    code: '',
    projectId: ''
  });

  // 1. Initial Load: Fetch Projects & Legacy Scripts
  useEffect(() => {
    if (!isRestrictedDev) {
      void loadProjects();
      void loadLegacyScripts();
    }
  }, [isRestrictedDev]);

  // Auto-hide banners after 5 seconds
  useEffect(() => {
    if (errorBanner || successBanner) {
      const timer = setTimeout(() => {
        setErrorBanner(null);
        setSuccessBanner(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorBanner, successBanner]);

  // Load files when selected project changes
  useEffect(() => {
    if (selectedProject) {
      void loadFilesForProject(selectedProject.id);
    } else {
      setFiles([]);
      setSelectedFile(null);
    }
  }, [selectedProject?.id]);

  // Load access requests when Access tab is selected
  useEffect(() => {
    if (activeTab === 'access') {
      void loadAccessRequests();
    } else if (activeTab === 'ide') {
      void checkIdeStatus();
    }
  }, [activeTab]);

  // Sync editor content when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      setEditedContent(selectedFile.content || '');
      setIsEditing(false);
      setCommitMessage('');
    }
  }, [selectedFile?.id, selectedFile?.version]);

  // Load Projects
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await automationHubApi.fetchProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching automation projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Files for Project
  const loadFilesForProject = async (projectId: string) => {
    try {
      const fileList = await automationHubApi.fetchProjectFiles(projectId);
      setFiles(fileList);

      // Auto-expand root folders
      const initialExpanded: { [path: string]: boolean } = {};
      fileList.forEach((f) => {
        const parts = f.filePath.split('/');
        let cur = '';
        for (let i = 0; i < parts.length - 1; i++) {
          cur = cur ? `${cur}/${parts[i]}` : parts[i];
          initialExpanded[cur] = true;
        }
      });
      setExpandedFolders((prev) => ({ ...prev, ...initialExpanded }));

      // Select first file if nothing selected
      if (fileList.length > 0) {
        setSelectedFile((prev) => (prev ? fileList.find((f) => f.id === prev.id) || fileList[0] : fileList[0]));
      } else {
        setSelectedFile(null);
      }
    } catch (err: any) {
      console.error('Error loading project files:', err);
    }
  };

  // Load Access Requests
  const loadAccessRequests = async () => {
    try {
      const data = await automationHubApi.fetchOwnerAccessRequests();
      setAccessRequests(data);
    } catch (err) {
      console.error('Error loading access requests:', err);
    }
  };

  // Check IDE status
  const checkIdeStatus = async () => {
    try {
      setTestingIdeConnection(true);
      const data = await automationHubApi.getIdeStatus();
      setIdeInfo(data);
    } catch (err) {
      console.error('Error checking IDE status:', err);
    } finally {
      setTestingIdeConnection(false);
    }
  };

  // Load Legacy Scripts
  const loadLegacyScripts = async () => {
    try {
      const endpoint = isAdmin ? '/api/automation' : '/api/automation/my-scripts';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLegacyScripts(data);
      }
    } catch (err) {
      console.error('Error loading legacy scripts:', err);
    }
  };

  // Handle Create Automation Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await automationHubApi.createProject(newProjectForm);
      setProjects([created, ...projects]);
      setSelectedProject(created);
      setShowNewProjectModal(false);
      setNewProjectForm({
        name: '',
        description: '',
        framework: 'Playwright',
        language: 'Java',
        testverseProjectId: '',
        testverseProjectName: ''
      });
      setSuccessBanner(`Automation project "${created.name}" created successfully!`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to create automation project');
    }
  };

  // Build File Hierarchy Tree
  const fileTree = useMemo(() => {
    const root: { [key: string]: TreeNode } = {};

    const filteredFiles = files.filter((f) =>
      f.filePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filteredFiles.forEach((file) => {
      const parts = file.filePath.split('/');
      let currentLevel = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = index === parts.length - 1;

        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            fullPath: currentPath,
            type: isFile ? 'file' : 'folder',
            file: isFile ? file : undefined,
            children: {}
          };
        }
        currentLevel = currentLevel[part].children;
      });
    });

    return root;
  }, [files, searchQuery]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Save Modified File with Concurrency Check
  const handleSaveFileContent = async () => {
    if (!selectedFile) return;
    try {
      setSavingFile(true);
      setErrorBanner(null);
      const updated = await automationHubApi.updateFile(selectedFile.id, {
        content: editedContent,
        commitMessage: commitMessage.trim() || `Update ${selectedFile.fileName}`,
        expectedVersion: selectedFile.version
      });

      // Update in local files list
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setSelectedFile(updated);
      setIsEditing(false);
      setCommitMessage('');
      setSuccessBanner(`File ${updated.fileName} saved as version v${updated.version}!`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to save file. Someone may have updated it in the meantime.');
    } finally {
      setSavingFile(false);
    }
  };

  // Request Edit Access
  const handleRequestEditAccess = async () => {
    if (!selectedProject) return;
    try {
      setRequestingAccess(true);
      await automationHubApi.requestAccess(selectedProject.id, {
        requestedScope: selectedFile ? selectedFile.filePath : 'PROJECT'
      });
      // Update project status locally
      setSelectedProject({
        ...selectedProject,
        requestStatus: 'PENDING'
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? { ...p, requestStatus: 'PENDING' } : p))
      );
      setSuccessBanner('Edit access request submitted! The project owner has been notified.');
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to request edit access');
    } finally {
      setRequestingAccess(false);
    }
  };

  // Open Version History Modal
  const handleOpenVersionHistory = async () => {
    if (!selectedFile) return;
    try {
      setLoadingVersions(true);
      setShowHistoryModal(true);
      const vers = await automationHubApi.fetchFileVersions(selectedFile.id);
      setVersions(vers);
      if (vers.length > 0) {
        setSelectedVersionPreview(vers[0]);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to load version history');
    } finally {
      setLoadingVersions(false);
    }
  };

  // Revert to Version
  const handleRevertVersion = async (versionNumber: number) => {
    if (!selectedFile) return;
    if (!window.confirm(`Are you sure you want to revert ${selectedFile.fileName} to version v${versionNumber}?`)) {
      return;
    }
    try {
      const reverted = await automationHubApi.revertFileVersion(selectedFile.id, versionNumber);
      setFiles((prev) => prev.map((f) => (f.id === reverted.id ? reverted : f)));
      setSelectedFile(reverted);
      setShowHistoryModal(false);
      setSuccessBanner(`File successfully reverted to version v${versionNumber}!`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to revert file version');
    }
  };

  // Handle Native File Upload
  const handleFolderUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesToStage: Array<{ fileName: string; filePath: string; content: string; language: string }> = [];

    let processed = 0;
    Array.from(fileList).forEach((file) => {
      // webkitRelativePath preserves relative package structure
      const relativePath = (file as any).webkitRelativePath || file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        let lang = 'Plain Text';
        if (ext === '.java') lang = 'Java';
        else if (ext === '.js' || ext === '.jsx') lang = 'JavaScript';
        else if (ext === '.ts' || ext === '.tsx') lang = 'TypeScript';
        else if (ext === '.py') lang = 'Python';
        else if (ext === '.json') lang = 'JSON';
        else if (ext === '.xml') lang = 'XML';
        else if (ext === '.properties') lang = 'Properties';
        else if (ext === '.feature') lang = 'Cucumber Feature';

        filesToStage.push({
          fileName: file.name,
          filePath: relativePath,
          content: text || '',
          language: lang
        });

        processed++;
        if (processed === fileList.length) {
          setStagedFiles(filesToStage);
        }
      };
      reader.readAsText(file);
    });
  };

  // Submit Staged Upload
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      if (uploadMode === 'files') {
        if (stagedFiles.length === 0) {
          setErrorBanner('Please select files or a package directory to upload');
          return;
        }
        await automationHubApi.uploadProjectFiles(selectedProject.id, {
          files: stagedFiles,
          commitMessage: `Batch uploaded ${stagedFiles.length} source file(s)`
        });
        setSuccessBanner(`Successfully synchronized ${stagedFiles.length} file(s) to ${selectedProject.name}`);
      } else {
        if (!uploadForm.filePath || !uploadForm.content) {
          setErrorBanner('File path and content are required');
          return;
        }
        const fileName = uploadForm.filePath.split('/').pop() || 'Untitled';
        await automationHubApi.uploadProjectFiles(selectedProject.id, {
          files: [
            {
              fileName,
              filePath: uploadForm.filePath,
              content: uploadForm.content,
              language: uploadForm.language
            }
          ],
          commitMessage: uploadForm.commitMessage
        });
        setSuccessBanner(`File ${fileName} added to ${selectedProject.name}`);
      }

      setShowUploadModal(false);
      setStagedFiles([]);
      setUploadForm({
        filePath: '',
        language: 'Java',
        content: '',
        commitMessage: 'Initial file upload'
      });
      // Refresh files list
      await loadFilesForProject(selectedProject.id);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to upload files');
    }
  };

  // Approve / Reject Access Request
  const handleUpdateAccessRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await automationHubApi.updateAccessRequestStatus(requestId, status);
      setAccessRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status } : req))
      );
      setSuccessBanner(`Access request has been ${status.toLowerCase()}`);
      if (selectedProject) {
        await loadProjects();
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to update request');
    }
  };

  // Delete File
  const handleDeleteFile = async (file: AutomationFile) => {
    if (!window.confirm(`Are you sure you want to delete ${file.filePath}?`)) return;
    try {
      await automationHubApi.deleteFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (selectedFile?.id === file.id) {
        const remaining = files.filter((f) => f.id !== file.id);
        setSelectedFile(remaining.length > 0 ? remaining[0] : null);
      }
      setSuccessBanner(`File ${file.fileName} removed`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to delete file');
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (nodes: { [key: string]: TreeNode }, depth = 0) => {
    return Object.values(nodes).map((node) => {
      if (node.type === 'folder') {
        const isExpanded = !!expandedFolders[node.fullPath];
        return (
          <div key={node.fullPath} className="select-none">
            <div
              onClick={() => toggleFolder(node.fullPath)}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-100 rounded-md cursor-pointer text-slate-700 text-sm font-medium transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-slate-400 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen size={16} className="text-amber-500 shrink-0" />
              ) : (
                <Folder size={16} className="text-amber-500 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderTreeNode(node.children, depth + 1)}</div>
            )}
          </div>
        );
      } else {
        const isSelected = selectedFile?.id === node.file?.id;
        return (
          <div
            key={node.fullPath}
            onClick={() => node.file && setSelectedFile(node.file)}
            style={{ paddingLeft: `${depth * 16 + 22}px` }}
            className={`flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer text-sm transition-all group ${
              isSelected
                ? 'bg-blue-50 text-[#0062E0] font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <FileCode size={15} className={isSelected ? 'text-[#0062E0]' : 'text-slate-400'} />
              <span className="truncate">{node.name}</span>
            </div>
            {node.file && (
              <span className="text-[10px] text-slate-400 opacity-70 group-hover:opacity-100 px-1 rounded bg-slate-100">
                v{node.file.version}
              </span>
            )}
          </div>
        );
      }
    });
  };

  // Helper for framework icons
  const getFrameworkBadge = (framework?: string) => {
    switch (framework) {
      case 'Playwright':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-xs font-medium">🎭 Playwright</span>;
      case 'Selenium':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-medium">🧪 Selenium</span>;
      case 'Cypress':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs font-medium">🔄 Cypress</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium">💻 {framework || 'Automation'}</span>;
    }
  };

  // Restricted Developer View
  if (isRestrictedDev) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-white border border-blue-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-[#0062E0] rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Access Restricted to Testers & QA Mentors</h2>
          <p className="text-slate-600 text-sm max-w-lg mx-auto">
            AutomationHub is dedicated to test automation suites, test scripts, and QA IDE integrations.
            Your role (<span className="font-semibold text-slate-800">{user?.role === 'MENTOR' ? 'Development Mentor' : 'Developer'}</span>) has full access to <span className="font-semibold text-[#0062E0]">Developer Hub</span> for GitHub repositories, branches, commits, PRs, and software development collaboration.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/developer-hub')}
              className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm inline-flex items-center gap-2 transition-all"
            >
              Go to Developer Hub
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {errorBanner && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span className="text-sm font-medium">{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
            <span className="text-sm font-medium">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-emerald-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0062E0] to-[#0047AB] text-white flex items-center justify-center shadow-md">
              <Code2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AutomationHub</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                IDE Source Code Integration, Package Synchronization & Version Control
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium shadow-xs flex items-center gap-2 transition-all hover:bg-slate-50"
          >
            <Plus size={16} className="text-[#0062E0]" />
            New Automation Project
          </button>

          {selectedProject && (selectedProject.canEdit || selectedProject.isOwner) && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all"
            >
              <Upload size={16} />
              Upload / Sync Source
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-50/60 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('source')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'source'
              ? 'bg-white text-[#0062E0] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers size={16} />
          Source Code Explorer
        </button>

        <button
          onClick={() => setActiveTab('ide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ide'
              ? 'bg-white text-[#0062E0] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Laptop size={16} />
          IDE Connections
          <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
            4 IDEs
          </span>
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'access'
              ? 'bg-white text-[#0062E0] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={16} />
          Access Requests
          {accessRequests.filter((r) => r.status === 'PENDING').length > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
              {accessRequests.filter((r) => r.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'scripts'
              ? 'bg-white text-[#0062E0] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Rocket size={16} />
          Execution Scripts
          <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
            {legacyScripts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SOURCE CODE EXPLORER */}
      {activeTab === 'source' && (
        <div className="space-y-4">
          {/* Project Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Project:
              </label>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const p = projects.find((proj) => proj.id === e.target.value);
                  if (p) setSelectedProject(p);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.framework || 'Automation'})
                  </option>
                ))}
              </select>
              {selectedProject && getFrameworkBadge(selectedProject.framework)}
              {selectedProject?.language && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  {selectedProject.language}
                </span>
              )}
            </div>

            {/* Permission Indicator */}
            {selectedProject && (
              <div className="flex items-center gap-3">
                {selectedProject.isOwner ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck size={14} />
                    Project Owner (Full Control)
                  </span>
                ) : selectedProject.canEdit ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Unlock size={14} />
                    Approved Editor (Edit Mode)
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <Lock size={14} />
                      View Only
                    </span>
                    {selectedProject.requestStatus === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-medium">
                        <Clock size={13} />
                        Edit Access Pending
                      </span>
                    ) : (
                      <button
                        onClick={handleRequestEditAccess}
                        disabled={requestingAccess}
                        className="bg-white border border-[#0062E0] text-[#0062E0] hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Key size={13} />
                        Request Edit Access
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explorer Layout: Tree on Left, Viewer on Right */}
          {projects.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-xs">
              <Code2 size={48} className="mx-auto mb-3 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-800">No Automation Projects Found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                Create your first AutomationHub project to synchronize source code from VS Code, IntelliJ IDEA, Eclipse, or Antigravity.
              </p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="mt-4 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create Automation Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Package / Folder Tree */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[750px]">
                {/* Search & Actions Header */}
                <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Folder size={14} className="text-amber-500" />
                      Package Structure
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {files.length} file{files.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search packages, classes, files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0]"
                    />
                  </div>
                </div>

                {/* Tree View Scroll Area */}
                <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs">
                  {files.length === 0 ? (
                    <div className="text-center py-16 px-4 text-slate-400">
                      <FileCode size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-sans text-sm font-medium text-slate-600">No source files yet</p>
                      <p className="font-sans text-xs text-slate-400 mt-1">
                        Upload packages or synchronize from your IDE.
                      </p>
                      {selectedProject && (selectedProject.canEdit || selectedProject.isOwner) && (
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="mt-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-sans font-medium inline-flex items-center gap-1.5"
                        >
                          <Upload size={14} />
                          Upload Files
                        </button>
                      )}
                    </div>
                  ) : (
                    renderTreeNode(fileTree)
                  )}
                </div>

                {/* Footer Sync Indicator */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    IDE Sync Ready
                  </span>
                  <span className="text-slate-400 font-mono">
                    Owner: {selectedProject?.ownerName || 'Admin'}
                  </span>
                </div>
              </div>

              {/* Right Column: Source Code Viewer & Editor */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[750px]">
                {selectedFile ? (
                  <>
                    {/* Viewer Header */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {selectedFile.filePath}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Version v{selectedFile.version}
                          </span>
                          {selectedFile.language && (
                            <span className="text-xs text-slate-500 font-medium">
                              • {selectedFile.language}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>
                            Last modified: {new Date(selectedFile.updatedAt).toLocaleString()}
                          </span>
                          {selectedFile.lastModifiedByName && (
                            <span>by {selectedFile.lastModifiedByName}</span>
                          )}
                          {selectedFile.lastCommitMessage && (
                            <span className="italic text-slate-500 truncate max-w-xs">
                              "{selectedFile.lastCommitMessage}"
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Viewer Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* History Button */}
                        <button
                          onClick={handleOpenVersionHistory}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all"
                          title="View Version History"
                        >
                          <History size={14} className="text-[#0062E0]" />
                          History (v{selectedFile.version})
                        </button>

                        {/* Copy Code */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedFile.content);
                            setSuccessBanner('Source code copied to clipboard!');
                          }}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all"
                          title="Copy Code"
                        >
                          <Copy size={14} />
                          Copy
                        </button>

                        {/* Download File */}
                        <button
                          onClick={() => {
                            const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = selectedFile.fileName;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all"
                          title="Download File"
                        >
                          <Download size={14} />
                        </button>

                        {/* Edit Mode Toggle (for Owner / Approved Editors) */}
                        {selectedProject && (selectedProject.canEdit || selectedProject.isOwner) && (
                          <>
                            {isEditing ? (
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditedContent(selectedFile.content);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={() => setIsEditing(true)}
                                className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all"
                              >
                                <Edit3 size={14} />
                                Edit Code
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteFile(selectedFile)}
                              className="text-slate-400 hover:text-red-600 p-1.5 transition-colors"
                              title="Delete file"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit Mode Header (Commit message & Save) */}
                    {isEditing && (
                      <div className="p-3 bg-amber-50/70 border-b border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex-1 w-full flex items-center gap-2">
                          <label className="text-xs font-semibold text-amber-900 shrink-0">
                            Commit Summary:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Added login assertions and error handling"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0062E0]"
                          />
                        </div>
                        <button
                          onClick={handleSaveFileContent}
                          disabled={savingFile}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
                        >
                          <Save size={14} />
                          {savingFile ? 'Saving...' : 'Save Changes (v' + (selectedFile.version + 1) + ')'}
                        </button>
                      </div>
                    )}

                    {/* Code Content View / Edit Area */}
                    <div className="flex-1 overflow-auto bg-slate-900 text-slate-100 font-mono text-xs relative">
                      {isEditing ? (
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full h-full bg-slate-900 text-slate-100 p-4 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                          spellCheck={false}
                        />
                      ) : (
                        <div className="flex min-h-full">
                          {/* Line numbers column */}
                          <div className="select-none py-4 px-3 text-right bg-slate-950/60 text-slate-600 border-r border-slate-800 text-[11px] leading-relaxed font-mono min-w-[42px]">
                            {selectedFile.content.split('\n').map((_, i) => (
                              <div key={i}>{i + 1}</div>
                            ))}
                          </div>
                          {/* Code text */}
                          <pre className="p-4 overflow-x-auto leading-relaxed text-slate-200 flex-1 whitespace-pre">
                            {selectedFile.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-slate-400">
                    <Code2 size={48} className="mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-base">Select a source file to view</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Browse packages in the tree on the left or upload source code from your local development environment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IDE CONNECTIONS */}
      {activeTab === 'ide' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-900 to-[#002B66] text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-1 rounded-full border border-blue-700">
                  Universal IDE Connector
                </span>
                <h2 className="text-2xl font-bold mt-2">Connect Your Developer / Tester IDE</h2>
                <p className="text-blue-100/80 text-sm mt-1 max-w-2xl">
                  AutomationHub acts as a centralized source code and version repository for your automated test suites.
                  Keep using your native IDE for authoring while TestVerse manages project storage, version history, permissions, and team review.
                </p>
              </div>
              <button
                onClick={checkIdeStatus}
                disabled={testingIdeConnection}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm font-medium backdrop-blur-xs flex items-center gap-2 transition-all shrink-0"
              >
                <RefreshCw size={16} className={testingIdeConnection ? 'animate-spin' : ''} />
                Test API Gateway
              </button>
            </div>
          </div>

          {/* IDE Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. VS Code */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-[#0062E0] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                      VS
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Visual Studio Code</h3>
                      <p className="text-xs text-slate-500">TestVerse AutomationHub Extension</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle size={13} />
                    API Ready
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-4">
                  Full bidirectional synchronization for Playwright, TypeScript, JavaScript, and Python automation workspaces.
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs font-mono text-slate-700">
                  <div className="text-slate-400 font-sans text-[11px] uppercase tracking-wider font-semibold">
                    Extension Command:
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                    <code>code --install-extension testverse.automationhub</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('code --install-extension testverse.automationhub');
                        setSuccessBanner('Copied VS Code command!');
                      }}
                      className="text-slate-400 hover:text-slate-700 ml-2"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Protocol: REST / Bearer JWT</span>
                <span className="text-[#0062E0] font-medium">Ready for Connection</span>
              </div>
            </div>

            {/* 2. IntelliJ IDEA */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-[#0062E0] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
                      IJ
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">IntelliJ IDEA / JetBrains</h3>
                      <p className="text-xs text-slate-500">TestVerse AutomationHub Plugin</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle size={13} />
                    API Ready
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-4">
                  Optimized for Java Maven / Gradle test suites (Playwright Java, Selenium WebDriver, TestNG, JUnit).
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs font-mono text-slate-700">
                  <div className="text-slate-400 font-sans text-[11px] uppercase tracking-wider font-semibold">
                    Plugin Repository ID:
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                    <code>com.testverse.automationhub.intellij</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('com.testverse.automationhub.intellij');
                        setSuccessBanner('Copied IntelliJ plugin ID!');
                      }}
                      className="text-slate-400 hover:text-slate-700 ml-2"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Protocol: Package Relative Tree</span>
                <span className="text-[#0062E0] font-medium">Ready for Connection</span>
              </div>
            </div>

            {/* 3. Eclipse */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-[#0062E0] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold text-xl">
                      EC
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Eclipse IDE</h3>
                      <p className="text-xs text-slate-500">TestVerse AutomationHub Marketplace Plugin</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle size={13} />
                    API Ready
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-4">
                  Seamless project synchronization for enterprise Java testers and Selenium Automation frameworks.
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs font-mono text-slate-700">
                  <div className="text-slate-400 font-sans text-[11px] uppercase tracking-wider font-semibold">
                    Update Site URL:
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                    <code>http://localhost:8080/api/automation/ide/eclipse</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('http://localhost:8080/api/automation/ide/eclipse');
                        setSuccessBanner('Copied Eclipse Update URL!');
                      }}
                      className="text-slate-400 hover:text-slate-700 ml-2"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Protocol: Eclipse P2 / Workspace Sync</span>
                <span className="text-[#0062E0] font-medium">Ready for Connection</span>
              </div>
            </div>

            {/* 4. Antigravity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-[#0062E0] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-xl">
                      AG
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Antigravity IDE</h3>
                      <p className="text-xs text-slate-500">TestVerse AutomationHub Extension</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle size={13} />
                    API Ready
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-4">
                  Direct workspace integration with Antigravity AI coding assistant and agentic test execution.
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs font-mono text-slate-700">
                  <div className="text-slate-400 font-sans text-[11px] uppercase tracking-wider font-semibold">
                    Antigravity Skill / Sidecar:
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                    <code>agy-skill: automationhub-sync</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('agy-skill: automationhub-sync');
                        setSuccessBanner('Copied Antigravity skill!');
                      }}
                      className="text-slate-400 hover:text-slate-700 ml-2"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Protocol: One TestVerse API Gateway</span>
                <span className="text-[#0062E0] font-medium">Ready for Connection</span>
              </div>
            </div>
          </div>

          {/* IDE Authentication & Configuration Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key size={18} className="text-[#0062E0]" />
              Project Connection Configuration (testverse.json)
            </h3>
            <p className="text-sm text-slate-600">
              Save this configuration file in your local test repository root (e.g. at <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">.testverse/config.json</code>).
              Your IDE extension will automatically authenticate and synchronize files to this AutomationHub project.
            </p>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto relative">
              <button
                onClick={() => {
                  const conf = JSON.stringify(
                    {
                      serverUrl: 'http://localhost:8080',
                      automationProjectId: selectedProject?.id || 'PROJ-1',
                      projectName: selectedProject?.name || 'Playwright Automation',
                      framework: selectedProject?.framework || 'Playwright',
                      userEmail: user?.email || 'developer@testverse.com',
                      syncRules: {
                        includePackages: ['src/test/java/**', 'src/page/**', 'tests/**'],
                        excludePatterns: ['**/target/**', '**/node_modules/**', '**/.git/**']
                      }
                    },
                    null,
                    2
                  );
                  navigator.clipboard.writeText(conf);
                  setSuccessBanner('Copied configuration to clipboard!');
                }}
                className="absolute right-3 top-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all"
              >
                <Copy size={13} />
                Copy Config
              </button>

              <pre>
{`{
  "serverUrl": "http://localhost:8080",
  "automationProjectId": "${selectedProject?.id || 'PROJ-1'}",
  "projectName": "${selectedProject?.name || 'Playwright Automation'}",
  "framework": "${selectedProject?.framework || 'Playwright'}",
  "userEmail": "${user?.email || 'developer@testverse.com'}",
  "syncRules": {
    "includePackages": [
      "src/test/java/**",
      "src/page/**",
      "tests/**"
    ],
    "excludePatterns": [
      "**/target/**",
      "**/node_modules/**",
      "**/.git/**"
    ]
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCESS REQUESTS */}
      {activeTab === 'access' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#0062E0]" />
              AutomationHub Access Requests
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Review and manage edit access requests for your automation projects. Approved users receive edit and package synchronization permissions.
            </p>
          </div>

          {accessRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
              <Shield size={44} className="mx-auto text-slate-300 mb-2.5" />
              <p className="text-slate-700 font-semibold">No Pending Access Requests</p>
              <p className="text-xs text-slate-400 mt-1">
                When viewers request edit permissions for your automation projects, they will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
              {accessRequests.map((req) => (
                <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-slate-900">{req.userName}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {req.userRole || 'Student / Tester'}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Requested edit access to project:{' '}
                      <span className="font-semibold text-slate-800">{req.automationProjectName}</span>
                      {req.requestedScope && req.requestedScope !== 'PROJECT' && (
                        <span> (Scope: {req.requestedScope})</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Submitted on: {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateAccessRequest(req.id, 'APPROVED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateAccessRequest(req.id, 'REJECTED')}
                        className="bg-white border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXECUTION SCRIPTS (LEGACY BACKWARD COMPATIBILITY) */}
      {activeTab === 'scripts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Execution Scripts</h2>
              <p className="text-slate-500 text-sm">
                Single-file automation test runner scripts and test executions.
              </p>
            </div>
            <button
              onClick={() => setShowLegacyModal(true)}
              className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all text-sm"
            >
              <Plus size={16} />
              New Script
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Total Scripts</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{legacyScripts.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Passed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {legacyScripts.filter((s) => s.status === 'Passed').length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {legacyScripts.filter((s) => s.status === 'Failed').length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <p className="text-xs font-medium text-slate-500">In Progress</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {legacyScripts.filter((s) => s.status === 'Running').length}
              </p>
            </div>
          </div>

          {legacyScripts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-xs">
              <Rocket size={44} className="mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-semibold text-slate-900">No automation scripts yet</p>
              <p className="text-sm text-slate-500 mt-1">Create your first test script</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {legacyScripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-[#0062E0] hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedLegacyScript(script)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{script.framework === 'Playwright' ? '🎭' : script.framework === 'Selenium' ? '🧪' : '🔄'}</span>
                        <h3 className="text-slate-900 font-semibold">{script.name}</h3>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{script.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {script.status}
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {script.framework}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <UserIcon size={12} />
                          {script.createdBy?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE AUTOMATION PROJECT */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Code2 size={20} className="text-[#0062E0]" />
                New Automation Project
              </h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Playwright Java Automation"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What test suites and packages does this project contain?"
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Framework
                  </label>
                  <select
                    value={newProjectForm.framework}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, framework: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                  >
                    <option value="Playwright">Playwright</option>
                    <option value="Selenium">Selenium</option>
                    <option value="Cypress">Cypress</option>
                    <option value="Appium">Appium</option>
                    <option value="Cucumber">Cucumber / BDD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Language
                  </label>
                  <select
                    value={newProjectForm.language}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, language: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                  >
                    <option value="Java">Java</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="Python">Python</option>
                    <option value="C#">C#</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD SOURCE FILES / PACKAGES */}
      {showUploadModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Upload size={20} className="text-[#0062E0]" />
                  Upload Source Code to "{selectedProject.name}"
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preserves relative package directories (e.g. <code className="font-mono text-slate-700">src/test/java/page/LoginPage.java</code>)
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Upload Mode Selector */}
            <div className="flex gap-2 my-4 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setUploadMode('files')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  uploadMode === 'files' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Select Files / Directory
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('manual')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  uploadMode === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Paste Single File Code
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {uploadMode === 'files' ? (
                <div className="space-y-4">
                  {/* File Selector Box */}
                  <div className="border-2 border-dashed border-slate-200 hover:border-[#0062E0] rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
                    <FileUp size={36} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      Choose source files or package directory
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports .java, .js, .ts, .py, .json, .xml, .properties, .feature
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-3">
                      <label className="cursor-pointer bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5">
                        <Upload size={14} />
                        Choose Files
                        <input
                          type="file"
                          multiple
                          onChange={handleFolderUploadChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Staged Files Preview */}
                  {stagedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Ready to upload ({stagedFiles.length} file{stagedFiles.length === 1 ? '' : 's'}):</span>
                        <button
                          type="button"
                          onClick={() => setStagedFiles([])}
                          className="text-red-500 hover:text-red-700"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                        {stagedFiles.map((sf, idx) => (
                          <div key={idx} className="p-2 text-xs flex items-center justify-between">
                            <span className="font-mono text-slate-700 truncate max-w-md">
                              {sf.filePath}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {sf.language}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Relative File Path *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. src/test/java/page/LoginPage.java"
                      value={uploadForm.filePath}
                      onChange={(e) => setUploadForm({ ...uploadForm, filePath: e.target.value })}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Language
                      </label>
                      <select
                        value={uploadForm.language}
                        onChange={(e) => setUploadForm({ ...uploadForm, language: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                      >
                        <option value="Java">Java</option>
                        <option value="TypeScript">TypeScript</option>
                        <option value="JavaScript">JavaScript</option>
                        <option value="Python">Python</option>
                        <option value="JSON">JSON</option>
                        <option value="XML">XML</option>
                        <option value="Properties">Properties</option>
                        <option value="Cucumber Feature">Cucumber Feature</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Commit Summary
                      </label>
                      <input
                        type="text"
                        value={uploadForm.commitMessage}
                        onChange={(e) => setUploadForm({ ...uploadForm, commitMessage: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Source Code Content *
                    </label>
                    <textarea
                      rows={8}
                      required
                      placeholder="// Paste file code here..."
                      value={uploadForm.content}
                      onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all"
                >
                  Synchronize to AutomationHub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VERSION HISTORY & RESTORE */}
      {showHistoryModal && selectedFile && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <History size={20} className="text-[#0062E0]" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Version History: {selectedFile.fileName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedFile.filePath}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
              {/* Left: Version List */}
              <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto divide-y divide-slate-100 max-h-[550px]">
                {loadingVersions ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Loading versions...</div>
                ) : versions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No recorded versions.</div>
                ) : (
                  versions.map((ver) => {
                    const isSelected = selectedVersionPreview?.id === ver.id;
                    const isCurrent = ver.version === selectedFile.version;
                    return (
                      <div
                        key={ver.id}
                        onClick={() => setSelectedVersionPreview(ver)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70 border-l-4 border-[#0062E0]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                            Version v{ver.version}
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-normal">
                                Current
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(ver.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                          {ver.changeSummary || 'File update'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Author: {ver.modifiedByName || 'Developer'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right: Version Content Preview */}
              <div className="md:col-span-7 flex flex-col max-h-[550px] bg-slate-900 text-slate-100">
                {selectedVersionPreview ? (
                  <>
                    <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-blue-400">
                          Previewing Version v{selectedVersionPreview.version}
                        </span>
                        <span className="text-slate-400 ml-2">
                          ({selectedVersionPreview.modifiedByName || 'User'})
                        </span>
                      </div>
                      {selectedProject && (selectedProject.canEdit || selectedProject.isOwner) && selectedVersionPreview.version !== selectedFile.version && (
                        <button
                          onClick={() => handleRevertVersion(selectedVersionPreview.version)}
                          className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-3 py-1 rounded text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
                        >
                          <History size={12} />
                          Revert to v{selectedVersionPreview.version}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
                      <pre className="whitespace-pre">{selectedVersionPreview.content}</pre>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    Select a version to inspect code
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: LEGACY SCRIPT CREATION */}
      {showLegacyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Code size={20} className="text-[#0062E0]" />
                Create Execution Script
              </h2>
              <button onClick={() => setShowLegacyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const response = await fetch(`${API_BASE_URL}/api/automation`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      ...legacyFormData,
                      projectId: parseInt(legacyFormData.projectId) || 1
                    })
                  });
                  if (response.ok) {
                    const newScript = await response.json();
                    setLegacyScripts([newScript, ...legacyScripts]);
                    setShowLegacyModal(false);
                    setSuccessBanner('Automation script created successfully!');
                  }
                } catch (err) {
                  console.error('Error creating script:', err);
                }
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Script Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. User Authentication Flow Test"
                  value={legacyFormData.name}
                  onChange={(e) => setLegacyFormData({ ...legacyFormData, name: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={legacyFormData.description}
                  onChange={(e) => setLegacyFormData({ ...legacyFormData, description: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Framework
                  </label>
                  <select
                    value={legacyFormData.framework}
                    onChange={(e) => setLegacyFormData({ ...legacyFormData, framework: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                  >
                    <option value="Playwright">Playwright</option>
                    <option value="Selenium">Selenium</option>
                    <option value="Cypress">Cypress</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Project ID
                  </label>
                  <input
                    type="number"
                    value={legacyFormData.projectId}
                    onChange={(e) => setLegacyFormData({ ...legacyFormData, projectId: e.target.value })}
                    placeholder="Project ID"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062E0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Script Code
                </label>
                <textarea
                  rows={6}
                  value={legacyFormData.code}
                  onChange={(e) => setLegacyFormData({ ...legacyFormData, code: e.target.value })}
                  className="w-full text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded-lg focus:outline-none"
                  placeholder="// Enter automation test script..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLegacyModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all"
                >
                  Create Script
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VIEW LEGACY SCRIPT */}
      {selectedLegacyScript && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <span>{selectedLegacyScript.framework === 'Playwright' ? '🎭' : '🧪'}</span>
                {selectedLegacyScript.name}
              </h3>
              <button onClick={() => setSelectedLegacyScript(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">{selectedLegacyScript.description}</p>
              <div>
                <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Code</label>
                <pre className="mt-1 bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                  {selectedLegacyScript.code}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationPage;