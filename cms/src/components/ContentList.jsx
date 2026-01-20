import { useState, useEffect } from 'react';
import { radarAPI } from '../services/api';

export default function ContentList({ onEdit }) {
    const [groupedItems, setGroupedItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            const data = await radarAPI.getAllGrouped();
            setGroupedItems(data.grouped || {});
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, date) => {
        if (!confirm('确定要删除这条内容吗？')) return;

        try {
            await radarAPI.delete(id);
            // 重新加载数据
            await loadItems();
            alert('删除成功！');
        } catch (err) {
            alert('删除失败：' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                加载失败：{error}
            </div>
        );
    }

    const dates = Object.keys(groupedItems).sort().reverse();

    if (dates.length === 0) {
        return (
            <div className="card text-center">
                <p className="text-muted">还没有任何内容，点击"添加内容"开始吧！</p>
            </div>
        );
    }

    return (
        <div>
            {dates.map(date => (
                <div key={date} className="card mb-3">
                    <div className="flex-between mb-3">
                        <h3 className="text-primary">
                            {date}
                            <span className="badge badge-neutral ml-2" style={{ marginLeft: '12px' }}>
                                {groupedItems[date].length}条
                            </span>
                            {groupedItems[date].length >= 6 && groupedItems[date].length <= 8 ? (
                                <span className="badge badge-success" style={{ marginLeft: '8px' }}>
                                    ✓ 达标
                                </span>
                            ) : groupedItems[date].length < 6 ? (
                                <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                                    ⚠ 偏少
                                </span>
                            ) : (
                                <span className="badge badge-error" style={{ marginLeft: '8px' }}>
                                    ⚠ 超量
                                </span>
                            )}
                        </h3>
                    </div>

                    <div className="grid grid-2" style={{ gap: '12px' }}>
                        {groupedItems[date].map(item => (
                            <div key={item.id} className="list-item">
                                <div className="flex-between mb-2">
                                    <div className="flex" style={{ gap: '8px', alignItems: 'center' }}>
                                        <span className="badge badge-neutral">{item.freq}</span>
                                        <span className={`badge ${item.stance === 'A' ? 'badge-success' : 'badge-warning'}`}>
                                            {item.stance}极
                                        </span>
                                    </div>
                                    <div className="flex flex-gap">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            编辑
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, date)}
                                            className="btn btn-danger btn-sm"
                                        >
                                            删除
                                        </button>
                                    </div>
                                </div>

                                <h4 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
                                    {item.title}
                                </h4>

                                <div className="flex" style={{ gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <span>📝 {item.author_name}</span>
                                    <span>📊 {item.content?.length || 0}字</span>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        {item.domain}
                                    </span>
                                </div>

                                {item.keywords && item.keywords.length > 0 && (
                                    <div className="flex flex-gap" style={{ marginTop: '8px' }}>
                                        {item.keywords.slice(0, 3).map((keyword, i) => (
                                            <span key={i} className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
