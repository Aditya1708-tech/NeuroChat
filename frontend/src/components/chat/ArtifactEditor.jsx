import React, { useState, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  FileText,
  Table,
} from 'lucide-react';
import {
  downloadFile,
  exportArtifactAsPdf,
} from '../../services/artifactService.js';
import { MarkdownRenderer } from './MarkdownRenderer.jsx';

export function ArtifactEditor({ artifact, onClose, isExpanded = false, onToggleExpand }) {
  const [content, setContent] = useState(artifact?.content || '');
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (artifact) {
      setContent(artifact.content || '');
    }
  }, [artifact]);

  if (!artifact) return null;

  const {
    id,
    title = 'Untitled Artifact',
    filename = 'document.html',
    type = 'document',
    format = 'html',
    mimeType = 'text/html',
  } = artifact;

  const lines = (content || '').split(/\r\n|\r|\n/);
  const lineCount = lines.length;
  const byteSize = new Blob([content]).size;
  const formattedSize =
    byteSize < 1024
      ? `${byteSize} B`
      : byteSize < 1024 * 1024
      ? `${(byteSize / 1024).toFixed(1)} KB`
      : `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;

  const isDocType =
    type === 'document' ||
    type === 'html' ||
    format === 'html' ||
    format === 'markdown' ||
    Boolean(content && (content.includes('<!DOCTYPE html>') || content.includes('<html')));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExportAsPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportArtifactAsPdf({
        title,
        filename,
        content,
        type,
        format,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadOriginal = () => {
    if (type === 'image' || (typeof content === 'string' && content.startsWith('data:image/'))) {
      const a = document.createElement('a');
      a.href = content;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    downloadFile(filename, content, mimeType);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header - Compact, non-overlapping */}
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--surface)',
          flexShrink: 0,
          gap: '8px',
          height: '48px',
        }}
      >
        {/* Title & File Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden', marginRight: '4px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-soft)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-indigo-600)',
              flexShrink: 0,
            }}
          >
            {type === 'image' ? <ImageIcon size={15} /> : type === 'data' ? <Table size={15} /> : <FileText size={15} />}
          </div>

          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--text-primary)',
                  display: 'inline-block',
                  maxWidth: '180px',
                }}
                title={title}
              >
                {title}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-soft)',
                  color: 'var(--color-indigo-600)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                {format}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={filename}
            >
              {filename}
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Download Button: Image Download for images, PDF Download for documents */}
          {type === 'image' || (typeof content === 'string' && content.startsWith('data:image/')) ? (
            <button
              type="button"
              onClick={handleDownloadOriginal}
              className="btn btn-primary"
              style={{
                minHeight: '28px',
                padding: '0 10px',
                fontSize: '0.75rem',
                gap: '4px',
                backgroundColor: 'var(--color-indigo-600)',
                color: '#ffffff',
                fontWeight: 600,
              }}
              title={`Download ${filename}`}
            >
              <Download size={13} />
              <span>Download Image</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleExportAsPdf}
                className="btn btn-primary"
                style={{
                  minHeight: '28px',
                  padding: '0 10px',
                  fontSize: '0.75rem',
                  gap: '4px',
                  backgroundColor: 'var(--color-indigo-600)',
                  color: '#ffffff',
                  fontWeight: 600,
                }}
                title="Download / Print as PDF with exact colors and margins"
              >
                <FileText size={13} />
                <span>{isExportingPdf ? "Generating PDF..." : "Download PDF"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadOriginal}
                className="btn"
                style={{
                  minHeight: '28px',
                  padding: '0 8px',
                  fontSize: '0.75rem',
                  gap: '4px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-secondary)',
                }}
                title={`Download ${filename}`}
              >
                <Download size={13} />
                <span>File</span>
              </button>
            </>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="icon-btn"
            style={{ width: '28px', height: '28px' }}
            title="Copy content"
          >
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
          </button>

          {/* Expand / Minimize Toggle */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="icon-btn"
              style={{ width: '28px', height: '28px' }}
              title={isExpanded ? 'Restore side pane' : 'Maximize full screen'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            style={{ width: '28px', height: '28px' }}
            title="Close viewer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Full-Height Document / Code Canvas - Smooth scrolling, zero clipping */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: '#ffffff',
        }}
      >
        {type === 'image' || (typeof content === 'string' && content.startsWith('data:image/')) ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              padding: '24px',
              overflow: 'auto',
            }}
          >
            <img
              src={content}
              alt={title || filename}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        ) : isDocType && (format === 'html' || content.includes('<!DOCTYPE html>') || content.includes('<html')) ? (
          <iframe
            title={title}
            srcDoc={content}
            sandbox="allow-same-origin allow-scripts"
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              backgroundColor: '#ffffff',
            }}
          />
        ) : type === 'markdown' || format === 'markdown' ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              overflowY: 'auto',
              padding: '24px 24px 60px 24px',
              backgroundColor: 'var(--surface)',
            }}
          >
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>
              <MarkdownRenderer content={content} />
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              overflow: 'auto',
              padding: '16px 16px 60px 16px',
              backgroundColor: 'var(--bg-page)',
            }}
          >
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              <code>{content}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Clean Bottom Status Bar (No typing box!) */}
      <div
        style={{
          height: '24px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '10px' }}>
          {type === 'image' ? (
            <span>1024 × 1024 HD</span>
          ) : (
            <span>{lineCount} lines</span>
          )}
          <span>{formattedSize}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ textTransform: 'uppercase' }}>{format}</span>
          <span>{type === 'image' ? 'Image Studio • Ready to Download' : 'Ready to View & Export'}</span>
        </div>
      </div>
    </div>
  );
}
