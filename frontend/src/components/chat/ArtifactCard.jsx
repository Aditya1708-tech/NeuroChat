import React, { useState } from 'react';
import {
  Code,
  Image as ImageIcon,
  FileText,
  Table,
  ExternalLink,
  Download,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext.jsx';
import { downloadFile, exportArtifactAsPdf, artifactService } from '../../services/artifactService.js';

export function ArtifactCard({ artifact }) {
  const { openArtifact } = useChat();
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!artifact) return null;

  const {
    title = 'Generated Artifact',
    filename = 'document.txt',
    type = 'code',
    format = 'text',
    content = '',
    size = 0,
    version = 1,
    mimeType = 'text/plain',
  } = artifact;

  const lineCount = content ? content.split(/\r\n|\r|\n/).length : 0;
  const formattedSize =
    size < 1024
      ? `${size} B`
      : size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(1)} MB`;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    let fileContent = content;
    if (!fileContent && (artifact.id || artifact._id)) {
      try {
        const full = await artifactService.get(artifact.id || artifact._id);
        fileContent = full?.content || '';
      } catch (err) {
        console.warn('Failed to fetch full artifact for download:', err);
      }
    }
    if (type === 'image' || (typeof fileContent === 'string' && fileContent.startsWith('data:image/'))) {
      const a = document.createElement('a');
      a.href = fileContent;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    downloadFile(filename, fileContent || '', mimeType);
  };

  const handleExportPdf = async (e) => {
    e.stopPropagation();
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      let fileContent = content;
      if (!fileContent && (artifact.id || artifact._id)) {
        try {
          const full = await artifactService.get(artifact.id || artifact._id);
          fileContent = full?.content || '';
        } catch (err) {
          console.warn('Failed to fetch full artifact for PDF:', err);
        }
      }
      await exportArtifactAsPdf({
        ...artifact,
        content: fileContent || '',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getIcon = () => {
    if (type === 'image') {
      return <ImageIcon size={18} color="var(--color-indigo-500)" />;
    }
    if (type === 'data' || format === 'csv' || format === 'json') {
      return <Table size={18} color="var(--color-indigo-500)" />;
    }
    if (type === 'markdown' || type === 'document' || format === 'text') {
      return <FileText size={18} color="var(--color-violet-500)" />;
    }
    return <Code size={18} color="var(--color-indigo-500)" />;
  };

  return (
    <div
      onClick={() => openArtifact(artifact)}
      style={{
        margin: '14px 0',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-soft)',
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="artifact-card-hover"
      title="Click to view & edit in side pane"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {getIcon()}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--color-indigo-600)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {format}
              </span>
              {version > 1 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--color-indigo-600)',
                    fontWeight: 600,
                  }}
                >
                  v{version}
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)' }}>{filename}</span>
              <span>•</span>
              <span>{lineCount} lines</span>
              <span>•</span>
              <span>{formattedSize}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          paddingTop: '8px',
        }}
      >
        <button
          type="button"
          onClick={handleCopy}
          className="btn"
          style={{
            minHeight: '28px',
            padding: '0 8px',
            fontSize: '0.75rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: copied ? 'var(--success)' : 'var(--text-secondary)',
            gap: '4px',
          }}
          title="Copy code/content"
        >
          {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Download PDF button for documents */}
        {(type === 'document' || format === 'html' || filename.endsWith('.html') || artifact.originalFileName?.endsWith('.pdf') || content.includes('<!DOCTYPE html>')) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleExportPdf(e);
            }}
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
            title="Download formatted PDF with colors and margins"
          >
            <FileText size={13} />
            <span>{isExportingPdf ? "Generating PDF..." : "Download PDF"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          className="btn"
          style={{
            minHeight: '28px',
            padding: '0 8px',
            fontSize: '0.75rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            gap: '4px',
          }}
          title={`Download ${filename}`}
        >
          <Download size={13} />
          <span>Download</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openArtifact(artifact);
          }}
          className="btn"
          style={{
            minHeight: '28px',
            padding: '0 10px',
            fontSize: '0.75rem',
            gap: '4px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <ExternalLink size={13} />
          <span>
            {type === 'document' || format === 'html' || filename.endsWith('.html')
              ? 'View Document'
              : 'Open in Editor'}
          </span>
        </button>
      </div>

      <style>{`
        .artifact-card-hover:hover {
          border-color: var(--color-indigo-500) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

