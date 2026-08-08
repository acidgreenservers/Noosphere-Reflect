import React, { useEffect, useState, createContext, useContext } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { sanitizeUrl, sanitizeImageUrl } from '../utils/securityUtils';
import { useMathJax } from './MathJaxProvider';

interface MarkdownRendererProps {
  content: string;
  onImageClick?: (src: string, alt?: string) => void;
}

const CodeBlockContext = createContext<boolean>(false);

const getTextFromReactNodes = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) {
    return node.map(getTextFromReactNodes).join('');
  }
  if (node.props && node.props.children) {
    return getTextFromReactNodes(node.props.children);
  }
  return '';
};

const getExtensionForLanguage = (lang: string): string => {
  const mapping: Record<string, string> = {
    javascript: 'js',
    js: 'js',
    typescript: 'ts',
    ts: 'ts',
    python: 'py',
    py: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    bash: 'sh',
    sh: 'sh',
    shell: 'sh',
    markdown: 'md',
    md: 'md',
    rust: 'rs',
    rs: 'rs',
    go: 'go',
    sql: 'sql',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    java: 'java',
    kotlin: 'kt',
    ruby: 'rb',
    php: 'php',
    swift: 'swift',
    xml: 'xml',
    toml: 'toml',
    ini: 'ini',
    dockerfile: 'dockerfile',
    docker: 'dockerfile',
    powershell: 'ps1',
    ps1: 'ps1',
    r: 'r',
    dart: 'dart',
  };
  return mapping[lang.toLowerCase()] || 'txt';
};

interface CodeBoxProps {
  language: string;
  children: React.ReactNode;
  [key: string]: any;
}

const CodeBox: React.FC<CodeBoxProps> = ({ language, children, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const rawText = getTextFromReactNodes(children);
      const cleanText = rawText.replace(/\n$/, '');
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleDownload = () => {
    const rawText = getTextFromReactNodes(children);
    const cleanText = rawText.replace(/\n$/, '');
    const extension = getExtensionForLanguage(language);
    const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-block.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="group relative my-4 rounded-xl border border-gray-800/60 bg-gray-950/80 overflow-hidden shadow-lg transition-all duration-300 hover:border-purple-500/20">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/95 border-b border-gray-800/60 text-xs text-gray-400 font-mono select-none">
        <span className="text-gray-300 font-medium">{language}</span>
        <div className="flex items-center gap-2">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-1.5 hover:text-purple-400 hover:bg-gray-800/80 rounded-lg transition-all duration-200 cursor-pointer"
            title="Download Code"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </button>
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
              copied
                ? 'text-green-400 bg-green-500/10'
                : 'hover:text-purple-400 hover:bg-gray-800/80'
            }`}
            title={copied ? 'Copied!' : 'Copy Code'}
          >
            {copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Code Pre/Code Area */}
      <pre className="hljs bg-transparent p-4 overflow-x-auto m-0" {...props}>
        <code className={`language-${language} text-sm text-gray-300 font-mono`}>
          {children}
        </code>
      </pre>
    </div>
  );
};

const CustomComponents = (onImageClick?: (src: string, alt?: string) => void) => ({
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => {
    const safeUrl = sanitizeUrl(href || '');
    if (!safeUrl) {
      return <span className="text-red-500">Invalid URL</span>;
    }
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
      >
        {children}
      </a>
    );
  },

  img: ({ src, alt }: { src?: string; alt?: string }) => {
    const safeUrl = sanitizeImageUrl(src || '');
    if (!safeUrl) {
      return <span className="text-red-500">Invalid image URL</span>;
    }
    return (
      <img
        src={safeUrl}
        alt={alt || ''}
        onClick={(e) => {
          e.stopPropagation();
          if (onImageClick) onImageClick(safeUrl, alt);
        }}
        className="max-w-full rounded-lg my-3 border border-gray-700 shadow-md cursor-pointer hover:opacity-90 transition-opacity hover:border-purple-500/50"
        title="Click to view in Side Reader"
      />
    );
  },

  pre: ({ children, ...props }: any) => {
    return (
      <CodeBlockContext.Provider value={true}>
        {children}
      </CodeBlockContext.Provider>
    );
  },

  code: ({ inline, className, children, node, ...props }: any) => {
    const isBlock = useContext(CodeBlockContext);

    if (!isBlock) {
      return (
        <code className="bg-gray-800/50 px-1.5 py-0.5 rounded text-purple-300 font-mono text-sm border border-gray-700/50" {...props}>
          {children}
        </code>
      );
    }

    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext';

    return (
      <CodeBox language={language} {...props}>
        {children}
      </CodeBox>
    );
  },

  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-purple-500/30 pl-4 italic text-purple-300 my-4 bg-purple-500/5 px-4 py-3 rounded-r-lg">
      {children}
    </blockquote>
  ),

  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-gray-700 border-collapse">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gray-800">{children}</thead>
  ),

  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border border-gray-700">
      {children}
    </th>
  ),

  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-sm text-gray-300 border border-gray-700">{children}</td>
  ),

  collapsible: ({ children }: { children: React.ReactNode }) => (
    <CollapsibleBlock title="Collapsible Section" iconOpen="📂" iconClosed="📁">
      {children}
    </CollapsibleBlock>
  ),

  thoughts: ({ children }: { children: React.ReactNode }) => (
    <CollapsibleBlock title="Thought process" iconOpen="🧠" iconClosed="💡" isThought={true}>
      {children}
    </CollapsibleBlock>
  ),

  thought: ({ children }: { children: React.ReactNode }) => (
    <CollapsibleBlock title="Thought process" iconOpen="🧠" iconClosed="💡" isThought={true}>
      {children}
    </CollapsibleBlock>
  ),
});

interface CollapsibleBlockProps {
  title: string;
  children: React.ReactNode;
  iconOpen: string;
  iconClosed: string;
  isThought?: boolean;
}

const CollapsibleBlock: React.FC<CollapsibleBlockProps> = ({ title, children, iconOpen, iconClosed, isThought }) => {
  const [isOpen, setIsOpen] = useState(false);
  const blockClass = isThought ? "markdown-thought-block" : "markdown-collapsible-block";
  const summaryClass = isThought ? "markdown-thought-summary" : "markdown-collapsible-summary";
  const contentClass = isThought ? "markdown-thought-content" : "";

  return (
    <span className={`block my-4 ${blockClass}`}>
      <details
        open={isOpen}
        onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className={`${summaryClass} cursor-pointer flex items-center justify-between list-none`}>
          <span className="flex items-center gap-3">
            <span className="text-purple-400 text-lg">{isOpen ? iconOpen : iconClosed}</span>
            <span className="font-bold">{title}</span>
          </span>
          <span className={`inline-block transform transition-transform duration-300 text-purple-400 ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
        </summary>
        <span className={`block p-4 border-t border-purple-500/20 bg-gray-900/40 ${contentClass}`}>
          {children}
        </span>
      </details>
    </span>
  );
};

// Customize sanitization schema to allow custom tags and data URIs for images
const schema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src || []), 'data']
  },
  tagNames: [...(defaultSchema.tagNames || []), 'collapsible', 'thoughts', 'thought'],
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onImageClick }) => {
  const { typeset } = useMathJax();

  useEffect(() => {
    typeset();
  }, [content, typeset]);

  // Pre-process markdown to handle nested custom tags in blockquotes without blank lines
  const processedContent = React.useMemo(() => {
    if (!content) return '';

    const lines = content.split('\n');
    const result: string[] = [];
    let blockquotePrefix = "";
    let insideNestedTag = false;
    const customTagStack: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check for blockquote prefix
      // We look for a line starting with > (potentially preceded by spaces)
      const blockquoteMatch = line.match(/^(\s*>+ ?)/);
      if (blockquoteMatch) {
        blockquotePrefix = blockquoteMatch[1];
      } else if (trimmedLine === "" && customTagStack.length === 0) {
        // Only reset blockquote prefix on truly empty lines if not currently inside a custom tag
        // that we are force-nesting.
        blockquotePrefix = "";
      }

      // Check for custom tag starts
      const tagStartMatch = trimmedLine.match(/^<(collapsible|thoughts|thought)>/);
      const tagEndMatch = trimmedLine.match(/<\/(collapsible|thoughts|thought)>/);

      if (tagStartMatch) {
        const tagName = tagStartMatch[1];
        // If we have a blockquote prefix and we're starting a tag at the top level
        // (relative to other custom tags), we mark that we're now force-nesting.
        if (blockquotePrefix && customTagStack.length === 0) {
          insideNestedTag = true;
        }
        customTagStack.push(tagName);
      }

      let processedLine = line;
      if (insideNestedTag) {
        // If we are inside a tag that started in a blockquote context,
        // ensure every line (including blank ones) has the blockquote prefix
        // so it stays within the same blockquote element in the DOM.
        if (blockquotePrefix && !line.startsWith(blockquotePrefix)) {
          processedLine = blockquotePrefix + line;
        }
      }

      if (tagEndMatch) {
        const tagName = tagEndMatch[1];
        // Find last occurrence of this tag in stack to handle potential nesting correctly
        const lastIndex = customTagStack.lastIndexOf(tagName);
        if (lastIndex !== -1) {
          customTagStack.splice(lastIndex, 1);
          if (customTagStack.length === 0) {
            insideNestedTag = false;
          }
        }
      }

      result.push(processedLine);
    }
    return result.join('\n');
  }, [content]);

  const componentsMemo = React.useMemo(() => CustomComponents(onImageClick) as any, [onImageClick]);

  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeHighlight]}
        components={componentsMemo}
        urlTransform={(url) => {
          if (url.startsWith('data:image/')) return url;
          return defaultUrlTransform(url);
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;