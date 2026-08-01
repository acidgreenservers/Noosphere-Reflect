import React, { useState, useMemo, useEffect } from 'react';
import { ConversationArtifact } from '../../../../types';
import { safeDecode } from '../../utils';
import { buildDocument } from './services/buildDocument';

/**
 * HtmlReader — UI-only component for HTML/JSX/TSX artifact preview.
 *
 * Responsibilities:
 * - Decode the artifact payload via safeDecode
 * - Determine file type (html vs jsx vs tsx)
 * - Build the iframe srcDoc via the buildDocument service
 * - Render the Preview/Source toggle + iframe
 *
 * All logic (CDN constants, import transformation, Babel wiring) lives in
 * ./services/*.ts — no business logic in this file.
 */
export const HtmlReader = ({ artifact }: { artifact: ConversationArtifact }) => {
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  const decodedContent = useMemo(() => safeDecode(artifact.fileData), [artifact.fileData]);

  const ext = artifact.fileName.toLowerCase().split('.').pop() || '';
  const isJsx = ext === 'jsx' || ext === 'tsx';
  const isTsx = ext === 'tsx';

  const iframeContent = useMemo(
    () => buildDocument(decodedContent, isJsx, isTsx),
    [decodedContent, isJsx, isTsx]
  );

  // Reset to preview mode when switching artifacts
  useEffect(() => {
    setViewMode('preview');
  }, [artifact.id]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Source / Preview Toggle Bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-700/50 bg-[#161b22] flex-shrink-0">
        <button
          onClick={() => setViewMode('preview')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'preview'
            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent'
            }`}
        >
          Preview
        </button>
        <button
          onClick={() => setViewMode('source')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'source'
            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent'
            }`}
        >
          Source
        </button>
        {isJsx && viewMode === 'preview' && (
          <span className="ml-auto text-[10px] text-gray-500 font-mono">
            React 18 + Babel + Tailwind (sandboxed)
          </span>
        )}
      </div>

      {/* Content Area */}
      {viewMode === 'preview' ? (
        <iframe
          key={artifact.id}
          srcDoc={iframeContent}
          title={artifact.fileName}
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts"
        />
      ) : (
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#0d1117]">
          <pre className="px-6 py-4 font-mono text-[13px] leading-6 text-gray-300 whitespace-pre-wrap break-all">
            {decodedContent}
          </pre>
        </div>
      )}
    </div>
  );
};