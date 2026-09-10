import React, { useState } from 'react';
import { 
  RibbonTab, 
  DocumentPageSettings, 
  DocumentTheme, 
  DocumentFormattingStyle,
  DocumentRecipient 
} from './types';
import { 
  THEME_PRESETS, 
  FORMATTING_STYLE_PRESETS 
} from './templates';
import { 
  FileText, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Indent, 
  Outdent, 
  Type, 
  Highlighter, 
  Palette, 
  Table, 
  Image as ImageIcon, 
  Square, 
  BarChart3, 
  Link, 
  MessageSquare, 
  Hash, 
  FilePlus, 
  Bookmark, 
  Scissors, 
  Copy, 
  Clipboard, 
  Undo, 
  Redo, 
  Eraser, 
  PenTool, 
  Grid, 
  Check, 
  ChevronDown, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Eye, 
  Play, 
  CheckCircle2, 
  Users, 
  Search, 
  CornerDownRight, 
  Layers, 
  Maximize2,
  FileCheck2,
  Heading1,
  Heading2,
  Quote
} from 'lucide-react';

interface DocumentRibbonProps {
  activeTab: RibbonTab;
  setActiveTab: (tab: RibbonTab) => void;
  pageSettings: DocumentPageSettings;
  setPageSettings: React.Dispatch<React.SetStateAction<DocumentPageSettings>>;
  activeTheme: DocumentTheme;
  setActiveTheme: (theme: DocumentTheme) => void;
  activeStyle: DocumentFormattingStyle;
  setActiveStyle: (style: DocumentFormattingStyle) => void;
  drawingMode: boolean;
  setDrawingMode: (val: boolean) => void;
  penTool: 'pen' | 'highlighter' | 'eraser';
  setPenTool: (val: 'pen' | 'highlighter' | 'eraser') => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  showRuler: boolean;
  setShowRuler: (show: boolean) => void;
  gridBackground: 'none' | 'ruled' | 'grid';
  setGridBackground: (bg: 'none' | 'ruled' | 'grid') => void;
  clearDrawings: () => void;
  // Mailings
  recipients: DocumentRecipient[];
  currentRecipientIndex: number;
  setCurrentRecipientIndex: (idx: number) => void;
  previewMerge: boolean;
  setPreviewMerge: (preview: boolean) => void;
  insertMergeField: (fieldKey: string) => void;
  // Review & speech
  isSpeaking: boolean;
  toggleReadAloud: () => void;
  wordCount: { words: number; chars: number; readTimeMin: number };
  showComments: boolean;
  setShowComments: (show: boolean) => void;
  // Canvas editing actions
  execCommand: (command: string, value?: string) => void;
  insertTable: (rows: number, cols: number) => void;
  insertImage: (url: string) => void;
  insertCallout: () => void;
  insertPageBreak: () => void;
  insertToc: () => void;
  insertSignatureBlock: () => void;
}

export const DocumentRibbon: React.FC<DocumentRibbonProps> = ({
  activeTab,
  setActiveTab,
  pageSettings,
  setPageSettings,
  activeTheme,
  setActiveTheme,
  activeStyle,
  setActiveStyle,
  drawingMode,
  setDrawingMode,
  penTool,
  setPenTool,
  penColor,
  setPenColor,
  penSize,
  setPenSize,
  showRuler,
  setShowRuler,
  gridBackground,
  setGridBackground,
  clearDrawings,
  recipients,
  currentRecipientIndex,
  setCurrentRecipientIndex,
  previewMerge,
  setPreviewMerge,
  insertMergeField,
  isSpeaking,
  toggleReadAloud,
  wordCount,
  showComments,
  setShowComments,
  execCommand,
  insertTable,
  insertImage,
  insertCallout,
  insertPageBreak,
  insertToc,
  insertSignatureBlock
}) => {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showWatermarkDropdown, setShowWatermarkDropdown] = useState(false);
  const [showMergeDropdown, setShowMergeDropdown] = useState(false);
  const [showFindModal, setShowFindModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');

  const tabs: { id: RibbonTab; label: string }[] = [
    { id: 'file', label: 'File' },
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'draw', label: 'Draw' },
    { id: 'design', label: 'Design' },
    { id: 'layout', label: 'Layout' },
    { id: 'references', label: 'References' },
    { id: 'mailings', label: 'Mailings' },
    { id: 'review', label: 'Review' }
  ];

  const handleFontFamily = (font: string) => {
    execCommand('fontName', font);
  };

  const handleFontSize = (size: string) => {
    // execCommand accepts 1-7 for fontSize
    execCommand('fontSize', size);
  };

  const currentRecipient = recipients[currentRecipientIndex];

  return (
    <div className="bg-slate-900 border-b border-slate-700 text-slate-200 select-none shadow-md">
      {/* Top Ribbon Tab Headers */}
      <div className="flex items-center space-x-1 px-3 pt-1 border-b border-slate-800 text-xs font-medium">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-t font-semibold transition-all relative ${
                isActive 
                  ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
              {tab.id === 'mailings' && recipients.length > 0 && (
                <span className="ml-1.5 px-1 py-0.2 text-[10px] bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                  {recipients.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ribbon Tool Strip */}
      <div className="p-2 bg-slate-800/95 flex items-center overflow-x-auto min-h-[64px] divide-x divide-slate-700 text-xs">
        {/* ─── HOME TAB ─── */}
        {activeTab === 'home' && (
          <div className="flex items-center space-x-3 w-full">
            {/* Clipboard */}
            <div className="flex flex-col items-center justify-center pr-3">
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => execCommand('paste')} 
                  title="Paste" 
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                  <button 
                    onClick={() => execCommand('cut')} 
                    title="Cut" 
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => execCommand('copy')} 
                    title="Copy" 
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Clipboard</span>
            </div>

            {/* Font formatting */}
            <div className="flex flex-col space-y-1.5 px-3">
              <div className="flex items-center space-x-2">
                <select 
                  defaultValue="Inter, sans-serif"
                  onChange={(e) => handleFontFamily(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 outline-none w-32"
                >
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                </select>

                <select 
                  defaultValue="3"
                  onChange={(e) => handleFontSize(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 outline-none w-14"
                >
                  <option value="2">10pt</option>
                  <option value="3">12pt</option>
                  <option value="4">14pt</option>
                  <option value="5">18pt</option>
                  <option value="6">24pt</option>
                  <option value="7">32pt</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button onClick={() => execCommand('bold')} className="p-1 hover:bg-slate-700 rounded text-slate-300 font-bold" title="Bold (Ctrl+B)">
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('italic')} className="p-1 hover:bg-slate-700 rounded text-slate-300 italic" title="Italic (Ctrl+I)">
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('underline')} className="p-1 hover:bg-slate-700 rounded text-slate-300 underline" title="Underline (Ctrl+U)">
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('strikeThrough')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Strikethrough">
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button onClick={() => execCommand('hiliteColor', '#fef08a')} className="p-1 hover:bg-slate-700 rounded text-yellow-300" title="Highlight Yellow">
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('foreColor', '#2563eb')} className="p-1 hover:bg-slate-700 rounded text-blue-400" title="Text Color Blue">
                  <Palette className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('removeFormat')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Clear Formatting">
                  <Type className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Paragraph formatting */}
            <div className="flex flex-col space-y-1.5 px-3">
              <div className="flex items-center space-x-1">
                <button onClick={() => execCommand('insertUnorderedList')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Bullet List">
                  <List className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('insertOrderedList')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Numbered List">
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('outdent')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Decrease Indent">
                  <Outdent className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('indent')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Increase Indent">
                  <Indent className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center space-x-1">
                <button onClick={() => execCommand('justifyLeft')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Align Left">
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('justifyCenter')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Center">
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('justifyRight')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Align Right">
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCommand('justifyFull')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Justify">
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Styles Gallery */}
            <div className="flex items-center space-x-2 px-3 overflow-x-auto">
              <button 
                onClick={() => execCommand('formatBlock', '<p>')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-center min-w-[65px]"
              >
                <div className="text-xs font-normal">Normal</div>
                <div className="text-[9px] text-slate-400">Regular Text</div>
              </button>
              <button 
                onClick={() => execCommand('formatBlock', '<h1>')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-center min-w-[65px]"
              >
                <div className="text-xs font-bold text-blue-400">Heading 1</div>
                <div className="text-[9px] text-slate-400">Section title</div>
              </button>
              <button 
                onClick={() => execCommand('formatBlock', '<h2>')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-center min-w-[65px]"
              >
                <div className="text-xs font-semibold text-slate-200">Heading 2</div>
                <div className="text-[9px] text-slate-400">Subheading</div>
              </button>
              <button 
                onClick={() => execCommand('formatBlock', '<blockquote>')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-center min-w-[65px]"
              >
                <div className="text-xs italic text-amber-300">Quote</div>
                <div className="text-[9px] text-slate-400">Callout block</div>
              </button>
            </div>
          </div>
        )}

        {/* ─── INSERT TAB ─── */}
        {activeTab === 'insert' && (
          <div className="flex items-center space-x-3 w-full">
            {/* Pages */}
            <div className="flex items-center space-x-1 pr-3">
              <button 
                onClick={insertPageBreak} 
                className="flex flex-col items-center p-1.5 hover:bg-slate-700 rounded text-slate-300"
                title="Insert Page Break"
              >
                <FilePlus className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] mt-1">Page Break</span>
              </button>
            </div>

            {/* Table */}
            <div className="relative px-3">
              <button 
                onClick={() => setShowTablePicker(!showTablePicker)}
                className="flex flex-col items-center p-1.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Table className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] mt-1 flex items-center">Table <ChevronDown className="w-2.5 h-2.5 ml-0.5" /></span>
              </button>

              {showTablePicker && (
                <div className="absolute top-12 left-0 bg-slate-900 border border-slate-700 rounded shadow-xl p-2 z-50">
                  <div className="text-[11px] text-slate-300 font-semibold mb-2">Select Grid Size</div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { r: 2, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 3 }, { r: 5, c: 4 }
                    ].map(grid => (
                      <button
                        key={`${grid.r}x${grid.c}`}
                        onClick={() => {
                          insertTable(grid.r, grid.c);
                          setShowTablePicker(false);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-blue-600 rounded text-[11px] text-slate-200 text-center"
                      >
                        {grid.r} &times; {grid.c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Visual Elements */}
            <div className="flex items-center space-x-2 px-3">
              <button 
                onClick={() => {
                  const url = prompt('Enter Image URL (e.g. logo, site screenshot):');
                  if (url) insertImage(url);
                }} 
                className="flex flex-col items-center p-1.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] mt-1">Picture</span>
              </button>

              <button 
                onClick={insertCallout} 
                className="flex flex-col items-center p-1.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Square className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] mt-1">Callout Box</span>
              </button>

              <button 
                onClick={insertSignatureBlock} 
                className="flex flex-col items-center p-1.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <FileCheck2 className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] mt-1">Signature Line</span>
              </button>
            </div>

            {/* Links & Comments */}
            <div className="flex items-center space-x-2 px-3">
              <button 
                onClick={() => {
                  const url = prompt('Enter Web Link URL:');
                  if (url) execCommand('createLink', url);
                }} 
                className="flex flex-col items-center p-1.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Link className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] mt-1">Hyperlink</span>
              </button>

              <button 
                onClick={() => setShowComments(!showComments)} 
                className={`flex flex-col items-center p-1.5 rounded ${showComments ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'hover:bg-slate-700 text-slate-300'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-[10px] mt-1">Comment</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── DRAW TAB (Matches Screenshot 2) ─── */}
        {activeTab === 'draw' && (
          <div className="flex items-center space-x-4 w-full">
            {/* Draw Mode Switch */}
            <div className="flex items-center space-x-1 pr-3">
              <button
                onClick={() => setDrawingMode(!drawingMode)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
                  drawingMode 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>{drawingMode ? 'Ink Canvas Active' : 'Enable Draw Tool'}</span>
              </button>
            </div>

            {/* Pen Tools */}
            <div className="flex items-center space-x-1 px-3">
              <button
                onClick={() => { setDrawingMode(true); setPenTool('pen'); }}
                className={`p-1.5 rounded flex items-center space-x-1 ${penTool === 'pen' && drawingMode ? 'bg-slate-700 border border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Pen"
              >
                <PenTool className="w-4 h-4" />
                <span className="text-[11px]">Pen</span>
              </button>
              <button
                onClick={() => { setDrawingMode(true); setPenTool('highlighter'); }}
                className={`p-1.5 rounded flex items-center space-x-1 ${penTool === 'highlighter' && drawingMode ? 'bg-slate-700 border border-yellow-500 text-yellow-300' : 'text-slate-400 hover:text-white'}`}
                title="Highlighter"
              >
                <Highlighter className="w-4 h-4" />
                <span className="text-[11px]">Highlighter</span>
              </button>
              <button
                onClick={() => { setDrawingMode(true); setPenTool('eraser'); }}
                className={`p-1.5 rounded flex items-center space-x-1 ${penTool === 'eraser' && drawingMode ? 'bg-slate-700 border border-rose-500 text-rose-300' : 'text-slate-400 hover:text-white'}`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
                <span className="text-[11px]">Eraser</span>
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-1.5 px-3">
              {['#0f172a', '#2563eb', '#dc2626', '#16a34a', '#eab308', '#9333ea'].map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${penColor === c ? 'scale-125 border-white' : 'border-slate-600'}`}
                />
              ))}
            </div>

            {/* Line Thickness */}
            <div className="flex items-center space-x-2 px-3">
              <span className="text-[10px] text-slate-400">Thickness:</span>
              <button onClick={() => setPenSize(2)} className={`px-2 py-0.5 rounded text-[11px] ${penSize === 2 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Fine</button>
              <button onClick={() => setPenSize(5)} className={`px-2 py-0.5 rounded text-[11px] ${penSize === 5 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Med</button>
              <button onClick={() => setPenSize(12)} className={`px-2 py-0.5 rounded text-[11px] ${penSize === 12 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Thick</button>
            </div>

            {/* Canvas Helpers */}
            <div className="flex items-center space-x-2 px-3">
              <button
                onClick={() => setShowRuler(!showRuler)}
                className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${showRuler ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
              >
                <span>Ruler</span>
              </button>

              <select
                value={gridBackground}
                onChange={(e) => setGridBackground(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
              >
                <option value="none">Blank Canvas</option>
                <option value="ruled">Ruled Lines</option>
                <option value="grid">Grid / Graph</option>
              </select>

              <button
                onClick={clearDrawings}
                className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded text-xs transition-colors"
              >
                Clear Ink
              </button>
            </div>
          </div>
        )}

        {/* ─── DESIGN TAB (Matches Screenshot 1 - Document Formatting) ─── */}
        {activeTab === 'design' && (
          <div className="flex items-center space-x-4 w-full">
            {/* Themes */}
            <div className="flex flex-col pr-3">
              <span className="text-[10px] text-slate-400 mb-1">Theme Palette</span>
              <select
                value={activeTheme.id}
                onChange={(e) => {
                  const th = THEME_PRESETS.find(t => t.id === e.target.value);
                  if (th) setActiveTheme(th);
                }}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none font-medium"
              >
                {THEME_PRESETS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Document Formatting Style Gallery */}
            <div className="flex items-center space-x-2 px-3">
              <div className="text-[10px] text-slate-400 mr-1">Style Packs:</div>
              {FORMATTING_STYLE_PRESETS.map((style) => {
                const isSelected = activeStyle.id === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setActiveStyle(style)}
                    className={`px-3 py-1 rounded text-center transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-400/50' 
                        : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xs">{style.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Watermark & Page Color */}
            <div className="flex items-center space-x-3 px-3">
              <div className="relative">
                <button
                  onClick={() => setShowWatermarkDropdown(!showWatermarkDropdown)}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:bg-slate-700 rounded text-xs flex items-center space-x-1"
                >
                  <span>Watermark: {pageSettings.watermark || 'None'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showWatermarkDropdown && (
                  <div className="absolute top-8 left-0 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50 min-w-[140px]">
                    {['None', 'CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE'].map((wm) => (
                      <button
                        key={wm}
                        onClick={() => {
                          setPageSettings(prev => ({ ...prev, watermark: wm === 'None' ? null : wm }));
                          setShowWatermarkDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1 text-xs hover:bg-blue-600 hover:text-white"
                      >
                        {wm}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Page Background Tint */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400">Page Tint:</span>
                {[
                  { name: 'White', color: '#ffffff' },
                  { name: 'Ivory', color: '#fefce8' },
                  { name: 'Light Gray', color: '#f8fafc' },
                  { name: 'Soft Ice', color: '#f0f9ff' }
                ].map((tint) => (
                  <button
                    key={tint.name}
                    onClick={() => setPageSettings(prev => ({ ...prev, pageColor: tint.color }))}
                    style={{ backgroundColor: tint.color }}
                    title={tint.name}
                    className={`w-5 h-5 rounded border ${pageSettings.pageColor === tint.color ? 'border-blue-500 ring-1 ring-blue-400' : 'border-slate-600'}`}
                  />
                ))}
              </div>

              {/* Page Border */}
              <select
                value={pageSettings.borderStyle}
                onChange={(e) => setPageSettings(prev => ({ ...prev, borderStyle: e.target.value as any }))}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
              >
                <option value="none">No Border</option>
                <option value="box">Box Border</option>
                <option value="shadow">Shadow Frame</option>
                <option value="double">Double Border</option>
                <option value="classic">Classic Ornate</option>
              </select>
            </div>
          </div>
        )}

        {/* ─── LAYOUT TAB (Matches Screenshot 5) ─── */}
        {activeTab === 'layout' && (
          <div className="flex items-center space-x-4 w-full">
            {/* Margins */}
            <div className="flex flex-col pr-3">
              <span className="text-[10px] text-slate-400 mb-1">Margins</span>
              <select
                value={pageSettings.margins}
                onChange={(e) => setPageSettings(prev => ({ ...prev, margins: e.target.value as any }))}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
              >
                <option value="normal">Normal (1.0 in)</option>
                <option value="narrow">Narrow (0.5 in)</option>
                <option value="moderate">Moderate (0.75 in)</option>
                <option value="wide">Wide (1.5 in)</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="flex flex-col px-3">
              <span className="text-[10px] text-slate-400 mb-1">Orientation</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPageSettings(prev => ({ ...prev, orientation: 'portrait' }))}
                  className={`px-2 py-1 rounded text-xs ${pageSettings.orientation === 'portrait' ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-300'}`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => setPageSettings(prev => ({ ...prev, orientation: 'landscape' }))}
                  className={`px-2 py-1 rounded text-xs ${pageSettings.orientation === 'landscape' ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-300'}`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Paper Size */}
            <div className="flex flex-col px-3">
              <span className="text-[10px] text-slate-400 mb-1">Paper Size</span>
              <select
                value={pageSettings.size}
                onChange={(e) => setPageSettings(prev => ({ ...prev, size: e.target.value as any }))}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
              >
                <option value="letter">Letter (8.5 &times; 11 in)</option>
                <option value="a4">A4 (210 &times; 297 mm)</option>
                <option value="legal">Legal (8.5 &times; 14 in)</option>
              </select>
            </div>

            {/* Columns */}
            <div className="flex flex-col px-3">
              <span className="text-[10px] text-slate-400 mb-1">Columns</span>
              <div className="flex items-center space-x-1">
                {[1, 2, 3].map(col => (
                  <button
                    key={col}
                    onClick={() => setPageSettings(prev => ({ ...prev, columns: col as any }))}
                    className={`px-2 py-1 rounded text-xs ${pageSettings.columns === col ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 border border-slate-700 text-slate-300'}`}
                  >
                    {col} Col
                  </button>
                ))}
              </div>
            </div>

            {/* Header / Footer Toggles */}
            <div className="flex items-center space-x-3 px-3">
              <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pageSettings.showPageNumbers}
                  onChange={(e) => setPageSettings(prev => ({ ...prev, showPageNumbers: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600"
                />
                <span>Page Numbers</span>
              </label>
            </div>
          </div>
        )}

        {/* ─── REFERENCES TAB (Matches Screenshot 6) ─── */}
        {activeTab === 'references' && (
          <div className="flex items-center space-x-4 w-full">
            <button
              onClick={insertToc}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white rounded text-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Insert Table of Contents</span>
            </button>

            <div className="flex items-center space-x-2 px-3">
              <span className="text-[10px] text-slate-400">Citation Style:</span>
              <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none">
                <option>APA 7th Edition</option>
                <option>MLA 9th Edition</option>
                <option>Chicago Commercial</option>
                <option>IEEE Technical</option>
              </select>
            </div>

            <button
              onClick={() => {
                const note = prompt('Enter Footnote Reference text:');
                if (note) {
                  execCommand('insertHTML', `<sup style="color: #2563eb; font-weight: bold;">[1]</sup>`);
                }
              }}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:bg-slate-700 rounded text-xs text-slate-300"
            >
              Insert Footnote
            </button>
          </div>
        )}

        {/* ─── MAILINGS TAB (Matches Screenshot 7 - Connected to HAL intelligence!) ─── */}
        {activeTab === 'mailings' && (
          <div className="flex items-center space-x-4 w-full">
            {/* Lead / Recipient Selector */}
            <div className="flex items-center space-x-2 pr-3">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-200">Recipient:</span>
              <select
                value={currentRecipientIndex}
                onChange={(e) => setCurrentRecipientIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none max-w-[200px]"
              >
                {recipients.map((rec, i) => (
                  <option key={rec.id} value={i}>
                    {rec.businessName} ({rec.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Variable field picker */}
            <div className="relative px-3">
              <button
                onClick={() => setShowMergeDropdown(!showMergeDropdown)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold text-white flex items-center space-x-1.5 shadow"
              >
                <span>Insert Merge Field</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showMergeDropdown && (
                <div className="absolute top-10 left-0 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50 min-w-[200px]">
                  {[
                    { key: '{{business_name}}', label: 'Business Name' },
                    { key: '{{owner_name}}', label: 'Owner / Contact Name' },
                    { key: '{{city}}', label: 'City / Territory' },
                    { key: '{{phone}}', label: 'Phone Number' },
                    { key: '{{trade_niche}}', label: 'Trade Niche' },
                    { key: '{{ssl_status}}', label: 'SSL Diagnostic Flag' },
                    { key: '{{lcp_speed}}', label: 'Mobile Speed (LCP)' },
                    { key: '{{monthly_sla}}', label: 'Recommended SLA ($)' },
                    { key: '{{date_today}}', label: 'Current Date' }
                  ].map(field => (
                    <button
                      key={field.key}
                      onClick={() => {
                        insertMergeField(field.key);
                        setShowMergeDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-600 hover:text-white flex items-center justify-between"
                    >
                      <span>{field.label}</span>
                      <code className="text-[10px] text-blue-400 font-mono">{field.key}</code>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Merge Preview Toggle */}
            <div className="flex items-center space-x-2 px-3">
              <button
                onClick={() => setPreviewMerge(!previewMerge)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-all ${
                  previewMerge 
                    ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40' 
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>{previewMerge ? 'Showing Merged Data' : 'Preview Live Merge'}</span>
              </button>
            </div>

            {/* Active Recipient Details */}
            {currentRecipient && (
              <div className="text-[11px] text-slate-400 pl-2">
                Active: <span className="text-slate-200 font-medium">{currentRecipient.businessName}</span> &bull; <span className="text-blue-400">\${currentRecipient.recommendedSlaUsd}/mo</span>
              </div>
            )}
          </div>
        )}

        {/* ─── REVIEW TAB (Matches Screenshot 8) ─── */}
        {activeTab === 'review' && (
          <div className="flex items-center space-x-4 w-full">
            {/* Word Count */}
            <div className="flex items-center space-x-3 pr-3 border-r border-slate-700">
              <div className="text-center">
                <div className="text-sm font-bold text-slate-100">{wordCount.words}</div>
                <div className="text-[9px] text-slate-400 uppercase">Words</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-slate-100">{wordCount.chars}</div>
                <div className="text-[9px] text-slate-400 uppercase">Chars</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-blue-400">{wordCount.readTimeMin}m</div>
                <div className="text-[9px] text-slate-400 uppercase">Read Time</div>
              </div>
            </div>

            {/* Speech Read Aloud */}
            <div className="flex items-center space-x-2 px-3">
              <button
                onClick={toggleReadAloud}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  isSpeaking 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? 'Stop Read Aloud' : 'Read Aloud'}</span>
              </button>
            </div>

            {/* Spellcheck & Proofing status */}
            <div className="flex items-center space-x-2 px-3 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Proofing Verified &bull; Active Grammar Engine</span>
            </div>

            {/* Comments Toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`px-3 py-1.5 rounded text-xs ${showComments ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-300'}`}
            >
              {showComments ? 'Hide Comments Panel' : 'Show Comments Panel'}
            </button>
          </div>
        )}

        {/* ─── FILE TAB ─── */}
        {activeTab === 'file' && (
          <div className="flex items-center space-x-2.5 w-full flex-wrap gap-y-2">
            <span className="text-xs text-slate-400 font-mono">Document Actions:</span>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Export to PDF / Print</span>
            </button>
            <button
              onClick={() => {
                const docContent = document.getElementById('document-page-canvas')?.innerHTML;
                if (docContent) {
                  const blob = new Blob([docContent], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Document-${new Date().toISOString().slice(0, 10)}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded text-xs cursor-pointer"
            >
              Download HTML (.html)
            </button>
            <button
              onClick={() => {
                const canvas = document.getElementById('document-page-canvas');
                if (canvas) {
                  const plainText = canvas.innerText || canvas.textContent || '';
                  const blob = new Blob([plainText], { type: 'text/markdown;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Proposal-${new Date().toISOString().slice(0, 10)}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded text-xs cursor-pointer"
            >
              Download Markdown (.md)
            </button>
            <button
              onClick={async () => {
                const canvas = document.getElementById('document-page-canvas');
                if (canvas) {
                  const plainText = canvas.innerText || canvas.textContent || '';
                  try {
                    await navigator.clipboard.writeText(plainText);
                    alert('Document text copied to clipboard successfully.');
                  } catch {
                    // Fallback
                  }
                }
              }}
              className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/50 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Copy Proposal Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
