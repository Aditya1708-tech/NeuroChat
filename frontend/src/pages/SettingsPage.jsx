import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { userService } from '../services/userService.js';
import { Sidebar } from '../components/conversations/Sidebar.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { User, Globe, Moon, HelpCircle, LogOut, Check, ArrowLeft, Menu, Brain, Trash2, Plus, Sparkles } from 'lucide-react';
import { memoryService } from '../services/memoryService.js';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('neurochat:sidebar-collapsed') === 'true';
  });

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('neurochat:sidebar-collapsed', String(next));
        return next;
      });
    }
  };
  const [name, setName] = useState(user?.name || '');
  const [uiLanguage, setUiLanguage] = useState(user?.settings?.uiLanguage || i18n.language || 'en');
  const [replyLanguage, setReplyLanguage] = useState(user?.settings?.replyLanguage || 'auto');
  const [selectedTheme, setSelectedTheme] = useState(user?.settings?.theme || theme || 'light');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ChatGPT-style Memory State
  const [memories, setMemories] = useState([]);
  const [memoryEnabled, setMemoryEnabled] = useState(user?.settings?.memoryEnabled !== false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [isAddingMemory, setIsAddingMemory] = useState(false);

  React.useEffect(() => {
    memoryService.list()
      .then((data) => setMemories(data))
      .catch((err) => console.warn('Failed to load memories', err))
      .finally(() => setIsLoadingMemories(false));
  }, []);

  const handleToggleMemory = async (e) => {
    const nextVal = e.target.checked;
    setMemoryEnabled(nextVal);
    try {
      const updated = await userService.updateProfile({
        settings: { memoryEnabled: nextVal },
      });
      updateUser(updated);
    } catch (err) {
      alert('Failed to update memory setting: ' + err.message);
      setMemoryEnabled(!nextVal);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newMemoryText.trim() || isAddingMemory) return;

    setIsAddingMemory(true);
    try {
      const created = await memoryService.create(newMemoryText.trim());
      if (created) {
        setMemories((prev) => [...prev, created]);
        setNewMemoryText('');
      }
    } catch (err) {
      alert(err.message || 'Failed to add memory.');
    } finally {
      setIsAddingMemory(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await memoryService.remove(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert('Failed to delete memory: ' + err.message);
    }
  };

  const handleClearAllMemories = async () => {
    if (!window.confirm('Are you sure you want to clear all saved memories? This cannot be undone.')) {
      return;
    }
    try {
      await memoryService.clear();
      setMemories([]);
    } catch (err) {
      alert('Failed to clear memories: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const updated = await userService.updateProfile({
        name,
        settings: {
          uiLanguage,
          replyLanguage,
          theme: selectedTheme,
        },
      });

      updateUser(updated);

      // Apply language change
      i18n.changeLanguage(uiLanguage);
      localStorage.setItem('neurochat-lang', uiLanguage);

      // Apply theme
      setTheme(selectedTheme);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetOnboarding = async () => {
    try {
      const updated = await userService.updateProfile({
        settings: { onboardingCompleted: false },
      });
      updateUser(updated);
      alert('Onboarding reset! It will appear next time you visit the chat dashboard.');
    } catch (err) {
      alert(err.message || 'Failed to reset onboarding.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-page)',
        overflow: 'hidden',
      }}
    >
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            height: '56px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={toggleSidebar}
            className="icon-btn sidebar-hamburger-btn"
            aria-label={sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            id="mobile-drawer-toggle-settings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color var(--dur) var(--ease), transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            <Menu size={20} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="icon-btn"
            title="Back to chat"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{t('settings.title')}</h2>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '640px', width: '100%', margin: '32px auto', padding: '0 16px' }}>
          {savedSuccess && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem',
              }}
            >
              <Check size={18} />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Profile Section */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <User size={20} color="var(--color-indigo-500)" />
                <h3 style={{ fontSize: '1.2rem' }}>{t('settings.profile')}</h3>
              </div>

              <TextField
                id="profile-name"
                label={t('settings.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    marginBottom: '6px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {t('settings.email')}
                </label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-soft)',
                    color: 'var(--text-secondary)',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Email address cannot be modified.
                </span>
              </div>
            </div>

            {/* Language & AI Preferences */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <Globe size={20} color="var(--color-indigo-500)" />
                <h3 style={{ fontSize: '1.2rem' }}>{t('settings.preferences')}</h3>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="pref-ui-lang"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}
                >
                  {t('settings.uiLanguage')}
                </label>
                <select
                  id="pref-ui-lang"
                  value={uiLanguage}
                  onChange={(e) => setUiLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="pref-reply-lang"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}
                >
                  {t('settings.replyLanguage')}
                </label>
                <select
                  id="pref-reply-lang"
                  value={replyLanguage}
                  onChange={(e) => setReplyLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                >
                  <option value="auto">{t('settings.replyAuto')}</option>
                  <option value="en">{t('settings.replyEnglish')}</option>
                  <option value="hi">{t('settings.replyHindi')}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="pref-theme"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}
                >
                  {t('settings.theme')}
                </label>
                <select
                  id="pref-theme"
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                >
                  <option value="light">{t('settings.themeLight')}</option>
                  <option value="dark">{t('settings.themeDark')}</option>
                  <option value="system">{t('settings.themeSystem')}</option>
                </select>
              </div>
            </div>

            {/* Memory & Personalization (ChatGPT-style Memory) */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Brain size={20} color="var(--color-indigo-500)" />
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Memory & Personalization</h3>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <span>{memoryEnabled ? 'Enabled' : 'Disabled'}</span>
                  <input
                    type="checkbox"
                    checked={memoryEnabled}
                    onChange={handleToggleMemory}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-indigo-600)' }}
                  />
                </label>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
                NeuroChat remembers key facts, study topics, and background details across your conversations to provide tailored answers, just like ChatGPT.
              </p>

              {memoryEnabled && (
                <div>
                  {/* Add Memory Form */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Add a fact to remember (e.g. 'I am studying for CS Executive')"
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMemory(e);
                        }
                      }}
                      style={{
                        flex: 1,
                        minHeight: '40px',
                        padding: '0 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddMemory}
                      disabled={isAddingMemory || !newMemoryText.trim()}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0 14px' }}
                    >
                      <Plus size={16} />
                      <span>{isAddingMemory ? 'Adding...' : 'Add'}</span>
                    </button>
                  </div>

                  {/* Memory Items List */}
                  {isLoadingMemories ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px 0' }}>Loading memories...</div>
                  ) : memories.length === 0 ? (
                    <div style={{
                      padding: '16px',
                      background: 'var(--bg-soft)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem'
                    }}>
                      No memories saved yet. As you chat, NeuroChat will automatically record key details about your goals and studies!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                      {memories.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            background: 'var(--bg-soft)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
                            <Sparkles size={16} color="var(--color-indigo-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                              {m.text}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(m.id)}
                            title="Delete memory"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {memories.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={handleClearAllMemories}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--error)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          textDecoration: 'underline',
                        }}
                      >
                        Clear all memories
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* About the AI & Guidance */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <HelpCircle size={20} color="var(--color-indigo-500)" />
                <h3 style={{ fontSize: '1.2rem' }}>{t('settings.aboutAi')}</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '16px' }}>
                {t('settings.aboutAiText')}
              </p>
              <button
                type="button"
                onClick={handleResetOnboarding}
                className="btn"
                style={{ fontSize: '0.9rem' }}
              >
                {t('settings.showOnboardingAgain')}
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={logout}
                className="btn"
                style={{ color: 'var(--error)', border: '1px solid var(--error)' }}
              >
                <LogOut size={16} />
                <span>{t('settings.logout')}</span>
              </button>

              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : t('settings.save')}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .sidebar-hamburger-btn:hover {
          background-color: var(--surface-hover) !important;
        }
        .sidebar-hamburger-btn:active {
          transform: scale(0.92);
        }
      `}</style>
    </div>
  );
}
