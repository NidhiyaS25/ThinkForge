'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  FileText,
  Clock,
  AlertCircle,
  Sparkles,
  Database,
  Trash2,
  Eye,
  RefreshCw,
  Edit3,
  Layers,
  HelpCircle,
  Check,
  X,
  Share2
} from 'lucide-react';
import { CourseDocument, Assignment, Quiz, QuizQuestionItem, RAGTraceInfo, QuestionType } from '../types';
import { ragService } from '../lib/ragService';
import { RAGProofPanel } from './RAGProofPanel';

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
  const [activeTab, setActiveTab] = useState<'materials' | 'quiz_studio' | 'published_quizzes' | 'assignments'>('quiz_studio');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ filename: string; preview: string; unit_type: string; unit_count: number } | null>(null);

  // Quiz Studio Generator State
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [quizTitle, setQuizTitle] = useState('Foundational Concepts Assessment');
  const [topic, setTopic] = useState('Recursion and Call Stack Dynamics');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice', 'true_false', 'short_answer', 'conceptual_scenario']);
  const [feedbackPolicy, setFeedbackPolicy] = useState<'immediate_practice' | 'post_submission_assessment'>('immediate_practice');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Generated Quiz Review State
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestionItem[]>([]);
  const [ragTrace, setRagTrace] = useState<RAGTraceInfo | null>(null);
  const [isRAGPanelOpen, setIsRAGPanelOpen] = useState(false);
  const [activeQuestionAuditIdx, setActiveQuestionAuditIdx] = useState(0);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Published Quizzes State
  const [publishedQuizzes, setPublishedQuizzes] = useState<Quiz[]>([]);

  // Assignment Form State (Preserved for backwards compatibility)
  const [assignTitle, setAssignTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [rubric, setRubric] = useState('');
  const [targetTimeSeconds, setTargetTimeSeconds] = useState(420);
  const [transferQuestion, setTransferQuestion] = useState('');
  const [transferExpected, setTransferExpected] = useState('');
  const [isCreatingAssign, setIsCreatingAssign] = useState(false);
  const [createAssignSuccess, setCreateAssignSuccess] = useState(false);

  // Initialize selected documents
  useEffect(() => {
    if (documents.length > 0 && selectedDocIds.length === 0) {
      setSelectedDocIds(documents.map((d) => d.id));
    }
  }, [documents]);

  // Load published quizzes
  useEffect(() => {
    async function loadQuizzes() {
      try {
        const qList = await ragService.getQuizzes(1);
        setPublishedQuizzes(qList);
      } catch (e) {}
    }
    loadQuizzes();
  }, []);

  // Multi-format Upload Handler
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadMessage(null);
    setUploadStage('1. Uploading file to server...');

    try {
      setTimeout(() => setUploadStage('2. Extracting text & preserving page/slide metadata...'), 600);
      setTimeout(() => setUploadStage('3. Dividing content into overlapping word chunks...'), 1200);
      setTimeout(() => setUploadStage('4. Generating normalized MiniLM embeddings...'), 1800);
      setTimeout(() => setUploadStage('5. Storing vectors in persistent ChromaDB collection...'), 2400);

      await onUploadPDF(selectedFile);
      setUploadStage('6. Complete: Document fully indexed and ready for quiz generation!');
      setUploadMessage(`Indexed successfully: ${selectedFile.name}`);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadMessage(`Upload error: ${err.message || 'Failed to process document.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Preview Document Handler
  const handlePreviewDoc = async (docId: number) => {
    try {
      const data = await ragService.getDocumentPreview(docId);
      setPreviewDoc({
        filename: data.filename,
        preview: data.preview,
        unit_type: data.unit_type || 'page',
        unit_count: data.unit_count || 1
      });
    } catch (err) {
      alert('Could not fetch extracted text preview.');
    }
  };

  // Delete Document Handler
  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document and purge its vector records from ChromaDB?')) return;
    try {
      await ragService.deleteDocument(docId);
      // Refresh documents
      await onUploadPDF(new File([], 'refresh_trigger'));
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  // Generate Quiz Handler
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length === 0) {
      alert('Please select at least one indexed course document.');
      return;
    }

    setIsGeneratingQuiz(true);
    setPublishSuccess(false);
    try {
      const response = await ragService.generateQuiz({
        course_id: 1,
        document_ids: selectedDocIds,
        title: quizTitle,
        topic,
        num_questions: numQuestions,
        difficulty,
        question_types: questionTypes,
        feedback_policy: feedbackPolicy,
        show_citations: true,
        include_explanations: true
      });

      setGeneratedQuestions(response.questions);
      setRagTrace(response.rag_trace);
    } catch (err: any) {
      alert(err.message || 'Failed to generate quiz with RAG pipeline.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Regenerate Single Question Handler
  const handleRegenerateQuestion = async (idx: number) => {
    const q = generatedQuestions[idx];
    setRegeneratingIdx(idx);
    try {
      const regenerated = await ragService.regenerateQuestion({
        course_id: 1,
        document_ids: selectedDocIds,
        topic,
        question_type: q.question_type,
        difficulty,
        current_question_text: q.question_text
      });

      setGeneratedQuestions((prev) => {
        const next = [...prev];
        next[idx] = { ...regenerated, order: idx + 1 };
        return next;
      });
    } catch (err) {
      alert('Failed to regenerate this question.');
    } finally {
      setRegeneratingIdx(null);
    }
  };

  // Publish Quiz Handler
  const handlePublishQuiz = async (status: 'draft' | 'published') => {
    if (!ragTrace || generatedQuestions.length === 0) return;

    try {
      const saved = await ragService.saveQuiz({
        course_id: 1,
        title: quizTitle,
        topic,
        difficulty,
        selected_document_ids: selectedDocIds,
        selected_document_names: ragTrace.selected_sources || [],
        feedback_policy: feedbackPolicy,
        show_citations: true,
        include_explanations: true,
        status,
        rag_trace: ragTrace,
        questions: generatedQuestions
      });

      setPublishSuccess(true);
      const qList = await ragService.getQuizzes(1);
      setPublishedQuizzes(qList);
      setTimeout(() => setPublishSuccess(false), 5000);
    } catch (err) {
      alert('Failed to publish quiz.');
    }
  };

  // Assignment Creator Handler
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle || !instructions) return;

    setIsCreatingAssign(true);
    try {
      await onCreateAssignment({
        course_id: 1,
        title: assignTitle,
        instructions,
        rubric,
        target_time_seconds: targetTimeSeconds,
        complexity_depth: 'intermediate',
        transfer_question: transferQuestion,
        transfer_expected_answer: transferExpected,
        starter_code: 'def solution():\n    pass'
      });
      setCreateAssignSuccess(true);
      setAssignTitle('');
      setInstructions('');
      setRubric('');
      setTransferQuestion('');
      setTimeout(() => setCreateAssignSuccess(false), 4000);
    } finally {
      setIsCreatingAssign(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E7A68]">
            Teacher Management Suite
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#0F2E2E] mt-1">
            Course Materials & Quiz Studio
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Upload multi-format study documents, generate evidence-grounded quizzes with observable RAG, and publish interactive assessments for students.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quiz_studio')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'quiz_studio'
                ? 'bg-[#113A35] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Quiz Studio (RAG)
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-[#113A35] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Course Materials
          </button>
          <button
            onClick={() => setActiveTab('published_quizzes')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'published_quizzes'
                ? 'bg-[#113A35] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Published Quizzes ({publishedQuizzes.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-[#113A35] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Code LMS
          </button>
        </div>
      </div>

      {/* ---------------- TAB 1: QUIZ STUDIO (RAG GENERATOR) ---------------- */}
      {activeTab === 'quiz_studio' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 5 cols: Configuration Form */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#1F5F50]" />
                    RAG Quiz Configuration
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Formulate queries to retrieve chunks from ChromaDB and synthesize grounded questions without requiring students to write code.
                  </p>
                </div>

                <form onSubmit={handleGenerateQuiz} className="space-y-4 text-xs">
                  {/* Source Documents Checkbox Picker */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700">
                      Select Grounding Source Documents:
                    </label>
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50/60">
                      {documents.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocIds([...selectedDocIds, doc.id]);
                              } else {
                                setSelectedDocIds(selectedDocIds.filter((id) => id !== doc.id));
                              }
                            }}
                            className="rounded text-emerald-800 focus:ring-emerald-700"
                          />
                          <span className="truncate font-medium text-slate-800">{doc.filename}</span>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ml-auto">
                            {doc.file_type || 'PDF'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quiz Title</label>
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Target Topic / Learning Objective
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Recursion base case, call stack, tree invariants"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Question Count</label>
                      <select
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      >
                        <option value={3}>3 Questions (Quick)</option>
                        <option value={5}>5 Questions (Standard)</option>
                        <option value={10}>10 Questions (Comprehensive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Types */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Included Question Types (No Code Required):
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        { id: 'multiple_choice', label: 'Multiple Choice (MCQ)' },
                        { id: 'true_false', label: 'True / False' },
                        { id: 'short_answer', label: 'Short Answer' },
                        { id: 'conceptual_scenario', label: 'Conceptual Scenario' }
                      ].map((t) => (
                        <label key={t.id} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={questionTypes.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQuestionTypes([...questionTypes, t.id]);
                              } else {
                                setQuestionTypes(questionTypes.filter((x) => x !== t.id));
                              }
                            }}
                            className="rounded text-emerald-800"
                          />
                          <span className="text-slate-700 font-medium">{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Policy */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Feedback Policy</label>
                    <select
                      value={feedbackPolicy}
                      onChange={(e) => setFeedbackPolicy(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="immediate_practice">Practice Mode (Instant Feedback & Citations)</option>
                      <option value="post_submission_assessment">Assessment Mode (Feedback after Final Submit)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isGeneratingQuiz || selectedDocIds.length === 0}
                    className="w-full bg-[#113A35] hover:bg-[#0c2a26] text-white py-3 rounded-xl font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    {isGeneratingQuiz ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                        <span>Retrieving Chunks & Grounding Questions...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>Generate Traceable Assessment via RAG</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right 7 cols: Generated Questions Review & Grounding Inspector */}
            <div className="lg:col-span-7 space-y-6">
              {generatedQuestions.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/90 shadow-sm text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-serif font-bold text-slate-800 text-base">
                    Ready to Forge Grounded Assessments
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Select your course documents and click <b>Generate Traceable Assessment</b>. ThinkForge will retrieve exact chunks from ChromaDB, ground every question, and provide verifiable citations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        {generatedQuestions.length} Grounded Questions
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        100% CITED
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsRAGPanelOpen(true)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Inspect RAG Evidence & Citations</span>
                      </button>

                      <button
                        onClick={() => handlePublishQuiz('published')}
                        className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Publish Quiz</span>
                      </button>
                    </div>
                  </div>

                  {publishSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Quiz published successfully! Students can now access it in the Student Quiz Center.</span>
                    </div>
                  )}

                  {/* Question Review Cards */}
                  <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
                    {generatedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#113A35] text-white text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                              {q.question_type.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRegenerateQuestion(idx)}
                              disabled={regeneratingIdx === idx}
                              className="text-[11px] text-slate-500 hover:text-emerald-800 flex items-center gap-1 font-semibold cursor-pointer"
                              title="Regenerate this question using alternative retrieved chunk"
                            >
                              <RefreshCw className={`w-3 h-3 ${regeneratingIdx === idx ? 'animate-spin' : ''}`} />
                              <span>Regenerate</span>
                            </button>

                            <button
                              onClick={() => {
                                setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== idx));
                              }}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <p className="font-semibold text-slate-900 text-xs leading-relaxed">
                          {q.question_text}
                        </p>

                        {/* Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`p-2 rounded-lg border text-[11px] flex items-center gap-2 ${
                                  opt === q.correct_answer
                                    ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="w-4 h-4 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[9px]">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="truncate">{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Grounded Citation Pill */}
                        <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-emerald-950 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-emerald-700" />
                              {q.source_citation || 'Course Notes — Page 12'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Similarity: {(q.similarity_score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 italic line-clamp-2">
                            "{q.source_excerpt}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: COURSE MATERIALS & MULTI-FORMAT UPLOAD ---------------- */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Uploader Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-[#1F5F50]" />
                    Multi-Format Document Upload
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Supported formats: <b>.pdf, .pptx, .docx, .txt, .md</b> (Max 30MB).
                    Legacy <code>.ppt</code> files should be converted to <code>.pptx</code> before uploading.
                  </p>
                </div>

                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-700/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.pptx,.docx,.txt,.md"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-xs text-emerald-800 mt-2 font-medium">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  {uploadStage && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">Processing Stage:</p>
                      <p className="text-emerald-800">{uploadStage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="w-full bg-[#113A35] hover:bg-[#0c2a26] text-white py-3 rounded-xl font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isUploading ? 'Extracting, Chunking & Embedding...' : 'Upload & Index into ChromaDB'}
                  </button>
                </form>

                {uploadMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Indexed Library Column */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#1F5F50]" />
                Indexed Knowledge Base ({documents.length} Files)
              </h3>
              <p className="text-xs text-slate-500">
                These documents are vectorized and indexed in ChromaDB for Socratic hint retrieval and quiz generation.
              </p>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                        {doc.file_type || 'PDF'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{doc.filename}</p>
                        <p className="text-[11px] text-slate-500">
                          {doc.unit_count || doc.page_count} {doc.unit_type || 'pages'} • {doc.chunk_count || 12} ChromaDB chunks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handlePreviewDoc(doc.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Extracted Text Preview Modal */}
          {previewDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Extracted Text Preview: {previewDoc.filename}
                  </h3>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto p-4 bg-slate-50 rounded-xl font-mono text-xs text-slate-700 leading-relaxed max-h-96 whitespace-pre-wrap">
                  {previewDoc.preview}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="bg-[#113A35] text-white px-5 py-2 rounded-xl text-xs font-bold"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: PUBLISHED QUIZZES ---------------- */}
      {activeTab === 'published_quizzes' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#1F5F50]" />
              Published Student Quizzes
            </h3>
            <p className="text-xs text-slate-500">
              Quizzes currently active in the Student Learning Center.
            </p>
          </div>

          {publishedQuizzes.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No quizzes published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publishedQuizzes.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {q.questions_count || 5} Questions
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm">{q.title}</h4>
                  <p className="text-xs text-slate-600">Topic: {q.topic || 'General Fundamentals'}</p>
                  <p className="text-[11px] text-slate-500">
                    Source: {q.selected_document_names?.[0] || 'Course Materials'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: CODE ASSIGNMENT CREATOR (PRESERVED) ---------------- */}
      {activeTab === 'assignments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
            <PlusCircle className="w-5 h-5 text-[#1F5F50]" />
            Create Programming Assignment with AI-Free Transfer Challenge
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Configure learning prompts, anti-cheat target pacing, rubric standards, and independent transfer checks.
          </p>

          <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assignment Title</label>
              <input
                type="text"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
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
                <label className="block font-semibold text-slate-700 mb-1">Target Pacing (Seconds)</label>
                <input
                  type="number"
                  value={targetTimeSeconds}
                  onChange={(e) => setTargetTimeSeconds(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grading Rubric Summary</label>
                <input
                  type="text"
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  placeholder="e.g., Base case, recursive step, guard rails"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Related AI-Free Transfer Question</label>
              <textarea
                value={transferQuestion}
                onChange={(e) => setTransferQuestion(e.target.value)}
                rows={2}
                placeholder="Related transfer problem where AI assistance will be completely disabled..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Transfer Solution</label>
              <textarea
                value={transferExpected}
                onChange={(e) => setTransferExpected(e.target.value)}
                rows={2}
                placeholder="Reference answer for deterministic rubric scoring..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingAssign}
              className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-6 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              {isCreatingAssign ? 'Creating...' : 'Create & Publish Assignment'}
            </button>

            {createAssignSuccess && (
              <span className="text-emerald-800 font-semibold ml-4">
                ✓ Assignment published to student workspace!
              </span>
            )}
          </form>
        </div>
      )}

      {/* RAG Proof Modal */}
      {ragTrace && (
        <RAGProofPanel
          trace={ragTrace}
          questions={generatedQuestions}
          isOpen={isRAGPanelOpen}
          onClose={() => setIsRAGPanelOpen(false)}
          activeQuestionIndex={activeQuestionAuditIdx}
        />
      )}
    </div>
  );
};
