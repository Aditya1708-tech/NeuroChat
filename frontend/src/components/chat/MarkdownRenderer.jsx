import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { CodeBlock } from './CodeBlock.jsx';
import { MermaidBlock } from './MermaidBlock.jsx';

// Sanitization schema per spec §26.4: allow safe text elements, disable image tags
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'em',
    'strong',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'a',
    'hr',
    'br',
  ],
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
  },
};

export function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-content" style={{ fontSize: '1rem', lineHeight: '1.65' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const lang = (match ? match[1] : '').toLowerCase();
            const isMermaidSyntax = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph)\b/i.test(codeString.trim());

            if (!inline && (lang === 'mermaid' || (!lang && isMermaidSyntax))) {
              return <MermaidBlock value={codeString} />;
            }

            if (!inline && match) {
              return <CodeBlock language={match[1]} value={codeString} />;
            }

            if (!inline) {
              return <CodeBlock language="" value={codeString} />;
            }

            return (
              <code
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-soft)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: 'var(--color-indigo-600)',
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          a({ node, href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ color: 'var(--color-indigo-500)', textDecoration: 'underline' }}
                {...props}
              >
                {children}
              </a>
            );
          },
          p({ children }) {
            return <p style={{ margin: '8px 0' }}>{children}</p>;
          },
          ul({ children }) {
            return <ul style={{ margin: '8px 0 8px 24px' }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol style={{ margin: '8px 0 8px 24px' }}>{children}</ol>;
          },
          blockquote({ children }) {
            return (
              <blockquote
                style={{
                  borderLeft: '3px solid var(--color-indigo-500)',
                  margin: '12px 0',
                  paddingLeft: '14px',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                }}
              >
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
