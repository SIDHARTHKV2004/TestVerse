import React, { useState } from 'react';
import { TestScenario, TestCase, RTMEntry } from '../types';
// Mock data import removed
import { 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload, 
  FileText, 
  Layers, 
  ChevronDown, 
  ChevronRight,
  ShieldCheck,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ManualTestingPage: React.FC = () => {
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'scenarios' | 'rtm' | 'reports'>('scenarios');
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [rtmList, setRtmList] = useState<RTMEntry[]>([]);

  // New Case Modal State
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [preconditions, setPreconditions] = useState('User is logged in.');
  const [steps, setSteps] = useState('1. Open Page\n2. Click Submit');
  const [expectedResult, setExpectedResult] = useState('Form submits successfully');

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim()) return;

    const newCase: TestCase = {
      id: `TC_${Date.now().toString().slice(-4)}`,
      scenarioId: scenarios[0].id,
      title: caseTitle,
      preconditions,
      steps: steps.split('\n'),
      expectedResult,
      status: 'Ready',
      module: 'Shopping Cart',
      authorName: user.name
    };

    setScenarios(prev => prev.map((sc, idx) => 
      idx === 0 ? { ...sc, testCases: [...sc.testCases, newCase] } : sc
    ));

    setCaseTitle('');
    setShowCaseModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            <span>Manual Testing Engineering Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Author Test Scenarios, manage Test Cases, generate RTM Matrices, and submit Test Execution Summary Reports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCaseModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Case</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'scenarios'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Test Scenarios & Executions
        </button>
        <button
          onClick={() => setActiveTab('rtm')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'rtm'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Requirements Traceability Matrix (RTM)
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Test Summary Reports
        </button>
      </div>

      {/* Tab 1: Scenarios & Cases */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {scenarios.map(sc => (
            <div key={sc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {sc.scenarioCode}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{sc.featureName}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{sc.description}</p>
                </div>
                <span className="text-xs font-mono text-slate-400">Req ID: {sc.requirementId}</span>
              </div>

              {/* Test Cases Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Test Case ID</th>
                      <th className="p-3">Title & Preconditions</th>
                      <th className="p-3">Expected Result</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Author / Reviewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sc.testCases.map(tc => (
                      <tr key={tc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-indigo-400">{tc.id}</td>
                        <td className="p-3 space-y-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{tc.title}</div>
                          <div className="text-[10px] text-slate-400 italic">Pre: {tc.preconditions}</div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{tc.expectedResult}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            tc.status === 'Passed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                            tc.status === 'Failed' ? 'bg-rose-950 text-rose-400 border border-rose-800/50' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {tc.status}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-400">
                          <div>By: {tc.authorName}</div>
                          {tc.reviewedByMentor && <div className="text-emerald-400">Approved by {tc.reviewedByMentor}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Tab 2: RTM */}
      {activeTab === 'rtm' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Requirements Traceability Matrix (RTM)</h3>
            <button className="flex items-center space-x-1 text-xs text-indigo-400 hover:underline">
              <Download className="w-3.5 h-3.5" />
              <span>Export RTM Excel</span>
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Req ID</th>
                <th className="p-3">Module</th>
                <th className="p-3">Requirement Description</th>
                <th className="p-3">Mapped Scenario</th>
                <th className="p-3">Test Case IDs</th>
                <th className="p-3">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rtmList.map(item => (
                <tr key={item.requirementId}>
                  <td className="p-3 font-mono font-bold text-indigo-400">{item.requirementId}</td>
                  <td className="p-3 font-semibold">{item.module}</td>
                  <td className="p-3 text-slate-300">{item.description}</td>
                  <td className="p-3 font-mono text-slate-400">{item.scenarioId}</td>
                  <td className="p-3 font-mono text-emerald-400">{item.testCaseIds.join(', ')}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-bold text-[10px]">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Summary Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Test Execution Summary Reports</h3>
            <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold">
              <Upload className="w-4 h-4" />
              <span>Upload Report PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="font-bold text-sm text-slate-100">E-Commerce Sprint #4 Test Execution Summary</div>
              <p className="text-slate-400">Total Executed: 45 | Passed: 41 | Failed: 4 | Pass Rate: 91.1%</p>
              <div className="text-emerald-400 font-semibold pt-1">Status: Reviewed & Signed off by Mentor Alex Rivera</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Test Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create New Test Case</h2>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Test Case Title</label>
                <input
                  type="text"
                  required
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="Verify password mask toggle functionality"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Preconditions</label>
                <input
                  type="text"
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Execution Steps (one per line)</label>
                <textarea
                  rows={3}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Expected Result</label>
                <textarea
                  rows={2}
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
