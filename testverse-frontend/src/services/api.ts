// API Service for TestVerse Backend

const API_BASE_URL = 'http://localhost:8080';

// ==================== Types ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
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

export interface Project {
  id?: number;
  name: string;
  description: string;
  status: string;
  techStack: string[];
  progress: number;
  category: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BugReport {
  id?: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  severity: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  reporterId?: number;
  reporterName?: string;
  assigneeName?: string;
  projectName?: string;
  screenshotUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Auth API ====================
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    return response.json();
  },

  register: async (userData: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Registration failed');
    }

    return response.json();
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getUser: (): LoginResponse | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

// ==================== Task API ====================
export const fetchTasks = async (): Promise<Task[]> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
};

export const createTask = async (taskData: any): Promise<Task> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create task');
  }

  return response.json();
};

export const updateTask = async (id: number, taskData: any): Promise<Task> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to update task');
  }

  return response.json();
};

export const deleteTask = async (id: number): Promise<void> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete task');
  }
};

// ==================== Project API ====================
export const fetchProjects = async (): Promise<Project[]> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
};

export const createProject = async (projectData: any): Promise<Project> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create project');
  }

  return response.json();
};

export const updateProject = async (id: number, projectData: any): Promise<Project> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to update project');
  }

  return response.json();
};

export const deleteProject = async (id: number): Promise<void> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete project');
  }
};

// ==================== Bug API ====================
export const fetchBugs = async (): Promise<BugReport[]> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/bugs`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch bugs');
  return response.json();
};

export const createBug = async (bugData: any): Promise<BugReport> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/bugs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bugData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create bug');
  }

  return response.json();
};

export const updateBugStatus = async (id: number, status: string): Promise<BugReport> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/bugs/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to update bug status');
  }

  return response.json();
};

export const deleteBug = async (id: number): Promise<void> => {
  const token = authApi.getToken();
  const response = await fetch(`${API_BASE_URL}/api/bugs/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete bug');
  }
};

// ==================== Protected API ====================
export const protectedApi = {
  get: async (endpoint: string): Promise<any> => {
    const token = authApi.getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    return response.json();
  },

  post: async (endpoint: string, data: any): Promise<any> => {
    const token = authApi.getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    return response.json();
  },

  put: async (endpoint: string, data: any): Promise<any> => {
    const token = authApi.getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    return response.json();
  },

  delete: async (endpoint: string): Promise<any> => {
    const token = authApi.getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    return response.json();
  },
};

// Default export for convenience
export default {
  auth: authApi,
  tasks: { fetchTasks, createTask, updateTask, deleteTask },
  projects: { fetchProjects, createProject, updateProject, deleteProject },
  bugs: { fetchBugs, createBug, updateBugStatus, deleteBug },
  protected: protectedApi,
};