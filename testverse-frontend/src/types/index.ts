// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DEVELOPER' | 'TESTER' | 'STUDENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bio?: string;
  points?: number;
  streakDays?: number;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Task Types
export type TaskStatus =
    | 'Planning'
    | 'To Do'
    | 'In Progress'
    | 'Review'
    | 'Done'
    | 'Completed'
    | 'Not Started'
    | 'Accepted'
    | 'Waiting For Review'
    | 'Need Help'
    | 'Changes Requested';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent';

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  url?: string;
  name?: string;
  size?: number;
}

export interface Comment {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
  author?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus | string;
  priority: Priority | string;
  module: string;
  projectName: string;
  assignedTo: number;
  assignedToName?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  tags?: string[];
  attachments?: Attachment[];
  comments?: Comment[];
  mentorName?: string;
  submissionNotes?: string;
  instructions?: string;
}

// Bug Types
export type BugSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED' | 'VERIFIED';

export interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: BugSeverity | string;
  status: BugStatus | string;
  priority: Priority | string;
  reporterId: number;
  reporterName?: string;
  assignedTo?: number;
  assignedToName?: string;
  projectName: string;
  projectId?: number;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  screenshotUrl?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// Notification Types
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'TASK' | 'BUG' | 'MENTION' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// Community Types
export interface CommunityPost {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  codeSnippet?: string;
}

// Chat Types
export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName?: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'CODE';
  isRead: boolean;
  createdAt: string;
}

// Project/Module Types
export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Planning';
  category: string;
  techStack: string[];
  progress: number;
  teamSize?: number;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  tasksCompleted?: number;
  totalTasks?: number;
  dueDate?: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  role: string;
  points: number;
  streakDays: number;
  tasksCompleted: number;
  bugsResolved: number;
  bugsLogged?: number;
  automationSubmissions?: number;
  streak?: number;
  rank: number;
  user?: {
    id: number;
    name: string;
    avatar?: string;
    role: string;
  };
}

// Testing Types
export interface TestScenario {
  id: number;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  actualResult?: string;
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'Ready';
  module: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  testCases?: TestCase[];
  scenarioCode?: string;
  featureName?: string;
  requirementId?: string;
}

export interface TestCase {
  id: number;
  title: string;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResults: string[];
  actualResults?: string[];
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'Ready';
  priority: Priority | string;
  module: string;
  createdBy: number;
  executedBy?: number;
  createdAt: string;
  executedAt?: string;
}

export interface RTMEntry {
  id: number;
  requirementId: string;
  requirementName: string;
  testCaseId: number;
  testCaseTitle: string;
  module: string;
  status: 'COVERED' | 'NOT_COVERED' | 'PARTIAL';
  description?: string;
  scenarioId?: number;
  testCaseIds?: number[];
}

// Notes Types
export interface NoteResource {
  id: number;
  title: string;
  content: string;
  tags: string[];
  category: string;
  userId: number;
  isPublic: boolean;
  isBookmarked?: boolean;
  type?: 'note' | 'resource' | 'file';
  description?: string;
  uploadedBy?: string;
  url?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

// Auth Context Type
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isTester: boolean;
  isStudent: boolean;
  isPending: boolean;
  isApproved: boolean;
  isRejected: boolean;
  hasRole: (roles: string[]) => boolean;
  role?: string;
}