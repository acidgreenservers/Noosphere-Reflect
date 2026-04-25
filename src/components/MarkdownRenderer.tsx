import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
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
        <code className="bg-gray-800 px-1.5 py-0.5 rounded text-purple-300 font-mono text-sm border border-gray-700">
          {children}
        </code>
      );
    }

    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    return (
      <div className="group relative my-4">
        <pre className="bg-gray-950 p-4 rounded-lg border border-gray-800 overflow-x-auto">
          <code className={`language-${language} text-sm text-gray-300`}>{children}</code>
        </pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
          }}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
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
        rehypePlugins={[rehypeHighlight, rehypeSanitize]}
        components={CustomComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;