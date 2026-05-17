import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { sanitizeUrl } from '../utils/securityUtils';
import { useMathJax } from './MathJaxProvider';

interface MarkdownRendererProps {
  content: string;
}

const CustomComponents = {
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
    const safeUrl = sanitizeUrl(src || '');
    if (!safeUrl) {
      return <span className="text-red-500">Invalid image URL</span>;
    }
    return (
      <img
        src={safeUrl}
        alt={alt || ''}
        className="max-w-full rounded-lg my-3 border border-gray-700 shadow-md"
      />
    );
  },

  code: ({ inline, children, className }: { inline?: boolean; children: React.ReactNode; className?: string }) => {
    if (inline) {
      return (
        <code className="bg-gray-800/50 px-1.5 py-0.5 rounded text-purple-300 font-mono text-sm border border-gray-700/50">
          {children}
        </code>
      );
    }

    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext';

    return (
      <div className="group relative my-4">
        <pre className="hljs bg-gray-950/80 p-4 rounded-xl border border-gray-800/50 overflow-x-auto">
          <code className={`language-${language} text-sm text-gray-300 font-mono`}>{children}</code>
        </pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
          }}
          className="absolute top-3 right-3 px-2.5 py-1.5 text-xs bg-gray-800/80 hover:bg-gray-700 border border-gray-700/50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105"
          title="Copy code"
        >
          Copy
        </button>
      </div>
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

  collapsible: ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <span className="block my-4 border border-purple-500/30 rounded-xl overflow-hidden bg-purple-500/5 transition-all duration-300 shadow-lg shadow-purple-500/5">
        <details
          open={isOpen}
          onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer p-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 font-bold flex items-center justify-between list-none transition-colors">
            <span className="flex items-center gap-3">
              <span className="text-purple-400 text-lg">{isOpen ? '📂' : '📁'}</span>
              <span>Collapsible Section</span>
            </span>
            <span className={`inline-block transform transition-transform duration-300 text-purple-400 ${isOpen ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </summary>
          <span className="block p-4 text-gray-300 border-t border-purple-500/20 bg-gray-900/40">
            {children}
          </span>
        </details>
      </span>
    );
  },
};

// Customize sanitization schema to allow <collapsible> tag
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'collapsible'],
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const { typeset } = useMathJax();

  useEffect(() => {
    typeset();
  }, [content, typeset]);

  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeHighlight]}
        components={CustomComponents as any}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;