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
};

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

// Customize sanitization schema to allow <collapsible>, <thoughts>, and <thought> tags
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'collapsible', 'thoughts', 'thought'],
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
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

  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeHighlight]}
        components={CustomComponents as any}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;