import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  File, 
  FolderPlus, 
  Trash2, 
  UploadCloud, 
  Search, 
  LogOut, 
  ExternalLink, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  X,
  FileText,
  Clock,
  HardDrive,
  RefreshCw,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { 
  DriveFile, 
  listDriveFiles, 
  createDriveFolder, 
  uploadDriveFile, 
  deleteDriveFile, 
  initAuth, 
  googleSignIn, 
  logout 
} from '../lib/gdrive';
import { generateResponse, getActiveAI, AIModelType } from '../services/nemotron';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useToast } from '../context/ToastContext';
import { User } from 'firebase/auth';

interface Breadcrumb {
  id: string;
  name: string;
}

export default function GoogleDrivePanel() {
  const { toast } = useToast();
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // File Explorer State
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: 'root', name: 'My Drive' }]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [explorerError, setExplorerError] = useState<string | null>(null);

  // Modals & Action States
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and Drop State
  const [isDragActive, setIsDragActive] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // AI Assistant State
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Summarize this file and suggest how to use it in our campaigns.');
  const [aiResponse, setAiResponse] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [activeAi, setActiveAi] = useState<AIModelType>(() => getActiveAI());

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Files when Folder changes or Auth is established
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchFiles();
    }
  }, [isAuthenticated, accessToken, currentFolder]);

  const fetchFiles = async (query: string = '') => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setExplorerError(null);
    try {
      const response = await listDriveFiles(accessToken, currentFolder, query);
      setFiles(response.files || []);
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setExplorerError(err.message || 'Failed to list Google Drive files.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setIsAuthenticated(true);
        toast({
          variant: 'success',
          title: 'Google Drive Sync Active',
          description: `Successfully authenticated as ${result.user.email}.`,
          whatNext: 'Ready to manage business documents.'
        });
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      toast({
        variant: 'danger',
        title: 'Authentication Failed',
        description: err.message || 'Failed to link Google Workspace account.'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setAccessToken(null);
      setUser(null);
      setFiles([]);
      setSelectedFile(null);
      setFileContent('');
      setAiResponse('');
      toast({
        variant: 'info',
        title: 'Account Disconnected',
        description: 'Google Drive authorization credentials purged.'
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Navigation Helper
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    setSearchQuery('');
    setBreadcrumbs(prev => {
      const idx = prev.findIndex(b => b.id === folderId);
      if (idx !== -1) {
        return prev.slice(0, idx + 1);
      }
      return [...prev, { id: folderId, name: folderName }];
    });
  };

  const handleBreadcrumbClick = (crumb: Breadcrumb, index: number) => {
    setCurrentFolder(crumb.id);
    setSearchQuery('');
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchFiles(searchQuery);
    } else {
      fetchFiles();
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !accessToken) return;
    setIsCreatingFolder(true);
    try {
      await createDriveFolder(accessToken, newFolderName.trim(), currentFolder);
      toast({
        variant: 'success',
        title: 'Folder Created',
        description: `Folder "${newFolderName}" successfully initiated.`
      });
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      fetchFiles();
    } catch (err: any) {
      toast({
        variant: 'danger',
        title: 'Folder Creation Failed',
        description: err.message || 'Could not instantiate folder.'
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFiles(e.target.files);
    }
  };

  const handleUploadFiles = async (fileList: FileList) => {
    if (!accessToken) return;
    setIsUploading(true);
    
    const file = fileList[0]; // upload first file in batch
    toast({
      variant: 'info',
      title: 'Uploading Document',
      description: `Sending ${file.name} to Google Drive...`
    });

    try {
      await uploadDriveFile(accessToken, file, currentFolder);
      toast({
        variant: 'success',
        title: 'Document Sync Complete',
        description: `"${file.name}" is now stored securely in Google Drive.`
      });
      fetchFiles();
    } catch (err: any) {
      toast({
        variant: 'danger',
        title: 'Upload Failed',
        description: err.message || 'Failed to complete document synchronization.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Strict confirmation before delete
  const handleDeleteConfirm = async () => {
    if (!fileToDelete || !accessToken) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, fileToDelete.id);
      toast({
        variant: 'success',
        title: 'Document Purged',
        description: `"${fileToDelete.name}" was permanently removed from Google Drive.`
      });
      
      if (selectedFile?.id === fileToDelete.id) {
        setSelectedFile(null);
        setFileContent('');
        setAiResponse('');
      }
      
      setFileToDelete(null);
      fetchFiles();
    } catch (err: any) {
      toast({
        variant: 'danger',
        title: 'Deletion Blocked',
        description: err.message || 'Failed to purge document.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch Selected File Content
  const fetchSelectedFileContent = async (file: DriveFile) => {
    if (!accessToken) return;
    setIsFetchingContent(true);
    setFileContent('');
    try {
      // Direct media content download endpoint (Works for plain text, csv, log files, etc.)
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (res.ok) {
        const text = await res.text();
        // Slice if it is extremely long to prevent context overflow
        setFileContent(text.slice(0, 10000));
      } else {
        setFileContent(`[Binary Content or Non-Readable Format: ${file.mimeType}]`);
      }
    } catch (err) {
      setFileContent(`[Unable to parse inline text content directly. Ready for metadata evaluation.]`);
    } finally {
      setIsFetchingContent(false);
    }
  };

  const handleSelectFile = (file: DriveFile) => {
    setSelectedFile(file);
    setAiResponse('');
    
    // Attempt text fetch only if it looks like a readable text or doc format
    const isReadable = [
      'text/plain', 
      'text/csv', 
      'application/json', 
      'text/html', 
      'application/xml',
      'text/css'
    ].includes(file.mimeType);

    if (isReadable) {
      fetchSelectedFileContent(file);
    } else {
      setFileContent(`[No direct text preview available for type: ${file.mimeType}]`);
    }
  };

  // HAL AI File Summarizer / Optimizer
  const handleAiAudit = async () => {
    if (!selectedFile) return;
    setIsGeneratingAi(true);
    setAiResponse('');
    
    const promptText = `
User Goal: ${aiPrompt}

File Metadata:
- Name: ${selectedFile.name}
- Type (MIME): ${selectedFile.mimeType}
- Size: ${selectedFile.size || 'Unknown'} bytes
- Last Modified: ${selectedFile.modifiedTime}

File Content Snippet (if available):
${fileContent.slice(0, 5000)}

Analyze this file according to the User Goal, offering concrete business strategy recommendations. Suggest exactly how HAL can ingest or deploy this data to improve search visibility, map optimization, or pitch leads. Keep your feedback actionable, technical, and objective.
`;

    try {
      const response = await generateResponse(
        promptText,
        "You are HAL's Strategy Core Intelligence Agent. Auditing file archives and transforming documents into growth tactics.",
        0.3,
        false,
        activeAi
      );
      setAiResponse(response);
    } catch (err: any) {
      setAiResponse(`AI Evaluation failed: ${err.message || 'Please check API keys.'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // UI Utilities
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '—';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isFolder = (mimeType: string) => mimeType === 'application/vnd.google-apps.folder';

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-text-primary h-full flex flex-col" id="gdrive_panel">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase">
            HAL Business Intelligence Archive
          </span>
          <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-accent" /> Google Drive Explorer
          </h1>
          <p className="text-xs text-text-secondary max-w-xl">
            A secure gateway connecting your local assets, pitch templates, client checklists, and campaign audits directly into Google Drive Cloud.
          </p>
        </div>

        {isAuthenticated && user && (
          <div className="bg-bg-base border border-border-dim rounded-sm p-3 flex items-center gap-3 text-xs font-mono shrink-0">
            <div className="text-right">
              <span className="text-[8px] text-text-secondary uppercase block">CONNECTED ACCOUNT</span>
              <span className="text-text-primary font-bold">{user.email}</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-1.5 rounded border border-danger/25 text-danger hover:bg-danger-dim/30 transition-colors"
              title="Disconnect Google Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        /* GOOGLE SIGN IN CARD */
        <div className="max-w-md mx-auto my-12 bg-bg-raised border border-border-dim p-8 rounded-sm shadow-xl text-center space-y-6">
          <div className="w-14 h-14 bg-accent-dim/30 border border-accent/20 rounded-full flex items-center justify-center text-accent mx-auto">
            <HardDrive className="w-7 h-7" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-sm font-mono text-text-primary uppercase font-bold">Authenticate Google Drive</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              To browse, upload, and utilize technical audits or pitch templates directly from your storage, connect your Google Drive account securely.
            </p>
          </div>

          <div className="pt-3 flex justify-center">
            {/* OFFICIAL GOOGLE BUTTON STYLE */}
            <button 
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="gsi-material-button relative border border-border-dim bg-bg-base hover:bg-bg-subtle active:bg-bg-subtle transition-all py-2.5 px-4 rounded-sm flex items-center gap-3 cursor-pointer"
            >
              <div className="gsi-material-button-content-wrapper flex items-center gap-3">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold font-sans text-text-primary">Sign in with Google</span>
              </div>
              {isLoggingIn && (
                <div className="absolute inset-0 bg-bg-raised/75 flex items-center justify-center rounded-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                </div>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* MAIN PANEL: EXPLORER + AI SIDEBAR */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch flex-1">
          
          {/* FILE EXPLORER SECTION (LEFT 2 COLS) */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            
            {/* ACTION ROW: BREADCRUMBS, SEARCH, CREATE FOLDER */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-bg-raised border border-border-dim p-3 rounded-sm">
              {/* Breadcrumbs */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono w-full sm:w-auto">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />}
                    <button 
                      onClick={() => handleBreadcrumbClick(crumb, idx)}
                      className={`hover:text-text-primary transition-colors uppercase font-semibold ${
                        idx === breadcrumbs.length - 1 ? 'text-accent' : 'text-text-secondary'
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Create folder trigger */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<FolderPlus className="w-3.5 h-3.5 text-accent" />}
                  onClick={() => setIsCreateFolderOpen(true)}
                >
                  Create Folder
                </Button>
              </div>
            </div>

            {/* SEARCH & REFRESH */}
            <div className="flex gap-2 items-center">
              <form onSubmit={handleSearch} className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search file archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-raised border border-border-dim text-xs py-2 pl-8.5 pr-3 rounded-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
                />
              </form>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-3 shrink-0" 
                onClick={() => fetchFiles(searchQuery)}
                disabled={isLoadingFiles}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-accent' : ''}`} />
              </Button>
            </div>

            {/* DRAG & DROP UPLOAD PORTAL */}
            <div 
              ref={dragRef}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-6 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-2 ${
                isDragActive 
                  ? 'border-accent bg-accent-dim/10' 
                  : 'border-border-dim hover:border-border-default bg-bg-raised/40'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleFileInputChange}
              />
              <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-accent animate-bounce' : 'text-text-tertiary'}`} />
              <div className="space-y-1">
                <p className="text-xs font-mono font-bold text-text-primary uppercase">
                  {isUploading ? 'SYNCING FILE TO CLOUD...' : 'Drag & Drop files here, or click to upload'}
                </p>
                <p className="text-[10px] text-text-secondary uppercase">
                  PDF, DOCX, CSV, TXT, JSON up to 25MB supported
                </p>
              </div>
              {isUploading && (
                <div className="w-48 bg-bg-base h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-accent h-full w-2/3 animate-pulse rounded-full" />
                </div>
              )}
            </div>

            {/* FILE & FOLDER LIST GRID */}
            <div className="bg-bg-raised border border-border-dim rounded-sm overflow-hidden flex-1 flex flex-col min-h-[350px]">
              {explorerError && (
                <div className="p-4 bg-danger-dim/20 border-b border-danger/25 text-danger flex items-center gap-3 text-xs font-mono">
                  <AlertCircle className="w-4 h-4" />
                  <span>{explorerError}</span>
                </div>
              )}

              {isLoadingFiles ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-accent" />
                  <span className="text-[10px] font-mono uppercase text-text-secondary">Retrieving file descriptors...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
                  <Folder className="w-8 h-8 text-text-tertiary" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-mono text-text-primary uppercase font-bold">This directory is empty</h4>
                    <p className="text-[11px] text-text-secondary">Use the upload box above or create a new directory container.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border-dim bg-bg-base/50 text-[10px] font-mono uppercase text-text-secondary">
                        <th className="py-2.5 px-4 font-bold">Name</th>
                        <th className="py-2.5 px-4 font-bold hidden md:table-cell">Last Modified</th>
                        <th className="py-2.5 px-4 font-bold hidden md:table-cell">Size</th>
                        <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dim/50">
                      {files.map(file => {
                        const isDir = isFolder(file.mimeType);
                        const isSelected = selectedFile?.id === file.id;

                        return (
                          <tr 
                            key={file.id}
                            onClick={() => handleSelectFile(file)}
                            className={`hover:bg-bg-base/30 transition-colors cursor-pointer group ${
                              isSelected ? 'bg-accent-dim/10' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 flex items-center gap-2.5 min-w-[200px]">
                              {isDir ? (
                                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : (
                                <File className="w-4 h-4 text-sky-400 shrink-0" />
                              )}
                              <div className="flex flex-col truncate">
                                {isDir ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateToFolder(file.id, file.name);
                                    }}
                                    className="text-text-primary hover:text-accent font-bold text-left truncate hover:underline"
                                  >
                                    {file.name}
                                  </button>
                                ) : (
                                  <span className="text-text-primary font-medium truncate group-hover:text-text-primary transition-colors">
                                    {file.name}
                                  </span>
                                )}
                                <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wide">
                                  {file.mimeType.split('/').pop()?.toUpperCase() || 'UNKNOWN'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                              {new Date(file.modifiedTime).toLocaleDateString()} {new Date(file.modifiedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="py-2.5 px-4 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                              {isDir ? '—' : formatBytes(file.size)}
                            </td>
                            <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {file.webViewLink && (
                                  <a 
                                    href={file.webViewLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1.5 rounded border border-border-dim hover:border-border-default text-text-secondary hover:text-text-primary transition-colors"
                                    title="Open file in Google Drive"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button 
                                  onClick={() => setFileToDelete(file)}
                                  className="p-1.5 rounded border border-danger/20 hover:border-danger text-text-secondary hover:bg-danger-dim/25 hover:text-danger transition-colors"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* HAL AI FILE EVALUATION SIDEBAR (RIGHT 1 COL) */}
          <div className="bg-bg-raised border border-border-dim rounded-sm p-5 flex flex-col space-y-4">
            
            {/* Header */}
            <div className="border-b border-border-dim pb-3">
              <span className="text-[8px] font-mono tracking-widest text-accent uppercase block">
                HAL AUTOMATED COGNITION
              </span>
              <h3 className="text-xs font-mono font-bold text-text-primary uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent animate-pulse" /> Document Intelligence
              </h3>
            </div>

            {selectedFile ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* File Quick Spec Card */}
                <div className="p-3 bg-bg-overlay border border-border-dim rounded-sm space-y-2">
                  <div className="flex items-start gap-2">
                    {isFolder(selectedFile.mimeType) ? (
                      <Folder className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <File className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-text-primary truncate leading-tight" title={selectedFile.name}>
                        {selectedFile.name}
                      </h4>
                      <p className="text-[9px] font-mono text-text-tertiary uppercase mt-1">
                        TYPE: {selectedFile.mimeType}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-dim/30 text-[10px] font-mono text-text-secondary">
                    <div>
                      <span className="text-text-tertiary block text-[8px] uppercase">File Size</span>
                      <span className="text-text-primary font-semibold">
                        {isFolder(selectedFile.mimeType) ? 'Folder Container' : formatBytes(selectedFile.size)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[8px] uppercase">Last Sync</span>
                      <span className="text-text-primary font-semibold">
                        {new Date(selectedFile.modifiedTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inline file preview for readable documents */}
                {!isFolder(selectedFile.mimeType) && (
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono text-text-secondary uppercase block">
                      Text Segment Preview:
                    </span>
                    <div className="h-28 bg-bg-base border border-border-dim rounded-sm p-2 overflow-y-auto font-mono text-[9px] text-text-secondary leading-normal whitespace-pre-wrap">
                      {isFetchingContent ? (
                        <div className="flex items-center justify-center h-full gap-2 text-text-tertiary">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />
                          <span>Streaming document...</span>
                        </div>
                      ) : (
                        fileContent || '[Preview empty or format unreadable]'
                      )}
                    </div>
                  </div>
                )}

                {/* AI Agent Configuration form */}
                <div className="space-y-3 pt-2 border-t border-border-dim/40 flex-1 flex flex-col">
                  
                  {/* Selectable AI Switcher */}
                  <div className="bg-bg-overlay border border-border-dim rounded p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider font-bold">
                        Cognitive Engine:
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-accent/10 text-accent border border-accent/20">
                        {activeAi === 'gemini' ? 'Gemini 3.5' : 'Nemotron'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAi('gemini');
                          localStorage.setItem('hal_active_ai', 'gemini');
                          toast({
                            variant: 'success',
                            title: 'Gemini 3.5 Activated',
                            description: 'Strictly utilizing Google Gemini 3.5 cognitive pathways.'
                          });
                        }}
                        className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                          activeAi === 'gemini'
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-bg-base/30 border-border-dim text-text-secondary hover:border-border-default hover:text-text-primary'
                        }`}
                      >
                        <span className="text-[10px] font-bold font-sans uppercase">Gemini 3.5</span>
                        <span className="text-[8px] font-mono opacity-80 mt-1 uppercase">Primary AI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveAi('nemotron');
                          localStorage.setItem('hal_active_ai', 'nemotron');
                          toast({
                            variant: 'success',
                            title: 'NVIDIA Nemotron Activated',
                            description: 'NVIDIA high-performance Llama analytics are now driving operations.'
                          });
                        }}
                        className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                          activeAi === 'nemotron'
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-bg-base/30 border-border-dim text-text-secondary hover:border-border-default hover:text-text-primary'
                        }`}
                      >
                        <span className="text-[10px] font-bold font-sans uppercase">Nemotron</span>
                        <span className="text-[8px] font-mono opacity-80 mt-1 uppercase">Secondary AI</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border-dim/30 text-[9.5px]">
                      <span className="text-text-tertiary uppercase">Gemini Switch:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = activeAi === 'gemini' ? 'nemotron' : 'gemini';
                          setActiveAi(next);
                          localStorage.setItem('hal_active_ai', next);
                          toast({
                            variant: 'info',
                            title: `Gemini toggled ${next === 'gemini' ? 'ON' : 'OFF'}`,
                            description: next === 'gemini' ? 'Gemini 3.5 is primary.' : 'Nemotron is now operating.'
                          });
                        }}
                        className="flex items-center gap-1 font-mono uppercase font-bold focus:outline-none text-text-primary"
                      >
                        <span className={activeAi === 'gemini' ? 'text-accent' : 'text-text-tertiary'}>
                          {activeAi === 'gemini' ? 'ON' : 'OFF'}
                        </span>
                        <div className={`w-8 h-4 rounded-full relative p-0.5 transition-colors ${activeAi === 'gemini' ? 'bg-accent/20 border border-accent/40' : 'bg-bg-base border border-border-dim'}`}>
                          <div className={`w-2 h-2 rounded-full bg-white transition-all absolute top-0.5 ${activeAi === 'gemini' ? 'right-0.5' : 'left-0.5'}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block">
                      Tactical Growth Instruction:
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Draft a pitch email based on this contractor list..."
                      className="w-full bg-bg-overlay border border-border-dim text-[11px] p-2 rounded-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent min-h-[60px]"
                    />
                  </div>

                  <Button 
                    variant="primary" 
                    size="sm"
                    className="w-full"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-black" />}
                    onClick={handleAiAudit}
                    isLoading={isGeneratingAi}
                  >
                    Analyze with {activeAi === 'gemini' ? 'Gemini 3.5' : 'Nemotron'}
                  </Button>

                  {/* AI Response output area */}
                  {aiResponse && (
                    <div className="flex-1 flex flex-col space-y-1.5">
                      <span className="text-[8px] font-mono text-accent uppercase block tracking-wider">
                        {activeAi === 'gemini' ? 'Gemini 3.5' : 'Nemotron'} Tactical Intelligence Summary:
                      </span>
                      <div className="flex-1 h-44 overflow-y-auto bg-bg-base/60 border border-accent/20 rounded-sm p-3 font-sans text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {aiResponse}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-2 text-text-tertiary">
                <HelpCircle className="w-8 h-8" />
                <p className="text-xs font-mono uppercase font-bold text-text-secondary">No Asset Selected</p>
                <p className="text-[10px] leading-relaxed max-w-[180px]">
                  Select any spreadsheet, PDF, or text log file in the explorer to initiate HAL's automated dual-AI cognitive analysis.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-raised border border-border-dim p-6 rounded-xl w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <h4 className="text-xs font-mono font-bold text-text-primary uppercase flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-accent" /> Create New Container
              </h4>
              <button 
                onClick={() => setIsCreateFolderOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-secondary uppercase block">
                  Directory Name:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Lead Lists"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-bg-overlay border border-border-dim text-xs py-2 px-3 rounded-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsCreateFolderOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm"
                  isLoading={isCreatingFolder}
                >
                  Instantiate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STRICT DELETION SAFEGUARD CONFIRMATION MODAL */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-raised border border-danger/30 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <h4 className="text-xs font-mono font-bold text-danger uppercase flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-danger animate-pulse" /> SECURITY DIALOG: DESTRUCTIVE ACTION
              </h4>
              <button 
                onClick={() => setFileToDelete(null)}
                className="text-text-secondary hover:text-danger transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-text-primary leading-relaxed font-sans">
                Are you absolutely sure you want to permanently delete this item from your Google Drive cloud account?
              </p>
              <div className="p-3 bg-danger-dim/10 border border-danger/20 rounded-xl font-mono text-[11px] text-text-primary space-y-1">
                <div>
                  <span className="text-text-tertiary uppercase">Item Name: </span>
                  <span className="font-bold">{fileToDelete.name}</span>
                </div>
                <div>
                  <span className="text-text-tertiary uppercase">Item Type: </span>
                  <span className="font-semibold text-text-secondary">{fileToDelete.mimeType}</span>
                </div>
                <div>
                  <span className="text-text-tertiary uppercase">Resource ID: </span>
                  <span className="text-text-tertiary text-[9.5px] break-all">{fileToDelete.id}</span>
                </div>
              </div>
              <p className="text-[10px] font-mono text-danger font-semibold uppercase leading-tight">
                ⚠️ WARNING: THIS MUTATING OPERATION CANNOT BE REVERSED OR RESTORED.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFileToDelete(null)}
              >
                Abort Action
              </Button>
              <Button 
                variant="danger" 
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Authorize Deletion
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
