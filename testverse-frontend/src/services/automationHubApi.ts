/// <reference types="vite/client" />

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface AutomationProject {
  id: string;
  name: string;
  description?: string;
  framework?: string; // Playwright, Selenium, Cypress, Appium, etc.
  language?: string; // Java, TypeScript, Python, etc.
  ownerId: number;
  ownerName: string;
  ownerEmail?: string;
  testverseProjectId?: string;
  testverseProjectName?: string;
  totalFiles: number;
  totalPackages: number;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  canEdit: boolean;
  requestStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AutomationFile {
  id: string;
  automationProjectId: string;
  fileName: string;
  filePath: string;
  packagePath?: string;
  language?: string;
  content: string;
  version: number;
  ownerId: number;
  lastModifiedById?: number;
  lastModifiedByName?: string;
  lastCommitMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationFileVersion {
  id: string;
  fileId: string;
  automationProjectId: string;
  version: number;
  content: string;
  modifiedById?: number;
  modifiedByName?: string;
  changeSummary?: string;
  createdAt: string;
}

export interface AutomationAccessRequest {
  id: string;
  automationProjectId: string;
  automationProjectName: string;
  userId: number;
  userName: string;
  userRole?: string;
  ownerId: number;
  requestedScope: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface IdeClientInfo {
  id: string;
  name: string;
  status: string;
  version: string;
  pluginCommand: string;
  docs: string;
}

export interface IdeStatusResponse {
  serverUrl: string;
  userEmail: string;
  userName: string;
  supportedIdes: IdeClientInfo[];
}

const getToken = (): string | null => localStorage.getItem('token');

const getHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    let msg = `HTTP error ${response.status}`;
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {
      try {
        const text = await response.text();
        if (text) msg = text;
      } catch {}
    }
    throw new Error(msg);
  }
  return response.json();
};

export const automationHubApi = {
  // Projects
  fetchProjects: async (): Promise<AutomationProject[]> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/projects`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchProjectById: async (projectId: string): Promise<AutomationProject> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/projects/${projectId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createProject: async (data: {
    name: string;
    description?: string;
    framework?: string;
    language?: string;
    testverseProjectId?: string;
    testverseProjectName?: string;
  }): Promise<AutomationProject> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateProject: async (
    projectId: string,
    data: {
      name?: string;
      description?: string;
      framework?: string;
      language?: string;
      testverseProjectId?: string;
      testverseProjectName?: string;
    }
  ): Promise<AutomationProject> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/projects/${projectId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteProject: async (projectId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/projects/${projectId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Files
  fetchProjectFiles: async (projectId: string): Promise<AutomationFile[]> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/projects/${projectId}/files`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchFileById: async (fileId: string): Promise<AutomationFile> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/files/${fileId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  uploadFiles: async (
    projectId: string,
    files: Array<{
      fileName: string;
      filePath: string;
      packagePath?: string;
      language?: string;
      content: string;
      commitMessage?: string;
      expectedVersion?: number;
    }>,
    commitMessage?: string
  ): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/projects/${projectId}/files`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ files, commitMessage }),
    });
    return handleResponse(response);
  },

  updateFile: async (
    fileId: string,
    data: {
      content: string;
      commitMessage?: string;
      expectedVersion?: number;
    }
  ): Promise<AutomationFile> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/files/${fileId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteFile: async (fileId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/files/${fileId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Versions
  fetchFileVersions: async (fileId: string): Promise<AutomationFileVersion[]> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/files/${fileId}/versions`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  revertFileVersion: async (fileId: string, versionNumber: number): Promise<AutomationFile> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/files/${fileId}/revert/${versionNumber}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Access Requests
  requestAccess: async (projectId: string, requestedScope?: string): Promise<AutomationAccessRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/projects/${projectId}/request-access`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ requestedScope: requestedScope || 'PROJECT' }),
    });
    return handleResponse(response);
  },

  fetchOwnerAccessRequests: async (): Promise<AutomationAccessRequest[]> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/access-requests/owner`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateAccessRequestStatus: async (
    requestId: string,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<AutomationAccessRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/access-requests/${requestId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // IDE Connection info
  fetchIdeStatus: async (): Promise<IdeStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/automation/ide/status`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
