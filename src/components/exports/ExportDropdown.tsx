import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChatData, ChatTheme, ParserMode, ChatMetadata, SavedChatSession } from '../../types';
import { generateZipExport, generateDirectoryExportWithPicker } from '../../services/converterService';
import { exportService } from './services';
import { storageService } from '../../services/storageService';
import { sanitizeFilename } from '../../utils/securityUtils';

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
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 180; // Approximate height of dropdown
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number;
      if (spaceBelow >= dropdownHeight) {
        // Enough space below, position below button
        top = rect.bottom + 8;
      } else if (spaceAbove >= dropdownHeight) {
        // Enough space above, position above button
        top = rect.top - dropdownHeight - 8;
      } else {
        // Not enough space above or below, position below and let it scroll
        top = rect.bottom + 8;
      }

      setDropdownPosition({
        top,
        left: rect.right - 224 // 224px = w-56 (14rem = 224px)
      });
    }
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

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
        content = exportService.generate('html', chatData, chatTitle, selectedTheme, userName, aiName, parserMode, metadata);
        extension = 'html';
        mimeType = 'text/html';
      } else if (format === 'markdown') {
        content = exportService.generate('markdown', chatData, chatTitle, undefined, userName, aiName, undefined, metadata);
        extension = 'md';
        mimeType = 'text/markdown';
      } else {
        content = exportService.generate('json', chatData, undefined, undefined, undefined, undefined, undefined, metadata);
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

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
      style={{
        top: dropdownPosition?.top || 0,
        left: dropdownPosition?.left || 0,
      }}
    >
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
  );

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className={buttonClassName}
      >
        <span>⬇️</span>
        {buttonText}
        <span className="text-xs ml-1">▼</span>
      </button>

      {isOpen && dropdownPosition && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default ExportDropdown;
