import { useState, useEffect } from 'react';
import ContentList from './components/ContentList';
import ContentForm from './components/ContentForm';
import BandManagement from './components/BandManagement';
import SourceManagement from './components/SourceManagement';
import DraftReview from './components/DraftReview';
import { draftsAPI } from './services/api';
import './index.css';

export default function App() {
  const [currentView, setCurrentView] = useState('content');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  // 加载待审核草稿数量
  useEffect(() => {
    const loadDraftCount = async () => {
      try {
        const stats = await draftsAPI.getStats();
        setDraftCount(stats.data?.pending_count || 0);
      } catch (err) {
        console.error('获取草稿数量失败:', err);
      }
    };
    loadDraftCount();
    // 每30秒刷新一次
    const interval = setInterval(loadDraftCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleFormSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 视图标题
  const getViewTitle = () => {
    switch (currentView) {
      case 'content': return { title: '内容列表', desc: '管理所有雷达条目' };
      case 'bands': return { title: '频段管理', desc: '配置频段和张力问题' };
      case 'sources': return { title: '内容源管理', desc: '管理YouTube频道、人物和出版物' };
      case 'drafts': return { title: 'AI草稿审核', desc: '审核AI生成的内容草稿' };
      default: return { title: '', desc: '' };
    }
  };

  const viewInfo = getViewTitle();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* 顶部导航 */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 0'
      }}>
        <div className="container">
          <div className="flex-between">
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, var(--primary), #00cc6a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '4px'
              }}>
                思想雷达 CMS
              </h1>
              <p className="text-muted">Thoughts Radar Content Management System</p>
            </div>

            <div className="flex flex-gap" style={{ flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentView('content')}
                className={`btn ${currentView === 'content' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📝 内容管理
              </button>
              <button
                onClick={() => setCurrentView('bands')}
                className={`btn ${currentView === 'bands' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📊 频段管理
              </button>
              <button
                onClick={() => setCurrentView('sources')}
                className={`btn ${currentView === 'sources' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📡 内容源
              </button>
              <button
                onClick={() => setCurrentView('drafts')}
                className={`btn ${currentView === 'drafts' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ position: 'relative' }}
              >
                ✨ AI草稿
                {draftCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--error)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {draftCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        {/* 视图标题 */}
        {currentView !== 'content' && (
          <div className="mb-4">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{viewInfo.title}</h2>
            <p className="text-muted">{viewInfo.desc}</p>
          </div>
        )}

        {/* 内容管理视图 */}
        {currentView === 'content' && (
          <>
            <div className="flex-between mb-4">
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>内容列表</h2>
                <p className="text-muted">管理所有雷达条目</p>
              </div>
              <button onClick={handleAddNew} className="btn btn-primary">
                ✨ 添加内容
              </button>
            </div>
            <ContentList key={refreshKey} onEdit={handleEdit} />
          </>
        )}

        {/* 频段管理视图 */}
        {currentView === 'bands' && <BandManagement />}

        {/* 内容源管理视图 */}
        {currentView === 'sources' && <SourceManagement />}

        {/* 草稿审核视图 */}
        {currentView === 'drafts' && <DraftReview />}
      </main>

      {/* 表单模态框 */}
      {showForm && (
        <ContentForm
          item={editingItem}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* 底部固定按钮（仅内容管理视图） */}
      {currentView === 'content' && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100
        }}>
          <button
            onClick={handleAddNew}
            className="btn btn-primary"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              fontSize: '24px',
              padding: '0',
              boxShadow: '0 4px 12px rgba(0, 255, 136, 0.4)'
            }}
            title="添加内容"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
