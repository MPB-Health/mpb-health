import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Sparkles, Loader, CheckCircle, XCircle, Book, Settings, History, Upload, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  generateBlogPost,
  getGeminiPrompts,
  extractPromptVariables,
  getBlogGenerationLogs,
  getGenerationStats,
  type GeminiPrompt,
  type BlogGenerationLog,
} from '../../lib/geminiService';
import {
  bulkImportBlogPosts,
  type BulkImportResult,
} from '../../lib/blogGenerationService';
import { sanitizeHtml } from '@mpbhealth/utils';

const GeminiBlogGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<GeminiPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [geminiEndpoint, setGeminiEndpoint] = useState<string>('http://localhost:11434/api/generate');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<BlogGenerationLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'bulk-import' | 'history' | 'stats'>('generate');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadPrompts();
    loadLogs();
    loadStats();
  }, []);

  const loadPrompts = async () => {
    const data = await getGeminiPrompts('blog');
    setPrompts(data);
  };

  const loadLogs = async () => {
    const data = await getBlogGenerationLogs({ limit: 20 });
    setLogs(data);
  };

  const loadStats = async () => {
    const data = await getGenerationStats();
    setStats(data);
  };

  const handlePromptChange = (promptId: string) => {
    setSelectedPromptId(promptId);
    const prompt = prompts.find((p) => p.id === promptId);
    if (prompt) {
      const vars = extractPromptVariables(prompt.template);
      const initialVars: Record<string, string> = {};
      vars.forEach((v) => {
        initialVars[v] = '';
      });
      setVariables(initialVars);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPromptId) {
      alert('Please select a prompt template');
      return;
    }

    if (!geminiEndpoint) {
      alert('Please enter your Gemini endpoint URL');
      return;
    }

    const missingVars = Object.entries(variables).filter(([_, v]) => !v);
    if (missingVars.length > 0) {
      alert(`Please fill in all variables: ${missingVars.map(([k]) => k).join(', ')}`);
      return;
    }

    setGenerating(true);
    setResult(null);

    const response = await generateBlogPost({
      promptId: selectedPromptId,
      variables,
      geminiEndpoint,
      saveToBlog: true,
    });

    setResult(response);
    setGenerating(false);

    if (response.success) {
      loadLogs();
      loadStats();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkFile(file);
      setBulkResult(null);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkFile) {
      alert('Please select a file');
      return;
    }

    setIsImporting(true);
    setBulkResult(null);

    try {
      const content = await bulkFile.text();
      const fileType = bulkFile.name.endsWith('.json') ? 'json' : 'csv';

      const result = await bulkImportBlogPosts(content, fileType, {
        publishImmediately: false,
      });

      setBulkResult(result);
      loadStats();
      loadLogs();
    } catch (error) {
      console.error('Bulk import error:', error);
      alert('Failed to import blog posts');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csv = `title,excerpt,content,category,author,featured_image_url,is_published
"Sample Blog Post","This is a sample excerpt","<p>This is the full content of the blog post.</p>",Healthcare,MPB Health,/assets/sample.jpg,false
"Another Post","Another excerpt","<p>More content here.</p>",Wellness,John Doe,/assets/another.jpg,true`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog-posts-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleJSON = () => {
    const json = JSON.stringify([
      {
        title: 'Sample Blog Post',
        excerpt: 'This is a sample excerpt',
        content: '<p>This is the full content of the blog post.</p>',
        category: 'Healthcare',
        author: 'MPB Health',
        featured_image_url: '/assets/sample.jpg',
        is_published: false
      }
    ], null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog-posts-sample.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout activeView="ai-blog" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Gemini Blog Generator | MPB Health Admin</title>
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="AI Blog Generator" />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-600" />
              Gemini AI Blog Generator
            </h1>
            <p className="mt-2 text-gray-600">
              Generate high-quality blog posts using Gemini AI running locally
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('generate')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'generate'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Book className="inline h-4 w-4 mr-2" />
                Generate
              </button>
              <button
                onClick={() => setActiveTab('bulk-import')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bulk-import'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="inline h-4 w-4 mr-2" />
                Bulk Import
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <History className="inline h-4 w-4 mr-2" />
                History
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'stats'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="inline h-4 w-4 mr-2" />
                Stats
              </button>
            </nav>
          </div>

          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Configuration */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="endpoint">Gemini Endpoint URL</Label>
                    <Input
                      id="endpoint"
                      type="url"
                      value={geminiEndpoint}
                      onChange={(e) => setGeminiEndpoint(e.target.value)}
                      placeholder="http://localhost:11434/api/generate"
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Your local Gemini API endpoint
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="prompt">Prompt Template</Label>
                    <Select
                      id="prompt"
                      value={selectedPromptId}
                      onChange={(e) => handlePromptChange(e.target.value)}
                      className="mt-2"
                    >
                      <option value="">Select a prompt template</option>
                      {prompts.map((prompt) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {selectedPromptId && Object.keys(variables).length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900">Template Variables</h3>
                      {Object.keys(variables).map((key) => (
                        <div key={key}>
                          <Label htmlFor={`var-${key}`}>{key}</Label>
                          <Input
                            id={`var-${key}`}
                            type="text"
                            value={variables[key]}
                            onChange={(e) =>
                              setVariables({ ...variables, [key]: e.target.value })
                            }
                            placeholder={`Enter ${key}`}
                            className="mt-2"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !selectedPromptId}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader className="animate-spin h-5 w-5 mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Blog Post
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right: Result */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Result</h2>

                {!result && !generating && (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Configure and generate to see results</p>
                  </div>
                )}

                {generating && (
                  <div className="text-center py-12">
                    <Loader className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Generating content...</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    {result.success ? (
                      <>
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900">
                              Blog post generated successfully!
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              Tokens used: {result.tokensUsed} | Time: {result.generationTime}ms
                            </p>
                            {result.blogPostId && (
                              <a
                                href={`/admin/blog`}
                                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                              >
                                View in blog admin →
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                          <h3 className="font-medium text-gray-900 mb-3">Generated Content:</h3>
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.content) }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">Generation failed</p>
                          <p className="text-sm text-red-700 mt-1">{result.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Import Tab */}
          {activeTab === 'bulk-import' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Bulk Import Blog Posts</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Import Instructions</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Upload a CSV or JSON file containing blog posts. Download sample templates below.
                </p>
                <div className="flex gap-3">
                  <Button onClick={downloadSampleCSV} className="text-sm bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    CSV Template
                  </Button>
                  <Button onClick={downloadSampleJSON} className="text-sm bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    JSON Template
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="bulk_file">Select File (CSV or JSON)</Label>
                  <input
                    id="bulk_file"
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {bulkFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleBulkImport}
                  disabled={isImporting || !bulkFile}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Import Posts
                    </>
                  )}
                </Button>

                {bulkResult && (
                  <div className={`border rounded-lg p-4 ${bulkResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className={`font-medium mb-3 ${bulkResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      Import Results
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-green-800">Successfully imported: {bulkResult.imported}</p>
                      <p className="text-red-800">Failed: {bulkResult.failed}</p>

                      {bulkResult.createdPosts.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium text-gray-900 mb-2">Created Posts:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {bulkResult.createdPosts.map((post) => (
                              <li key={post.id} className="text-gray-700">
                                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {post.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {bulkResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium text-red-900 mb-2">Errors:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {bulkResult.errors.map((error, idx) => (
                              <li key={idx} className="text-red-800">
                                Row {error.row}: {error.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Generation History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tokens
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time (ms)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Preview
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              <CheckCircle className="h-3 w-3" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.tokens_used.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.generation_time_ms || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                          {log.success
                            ? log.content_generated?.substring(0, 100) + '...'
                            : log.error_message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">Total Generations</div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalGenerations}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">Success Rate</div>
                <div className="text-3xl font-bold text-green-600">
                  {stats.totalGenerations > 0
                    ? Math.round((stats.successfulGenerations / stats.totalGenerations) * 100)
                    : 0}
                  %
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">Total Tokens Used</div>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalTokensUsed.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">Avg Generation Time</div>
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(stats.averageGenerationTime)}ms
                </div>
              </div>
            </div>
          )}
        </div>
    </AdminLayout>
  );
};

export default GeminiBlogGenerator;
