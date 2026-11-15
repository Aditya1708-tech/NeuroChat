import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { imageService } from '../../services/imageService.js';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  Clock,
  Layers,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export function ImageStudioModal({ isOpen, onClose }) {
  const { activeConversationId } = useChat();
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'history'

  // Generation state
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [error, setError] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // History state
  const [historyImages, setHistoryImages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Quick prompt suggestions
  const suggestions = [
    'A futuristic cybersecurity command center with illuminated holographic roadmap monitors and neon network shields',
    'High-resolution cinematic portrait of a robotic architect in a sunlit Scandinavian glass greenhouse',
    'A mystical floating island covered in ancient bioluminescent cherry blossom trees at twilight',
    'Minimalist Bauhaus architectural pavilion on a calm reflecting pool, golden hour lighting',
    'Macro photography of dew drops on vibrant emerald leaves with soft blurred bokeh background',
  ];

  // Load history when tab switches
  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory();
    }
  }, [isOpen, activeTab]);

  // Progress animation while generating
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setProgressPercent(10);
      interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 92) return prev;
          const inc = Math.max(1, Math.floor((95 - prev) * 0.12));
          return prev + inc;
        });
      }, 400);
    } else {
      setProgressPercent(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  async function loadHistory() {
    setIsLoadingHistory(true);
    try {
      const res = await imageService.getHistory({ limit: 30 });
      setHistoryImages(res.images || []);
    } catch (err) {
      console.error('Failed to load image history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function handleGenerate(e) {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setError(null);
    setIsGenerating(true);
    setCurrentImage(null);

    try {
      const res = await imageService.generate({
        prompt: prompt.trim(),
        style,
        aspectRatio,
        conversationId: activeConversationId,
      });

      setCurrentImage(res.image);
      setProgressPercent(100);
    } catch (err) {
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  const handleDownload = async (img) => {
    if (!img) return;
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = img.filename || `neurochat-image-${Date.now()}.${img.format || 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(img.url, '_blank');
    }
  };

  const copyToClipboard = (text, type = 'prompt') => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  AI Image Studio
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--color-indigo-600)',
                  }}
                >
                  Gemini Key 2 Powered
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Dedicated high-definition text-to-image engine & creative visual generator
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tab switch */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-soft)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('generate')}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  background: activeTab === 'generate' ? 'var(--surface)' : 'transparent',
                  color: activeTab === 'generate' ? 'var(--color-indigo-600)' : 'var(--text-muted)',
                  boxShadow: activeTab === 'generate' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  background: activeTab === 'history' ? 'var(--surface)' : 'transparent',
                  color: activeTab === 'history' ? 'var(--color-indigo-600)' : 'var(--text-muted)',
                  boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Gallery ({historyImages.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="icon-btn"
              title="Close modal"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '6px',
                borderRadius: '50%',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'generate' ? (
            <div style={{ display: 'grid', gridTemplateColumns: currentImage || isGenerating ? '1.1fr 1fr' : '1fr', gap: '20px' }}>
              {/* Left Column: Form Controls */}
              <div>
                <form onSubmit={handleGenerate}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}
                  >
                    Image Prompt Description
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to see in rich vivid detail (e.g. A cyberpunk library filled with glowing holographic manuscripts)..."
                    rows={4}
                    maxLength={1000}
                    disabled={isGenerating}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-soft)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>Be specific about lighting, materials, and composition.</span>
                    <span>{prompt.length}/1000</span>
                  </div>

                  {/* Quick inspirations */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Try prompt inspirations:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {suggestions.slice(0, 3).map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPrompt(s)}
                          disabled={isGenerating}
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-soft)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          "{s.slice(0, 48)}…"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style Presets */}
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Artistic Style
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
                      {[
                        { id: 'realistic', label: 'Photorealistic' },
                        { id: 'cinematic', label: 'Cinematic' },
                        { id: 'digital_art', label: 'Digital Art' },
                        { id: 'fantasy', label: 'Epic Fantasy' },
                        { id: 'anime', label: 'Anime / Manga' },
                        { id: 'cyberpunk', label: 'Cyberpunk' },
                        { id: 'minimalist', label: 'Minimalist' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setStyle(item.id)}
                          disabled={isGenerating}
                          style={{
                            padding: '6px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            border: style === item.id ? '1px solid var(--color-indigo-600)' : '1px solid var(--border)',
                            background: style === item.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-soft)',
                            color: style === item.id ? 'var(--color-indigo-600)' : 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Aspect Ratio
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { id: '1:1', label: '1:1 Square (1024×1024)' },
                        { id: '16:9', label: '16:9 Landscape (1280×720)' },
                        { id: '9:16', label: '9:16 Portrait (720×1280)' },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => setAspectRatio(ratio.id)}
                          disabled={isGenerating}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            border: aspectRatio === ratio.id ? '1px solid var(--color-indigo-600)' : '1px solid var(--border)',
                            background: aspectRatio === ratio.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-soft)',
                            color: aspectRatio === ratio.id ? 'var(--color-indigo-600)' : 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1, lineHeight: 1.4 }}>{error}</div>
                    </div>
                  )}

                  {/* Action button */}
                  <div style={{ marginTop: '20px' }}>
                    <button
                      type="submit"
                      disabled={!prompt.trim() || isGenerating}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        height: '42px',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <Sparkles size={16} />
                      {isGenerating ? `Rendering Image (${progressPercent}%)…` : 'Generate AI Image'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Generation Preview & Progress */}
              {(currentImage || isGenerating) && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-soft)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    padding: '16px',
                    minHeight: '360px',
                    position: 'relative',
                  }}
                >
                  {isGenerating ? (
                    <div style={{ textAlign: 'center', width: '85%' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                          margin: '0 auto 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          animation: 'pulse 1.5s infinite',
                        }}
                      >
                        <Sparkles size={26} />
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 }}>
                        Generating Image with Gemini...
                      </h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Composing photography details, color grading, and lighting...
                      </p>

                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          borderRadius: '4px',
                          background: 'var(--border)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {progressPercent}% completed
                      </div>
                    </div>
                  ) : currentImage ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          maxHeight: '360px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                          backgroundColor: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={currentImage.url}
                          alt={currentImage.prompt}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '360px',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      </div>

                      {/* Info & action buttons */}
                      <div style={{ width: '100%', marginTop: '12px' }}>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                          }}
                        >
                          <span>Engine: {currentImage.model}</span>
                          <span>Size: {Math.round(currentImage.size / 1024)} KB</span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                          <button
                            type="button"
                            onClick={() => handleDownload(currentImage)}
                            className="btn btn-primary"
                            style={{
                              flex: 1,
                              height: '36px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <Download size={15} />
                            Download Image
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentImage.prompt, 'prompt')}
                            className="btn"
                            title="Copy image prompt"
                            style={{
                              height: '36px',
                              padding: '0 12px',
                              fontSize: '0.82rem',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {copiedPrompt ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            {copiedPrompt ? 'Copied' : 'Prompt'}
                          </button>
                          <a
                            href={currentImage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            title="Open full resolution"
                            style={{
                              height: '36px',
                              padding: '0 12px',
                              fontSize: '0.82rem',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            /* Gallery History Tab */
            <div>
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Sparkles size={24} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '8px' }} />
                  <div>Loading your image collection...</div>
                </div>
              ) : historyImages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                  <ImageIcon size={40} style={{ opacity: 0.35, marginBottom: '12px' }} />
                  <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>No generated images yet</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>
                    Images you generate with Gemini Image Studio will appear here for easy viewing and re-downloading.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('generate')}
                    className="btn btn-primary"
                    style={{ marginTop: '16px', fontSize: '0.82rem' }}
                  >
                    Create Your First Image
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {historyImages.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        backgroundColor: 'var(--bg-soft)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          height: '160px',
                          backgroundColor: '#0a0a0a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={img.url}
                          alt={img.prompt}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.35,
                            maxHeight: '2.7em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            marginBottom: '8px',
                          }}
                          title={img.prompt}
                        >
                          {img.prompt}
                        </div>
                        <div
                          style={{
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(img.prompt, 'prompt')}
                              className="icon-btn"
                              title="Copy prompt"
                              style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(img)}
                              className="icon-btn"
                              title="Download image"
                              style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

