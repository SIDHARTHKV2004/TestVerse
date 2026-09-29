import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Layers,
  Code2,
  FileText,
  Star,
  GitFork,
  CheckCircle,
  X,
  RefreshCw,
  FolderGit2,
  Terminal,
  Share2,
  Link,
  Laptop,
  Users,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Tag,
  Wrench,
  HelpCircle,
  FileCode,
  Eye
} from 'lucide-react';
import {
  developingHubApi,
  DevelopingProject,
  GitHubRepository,
  GitHubBranch,
  GitHubCommit,
  GitHubIssue,
  GitHubPullRequest,
  SharedDevelopmentResource,
  ResourceType
} from '../services/developingHubApi';

export const DevelopingPage: React.FC = () => {
  const { user, isTester, isDeveloper, isMentor, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Role Gate check: TESTER and TESTING MENTOR cannot access Developer Hub
  const isTestingMentor = (isMentor || user?.role === 'MENTOR') && (
    user?.department === 'TESTING' ||
    user?.department?.toUpperCase() === 'TESTING' ||
    (!user?.department && !user?.email?.toLowerCase().includes('devmentor') && !user?.name?.toLowerCase().includes('development'))
  );
  const isRestrictedTester = !isAdmin && (user?.role === 'TESTER' || isTester || isTestingMentor);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'repos' | 'explorer' | 'resources'>('repos');

  // Projects & Repositories State
  const [projects, setProjects] = useState<DevelopingProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DevelopingProject | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);

  // Live GitHub Explorer State
  const [repoTab, setRepoTab] = useState<'branches' | 'commits' | 'issues' | 'pulls'>('branches');
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [loadingRepoData, setLoadingRepoData] = useState(false);

  // Shared Resources State
  const [sharedResources, setSharedResources] = useState<SharedDevelopmentResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [resourceSearch, setResourceSearch] = useState('');
  const [expandedContentId, setExpandedContentId] = useState<string | null>(null);

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectForm, setConnectForm] = useState({
    repoInput: '',
    description: ''
  });
  const [connecting, setConnecting] = useState(false);

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    resourceType: 'DOCUMENTATION' as ResourceType,
    resourceUrl: '',
    content: '',
    tags: ''
  });
  const [savingResource, setSavingResource] = useState(false);

  // Alerts
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    if (!isRestrictedTester) {
      void loadProjects();
      void loadAllRepositories();
      void loadSharedResources();
    }
  }, [isRestrictedTester]);

  // Load project repos when project changes
  useEffect(() => {
    if (selectedProject) {
      void loadRepositoriesForProject(selectedProject.id);
    } else {
      void loadAllRepositories();
    }
  }, [selectedProject?.id]);

  // Load live GitHub data when selected repository or explorer sub-tab changes
  useEffect(() => {
    if (selectedRepo && activeTab === 'explorer') {
      void loadRepoExplorerData(selectedRepo.id, repoTab);
    }
  }, [selectedRepo?.id, repoTab, activeTab]);

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

  // Fetch Projects
  const loadProjects = async () => {
    try {
      const data = await developingHubApi.fetchProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading developing projects:', err);
    }
  };

  // Fetch Repositories
  const loadAllRepositories = async () => {
    try {
      const data = await developingHubApi.fetchAllRepositories();
      setRepositories(data);
      if (data.length > 0 && !selectedRepo) {
        setSelectedRepo(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading repositories:', err);
    }
  };

  const loadRepositoriesForProject = async (projectId: string) => {
    try {
      const data = await developingHubApi.fetchRepositoriesForProject(projectId);
      setRepositories(data);
      if (data.length > 0) {
        setSelectedRepo(data[0]);
      } else {
        setSelectedRepo(null);
      }
    } catch (err: any) {
      console.error('Error loading project repositories:', err);
    }
  };

  // Fetch Shared Resources
  const loadSharedResources = async () => {
    try {
      const data = await developingHubApi.fetchSharedResources();
      setSharedResources(data);
    } catch (err: any) {
      console.error('Error loading shared resources:', err);
    }
  };

  // Fetch Live GitHub Data
  const loadRepoExplorerData = async (
    repoId: string,
    tab: 'branches' | 'commits' | 'issues' | 'pulls'
  ) => {
    setLoadingRepoData(true);
    try {
      if (tab === 'branches') {
        const data = await developingHubApi.fetchBranches(repoId);
        setBranches(data);
      } else if (tab === 'commits') {
        const data = await developingHubApi.fetchCommits(repoId);
        setCommits(data);
      } else if (tab === 'issues') {
        const data = await developingHubApi.fetchIssues(repoId);
        setIssues(data);
      } else if (tab === 'pulls') {
        const data = await developingHubApi.fetchPullRequests(repoId);
        setPullRequests(data);
      }
    } catch (err: any) {
      console.error(`Error loading ${tab}:`, err);
    } finally {
      setLoadingRepoData(false);
    }
  };

  // Connect Repository
  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      setErrorBanner('Please select a TestVerse project to associate this repository');
      return;
    }
    setConnecting(true);
    try {
      const connected = await developingHubApi.connectRepository(selectedProject.id, connectForm);
      setRepositories([connected, ...repositories]);
      setSelectedRepo(connected);
      setShowConnectModal(false);
      setConnectForm({ repoInput: '', description: '' });
      setSuccessBanner(`Repository "${connected.fullName}" connected successfully!`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to connect repository');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Repository
  const handleDisconnectRepo = async (repo: GitHubRepository) => {
    if (!window.confirm(`Disconnect repository ${repo.fullName} from this project?`)) return;
    try {
      await developingHubApi.disconnectRepository(repo.id);
      const remaining = repositories.filter((r) => r.id !== repo.id);
      setRepositories(remaining);
      if (selectedRepo?.id === repo.id) {
        setSelectedRepo(remaining.length > 0 ? remaining[0] : null);
      }
      setSuccessBanner(`Repository ${repo.fullName} disconnected.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to disconnect repository');
    }
  };

  // Create Shared Resource
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingResource(true);
    try {
      const newRes = await developingHubApi.createSharedResource({
        ...resourceForm,
        testverseProjectId: selectedProject?.id,
        testverseProjectName: selectedProject?.name || 'General'
      });
      setSharedResources([newRes, ...sharedResources]);
      setShowResourceModal(false);
      setResourceForm({
        title: '',
        description: '',
        resourceType: 'DOCUMENTATION',
        resourceUrl: '',
        content: '',
        tags: ''
      });
      setSuccessBanner(`Resource "${newRes.title}" shared successfully!`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to share resource');
    } finally {
      setSavingResource(false);
    }
  };

  // Delete Shared Resource
  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Delete this shared resource?')) return;
    try {
      await developingHubApi.deleteSharedResource(id);
      setSharedResources((prev) => prev.filter((r) => r.id !== id));
      setSuccessBanner('Resource removed.');
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to delete resource');
    }
  };

  // Filtered resources
  const filteredResources = sharedResources.filter((res) => {
    const matchCat =
      selectedCategory === 'ALL' || res.resourceType === selectedCategory;
    const matchSearch =
      res.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      (res.description && res.description.toLowerCase().includes(resourceSearch.toLowerCase())) ||
      (res.tags && res.tags.toLowerCase().includes(resourceSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  const getResourceTypeBadge = (type: ResourceType) => {
    switch (type) {
      case 'GITHUB_REPO':
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><FolderGit2 size={12} /> GitHub Repo</span>;
      case 'API_DOCS':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><Terminal size={12} /> API Docs</span>;
      case 'ARCHITECTURE':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><Layers size={12} /> Architecture</span>;
      case 'SETUP_GUIDE':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><Wrench size={12} /> Setup Guide</span>;
      case 'TOOL':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><Laptop size={12} /> Tool</span>;
      case 'ENVIRONMENT_NOTE':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><FileText size={12} /> Env Notes</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><BookOpen size={12} /> {type}</span>;
    }
  };

  // RESTRICTED TESTER VIEW
  if (isRestrictedTester) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-white border border-amber-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Access Restricted to Developers & Development Mentors</h2>
          <p className="text-slate-600 text-sm max-w-lg mx-auto">
            Developer Hub is dedicated to source development, GitHub repository integration, pull request collaboration, and developer notes.
            Your role (<span className="font-semibold text-slate-800">{user?.role === 'MENTOR' ? 'Testing Mentor' : 'Tester'}</span>) has full access to <span className="font-semibold text-[#0062E0]">AutomationHub</span> for automated test suites, scripts, and IDE integrations.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/automation')}
              className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm inline-flex items-center gap-2 transition-all"
            >
              Go to AutomationHub
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-md">
              <FolderGit2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Developer Hub</h1>
                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  GitHub Workspace
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Development collaboration, connected GitHub repositories, branches, pull requests & shared architecture notes
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isAdmin && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowConnectModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              Connect GitHub Repository
            </button>

            <button
              onClick={() => setShowResourceModal(true)}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium shadow-xs flex items-center gap-2 transition-all"
            >
              <Share2 size={15} className="text-[#0062E0]" />
              Share Resource / Note
            </button>
          </div>
        )}
        {isAdmin && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-[#0062E0] px-3.5 py-2 rounded-lg text-xs font-semibold">
            <Eye size={15} />
            Admin View Mode (Monitoring)
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-50/60 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('repos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'repos'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderGit2 size={16} />
          Connected Repositories
          <span className="text-[10px] bg-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded-full">
            {repositories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('explorer')}
          disabled={!selectedRepo}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
            activeTab === 'explorer'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitBranch size={16} />
          GitHub Explorer (Branches & PRs)
          {selectedRepo && (
            <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full truncate max-w-[120px]">
              {selectedRepo.repoName}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'resources'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={16} />
          Shared Resources & Architecture Notes
          <span className="text-[10px] bg-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded-full">
            {sharedResources.length}
          </span>
        </button>
      </div>

      {/* Project Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Project Workspace:
          </span>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((proj) => proj.id === e.target.value);
              if (p) setSelectedProject(p);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-slate-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {selectedProject?.category && (
            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
              {selectedProject.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>GitHub is the Single Source of Truth</span>
        </div>
      </div>

      {/* TAB 1: CONNECTED REPOSITORIES */}
      {activeTab === 'repos' && (
        <div className="space-y-4">
          {repositories.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <FolderGit2 size={48} className="mx-auto mb-3 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-800">No Connected GitHub Repositories</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                Connect your team's GitHub repository to view branches, commits, pull requests, and collaborate with mentors directly inside TestVerse.
              </p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="mt-4 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Connect GitHub Repository
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                          <FolderGit2 size={18} />
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-slate-900 text-base truncate">{repo.repoName}</h3>
                          <p className="text-xs text-slate-400 font-mono truncate">{repo.fullName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {repo.visibility}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 min-h-[32px]">
                      {repo.description || 'Connected GitHub repository'}
                    </p>

                    <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <GitBranch size={13} className="text-slate-400" />
                        {repo.defaultBranch}
                      </span>
                      {repo.language && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600">
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px]">
                        <Star size={12} className="text-amber-500" />
                        {repo.starsCount}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <GitFork size={12} className="text-slate-400" />
                        {repo.forksCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedRepo(repo);
                          setActiveTab('explorer');
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all"
                      >
                        Explore Live
                        <ChevronRight size={13} />
                      </button>

                      <a
                        href={repo.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all"
                      >
                        GitHub
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    {!isAdmin && (
                      <button
                        onClick={() => handleDisconnectRepo(repo)}
                        className="text-slate-400 hover:text-red-600 p-1.5 transition-colors"
                        title="Disconnect repository"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE GITHUB REPOSITORY EXPLORER */}
      {activeTab === 'explorer' && selectedRepo && (
        <div className="space-y-4">
          {/* Active Repo Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                GH
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{selectedRepo.fullName}</h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    branch: {selectedRepo.defaultBranch}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connected by {selectedRepo.connectedByName} • {selectedRepo.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadRepoExplorerData(selectedRepo.id, repoTab)}
                disabled={loadingRepoData}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw size={13} className={loadingRepoData ? 'animate-spin' : ''} />
                Refresh Live Data
              </button>
              <a
                href={selectedRepo.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
              >
                View on GitHub
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Explorer Sub-Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-1">
            <button
              onClick={() => setRepoTab('branches')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                repoTab === 'branches'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GitBranch size={14} />
              Branches
            </button>

            <button
              onClick={() => setRepoTab('commits')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                repoTab === 'commits'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GitCommit size={14} />
              Recent Commits
            </button>

            <button
              onClick={() => setRepoTab('issues')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                repoTab === 'issues'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertCircle size={14} />
              GitHub Issues
            </button>

            <button
              onClick={() => setRepoTab('pulls')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                repoTab === 'pulls'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GitPullRequest size={14} />
              Pull Requests
            </button>
          </div>

          {/* Sub-Tab Content View */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {loadingRepoData ? (
              <div className="p-16 text-center text-slate-400">
                <RefreshCw size={32} className="mx-auto mb-2 animate-spin text-slate-300" />
                <p className="text-sm font-medium text-slate-600">Querying live data from GitHub...</p>
              </div>
            ) : (
              <>
                {/* 1. BRANCHES */}
                {repoTab === 'branches' && (
                  <div className="divide-y divide-slate-100">
                    {branches.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">No branches retrieved.</div>
                    ) : (
                      branches.map((b, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <GitBranch size={16} className="text-slate-400" />
                            <span className="font-mono font-semibold text-slate-900 text-sm">{b.name}</span>
                            {b.isDefault && (
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                                default
                              </span>
                            )}
                            {b.protected && (
                              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded">
                                protected
                              </span>
                            )}
                          </div>
                          {b.githubUrl && (
                            <a
                              href={b.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
                            >
                              Browse Branch
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 2. COMMITS */}
                {repoTab === 'commits' && (
                  <div className="divide-y divide-slate-100">
                    {commits.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">No recent commits found.</div>
                    ) : (
                      commits.map((c, i) => (
                        <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                {c.shortSha}
                              </span>
                              <span className="font-medium text-slate-900 text-sm">{c.message}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Authored by <span className="font-medium text-slate-600">{c.authorName}</span> on{' '}
                              {c.date ? new Date(c.date).toLocaleString() : ''}
                            </p>
                          </div>
                          <a
                            href={c.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 shrink-0"
                          >
                            View Commit
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. ISSUES */}
                {repoTab === 'issues' && (
                  <div className="divide-y divide-slate-100">
                    {issues.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">No issues found on GitHub.</div>
                    ) : (
                      issues.map((issue) => (
                        <div key={issue.number} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">#{issue.number}</span>
                              <span className="font-semibold text-slate-900 text-sm">{issue.title}</span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  issue.state === 'open'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                {issue.state}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Opened by {issue.author} • {issue.commentsCount} comment{issue.commentsCount === 1 ? '' : 's'}
                            </p>
                          </div>
                          <a
                            href={issue.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 shrink-0"
                          >
                            Review on GitHub
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. PULL REQUESTS */}
                {repoTab === 'pulls' && (
                  <div className="divide-y divide-slate-100">
                    {pullRequests.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">No pull requests found on GitHub.</div>
                    ) : (
                      pullRequests.map((pr) => (
                        <div key={pr.number} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">#{pr.number}</span>
                              <span className="font-semibold text-slate-900 text-sm">{pr.title}</span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  pr.state === 'open'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                {pr.state}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              By {pr.author} • <span className="font-mono">{pr.headBranch}</span> →{' '}
                              <span className="font-mono">{pr.baseBranch}</span>
                            </p>
                          </div>
                          <a
                            href={pr.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 shrink-0"
                          >
                            Review on GitHub
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SHARED DEVELOPMENT RESOURCES & NOTES */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'ALL', label: 'All Resources' },
                { id: 'GITHUB_REPO', label: 'Repos' },
                { id: 'DOCUMENTATION', label: 'Docs' },
                { id: 'API_DOCS', label: 'API Specs' },
                { id: 'ARCHITECTURE', label: 'Architecture' },
                { id: 'SETUP_GUIDE', label: 'Setup Guides' },
                { id: 'ENVIRONMENT_NOTE', label: 'Notes' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources, tags..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Resources List */}
          {filteredResources.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <BookOpen size={44} className="mx-auto mb-2.5 text-slate-300" />
              <p className="font-semibold text-slate-800">No Development Resources Found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Share documentation, API specifications, setup guides, or architecture notes with developers and mentors.
              </p>
              <button
                onClick={() => setShowResourceModal(true)}
                className="mt-4 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} />
                Share First Resource
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((res) => {
                const isExpanded = expandedContentId === res.id;
                return (
                  <div
                    key={res.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        {getResourceTypeBadge(res.resourceType)}
                        <span className="text-[11px] text-slate-400">
                          {new Date(res.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mt-2.5">{res.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                        {res.description || 'No description provided'}
                      </p>

                      {res.tags && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-3">
                          {res.tags.split(',').map((t, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono"
                            >
                              #{t.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expandable Content Area */}
                      {res.content && (
                        <div className="mt-3">
                          {isExpanded ? (
                            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                              {res.content}
                            </div>
                          ) : null}
                          <button
                            onClick={() => setExpandedContentId(isExpanded ? null : res.id)}
                            className="mt-1.5 text-xs text-[#0062E0] font-medium hover:underline"
                          >
                            {isExpanded ? 'Hide Notes' : 'Read Detailed Notes / Guide →'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>By {res.createdByName}</span>
                      <div className="flex items-center gap-2">
                        {res.resourceUrl && (
                          <a
                            href={res.resourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1"
                          >
                            Visit Link
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {(res.createdById === user?.id || isAdmin || isMentor) && (
                          <button
                            onClick={() => handleDeleteResource(res.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Delete resource"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CONNECT GITHUB REPOSITORY */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderGit2 size={20} className="text-slate-900" />
                <h3 className="font-bold text-slate-900 text-base">Connect GitHub Repository</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConnectRepo} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  GitHub Repository (URL or owner/repo) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SIDHARTHKV2004/TestVerse or https://github.com/owner/repo"
                  value={connectForm.repoInput}
                  onChange={(e) => setConnectForm({ ...connectForm, repoInput: e.target.value })}
                  className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Connect public or team repositories without storing passwords or private tokens.
                </p>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Core microservices backend for TestVerse"
                  value={connectForm.description}
                  onChange={(e) => setConnectForm({ ...connectForm, description: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">GitHub as Source of Truth:</p>
                <p className="text-[11px] text-slate-500">
                  DevelopingHub retrieves branches, commits, and pull requests directly from GitHub without duplicating Git history.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  {connecting ? 'Connecting...' : 'Connect Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SHARE DEVELOPMENT RESOURCE / NOTE */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Share2 size={20} className="text-[#0062E0]" />
                <h3 className="font-bold text-slate-900 text-base">Share Resource or Architecture Note</h3>
              </div>
              <button
                onClick={() => setShowResourceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Architecture & Authentication Flow"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={resourceForm.resourceType}
                    onChange={(e) =>
                      setResourceForm({ ...resourceForm, resourceType: e.target.value as ResourceType })
                    }
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                  >
                    <option value="DOCUMENTATION">Documentation</option>
                    <option value="API_DOCS">API Documentation</option>
                    <option value="ARCHITECTURE">Architecture Diagram / Guide</option>
                    <option value="SETUP_GUIDE">Setup & Run Guide</option>
                    <option value="GITHUB_REPO">GitHub Repository</option>
                    <option value="TOOL">Tool / Library</option>
                    <option value="TUTORIAL">Tutorial</option>
                    <option value="CODING_STANDARD">Coding Standard</option>
                    <option value="ENVIRONMENT_NOTE">Environment Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    External Link / URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={resourceForm.resourceUrl}
                    onChange={(e) => setResourceForm({ ...resourceForm, resourceUrl: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Brief Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="What is this resource or guide about?"
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Detailed Notes / Guide Content
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste Markdown, setup steps, commands, architecture details, or environment notes..."
                  value={resourceForm.content}
                  onChange={(e) => setResourceForm({ ...resourceForm, content: e.target.value })}
                  className="w-full text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="backend, spring-boot, security, setup"
                  value={resourceForm.tags}
                  onChange={(e) => setResourceForm({ ...resourceForm, tags: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResource}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  {savingResource ? 'Saving...' : 'Share Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopingPage;
