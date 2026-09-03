// API Service for TestVerse Backend

// ✅ Fix: Use import.meta.env with proper TypeScript support
// Add this line at the top to fix the import.meta.env error
/// <reference types="vite/client" />

// ✅ Use environment variable for production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  reporterId?: number;
  reporterName?: string;
  assigneeName?: string;
  projectName?: string;
  screenshotUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Helper: Get Token ====================
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// ==================== Helper: Get Headers ====================
const getHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// ==================== Helper: Handle Response ====================
const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      console.error('❌ Authentication error - Redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    let errorMessage = `API call failed: ${response.status}`;
    try {
      const errorData = await response.text();
      if (errorData) {
        errorMessage = errorData;
      }
    } catch (_) {
      // Ignore
    }
    throw new Error(errorMessage);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return null;
  }

  try {
    return await response.json();
  } catch (_) {
    return await response.text();
  }
};

// ==================== Auth API ====================
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        name: data.name,
        role: data.role,
      }));
    }

    return data;
  },

  register: async (userData: any): Promise<any> => {
    console.log('📤 Registering user:', userData);

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      let errorMessage = 'Registration failed';
      try {
        const errorData = await response.text();
        if (errorData) {
          errorMessage = errorData;
        }
      } catch (_) {
        // Ignore
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('📥 Registration response:', data);

    return data;
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  } catch (error: any) {
    console.error('❌ Fetch tasks error:', error);
    throw new Error(error.message || 'Failed to fetch tasks');
  }
};

export const createTask = async (taskData: any): Promise<Task> => {
  try {
    const token = getToken();
    console.log('🔑 Token present:', !!token);
    console.log('📤 Creating task with data:', taskData);

    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Session expired. Please login again.');
      }

      throw new Error(errorText || `Failed to create task (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('✅ Task created:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Create task error:', error);
    throw new Error(error.message || 'Network error. Please check if backend is running on port 8080.');
  }
};

export const updateTask = async (id: number, taskData: any): Promise<Task> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(response);
  } catch (error: any) {
    console.error('❌ Update task error:', error);
    throw new Error(error.message || 'Failed to update task');
  }
};

export const deleteTask = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(response);
  } catch (error: any) {
    console.error('❌ Delete task error:', error);
    throw new Error(error.message || 'Failed to delete task');
  }
};

// ==================== Project API ====================
export const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createProject = async (projectData: any): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(projectData),
  });
  return handleResponse(response);
};

export const updateProject = async (id: number, projectData: any): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(projectData),
  });
  return handleResponse(response);
};

export const deleteProject = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  await handleResponse(response);
};

// ==================== Bug API ====================
export const fetchBugs = async (): Promise<BugReport[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bugs`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  } catch (error: any) {
    console.error('❌ Fetch bugs error:', error);
    throw new Error(error.message || 'Failed to fetch bugs');
  }
};

export const createBug = async (bugData: any): Promise<BugReport> => {
  try {
    const token = getToken();
    console.log('🔑 Token present:', !!token);
    console.log('📤 Creating bug with data:', bugData);

    const response = await fetch(`${API_BASE_URL}/api/bugs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bugData),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Session expired. Please login again.');
      }

      throw new Error(errorText || `Failed to create bug (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('✅ Bug created:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Create bug error:', error);
    throw new Error(error.message || 'Network error. Please check if backend is running on port 8080.');
  }
};

export const updateBug = async (id: number, bugData: any): Promise<BugReport> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bugs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(bugData),
    });
    return handleResponse(response);
  } catch (error: any) {
    console.error('❌ Update bug error:', error);
    throw new Error(error.message || 'Failed to update bug');
  }
};

export const updateBugStatus = async (id: number, status: string): Promise<BugReport> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bugs/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  } catch (error: any) {
    console.error('❌ Update bug status error:', error);
    throw new Error(error.message || 'Failed to update bug status');
  }
};

export const deleteBug = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bugs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(response);
  } catch (error: any) {
    console.error('❌ Delete bug error:', error);
    throw new Error(error.message || 'Failed to delete bug');
  }
};

// ==================== Team API ====================
export const fetchTeams = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createTeam = async (teamData: any): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(teamData),
  });
  return handleResponse(response);
};

// ==================== Notification API ====================
export const fetchNotifications = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
    method: 'PUT',
    headers: getHeaders(),
  });
  await handleResponse(response);
};

// ==================== Community API ====================
export const fetchCommunityPosts = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/api/community/posts`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createCommunityPost = async (postData: any): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/community/posts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(postData),
  });
  return handleResponse(response);
};

// ==================== Protected API (Generic) ====================
export const protectedApi = {
  get: async (endpoint: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== Debug Helper ====================
export const debugAuth = (): void => {
  console.log('🔍 Debug Auth:');
  console.log('  Token:', localStorage.getItem('token')?.substring(0, 30) + '...' || '❌ No token');
  console.log('  User:', localStorage.getItem('user') || '❌ No user');
  console.log('  Is Authenticated:', authApi.isAuthenticated());
};

// ==================== Default Export ====================
const api = {
  auth: authApi,
  tasks: { fetchTasks, createTask, updateTask, deleteTask },
  projects: { fetchProjects, createProject, updateProject, deleteProject },
  bugs: { fetchBugs, createBug, updateBug, updateBugStatus, deleteBug },
  teams: { fetchTeams, createTeam },
  notifications: { fetchNotifications, markNotificationAsRead },
  community: { fetchCommunityPosts, createCommunityPost },
  protected: protectedApi,
  debug: debugAuth,
  get: protectedApi.get,
  post: protectedApi.post,
  put: protectedApi.put,
  delete: protectedApi.delete,
};

export default api;