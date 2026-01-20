import { useState, useEffect } from 'react';
import { draftsAPI } from '../services/api';

export default function DraftReview() {
    const [drafts, setDrafts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [analyzeUrl, setAnalyzeUrl] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    // 加载草稿
    useEffect(() => {
        loadDrafts();
        loadStats();
    }, [statusFilter]);

    const loadDrafts = async () => {
        try {
            setLoading(true);
            const data = await draftsAPI.getAll(statusFilter);
            setDrafts(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await draftsAPI.getStats();
            setStats(data.data);
        } catch (err) {
            console.error('获取统计失败:', err);
        }
    };

    // 手动分析视频
    const handleAnalyzeVideo = async () => {
        if (!analyzeUrl) {
            alert('请输入YouTube视频URL');
            return;
        }

        try {
            setAnalyzing(true);
            const result = await draftsAPI.analyzeVideo(analyzeUrl);
            alert(`分析完成！${result.message}`);
            setAnalyzeUrl('');
            loadDrafts();
            loadStats();
        } catch (err) {
            alert(`分析失败: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    // 批准草稿
    const handleApprove = async (draft, selectedIndices = null) => {
        try {
            const result = await draftsAPI.approve(draft.id, selectedIndices);
            alert(`发布成功！创建了 ${result.data.publishedCount} 个雷达条目`);
            setSelectedDraft(null);
            loadDrafts();
            loadStats();
        } catch (err) {
            alert(`发布失败: ${err.message}`);
        }
    };

    // 拒绝草稿
    const handleReject = async (draft) => {
        const reason = prompt('请输入拒绝原因（可选）:', '');
        try {
            await draftsAPI.reject(draft.id, reason || '');
            alert('草稿已拒绝');
            setSelectedDraft(null);
            loadDrafts();
            loadStats();
        } catch (err) {
            alert(`拒绝失败: ${err.message}`);
        }
    };

    // 删除草稿
    const handleDelete = async (draft) => {
        if (!confirm('确定要删除这个草稿吗？')) return;
        try {
            await draftsAPI.delete(draft.id);
            loadDrafts();
            loadStats();
        } catch (err) {
            alert(`删除失败: ${err.message}`);
        }
    };

    // 获取频段颜色
    const getFreqColor = (freq) => {
        if (!freq) return '#9ca3af';
        const prefix = freq.charAt(0);
        const colors = {
            'T': '#00ff88',
            'P': '#4a9eff',
            'Φ': '#a78bfa',
            'H': '#f0a500',
            'F': '#10b981',
            'R': '#ec4899'
        };
        return colors[prefix] || '#9ca3af';
    };

    return (
        <div>
            {/* 统计卡片 */}
            {stats && (
                <div className="grid grid-3 mb-4">
                    <div className="stat-card">
                        <div className="stat-value">{stats.pending_count}</div>
                        <div className="stat-label">待审核</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--success)' }}>
                            {stats.approved_count}
                        </div>
                        <div className="stat-label">已发布</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--text-muted)' }}>
                            {stats.rejected_count}
                        </div>
                        <div className="stat-label">已拒绝</div>
                    </div>
                </div>
            )}

            {/* 手动分析区域 */}
            <div className="card mb-4">
                <h4 className="mb-2">🔍 手动分析视频</h4>
                <div className="flex flex-gap">
                    <input
                        type="url"
                        className="form-input"
                        value={analyzeUrl}
                        onChange={(e) => setAnalyzeUrl(e.target.value)}
                        placeholder="粘贴YouTube视频URL..."
                        style={{ flex: 1 }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleAnalyzeVideo}
                        disabled={analyzing || !analyzeUrl}
                    >
                        {analyzing ? '分析中...' : '开始分析'}
                    </button>
                </div>
                <p className="text-muted mt-1" style={{ fontSize: '12px' }}>
                    提示：仅分析40分钟以上的长视频，来自已追踪的内容源
                </p>
            </div>

            {/* 过滤器 */}
            <div className="flex-between mb-4">
                <div className="flex flex-gap">
                    <button
                        className={`btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        待审核
                    </button>
                    <button
                        className={`btn ${statusFilter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setStatusFilter('approved')}
                    >
                        已发布
                    </button>
                    <button
                        className={`btn ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setStatusFilter('rejected')}
                    >
                        已拒绝
                    </button>
                </div>
                <span className="text-muted">共 {drafts.length} 个草稿</span>
            </div>

            {/* 草稿列表 */}
            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : error ? (
                <div className="alert alert-error">{error}</div>
            ) : drafts.length === 0 ? (
                <div className="card text-center text-muted">
                    {statusFilter === 'pending'
                        ? '暂无待审核草稿。使用上方表单分析视频，或等待自动采集。'
                        : `暂无${statusFilter === 'approved' ? '已发布' : '已拒绝'}的草稿。`
                    }
                </div>
            ) : (
                <div className="list-group">
                    {drafts.map(draft => (
                        <div key={draft.id} className="list-item">
                            <div className="flex-between">
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>📹</span>
                                        <strong>{draft.source_title || '未知标题'}</strong>
                                        <span className={`badge badge-${draft.status === 'pending' ? 'warning' : draft.status === 'approved' ? 'success' : 'neutral'}`}>
                                            {draft.status === 'pending' ? '待审核' : draft.status === 'approved' ? '已发布' : '已拒绝'}
                                        </span>
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '13px' }}>
                                        来源: {draft.source_name || '手动添加'} ·
                                        生成条目: {draft.item_count || 0} 个 ·
                                        创建于: {new Date(draft.created_at).toLocaleDateString('zh-CN')}
                                    </div>
                                    {draft.generated_items && draft.generated_items.length > 0 && (
                                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {draft.generated_items.map((item, idx) => (
                                                <span
                                                    key={idx}
                                                    className="badge"
                                                    style={{
                                                        background: getFreqColor(item.freq) + '20',
                                                        color: getFreqColor(item.freq),
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    {item.freq} · {item.stance}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-gap">
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setSelectedDraft(draft)}
                                    >
                                        👁 查看
                                    </button>
                                    {draft.status === 'pending' && (
                                        <>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleApprove(draft)}
                                            >
                                                ✓ 全部发布
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleReject(draft)}
                                            >
                                                ✗ 拒绝
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleDelete(draft)}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 草稿详情模态框 */}
            {selectedDraft && (
                <DraftDetailModal
                    draft={selectedDraft}
                    onClose={() => setSelectedDraft(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    getFreqColor={getFreqColor}
                />
            )}
        </div>
    );
}

// 草稿详情模态框
function DraftDetailModal({ draft, onClose, onApprove, onReject, getFreqColor }) {
    const [selectedIndices, setSelectedIndices] = useState(
        draft.generated_items?.map((_, i) => i) || []
    );

    const toggleSelect = (index) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    const handleApproveSelected = () => {
        if (selectedIndices.length === 0) {
            alert('请至少选择一个条目');
            return;
        }
        onApprove(draft, selectedIndices);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '1000px' }}
            >
                <div className="modal-header">
                    <h3 className="modal-title">📹 {draft.source_title}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {/* 视频链接 */}
                {draft.source_url && (
                    <div className="mb-3">
                        <a
                            href={draft.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                        >
                            🔗 在YouTube中观看
                        </a>
                    </div>
                )}

                {/* 生成的条目 */}
                <h4 className="mb-2">生成的雷达条目 （选择要发布的）</h4>

                {draft.generated_items?.length === 0 ? (
                    <div className="text-muted">未生成任何条目</div>
                ) : (
                    <div className="list-group">
                        {draft.generated_items?.map((item, idx) => (
                            <div
                                key={idx}
                                className="list-item"
                                style={{
                                    cursor: 'pointer',
                                    borderColor: selectedIndices.includes(idx) ? 'var(--primary)' : undefined,
                                    background: selectedIndices.includes(idx) ? 'rgba(0, 255, 136, 0.05)' : undefined
                                }}
                                onClick={() => draft.status === 'pending' && toggleSelect(idx)}
                            >
                                <div className="flex-between mb-2">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {draft.status === 'pending' && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIndices.includes(idx)}
                                                onChange={() => toggleSelect(idx)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        )}
                                        <span
                                            className="badge"
                                            style={{
                                                background: getFreqColor(item.freq) + '20',
                                                color: getFreqColor(item.freq)
                                            }}
                                        >
                                            {item.freq} · {item.stance}
                                        </span>
                                        <strong>{item.title}</strong>
                                    </div>
                                    <span className="text-muted" style={{ fontSize: '12px' }}>
                                        {item.author_name}
                                    </span>
                                </div>

                                <div style={{
                                    fontSize: '13px',
                                    color: 'var(--text-secondary)',
                                    maxHeight: '100px',
                                    overflow: 'hidden',
                                    marginBottom: '8px'
                                }}>
                                    {item.content?.substring(0, 300)}...
                                </div>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {item.keywords?.map((kw, i) => (
                                        <span key={i} className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 操作按钮 */}
                {draft.status === 'pending' && (
                    <div className="flex flex-gap mt-4" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={onClose}>
                            取消
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={() => onReject(draft)}
                        >
                            拒绝全部
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleApproveSelected}
                            disabled={selectedIndices.length === 0}
                        >
                            发布选中 ({selectedIndices.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
