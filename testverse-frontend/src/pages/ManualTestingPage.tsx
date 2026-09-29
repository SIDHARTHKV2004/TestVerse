import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Plus,
  Check,
  CheckCircle2,
  X,
  Clock,
  ArrowLeft,
  Save,
  Layers,
  Lock,
  Unlock,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  manualTestingApi,
  ManualTestSuiteSummary,
  ManualTestSuiteDetail,
  ManualTestAccessRequest,
  WorksheetData,
} from '../services/manualTestingApi';
import { parseSpreadsheetFile, parseCSVText } from '../utils/spreadsheetParser';

export const ManualTestingPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user ? (user.id ?? user.userId) : null;

  // Navigation & View state
  const [suites, setSuites] = useState<ManualTestSuiteSummary[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<ManualTestSuiteDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

  // Edit Access Requests for sheets owned by this user
  const [ownerRequests, setOwnerRequests] = useState<ManualTestAccessRequest[]>([]);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  // In-memory working copy of worksheets for current suite
  const [workingSheets, setWorkingSheets] = useState<WorksheetData[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [requestingAccess, setRequestingAccess] = useState<boolean>(false);

  // File Renaming State
  const [isRenamingFile, setIsRenamingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');

  // Column Renaming State
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string>('');

  // Search & Filter in suite list
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewSheets, setUploadPreviewSheets] = useState<WorksheetData[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmittingUpload, setIsSubmittingUpload] = useState<boolean>(false);

  // Google Sheets Tab in Upload Modal
  const [uploadMode, setUploadMode] = useState<'file' | 'googlesheets'>('file');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState<string>('');
  const [googleSheetsLoading, setGoogleSheetsLoading] = useState<boolean>(false);

  // Toast / Status Message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show temporary status notification
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // Load all suites and owner access requests
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [suitesData, requestsData] = await Promise.all([
        manualTestingApi.fetchSuites().catch(() => [] as ManualTestSuiteSummary[]),
        manualTestingApi.fetchOwnerAccessRequests().catch(() => [] as ManualTestAccessRequest[]),
      ]);
      setSuites(Array.isArray(suitesData) ? suitesData : []);
      setOwnerRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err: any) {
      console.error('Failed to load manual testing data:', err);
      showToast(err.message || 'Failed to load test suites', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Strict Permissions calculation for currently selected suite
  const isOwner = Boolean(
    selectedSuite &&
    ((selectedSuite.ownerId != null && currentUserId != null && String(selectedSuite.ownerId) === String(currentUserId)) ||
      selectedSuite.isOwner === true)
  );

  const isApprovedEditor = Boolean(
    selectedSuite &&
    !isOwner &&
    (selectedSuite.requestStatus === 'APPROVED' || selectedSuite.canEdit === true)
  );

  const canEdit = isOwner || isApprovedEditor;

  // Open a specific test suite spreadsheet
  const handleOpenSuite = async (suiteId: string) => {
    try {
      setIsLoading(true);
      const detail = await manualTestingApi.fetchSuiteById(suiteId);
      setSelectedSuite(detail);

      let parsedSheets: WorksheetData[] = [];
      try {
        parsedSheets = JSON.parse(detail.sheetsData || '[]');
      } catch (e) {
        console.error('Failed to parse sheetsData JSON:', e);
      }

      if (!parsedSheets || parsedSheets.length === 0) {
        parsedSheets = [
          {
            sheetName: 'Sheet1',
            columns: ['Test Case ID', 'Test Scenario', 'Steps', 'Expected Result', 'Status'],
            columnWidths: [140, 240, 280, 280, 140],
            rows: [],
          },
        ];
      }

      // Ensure every sheet has columnWidths array initialized
      parsedSheets = parsedSheets.map((sheet) => {
        const defaultWidths = sheet.columns.map(() => 180);
        return {
          ...sheet,
          columnWidths:
            Array.isArray(sheet.columnWidths) && sheet.columnWidths.length === sheet.columns.length
              ? sheet.columnWidths
              : defaultWidths,
        };
      });

      setWorkingSheets(parsedSheets);
      setActiveSheetIndex(0);
      setIsDirty(false);
      setIsRenamingFile(false);
      setEditingColumnIndex(null);
    } catch (err: any) {
      console.error('Failed to open suite:', err);
      showToast(err.message || 'Failed to open test suite', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Back to suite list
  const handleBackToList = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Discard them and return to suites list?')) {
        return;
      }
    }
    setSelectedSuite(null);
    setWorkingSheets([]);
    setIsDirty(false);
    setIsRenamingFile(false);
    setEditingColumnIndex(null);
    loadData();
  };

  // Handle cell value change in working copy (Only for authorized editors)
  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    if (!canEdit) return;

    setWorkingSheets((prev) => {
      const updated = [...prev];
      const activeSheet = { ...updated[activeSheetIndex] };
      const activeRows = activeSheet.rows.map((r) => [...r]);

      if (!activeRows[rowIndex]) {
        activeRows[rowIndex] = new Array(activeSheet.columns.length).fill('');
      }

      activeRows[rowIndex][colIndex] = newValue;
      activeSheet.rows = activeRows;
      updated[activeSheetIndex] = activeSheet;
      return updated;
    });

    setIsDirty(true);
  };

  // Add a new row to active sheet (Only for authorized editors)
  const handleAddRow = () => {
    if (!canEdit) return;

    setWorkingSheets((prev) => {
      const updated = [...prev];
      const activeSheet = { ...updated[activeSheetIndex] };
      const newRow = new Array(activeSheet.columns.length).fill('');
      const rowCount = activeSheet.rows.length + 1;
      newRow[0] = `TC_${String(rowCount).padStart(3, '0')}`;
      activeSheet.rows = [...activeSheet.rows, newRow];
      updated[activeSheetIndex] = activeSheet;
      return updated;
    });

    setIsDirty(true);
  };

  // Column Renaming
  const handleStartRenameColumn = (colIndex: number, currentName: string) => {
    if (!canEdit) return;
    setEditingColumnIndex(colIndex);
    setEditingColumnName(currentName);
  };

  const handleSaveColumnName = (colIndex: number) => {
    const trimmed = editingColumnName.trim();
    if (!trimmed) {
      setEditingColumnIndex(null);
      return;
    }

    setWorkingSheets((prev) => {
      const updated = [...prev];
      const activeSheet = { ...updated[activeSheetIndex] };
      const cols = [...activeSheet.columns];
      cols[colIndex] = trimmed;
      activeSheet.columns = cols;
      updated[activeSheetIndex] = activeSheet;
      return updated;
    });

    setEditingColumnIndex(null);
    setIsDirty(true);
  };

  // Column Resizing (Drag boundary)
  const handleMouseDownResize = (e: React.MouseEvent, colIndex: number) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const currentWidth =
      workingSheets[activeSheetIndex]?.columnWidths?.[colIndex] || 180;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(90, currentWidth + delta);

      setWorkingSheets((prev) => {
        const updated = [...prev];
        const sheet = { ...updated[activeSheetIndex] };
        const widths = [...(sheet.columnWidths || sheet.columns.map(() => 180))];
        widths[colIndex] = newWidth;
        sheet.columnWidths = widths;
        updated[activeSheetIndex] = sheet;
        return updated;
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsDirty(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // File / Spreadsheet Renaming
  const handleStartRenameFile = () => {
    if (!canEdit || !selectedSuite) return;
    setNewFileName(selectedSuite.fileName);
    setIsRenamingFile(true);
  };

  const handleSaveFileName = () => {
    const trimmed = newFileName.trim();
    if (!trimmed || !selectedSuite) {
      setIsRenamingFile(false);
      return;
    }

    setSelectedSuite((prev) => (prev ? { ...prev, fileName: trimmed } : null));
    setIsRenamingFile(false);
    setIsDirty(true);
    showToast(`Spreadsheet renamed to "${trimmed}". Click "Save Changes" to persist.`);
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    if (!selectedSuite || !canEdit) return;

    try {
      setIsSaving(true);
      const totalCases = workingSheets.reduce((sum, s) => sum + (s.rows?.length || 0), 0);
      const updated = await manualTestingApi.updateSuite(selectedSuite.id, {
        fileName: selectedSuite.fileName,
        sheetsData: JSON.stringify(workingSheets),
        totalTestCases: totalCases,
      });

      setSelectedSuite((prev) => (prev ? { ...prev, ...updated, canEdit: true } : updated));
      setIsDirty(false);
      showToast('Changes saved successfully to database!');

      // Also update in list state
      setSuites((prev) =>
        prev.map((s) =>
          s.id === updated.id
            ? { ...s, fileName: updated.fileName, totalTestCases: updated.totalTestCases }
            : s
        )
      );
    } catch (err: any) {
      console.error('Failed to save changes:', err);
      showToast(err.message || 'Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Request Edit Access
  const handleRequestEditAccess = async () => {
    if (!selectedSuite) return;

    try {
      setRequestingAccess(true);
      await manualTestingApi.requestEditAccess(selectedSuite.id);
      setSelectedSuite((prev) =>
        prev ? { ...prev, requestStatus: 'PENDING' } : null
      );
      showToast('Edit access requested! The owner has been notified.');
      loadData();
    } catch (err: any) {
      console.error('Request edit access error:', err);
      showToast(err.message || 'Failed to request edit access', 'error');
    } finally {
      setRequestingAccess(false);
    }
  };

  // Owner approves / rejects edit access request
  const handleUpdateAccessRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setIsApproving(requestId);
      await manualTestingApi.updateAccessRequestStatus(requestId, status);
      showToast(`Access request ${status.toLowerCase()} successfully.`);

      const requests = await manualTestingApi.fetchOwnerAccessRequests();
      setOwnerRequests(requests);

      if (selectedSuite) {
        const refreshed = await manualTestingApi.fetchSuiteById(selectedSuite.id);
        setSelectedSuite(refreshed);
      }
    } catch (err: any) {
      console.error('Failed to update request:', err);
      showToast(err.message || 'Failed to process request', 'error');
    } finally {
      setIsApproving(null);
    }
  };

  // Delete suite (Owner only)
  const handleDeleteSuite = async (suiteId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await manualTestingApi.deleteSuite(suiteId);
      showToast(`Deleted "${fileName}".`);
      if (selectedSuite?.id === suiteId) {
        setSelectedSuite(null);
      }
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete test suite', 'error');
    }
  };

  // Handle file selection in Upload Modal
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadError(null);
    setIsParsing(true);

    try {
      const sheets = await parseSpreadsheetFile(file);
      setUploadPreviewSheets(sheets);
    } catch (err: any) {
      console.error('Parsing error:', err);
      setUploadError(err.message || 'Failed to parse spreadsheet file.');
      setUploadPreviewSheets([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Google Sheets URL import
  const handleImportGoogleSheets = async () => {
    if (!googleSheetsUrl.trim()) return;

    setGoogleSheetsLoading(true);
    setUploadError(null);

    try {
      const match = googleSheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match || !match[1]) {
        throw new Error(
          'Invalid Google Sheets URL. Please copy the full link from your browser address bar.'
        );
      }

      const sheetId = match[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(
          'Unable to import directly from URL. Please ensure your Google Sheet has link sharing enabled ("Anyone with the link can view"), or download it as .xlsx/.csv and use the File Upload tab.'
        );
      }

      const csvText = await response.text();
      const parsed = parseCSVText(csvText);

      setUploadPreviewSheets([
        {
          sheetName: 'GoogleSheet',
          columns: parsed.columns,
          columnWidths: parsed.columns.map(() => 180),
          rows: parsed.rows,
        },
      ]);
      setUploadFile(new File([csvText], 'GoogleSheet_TestCases.csv', { type: 'text/csv' }));
    } catch (err: any) {
      console.error('Google Sheet import error:', err);
      setUploadError(
        err.message ||
          'Failed to import Google Sheet. Safe alternative: In Google Sheets, click File → Download → Microsoft Excel (.xlsx), then upload here.'
      );
    } finally {
      setGoogleSheetsLoading(false);
    }
  };

  // Confirm and upload parsed spreadsheet
  const handleConfirmUpload = async () => {
    if (!uploadPreviewSheets || uploadPreviewSheets.length === 0) {
      setUploadError('Please select a valid spreadsheet file to upload.');
      return;
    }

    try {
      setIsSubmittingUpload(true);
      const totalCases = uploadPreviewSheets.reduce((sum, s) => sum + s.rows.length, 0);
      const fileName = uploadFile ? uploadFile.name : 'TestCases.xlsx';
      const fileType = fileName.split('.').pop() || 'xlsx';

      const created = await manualTestingApi.createSuite({
        fileName,
        fileType,
        totalTestCases: totalCases,
        sheetsData: JSON.stringify(uploadPreviewSheets),
      });

      showToast(`Spreadsheet "${fileName}" uploaded successfully!`);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreviewSheets([]);
      setGoogleSheetsUrl('');

      await handleOpenSuite(created.id);
      loadData();
    } catch (err: any) {
      console.error('Failed to create suite:', err);
      setUploadError(err.message || 'Failed to upload spreadsheet.');
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  // Filtered suites
  const filteredSuites = (Array.isArray(suites) ? suites : []).filter((s) => {
    const q = (searchQuery || '').toLowerCase();
    return (
      (s.fileName || '').toLowerCase().includes(q) ||
      (s.ownerName || '').toLowerCase().includes(q)
    );
  });

  // Pending access requests count for current user
  const pendingRequests = (Array.isArray(ownerRequests) ? ownerRequests : []).filter(
    (r) => r && r.status === 'PENDING'
  );

  // Active sheet data
  const currentSheet = (Array.isArray(workingSheets) && workingSheets[activeSheetIndex]) || {
    sheetName: 'Sheet1',
    columns: [],
    columnWidths: [],
    rows: [],
  };

  const sheetColumns = Array.isArray(currentSheet.columns) ? currentSheet.columns : [];
  const sheetRows = Array.isArray(currentSheet.rows) ? currentSheet.rows : [];

  // Helper for suite access status in list
  const isSuiteOwner = (s: ManualTestSuiteSummary) => {
    return Boolean(
      (s.ownerId != null && currentUserId != null && String(s.ownerId) === String(currentUserId)) ||
      s.isOwner
    );
  };

  const isSuiteApprovedEditor = (s: ManualTestSuiteSummary) => {
    return Boolean(!isSuiteOwner(s) && (s.requestStatus === 'APPROVED' || s.canEdit));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: SPREADSHEET VIEWER & INLINE EDITOR */}
      {/* ========================================================================= */}
      {selectedSuite ? (
        <div className="space-y-4">
          {/* Top Bar Navigation & Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToList}
                  className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
                  title="Back to Test Suites"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0062E0] flex items-center justify-center border border-blue-100 flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    {/* File / Spreadsheet Name with Rename Option for Author/Editor */}
                    {isRenamingFile ? (
                      <div className="flex items-center space-x-1.5 my-0.5">
                        <input
                          type="text"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveFileName();
                            if (e.key === 'Escape') setIsRenamingFile(false);
                          }}
                          autoFocus
                          className="px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-[#0062E0] rounded-lg shadow-sm focus:outline-none ring-2 ring-[#0062E0]/20"
                          placeholder="Spreadsheet name"
                        />
                        <button
                          onClick={handleSaveFileName}
                          className="px-2.5 py-1 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsRenamingFile(false)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                          {selectedSuite.fileName}
                        </h2>
                        {canEdit && (
                          <button
                            onClick={handleStartRenameFile}
                            className="px-2 py-0.5 text-xs text-slate-500 hover:text-[#0062E0] hover:bg-blue-50 rounded transition-colors flex items-center space-x-1 font-medium"
                            title="Rename Spreadsheet"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Rename</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Access Status Badge */}
                    {isOwner ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <Unlock className="w-3 h-3" />
                        <span>Owner (Edit Mode)</span>
                      </span>
                    ) : isApprovedEditor ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0062E0] border border-blue-200 flex items-center space-x-1">
                        <Unlock className="w-3 h-3" />
                        <span>Approved Editor (Edit Mode)</span>
                      </span>
                    ) : selectedSuite.requestStatus === 'PENDING' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Access Requested</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>VIEW ONLY</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Created by <span className="font-semibold text-slate-700">{selectedSuite.ownerName}</span>
                    {selectedSuite.createdAt && (
                      <span> • {new Date(selectedSuite.createdAt).toLocaleDateString()}</span>
                    )}
                    <span> • {workingSheets.reduce((sum, s) => sum + (s.rows?.length || 0), 0)} test cases</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 flex-wrap">
                {canEdit ? (
                  <>
                    <button
                      onClick={handleAddRow}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                      title="Add new test case row"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Row</span>
                    </button>

                    <button
                      onClick={handleSaveChanges}
                      disabled={!isDirty || isSaving}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all ${
                        isDirty
                          ? 'bg-[#0062E0] hover:bg-[#0050B8] text-white shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title={isDirty ? 'Save changes to database' : 'No changes to save'}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes *' : 'Save Changes'}</span>
                    </button>
                  </>
                ) : selectedSuite.requestStatus === 'PENDING' ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Access Requested (Pending Approval)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRequestEditAccess}
                    disabled={requestingAccess}
                    className="px-4 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{requestingAccess ? 'Requesting...' : 'Request Edit Access'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* View-Only Banner for Viewers */}
            {!canEdit && (
              <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    <strong>VIEW ONLY:</strong> You are currently viewing this spreadsheet. Viewers cannot edit cells, rename columns, resize columns, or rename the spreadsheet.
                  </span>
                </div>
                {selectedSuite.requestStatus !== 'PENDING' && (
                  <button
                    onClick={handleRequestEditAccess}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex-shrink-0"
                  >
                    Request Edit Access
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Multiple Worksheets Tabs */}
          {workingSheets.length > 0 && (
            <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-1">
              {workingSheets.map((sheet, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSheetIndex(idx);
                    setEditingColumnIndex(null);
                  }}
                  className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all flex items-center space-x-2 border-t border-l border-r whitespace-nowrap ${
                    activeSheetIndex === idx
                      ? 'bg-white border-slate-200 text-[#0062E0] font-bold shadow-sm -mb-px border-b-white z-10'
                      : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{sheet.sheetName}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                    {sheet.rows.length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Spreadsheet Table / Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto overflow-y-auto max-h-[640px] relative">
              <table className="w-full text-left text-xs border-collapse">
                {/* Sticky Header */}
                <thead className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 sticky top-0 z-20 backdrop-blur-sm">
                  <tr>
                    <th className="p-3 w-12 text-center text-slate-400 font-mono border-r border-slate-200 bg-slate-100 select-none">
                      #
                    </th>
                    {sheetColumns.map((col, cIdx) => {
                      const colWidth = currentSheet.columnWidths?.[cIdx] || 180;
                      const isEditingThisCol = editingColumnIndex === cIdx;

                      return (
                        <th
                          key={cIdx}
                          style={{
                            width: `${colWidth}px`,
                            minWidth: `${colWidth}px`,
                            maxWidth: `${colWidth}px`,
                          }}
                          className="relative p-2.5 font-semibold text-slate-800 border-r border-slate-200 select-none group"
                        >
                          {isEditingThisCol ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={editingColumnName}
                                onChange={(e) => setEditingColumnName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveColumnName(cIdx);
                                  if (e.key === 'Escape') setEditingColumnIndex(null);
                                }}
                                autoFocus
                                className="w-full bg-white text-slate-900 border border-[#0062E0] rounded px-1.5 py-0.5 text-xs focus:outline-none ring-1 ring-[#0062E0]"
                              />
                              <button
                                onClick={() => handleSaveColumnName(cIdx)}
                                className="p-1 text-emerald-600 hover:text-emerald-700"
                                title="Save Column Name"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingColumnIndex(null)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pr-2">
                              <span
                                className="truncate font-semibold text-slate-800"
                                title={canEdit ? `${col} (Double-click or click pencil to rename)` : col}
                                onDoubleClick={() => canEdit && handleStartRenameColumn(cIdx, col)}
                              >
                                {col}
                              </span>
                              {canEdit && (
                                <button
                                  onClick={() => handleStartRenameColumn(cIdx, col)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200/80 text-slate-400 hover:text-[#0062E0] rounded transition-opacity"
                                  title="Rename Column"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Column Resize Handle (Only rendered for owner/approved editors) */}
                          {canEdit && (
                            <div
                              onMouseDown={(e) => handleMouseDownResize(e, cIdx)}
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#0062E0]/50 active:bg-[#0062E0] select-none z-10 transition-colors"
                              title="Drag to resize column"
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Spreadsheet Rows */}
                <tbody className="divide-y divide-slate-100">
                  {sheetRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={sheetColumns.length + 1}
                        className="p-8 text-center text-slate-400 italic"
                      >
                        No test cases found in this worksheet.
                        {canEdit && (
                          <div className="mt-2">
                            <button
                              onClick={handleAddRow}
                              className="text-[#0062E0] font-semibold hover:underline"
                            >
                              + Add the first test case row
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    sheetRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* Row Index */}
                        <td className="p-2.5 text-center font-mono text-[11px] text-slate-400 border-r border-slate-200 bg-slate-50/50 select-none">
                          {rIdx + 1}
                        </td>

                        {/* Cell Values */}
                        {sheetColumns.map((_, cIdx) => {
                          const colWidth = currentSheet.columnWidths?.[cIdx] || 180;
                          const cellVal =
                            row && row[cIdx] !== undefined && row[cIdx] !== null
                              ? String(row[cIdx])
                              : '';

                          return (
                            <td
                              key={cIdx}
                              style={{
                                width: `${colWidth}px`,
                                minWidth: `${colWidth}px`,
                                maxWidth: `${colWidth}px`,
                              }}
                              className={`p-2 border-r border-slate-100 overflow-hidden ${
                                canEdit ? 'cursor-text focus-within:bg-blue-50/60' : 'cursor-default'
                              }`}
                            >
                              {canEdit ? (
                                <input
                                  type="text"
                                  value={cellVal}
                                  onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                  className="w-full bg-transparent border-0 p-1 text-slate-800 text-xs focus:ring-1 focus:ring-[#0062E0] focus:bg-white rounded outline-none transition-colors truncate"
                                  placeholder="—"
                                />
                              ) : (
                                <div
                                  className="p-1 text-slate-800 text-xs truncate select-text"
                                  title={cellVal}
                                >
                                  {cellVal || <span className="text-slate-300">—</span>}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing worksheet: <strong className="text-slate-700">{currentSheet.sheetName}</strong> ({sheetRows.length} test cases, {sheetColumns.length} columns)
              </div>
              <div>
                {canEdit ? (
                  <span className="text-emerald-600 font-medium flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Editable grid mode active</span>
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>View-only mode (Read only)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: TEST SUITES LIST & MAIN MANUAL TESTING HUB */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
                <FileSpreadsheet className="w-7 h-7 text-[#0062E0]" />
                <span>MANUAL TESTING</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Upload, manage, view, and collaborate on test-case spreadsheets (.xlsx, .csv, .xls).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all transform active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Spreadsheet</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* AUTHOR APPROVAL PANEL: EDIT ACCESS REQUESTS */}
          {/* ===================================================================== */}
          {pendingRequests.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#0062E0]" />
                  <h3 className="font-bold text-sm text-slate-900">
                    EDIT ACCESS REQUESTS
                  </h3>
                  <span className="px-2 py-0.5 bg-[#0062E0] text-white rounded-full text-[10px] font-bold">
                    {pendingRequests.length} pending
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Users who requested permission to edit your spreadsheets
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-sm flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#0062E0]" />
                        <span>{req.suiteName || 'Spreadsheet'}</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{req.userName}</span>
                        {req.userRole && <span className="text-slate-400"> ({req.userRole})</span>}{' '}
                        wants edit access.
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateAccessRequest(req.id, 'REJECTED')}
                        disabled={isApproving === req.id}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleUpdateAccessRequest(req.id, 'APPROVED')}
                        disabled={isApproving === req.id}
                        className="px-3 py-1.5 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        {isApproving === req.id ? 'Saving...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TEST SUITES TABLE */}
          {/* ===================================================================== */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Table Header & Search Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Test Case Files / Test Suites
                </h3>
                <p className="text-xs text-slate-500">
                  Everyone with access can view test cases. Author approval required for editing.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search spreadsheets..."
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] w-64"
                  />
                </div>
                <button
                  onClick={loadData}
                  className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suites Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">File Name</th>
                    <th className="p-3.5">Created By</th>
                    <th className="p-3.5">Created Date</th>
                    <th className="p-3.5">Test Cases</th>
                    <th className="p-3.5">Access</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-[#0062E0]" />
                          <span>Loading test suites...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSuites.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                          <div className="font-semibold text-slate-600">No test suites uploaded yet</div>
                          <p className="text-xs text-slate-400">
                            Click "Upload Spreadsheet" to upload your .xlsx or .csv test case file.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSuites.map((suite) => {
                      const isOwnerOfSuite = isSuiteOwner(suite);
                      const isEditorOfSuite = isSuiteApprovedEditor(suite);

                      return (
                        <tr
                          key={suite.id}
                          onClick={() => handleOpenSuite(suite.id)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* File Name */}
                          <td className="p-3.5 font-semibold text-slate-900 flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0062E0] flex items-center justify-center border border-blue-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-[#0062E0] transition-colors">
                                {suite.fileName}
                              </div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono">
                                .{suite.fileType || 'xlsx'}
                              </span>
                            </div>
                          </td>

                          {/* Created By */}
                          <td className="p-3.5 text-slate-700">
                            <div className="font-medium">{suite.ownerName}</div>
                            {isOwnerOfSuite && (
                              <span className="text-[10px] text-emerald-600 font-semibold">(You)</span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td className="p-3.5 text-slate-500 font-mono">
                            {suite.createdAt ? new Date(suite.createdAt).toLocaleDateString() : '—'}
                          </td>

                          {/* Test Cases Count */}
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800">
                              {suite.totalTestCases}
                            </span>{' '}
                            <span className="text-slate-500">test cases</span>
                          </td>

                          {/* Access Badge */}
                          <td className="p-3.5">
                            {isOwnerOfSuite ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Owner (Edit)
                              </span>
                            ) : isEditorOfSuite ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0062E0] border border-blue-200">
                                Approved Editor (Edit)
                              </span>
                            ) : suite.requestStatus === 'PENDING' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Requested
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                View Only
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenSuite(suite.id)}
                              className="px-3 py-1.5 bg-[#0062E0]/10 hover:bg-[#0062E0] text-[#0062E0] hover:text-white rounded-lg text-xs font-semibold transition-all"
                            >
                              Open Sheet
                            </button>
                            {isOwnerOfSuite && (
                              <button
                                onClick={(e) => handleDeleteSuite(suite.id, suite.fileName, e)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                title="Delete Spreadsheet"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD SPREADSHEET MODAL */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0062E0]" />
                <h3 className="font-bold text-base text-slate-900">Upload Spreadsheet</h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadPreviewSheets([]);
                  setUploadError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Tabs: Local File vs Google Sheets */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-px ${
                    uploadMode === 'file'
                      ? 'border-[#0062E0] text-[#0062E0]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Upload File (.xlsx, .csv, .xls)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('googlesheets')}
                  className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-px ${
                    uploadMode === 'googlesheets'
                      ? 'border-[#0062E0] text-[#0062E0]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Google Sheets Import
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Mode A: Local File Upload */}
              {uploadMode === 'file' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#0062E0] bg-slate-50 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto text-[#0062E0]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">
                        {uploadFile ? uploadFile.name : 'Click to select spreadsheet'}
                      </span>
                      <p className="text-slate-500 mt-1">
                        Supports <strong>.xlsx</strong>, <strong>.csv</strong>, and <strong>.xls</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode B: Google Sheets Import */}
              {uploadMode === 'googlesheets' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1">
                      Google Sheet URL
                    </label>
                    <input
                      type="url"
                      value={googleSheetsUrl}
                      onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleImportGoogleSheets}
                    disabled={googleSheetsLoading || !googleSheetsUrl.trim()}
                    className="px-4 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {googleSheetsLoading ? 'Fetching Sheet...' : 'Fetch Google Sheet'}
                  </button>

                  <div className="text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="font-semibold text-slate-700">How Google Sheets Import Works:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                      <li>Option A (Direct link): Ensure Google Sheet link sharing is set to "Anyone with the link can view", paste the link and click Fetch.</li>
                      <li>Option B (Recommended for private sheets): In Google Sheets, click <strong>File → Download → Microsoft Excel (.xlsx)</strong> or <strong>CSV</strong>, then switch to the File Upload tab. No passwords or Google account permissions needed!</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="p-4 bg-blue-50 text-[#0062E0] rounded-xl flex items-center justify-center space-x-2 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing spreadsheet and detecting worksheets...</span>
                </div>
              )}

              {/* Parsed Preview */}
              {uploadPreviewSheets.length > 0 && !isParsing && (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Detected Worksheets ({uploadPreviewSheets.length})</span>
                    <span className="text-[#0062E0] font-mono">
                      {uploadPreviewSheets.reduce((sum, s) => sum + s.rows.length, 0)} total test cases
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {uploadPreviewSheets.map((sheet, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Layers className="w-3.5 h-3.5 text-[#0062E0]" />
                          <span className="font-semibold text-slate-800">{sheet.sheetName}</span>
                          <span className="text-slate-400">
                            ({sheet.columns.length} columns)
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 text-[#0062E0] rounded-full text-[10px] font-bold">
                          {sheet.rows.length} test cases
                        </span>
                      </div>
                    ))}
                  </div>

                  {uploadPreviewSheets[0]?.columns && (
                    <div className="text-[11px] text-slate-500 mt-2">
                      <span className="font-semibold">Columns: </span>
                      {uploadPreviewSheets[0].columns.slice(0, 5).join(', ')}
                      {uploadPreviewSheets[0].columns.length > 5 && ' ...'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadPreviewSheets([]);
                  setUploadError(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={uploadPreviewSheets.length === 0 || isSubmittingUpload}
                className="px-5 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-xl font-semibold shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isSubmittingUpload ? 'Uploading...' : 'Confirm & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
