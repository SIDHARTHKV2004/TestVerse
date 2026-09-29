/// <reference types="vite/client" />

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface WorksheetData {
  sheetName: string;
  columns: string[];
  columnWidths?: number[];
  rows: (string | number | null)[][];
}

export interface ManualTestSuiteSummary {
  id: string;
  fileName: string;
  fileType: string;
  ownerId: number;
  ownerName: string;
  ownerEmail?: string;
  totalTestCases: number;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  canEdit: boolean;
  requestStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ManualTestSuiteDetail extends ManualTestSuiteSummary {
  sheetsData: string; // JSON string of WorksheetData[]
}

export interface ManualTestAccessRequest {
  id: string;
  suiteId: string;
  suiteName: string;
  userId: number;
  userName: string;
  userRole?: string;
  ownerId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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

export const manualTestingApi = {
  fetchSuites: async (): Promise<ManualTestSuiteSummary[]> => {
    const response = await fetch(`${API_BASE_URL}/api/manual-testing/suites`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchSuiteById: async (id: string): Promise<ManualTestSuiteDetail> => {
    const response = await fetch(`${API_BASE_URL}/api/manual-testing/suites/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createSuite: async (payload: {
    fileName: string;
    fileType: string;
    totalTestCases: number;
    sheetsData: string;
  }): Promise<ManualTestSuiteDetail> => {
    const response = await fetch(`${API_BASE_URL}/api/manual-testing/suites`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  updateSuite: async (
    id: string,
    payload: { fileName?: string; sheetsData: string; totalTestCases: number }
  ): Promise<ManualTestSuiteDetail> => {
    const response = await fetch(`${API_BASE_URL}/api/manual-testing/suites/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deleteSuite: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/manual-testing/suites/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  requestEditAccess: async (id: string): Promise<ManualTestAccessRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/manual-testing/suites/${id}/request-access`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchOwnerAccessRequests: async (): Promise<ManualTestAccessRequest[]> => {
    const response = await fetch(`${API_BASE_URL}/api/manual-testing/access-requests/owner`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateAccessRequestStatus: async (
    requestId: string,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<ManualTestAccessRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/manual-testing/access-requests/${requestId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};
