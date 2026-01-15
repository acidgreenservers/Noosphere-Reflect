import React, { useState, useRef, useEffect } from 'react';
import { ChatData, ChatTheme, ParserMode, ChatMetadata, SavedChatSession } from '../types';
import { generateHtml, generateMarkdown, generateJson, generateZipExport, generateDirectoryExportWithPicker } from '../services/converterService';
import { storageService } from '../services/storageService';
import { sanitizeFilename } from '../utils/securityUtils';

interface ExportDropdownProps {
  chatData: ChatData;
  chatTitle: string;
  userName: string;
  aiName: string;
  selectedTheme: ChatTheme;
  parserMode: ParserMode;
  metadata?: ChatMetadata;
  buttonText?: string;
  buttonClassName?: string;
  session?: SavedChatSession; // Optional: for ZIP export with artifacts
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({
  chatData,
  chatTitle,
  userName,
  aiName,
  selectedTheme,
  parserMode,
  metadata,
  buttonText = 'Export',
  buttonClassName = 'px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg hover:shadow-green-500/20 transition-all text-sm font-bold flex items-center gap-2',
  session
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard (ESC to close)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleExport = async (format: 'html' | 'markdown' | 'json') => {
    if (!chatData) {
      alert('Chat data is not available for export.');
      setIsOpen(false);
      return;
    }

    try {
      // Import utilities
      // Generate filename with [AIName] - chatname format (matching ArchiveHub)
      const appSettings = await storageService.getSettings();

      const sanitizedTitle = sanitizeFilename(
        chatTitle,
        appSettings.fileNamingCase
      );
      const baseFilename = `[${aiName}] - ${sanitizedTitle}`;

      // Generate content based on format
      let content: string;
      let extension: string;
      let mimeType: string;

      if (format === 'html') {
        content = generateHtml(chatData, chatTitle, selectedTheme, userName, aiName, parserMode, metadata);
        extension = 'html';
        mimeType = 'text/html';
      } else if (format === 'markdown') {
        content = generateMarkdown(chatData, chatTitle, userName, aiName, metadata);
        extension = 'md';
        mimeType = 'text/markdown';
      } else {
        content = generateJson(chatData, metadata);
        extension = 'json';
        mimeType = 'application/json';
      }

      // Create blob and download (simple single-file download)
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFilename}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName}
      >
        <span>⬇️</span>
        {buttonText}
        <span className="text-xs ml-1">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => handleExport('html')}
            className="w-full px-4 py-3 text-left text-gray-100 hover:bg-gray-700 transition-colors border-b border-gray-700 flex items-center gap-3"
          >
            <span className="text-lg">🌐</span>
            <div>
              <div className="font-semibold text-sm">HTML (Standalone)</div>
              <div className="text-xs text-gray-400">Complete with styling</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('markdown')}
            className="w-full px-4 py-3 text-left text-gray-100 hover:bg-gray-700 transition-colors border-b border-gray-700 flex items-center gap-3"
          >
            <span className="text-lg">📝</span>
            <div>
              <div className="font-semibold text-sm">Markdown (.md)</div>
              <div className="text-xs text-gray-400">Portable text format</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('json')}
            className="w-full px-4 py-3 text-left text-gray-100 hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <span className="text-lg">{ /* JSON braces */}{'{ }'}</span>
            <div>
              <div className="font-semibold text-sm">JSON (Data Only)</div>
              <div className="text-xs text-gray-400">Machine-readable format</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;