import { useState } from 'react';
import ContentList from './components/ContentList';
import ContentForm from './components/ContentForm';
import BandManagement from './components/BandManagement';
import './index.css';

export default function App() {
  const [currentView, setCurrentView] = useState('content'); // 'content' or 'bands'
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    // 刷新列表
    setRefreshKey(prev => prev + 1);
  };

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

            <div className="flex flex-gap">
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
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        {currentView === 'content' ? (
          <>
            {/* 操作栏 */}
            <div className="flex-between mb-4">
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
                  内容列表
                </h2>
                <p className="text-muted">管理所有雷达条目</p>
              </div>
              <button onClick={handleAddNew} className="btn btn-primary">
                ✨ 添加内容
              </button>
            </div>

            {/* 内容列表 */}
            <ContentList
              key={refreshKey}
              onEdit={handleEdit}
            />
          </>
        ) : (
          <BandManagement />
        )}
      </main>

      {/* 表单模态框 */}
      {showForm && (
        <ContentForm
          item={editingItem}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* 底部固定按钮（移动端友好） */}
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
