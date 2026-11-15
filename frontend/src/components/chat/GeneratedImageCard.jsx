import React, { useState } from 'react';
import { Download, Maximize2, Copy, Check, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { downloadFile } from '../../services/artifactService.js';

export function GeneratedImageCard({ image }) {
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!image || !image.url) return null;

  const {
    url,
    filename = 'image.png',
    originalName,
    format = 'png',
    mimeType = 'image/png',
    isEnhanced = false,
    size = 0,
  } = image;

  const formattedSize =
    size < 1024
      ? `${size} B`
      : size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(1)} MB`;

  const handleDownload = (e) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      // Try copying image blob if supported by browser
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback to copying data URL
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail
      }
    }
  };

  return (
    <>
      <div
        style={{
          marginTop: '14px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-strong)',
          backgroundColor: 'var(--surface)',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '560px',
          position: 'relative',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        className="nc-image-card"
      >
        {/* Image Preview Container */}
        <div
          style={{
            position: 'relative',
            cursor: 'zoom-in',
            backgroundColor: '#0f172a',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
            maxHeight: '480px',
          }}
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={url}
            alt={filename}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '480px',
              objectFit: 'contain',
              display: 'block',
              transition: 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
            }}
            className="nc-img-hover"
          />

          {/* Top Floating Badge */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <Sparkles size={13} color="var(--color-indigo-400)" />
            <span>{isEnhanced ? 'AI Enhanced Photo' : 'AI Generated Image'}</span>
          </div>

          {/* Quick Hover Overlay Trigger */}
          <button
            type="button"
            className="icon-btn"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              width: '32px',
              height: '32px',
            }}
            title="Full Screen Preview"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Bottom Metadata & Action Bar */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={filename}
            >
              {filename}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '8px',
                marginTop: '1px',
              }}
            >
              <span style={{ textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-indigo-600)' }}>
                {format}
              </span>
              {size > 0 && <span>• {formattedSize}</span>}
              <span>• 1024×1024</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="icon-btn"
              style={{ width: '32px', height: '32px' }}
              title="Copy Image"
            >
              {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            </button>

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary"
              style={{
                height: '32px',
                padding: '0 12px',
                fontSize: '0.8rem',
                gap: '6px',
                backgroundColor: 'var(--color-indigo-600)',
                color: '#ffffff',
                fontWeight: 600,
              }}
              title={`Directly download ${filename}`}
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Top Bar with Close and Download */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary"
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '0.85rem',
                gap: '6px',
                backgroundColor: 'var(--color-indigo-600)',
                color: '#ffffff',
              }}
            >
              <Download size={15} />
              <span>Download Image</span>
            </button>

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="icon-btn"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
              }}
              title="Close Preview"
            >
              <X size={20} />
            </button>
          </div>

          <img
            src={url}
            alt={filename}
            style={{
              maxWidth: '92vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          />

          <div
            style={{
              marginTop: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {filename} • 1024×1024 • {format.toUpperCase()}
          </div>
        </div>
      )}

      <style>{`
        .nc-image-card:hover .nc-img-hover {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
}

