// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  avatarUrl?: string;
  bio?: string;
  points?: number;
  streakDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Task Types
export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'To Do' | 'Planning' | 'In Progress' | 'Review' | 'Done';
  dueDate?: string;
  projectId?: number;
  mentorId?: number;
  assignedStudentId?: number;
  moduleName?: string;
  instructions?: string;
  submissionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Project Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  category: string;
  techStack?: string;
  progress?: number;
  mentorId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Bug Report Types
export interface BugReport {
  id: number;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: 'Minor' | 'Major' | 'Critical' | 'Blocker';
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  assigneeId?: number;
  reporterId: number;
  projectId?: number;
  screenshotUrl?: string;
  videoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Community Post Types
export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  authorId: number;
  tags?: string[];
  codeSnippet?: string;
  codeLanguage?: string;
  linkUrl?: string;
  images?: string[];
  isPinned?: boolean;
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Community Comment Types
export interface CommunityComment {
  id: number;
  content: string;
  authorId: number;
  postId: number;
  parentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Message Types
export interface Message {
  id: number;
  content: string;
  senderId: number;
  recipientId: number;
  isSeen?: boolean;
  createdAt?: string;
}

// Notification Types
export interface Notification {
  id: number;
  title: string;
  message: string;
  userId: number;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

// Submission Types
export interface Submission {
  id: number;
  title: string;
  studentId: number;
  taskId?: number;
  projectId?: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Review';
  reportUrl?: string;
  zipFileUrl?: string;
  zipFileName?: string;
  fileSize?: string;
  documentType?: string;
  framework?: string;
  duration?: string;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  mentorFeedback?: string;
  submittedAt?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

export interface RegisterResponse {
  message: string;
  userId?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalProjects: number;
  activeProjects: number;
  totalBugs: number;
  openBugs: number;
  resolvedBugs: number;
  notifications: number;
  communityPosts: number;
  points: number;
  streakDays: number;
}

// Filter Types
export interface TaskFilter {
  status?: Task['status'];
  priority?: Task['priority'];
  search?: string;
  projectId?: number;
  assignedToMe?: boolean;
}

export interface BugFilter {
  status?: BugReport['status'];
  priority?: BugReport['priority'];
  severity?: BugReport['severity'];
  search?: string;
  projectId?: number;
  assignedToMe?: boolean;
}

// Component Props Types
export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path?: string;
  children?: NavItem[];
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Form Types
export interface TaskFormData {
  title: string;
  description?: string;
  priority: Task['priority'];
  status: Task['status'];
  dueDate?: string;
  projectId?: number;
  assignedStudentId?: number;
  moduleName?: string;
  instructions?: string;
}

export interface BugFormData {
  title: string;
  description: string;
  priority: BugReport['priority'];
  severity: BugReport['severity'];
  status: BugReport['status'];
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  projectId?: number;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  category: string;
  techStack?: string;
}