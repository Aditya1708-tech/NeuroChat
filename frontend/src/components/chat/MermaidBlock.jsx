import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Eye, Code, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export function MermaidBlock({ value }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const containerRef = useRef(null);

  const [svgHtml, setSvgHtml] = useState('');
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'code'
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Re-render diagram whenever value or theme changes
  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!value || !value.trim()) return;

      try {
        setLoading(true);
        setError(null);

        // Unique ID per render
        const renderId = `mermaid-${Math.random().toString(36).substring(2, 11)}`;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'default',
          fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
          themeVariables: isDark
            ? {
                primaryColor: '#6366f1',
                primaryTextColor: '#f8fafc',
                primaryBorderColor: '#818cf8',
                lineColor: '#94a3b8',
                secondaryColor: '#312e81',
                tertiaryColor: '#1e1b4b',
                mainBkg: '#1e1b4b',
                nodeBorder: '#6366f1',
                clusterBkg: '#0f172a',
                clusterBorder: '#334155',
                defaultLinkColor: '#a5b4fc',
              }
            : {
                primaryColor: '#e0e7ff',
                primaryTextColor: '#1e1b4b',
                primaryBorderColor: '#6366f1',
                lineColor: '#64748b',
                secondaryColor: '#ede9fe',
                tertiaryColor: '#f5f3ff',
                mainBkg: '#ffffff',
                nodeBorder: '#6366f1',
                clusterBkg: '#f8fafc',
                clusterBorder: '#cbd5e1',
                defaultLinkColor: '#4f46e5',
              },
        });

        const { svg } = await mermaid.render(renderId, value.trim());

        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to render flowchart');
          setLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
      // Cleanup any dangling temporary render elements created by mermaid
      const dangling = document.querySelectorAll(`[id^="dmermaid"]`);
      dangling.forEach((el) => el.remove());
    };
  }, [value, isDark]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      style={{
        margin: '16px 0',
        borderRadius: 'var(--radius-lg, 12px)',
        background: isDark ? 'rgba(15, 23, 42, 0.65)' : 'var(--bg-soft, #f8fafc)',
        border: '1px solid var(--border, rgba(99, 102, 241, 0.15))',
        boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(99, 102, 241, 0.04)',
          borderBottom: '1px solid var(--border, rgba(99, 102, 241, 0.1))',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--color-indigo-500, #6366f1)',
              fontSize: '0.75rem',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            Diagram
          </span>
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>Flowchart / Architecture</span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Mode Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'diagram' ? 'code' : 'diagram')}
            title={viewMode === 'diagram' ? 'View Mermaid Code' : 'View Visual Diagram'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border, #cbd5e1)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {viewMode === 'diagram' ? (
              <>
                <Code size={13} />
                <span>Code</span>
              </>
            ) : (
              <>
                <Eye size={13} />
                <span>Diagram</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Diagram Code"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: copied ? 'var(--success, #10b981)' : 'var(--color-indigo-500, #6366f1)',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            {copied ? (
              <>
                <Check size={13} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'diagram' && !error ? (
        <div
          ref={containerRef}
          style={{
            padding: '20px 16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflowX: 'auto',
            minHeight: '140px',
            backgroundColor: isDark ? 'rgba(10, 15, 29, 0.4)' : '#ffffff',
          }}
        >
          {loading ? (
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              Generating visual flowchart...
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: svgHtml }}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
          )}
        </div>
      ) : (
        <div>
          {error && viewMode === 'diagram' && (
            <div
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                fontSize: '0.8rem',
                borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              <AlertCircle size={15} />
              <span>Diagram syntax is formatting or still streaming. Showing source code:</span>
            </div>
          )}
          <pre
            style={{
              padding: '14px 18px',
              margin: 0,
              overflowX: 'auto',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            }}
          >
            <code>{value}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
