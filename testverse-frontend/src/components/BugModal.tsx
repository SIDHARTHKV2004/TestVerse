import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Upload } from 'lucide-react';

interface BugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BugModal: React.FC<BugModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'HIGH',
    severity: 'CRITICAL',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    projectName: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedImage(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }

      // Build JSON data (not FormData)
      const jsonData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        severity: formData.severity,
        stepsToReproduce: formData.stepsToReproduce?.trim() || '',
        expectedResult: formData.expectedResult?.trim() || '',
        actualResult: formData.actualResult?.trim() || '',
        projectName: formData.projectName?.trim() || '',
        reporterId: user?.id || 1,
        reporterName: user?.name || 'Unknown',
      };

      console.log('📤 Sending bug data (JSON):', jsonData);

      const response = await fetch('http://localhost:8080/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jsonData)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = typeof data === 'string' ? data : (data.message || 'Failed to create bug');
        throw new Error(errorMsg);
      }

      alert('✅ Bug created successfully!');
      onSuccess();
      onClose();
      resetForm();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bug. Please try again.';
      console.error('❌ Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'OPEN',
      priority: 'HIGH',
      severity: 'CRITICAL',
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
      projectName: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <span className="text-[#0062E0]">🐛</span> Report a Bug
            </h2>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                ❌ {error}
              </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                    required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                    required
                />
              </div>

              {/* Status, Priority, Severity */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                  <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* Steps, Expected, Actual */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Steps to Reproduce</label>
                <textarea
                    value={formData.stepsToReproduce}
                    onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                    placeholder="1. Go to... 2. Click on..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Result</label>
                <input
                    type="text"
                    value={formData.expectedResult}
                    onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actual Result</label>
                <input
                    type="text"
                    value={formData.actualResult}
                    onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                />
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all text-sm"
                    placeholder="Project name (optional)"
                />
              </div>

              {/* Image Upload - UI only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Screenshot / Image</label>
                <div className="relative">
                  <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-4 text-center hover:border-[#0062E0] hover:bg-[#EFF6FF]/40 transition-all">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-700 text-sm font-medium">Click to upload an image (UI only)</p>
                    <p className="text-slate-500 text-xs mt-1">Max size: 5MB (JPG, PNG, GIF)</p>
                  </div>
                </div>

                {imagePreview && (
                    <div className="mt-3 relative">
                      <img
                          src={imagePreview}
                          alt="Bug screenshot"
                          className="w-full max-h-48 object-contain rounded-lg border border-[#E2E8F0] shadow-sm"
                      />
                      <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-2">
              <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg transition-all font-medium shadow-sm hover:shadow disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Bug Report'}
              </button>
              <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-[#E2E8F0] font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default BugModal;