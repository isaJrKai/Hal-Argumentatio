import React, { useRef, useEffect, useState } from 'react';
import { 
  DocumentPageSettings, 
  DocumentTheme, 
  DocumentFormattingStyle, 
  DocumentRecipient, 
  DocumentComment 
} from './types';
import { MessageSquare, Plus, Trash2, X } from 'lucide-react';

interface DocumentCanvasProps {
  content: string;
  onContentChange: (newContent: string) => void;
  pageSettings: DocumentPageSettings;
  activeTheme: DocumentTheme;
  activeStyle: DocumentFormattingStyle;
  drawingMode: boolean;
  penTool: 'pen' | 'highlighter' | 'eraser';
  penColor: string;
  penSize: number;
  showRuler: boolean;
  gridBackground: 'none' | 'ruled' | 'grid';
  previewMerge: boolean;
  activeRecipient: DocumentRecipient | undefined;
  comments: DocumentComment[];
  onAddComment: (comment: Omit<DocumentComment, 'id' | 'date'>) => void;
  onDeleteComment: (id: string) => void;
  showComments: boolean;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  content,
  onContentChange,
  pageSettings,
  activeTheme,
  activeStyle,
  drawingMode,
  penTool,
  penColor,
  penSize,
  showRuler,
  gridBackground,
  previewMerge,
  activeRecipient,
  comments,
  onAddComment,
  onDeleteComment,
  showComments
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Synchronize initial content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Handle inking on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas pixel density
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, [pageSettings.orientation, pageSettings.size]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setLastPoint({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint || !drawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentX, currentY);

    if (penTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penSize * 3;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (penTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor === '#0f172a' ? 'rgba(254, 240, 138, 0.45)' : `${penColor}55`;
      ctx.lineWidth = penSize * 4;
      ctx.lineCap = 'square';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.stroke();
    setLastPoint({ x: currentX, y: currentY });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  // Dimensions based on page size and orientation
  const isLandscape = pageSettings.orientation === 'landscape';
  let pageWidth = isLandscape ? '1100px' : '820px';
  let minHeight = isLandscape ? '750px' : '1056px'; // standard 8.5x11 aspect ratio

  if (pageSettings.size === 'a4') {
    pageWidth = isLandscape ? '1120px' : '794px';
    minHeight = isLandscape ? '794px' : '1123px';
  } else if (pageSettings.size === 'legal') {
    pageWidth = isLandscape ? '1340px' : '820px';
    minHeight = isLandscape ? '820px' : '1340px';
  }

  // Margin padding
  let paddingClass = 'p-12';
  if (pageSettings.margins === 'narrow') paddingClass = 'p-6';
  if (pageSettings.margins === 'moderate') paddingClass = 'p-8';
  if (pageSettings.margins === 'wide') paddingClass = 'p-16';

  // Border styling
  let borderClasses = 'border border-slate-200';
  if (pageSettings.borderStyle === 'box') {
    borderClasses = 'border-4 border-slate-800';
  } else if (pageSettings.borderStyle === 'shadow') {
    borderClasses = 'border-2 border-slate-700 shadow-2xl';
  } else if (pageSettings.borderStyle === 'double') {
    borderClasses = 'border-4 border-double border-slate-900';
  } else if (pageSettings.borderStyle === 'classic') {
    borderClasses = 'border-[6px] border-double border-amber-900 shadow-xl';
  }

  // Live variable replacement for preview
  const getRenderedContent = () => {
    if (!previewMerge || !activeRecipient) {
      return content;
    }
    return content
      .replace(/\{\{business_name\}\}/g, activeRecipient.businessName)
      .replace(/\{\{owner_name\}\}/g, activeRecipient.ownerName)
      .replace(/\{\{city\}\}/g, activeRecipient.city)
      .replace(/\{\{phone\}\}/g, activeRecipient.phone)
      .replace(/\{\{trade_niche\}\}/g, activeRecipient.tradeNiche)
      .replace(/\{\{ssl_status\}\}/g, activeRecipient.missingSsl ? 'MISSING (Unsecured HTTP)' : 'Valid TLS 256-Bit')
      .replace(/\{\{lcp_speed\}\}/g, activeRecipient.lcpSpeed)
      .replace(/\{\{monthly_sla\}\}/g, activeRecipient.recommendedSlaUsd.toLocaleString())
      .replace(/\{\{date_today\}\}/g, new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  };

  const handleInput = () => {
    if (editorRef.current && !previewMerge) {
      onContentChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-950 p-6 flex justify-center relative">
      {/* Horizontal Ruler (when active) */}
      {showRuler && (
        <div 
          className="absolute top-0 bg-slate-800 border-b border-slate-700 text-[9px] text-slate-400 flex items-center h-4 font-mono select-none pointer-events-none z-20"
          style={{ width: pageWidth, maxWidth: '100%' }}
        >
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center border-l border-slate-600 pl-1">
              <span>{i}"</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Document Paper Sheet */}
      <div 
        id="document-page-canvas"
        className={`relative shadow-2xl transition-all duration-200 select-text ${borderClasses} ${paddingClass}`}
        style={{
          width: pageWidth,
          minHeight: minHeight,
          backgroundColor: pageSettings.pageColor || '#ffffff',
          fontFamily: activeTheme.fontFamily,
          color: activeTheme.primaryColor
        }}
      >
        {/* Watermark Diagonal Text Overlay */}
        {pageSettings.watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            <span 
              className="text-8xl font-black tracking-widest text-slate-400/20 transform -rotate-45 uppercase font-sans whitespace-nowrap"
              style={{ fontSize: '7rem' }}
            >
              {pageSettings.watermark}
            </span>
          </div>
        )}

        {/* Paper Background Patterns (Ruled / Grid) */}
        {gridBackground === 'ruled' && (
          <div 
            className="absolute inset-0 pointer-events-none select-none opacity-25 z-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #94a3b8 24px)'
            }}
          />
        )}
        {gridBackground === 'grid' && (
          <div 
            className="absolute inset-0 pointer-events-none select-none opacity-20 z-0"
            style={{
              backgroundImage: 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
        )}

        {/* Running Header */}
        <div className="border-b border-slate-200/80 pb-2 mb-6 flex items-center justify-between text-[11px] text-slate-400 select-none">
          <span className="font-semibold tracking-wide uppercase">{pageSettings.headerText || 'HAL ENTERPRISE OPERATING INTELLIGENCE'}</span>
          <span>DOCUMENT SPECIFICATION &bull; CONFIDENTIAL</span>
        </div>

        {/* Multi-Column Document Layout Wrapper */}
        <div
          style={{
            columnCount: pageSettings.columns,
            columnGap: '2rem',
            columnRule: pageSettings.columns > 1 ? '1px solid #e2e8f0' : 'none'
          }}
        >
          {previewMerge ? (
            <div 
              className="prose max-w-none outline-none relative z-10 leading-relaxed text-slate-800"
              dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              className="prose max-w-none outline-none relative z-10 leading-relaxed text-slate-800 min-h-[500px]"
            />
          )}
        </div>

        {/* Running Footer */}
        <div className="absolute bottom-4 left-12 right-12 border-t border-slate-200/80 pt-2 flex items-center justify-between text-[10px] text-slate-400 select-none">
          <span>{pageSettings.footerText || 'PROPRIETARY WORK ORDER &bull; ALL RIGHTS RESERVED'}</span>
          {pageSettings.showPageNumbers && (
            <span className="font-mono font-semibold">Page 1 of 1</span>
          )}
        </div>

        {/* Inking / Drawing Overlay HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`absolute inset-0 z-20 ${drawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
        />
      </div>

      {/* Review Comments Sidebar */}
      {showComments && (
        <div className="w-72 ml-4 bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-xl flex flex-col h-[600px] select-none text-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-1.5 font-semibold text-xs">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Review Comments ({comments.length})</span>
            </div>
          </div>

          {/* Comment List */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active comments. Add inline review feedback below.
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-blue-300">{comment.author}</span>
                    <span>{comment.date}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-snug">{comment.text}</p>
                  <div className="mt-1.5 flex justify-end">
                    <button 
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center space-x-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Resolve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New Comment Input */}
          <div className="pt-2 border-t border-slate-800">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Leave feedback or legal review note..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none resize-none h-16"
            />
            <button
              onClick={() => {
                if (!newCommentText.trim()) return;
                onAddComment({
                  author: 'Operator / Lead Counsel',
                  text: newCommentText.trim()
                });
                setNewCommentText('');
              }}
              className="mt-1.5 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition-colors flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Comment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
