'use client';

import React, { useState } from 'react';
import { UploadCloud, BookOpen, PlusCircle, CheckCircle2, FileText, Clock, AlertCircle } from 'lucide-react';
import { CourseDocument, Assignment } from '../types';

interface TeacherDashboardProps {
  documents: CourseDocument[];
  assignments: Assignment[];
  onUploadPDF: (file: File) => Promise<void>;
  onCreateAssignment: (data: Partial<Assignment>) => Promise<void>;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  documents,
  assignments,
  onUploadPDF,
  onCreateAssignment
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Assignment Form State
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [rubric, setRubric] = useState('');
  const [targetTimeSeconds, setTargetTimeSeconds] = useState(420);
  const [transferQuestion, setTransferQuestion] = useState('');
  const [transferExpected, setTransferExpected] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadMessage(null);
    try {
      await onUploadPDF(selectedFile);
      setUploadMessage(`Indexed successfully: ${selectedFile.name}`);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadMessage(`Upload error: ${err.message || 'Failed to process PDF'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !instructions) return;

    setIsCreating(true);
    try {
      await onCreateAssignment({
        course_id: 1,
        title,
        instructions,
        rubric,
        target_time_seconds: targetTimeSeconds,
        complexity_depth: 'intermediate',
        transfer_question: transferQuestion,
        transfer_expected_answer: transferExpected,
        starter_code: 'def solution():\n    pass'
      });
      setCreateSuccess(true);
      setTitle('');
      setInstructions('');
      setRubric('');
      setTransferQuestion('');
      setTimeout(() => setCreateSuccess(false), 4000);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Title Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#2E7A68]">
          Teacher Management Suite
        </span>
        <h2 className="text-3xl font-serif font-bold text-[#0F2E2E] mt-1">
          Course Knowledge & Assignment Forging
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Upload course reference materials for grounded Socratic retrieval and configure dynamic anti-cheat pacing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: PDF Uploader & Indexed Library */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
              <UploadCloud className="w-5 h-5 text-[#1F5F50]" />
              Upload Course Materials (PDF RAG)
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              PDFs are indexed page-by-page. The Socratic Mentor grounds all hints and citations in these documents.
            </p>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-emerald-700/50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-emerald-800 mt-2 font-medium">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full bg-[#113A35] hover:bg-[#0c2a26] text-white py-2.5 rounded-xl font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? 'Extracting & Indexing Embeddings...' : 'Upload & Index into ChromaDB'}
              </button>
            </form>

            {uploadMessage && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadMessage}</span>
              </div>
            )}
          </div>

          {/* Indexed Materials List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-[#1F5F50]" />
              Indexed Course Knowledge Base
            </h3>

            <div className="space-y-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <div>
                      <p className="font-semibold text-slate-800">{doc.filename}</p>
                      <p className="text-[11px] text-slate-500">
                        {doc.page_count} pages • {doc.chunk_count || 12} vector chunks
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    {doc.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Assignment Creator */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
            <PlusCircle className="w-5 h-5 text-[#1F5F50]" />
            Create Assignment with AI-Free Transfer Challenge
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Configure learning prompts, anti-cheat target pacing, rubric standards, and independent transfer checks.
          </p>

          <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assignment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Understanding Recursion and Stack Memory"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Instructions / Prompt</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="Detail what the student must implement and explain..."
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Pacing (Seconds)
                </label>
                <input
                  type="number"
                  value={targetTimeSeconds}
                  onChange={(e) => setTargetTimeSeconds(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grading Rubric Summary</label>
                <input
                  type="text"
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  placeholder="e.g., Base case, recursive step, guard rails"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Related AI-Free Transfer Question
              </label>
              <textarea
                value={transferQuestion}
                onChange={(e) => setTransferQuestion(e.target.value)}
                rows={2}
                placeholder="Related transfer problem where AI assistance will be completely disabled..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expected Transfer Solution / Criteria
              </label>
              <textarea
                value={transferExpected}
                onChange={(e) => setTransferExpected(e.target.value)}
                rows={2}
                placeholder="Reference answer for deterministic rubric scoring..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-6 py-3 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              {isCreating ? 'Creating...' : 'Create & Publish Assignment'}
            </button>

            {createSuccess && (
              <span className="text-emerald-800 font-semibold ml-4">
                ✓ Assignment published to student workspace!
              </span>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
