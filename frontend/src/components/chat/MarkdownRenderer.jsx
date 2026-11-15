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
    <div
      className="markdown-content"
      style={{
        fontSize: 'var(--chat-font-size, 0.9125rem)',
        lineHeight: '1.65',
        color: 'var(--text-primary)',
      }}
    >
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
                  fontSize: '0.82rem',
                  backgroundColor: 'var(--bg-soft)',
                  padding: '2px 5px',
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
          h1({ children }) {
            return (
              <h1 style={{ fontSize: '1.25rem', margin: '14px 0 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 style={{ fontSize: '1.12rem', margin: '12px 0 6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 style={{ fontSize: '1.02rem', margin: '10px 0 4px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {children}
              </h3>
            );
          },
          p({ children }) {
            return <p style={{ margin: '8px 0', fontSize: 'inherit' }}>{children}</p>;
          },
          ul({ children }) {
            return <ul style={{ margin: '6px 0 6px 20px', fontSize: 'inherit' }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol style={{ margin: '6px 0 6px 20px', fontSize: 'inherit' }}>{children}</ol>;
          },
          li({ children }) {
            return <li style={{ margin: '3px 0', fontSize: 'inherit' }}>{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote
                style={{
                  borderLeft: '3px solid var(--color-indigo-500)',
                  margin: '10px 0',
                  paddingLeft: '12px',
                  color: 'var(--text-secondary)',
                  fontStyle: 'normal',
                  fontSize: '0.88rem',
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
