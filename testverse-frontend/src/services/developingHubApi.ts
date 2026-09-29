/// <reference types="vite/client" />

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface DevelopingProject {
  id: string;
  name: string;
  description?: string;
  category?: string;
  techStack?: string[];
  progress?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GitHubRepository {
  id: string;
  testverseProjectId?: string;
  testverseProjectName?: string;
  repoName: string;
  ownerLogin: string;
  fullName: string;
  githubUrl: string;
  description?: string;
  defaultBranch: string;
  visibility: string;
  language?: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  connectedById: number;
  connectedByName: string;
  connectedByEmail?: string;
  connectedAt: string;
  updatedAt: string;
}

export interface GitHubBranch {
  name: string;
  isDefault: boolean;
  protected: boolean;
  commitSha?: string;
  githubUrl?: string;
}

export interface GitHubCommit {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  date: string;
  htmlUrl: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  author: string;
  commentsCount: number;
  createdAt: string;
  htmlUrl: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  headBranch: string;
  baseBranch: string;
  createdAt: string;
  htmlUrl: string;
}

export type ResourceType =
  | 'GITHUB_REPO'
  | 'DOCUMENTATION'
  | 'API_DOCS'
  | 'ARCHITECTURE'
  | 'SETUP_GUIDE'
  | 'TOOL'
  | 'TUTORIAL'
  | 'CODING_STANDARD'
  | 'ENVIRONMENT_NOTE';

export interface SharedDevelopmentResource {
  id: string;
  testverseProjectId?: string;
  testverseProjectName?: string;
  title: string;
  description?: string;
  resourceType: ResourceType;
  resourceUrl?: string;
  content?: string;
  tags?: string;
  createdById: number;
  createdByName: string;
  createdByEmail?: string;
  createdAt: string;
  updatedAt: string;
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

export const developingHubApi = {
  // Projects
  fetchProjects: async (): Promise<DevelopingProject[]> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/projects`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchProjectById: async (projectId: string): Promise<DevelopingProject> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/projects/${projectId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Repositories
  fetchAllRepositories: async (): Promise<GitHubRepository[]> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/repositories`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchRepositoriesForProject: async (projectId: string): Promise<GitHubRepository[]> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/projects/${projectId}/repositories`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  connectRepository: async (
    projectId: string,
    data: { repoInput: string; description?: string }
  ): Promise<GitHubRepository> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/projects/${projectId}/repositories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  disconnectRepository: async (repositoryId: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/repositories/${repositoryId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Live GitHub Data (source of truth is GitHub)
  fetchBranches: async (repositoryId: string): Promise<GitHubBranch[]> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/repositories/${repositoryId}/branches`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchCommits: async (repositoryId: string): Promise<GitHubCommit[]> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/repositories/${repositoryId}/commits`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchIssues: async (repositoryId: string): Promise<GitHubIssue[]> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/repositories/${repositoryId}/issues`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchPullRequests: async (repositoryId: string): Promise<GitHubPullRequest[]> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/repositories/${repositoryId}/pull-requests`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Shared Development Resources & Notes
  fetchSharedResources: async (params?: {
    projectId?: string;
    resourceType?: string;
  }): Promise<SharedDevelopmentResource[]> => {
    const query = new URLSearchParams();
    if (params?.projectId) query.append('projectId', params.projectId);
    if (params?.resourceType) query.append('resourceType', params.resourceType);

    const url = `${API_BASE_URL}/api/developing/resources${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createSharedResource: async (data: {
    testverseProjectId?: string;
    testverseProjectName?: string;
    title: string;
    description?: string;
    resourceType: ResourceType;
    resourceUrl?: string;
    content?: string;
    tags?: string;
  }): Promise<SharedDevelopmentResource> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/resources`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateSharedResource: async (
    resourceId: string,
    data: Partial<SharedDevelopmentResource>
  ): Promise<SharedDevelopmentResource> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/resources/${resourceId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteSharedResource: async (resourceId: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/developing/resources/${resourceId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
