import { useState, useEffect } from 'react';
import { sourcesAPI, collectionAPI, draftsAPI } from '../services/api';

export default function SourceManagement() {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('list'); // list, add, recommendations
    const [filters, setFilters] = useState({ domain: '', type: '', status: 'active' });
    const [selectedSource, setSelectedSource] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [analyzing, setAnalyzing] = useState(null);

    // 加载内容源
    useEffect(() => {
        loadSources();
    }, [filters]);

    const loadSources = async () => {
        try {
            setLoading(true);
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v)
            );
            const data = await sourcesAPI.getAll(cleanFilters);
            setSources(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadRecommendations = async () => {
        try {
            const data = await sourcesAPI.getRecommendations();
            setRecommendations(data.data || []);
        } catch (err) {
            console.error('加载推荐失败:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'recommendations') {
            loadRecommendations();
        }
    }, [activeTab]);

    // 分析最新视频
    const handleAnalyze = async (source) => {
        try {
            setAnalyzing(source.id);
            // 获取最新视频
            const videosData = await collectionAPI.getRecentVideos(source.id, 3);
            const videos = videosData.data || [];

            if (videos.length === 0) {
                alert('未找到可分析的视频');
                return;
            }

            // 分析第一个视频
            const video = videos[0];
            const result = await collectionAPI.analyzeVideo(source.id, video.videoId);
            alert(`分析完成！${result.message}`);
        } catch (err) {
            alert(`分析失败: ${err.message}`);
        } finally {
            setAnalyzing(null);
        }
    };

    // 批准推荐
    const handleApproveRecommendation = async (rec) => {
        const domain = prompt('请输入领域 (T/P/Φ/H/F/R):', 'T');
        if (!domain) return;

        try {
            await sourcesAPI.approveRecommendation(rec.id, { domain });
            alert('推荐已批准');
            loadRecommendations();
            loadSources();
        } catch (err) {
            alert(`批准失败: ${err.message}`);
        }
    };

    // 类型图标
    const getTypeIcon = (type) => {
        switch (type) {
            case 'channel': return '🎬';
            case 'person': return '👤';
            case 'publication': return '🏛';
            default: return '📄';
        }
    };

    // 领域颜色
    const getDomainColor = (domain) => {
        const colors = {
            'T': '#00ff88',
            'P': '#4a9eff',
            'Φ': '#a78bfa',
            'H': '#f0a500',
            'F': '#10b981',
            'R': '#ec4899'
        };
        return colors[domain] || '#9ca3af';
    };

    return (
        <div>
            {/* 标签栏 */}
            <div className="flex flex-gap mb-4">
                <button
                    className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('list')}
                >
                    📋 内容源列表
                </button>
                <button
                    className={`btn ${activeTab === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('add')}
                >
                    ➕ 添加内容源
                </button>
                <button
                    className={`btn ${activeTab === 'recommendations' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('recommendations')}
                >
                    💡 系统推荐 {recommendations.length > 0 && `(${recommendations.length})`}
                </button>
            </div>

            {/* 内容源列表 */}
            {activeTab === 'list' && (
                <>
                    {/* 过滤器 */}
                    <div className="card mb-4">
                        <div className="flex flex-gap" style={{ flexWrap: 'wrap' }}>
                            <select
                                className="form-select"
                                value={filters.domain}
                                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                                style={{ width: 'auto', minWidth: '120px' }}
                            >
                                <option value="">所有领域</option>
                                <option value="T">技术 (T)</option>
                                <option value="P">政治 (P)</option>
                                <option value="Φ">哲学 (Φ)</option>
                                <option value="H">历史 (H)</option>
                                <option value="F">金融 (F)</option>
                                <option value="R">宗教 (R)</option>
                            </select>

                            <select
                                className="form-select"
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                style={{ width: 'auto', minWidth: '120px' }}
                            >
                                <option value="">所有类型</option>
                                <option value="channel">YouTube频道</option>
                                <option value="person">人物</option>
                                <option value="publication">出版物</option>
                            </select>

                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                style={{ width: 'auto', minWidth: '120px' }}
                            >
                                <option value="active">活跃</option>
                                <option value="paused">已暂停</option>
                                <option value="retired">已归档</option>
                                <option value="">全部状态</option>
                            </select>

                            <span className="text-muted" style={{ alignSelf: 'center' }}>
                                共 {sources.length} 个内容源
                            </span>
                        </div>
                    </div>

                    {/* 列表 */}
                    {loading ? (
                        <div className="loading"><div className="spinner"></div></div>
                    ) : error ? (
                        <div className="alert alert-error">{error}</div>
                    ) : (
                        <div className="list-group">
                            {sources.map(source => (
                                <div key={source.id} className="list-item">
                                    <div className="flex-between">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(source.type)}</span>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong>{source.name}</strong>
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            background: getDomainColor(source.domain) + '20',
                                                            color: getDomainColor(source.domain),
                                                            fontSize: '11px'
                                                        }}
                                                    >
                                                        {source.domain}
                                                    </span>
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '13px' }}>
                                                    {source.description?.substring(0, 60) || '暂无描述'}
                                                    {source.description?.length > 60 && '...'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-gap">
                                            {source.type === 'channel' && (
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleAnalyze(source)}
                                                    disabled={analyzing === source.id}
                                                >
                                                    {analyzing === source.id ? '分析中...' : '🔍 分析最新'}
                                                </button>
                                            )}
                                            {source.url && (
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-secondary"
                                                >
                                                    🔗 访问
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* 添加内容源 */}
            {activeTab === 'add' && (
                <AddSourceForm onSuccess={() => { loadSources(); setActiveTab('list'); }} />
            )}

            {/* 系统推荐 */}
            {activeTab === 'recommendations' && (
                <div>
                    <h3 className="mb-3">系统发现的新内容源</h3>
                    {recommendations.length === 0 ? (
                        <div className="card text-center text-muted">
                            暂无新推荐。运行发现任务后将显示在这里。
                        </div>
                    ) : (
                        <div className="list-group">
                            {recommendations.map(rec => (
                                <div key={rec.id} className="list-item">
                                    <div className="flex-between">
                                        <div>
                                            <strong>💡 {rec.name}</strong>
                                            <div className="text-muted" style={{ fontSize: '13px' }}>
                                                理由: {rec.reason}
                                            </div>
                                        </div>
                                        <div className="flex flex-gap">
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleApproveRecommendation(rec)}
                                            >
                                                ✓ 添加追踪
                                            </button>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={async () => {
                                                    await sourcesAPI.rejectRecommendation(rec.id);
                                                    loadRecommendations();
                                                }}
                                            >
                                                ✗ 忽略
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// 添加内容源表单组件
function AddSourceForm({ onSuccess }) {
    const [form, setForm] = useState({
        type: 'channel',
        name: '',
        url: '',
        domain: 'T',
        description: '',
        priority_rank: 50
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name) {
            alert('请输入名称');
            return;
        }

        try {
            setSubmitting(true);
            await sourcesAPI.create(form);
            alert('内容源添加成功！');
            onSuccess();
        } catch (err) {
            alert(`添加失败: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card">
            <h3 className="mb-3">添加新内容源</h3>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-2">
                    <div className="form-group">
                        <label className="form-label required">类型</label>
                        <select
                            className="form-select"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="channel">YouTube频道</option>
                            <option value="person">人物</option>
                            <option value="publication">出版物/机构</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">领域</label>
                        <select
                            className="form-select"
                            value={form.domain}
                            onChange={(e) => setForm({ ...form, domain: e.target.value })}
                        >
                            <option value="T">技术 (T)</option>
                            <option value="P">政治 (P)</option>
                            <option value="Φ">哲学 (Φ)</option>
                            <option value="H">历史 (H)</option>
                            <option value="F">金融 (F)</option>
                            <option value="R">宗教 (R)</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label required">名称</label>
                    <input
                        type="text"
                        className="form-input"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="如: Lex Fridman Podcast"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">URL</label>
                    <input
                        type="url"
                        className="form-input"
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder="如: https://youtube.com/@lexfridman"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">描述</label>
                    <textarea
                        className="form-textarea"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="简要描述这个内容源的特点..."
                        rows={3}
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? '添加中...' : '✓ 添加内容源'}
                </button>
            </form>
        </div>
    );
}
