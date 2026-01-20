import { useState, useEffect } from 'react';
import { bandsAPI } from '../services/api';

const DOMAIN_LABELS = {
    tech: '科技',
    politics: '政治',
    history: '历史',
    philosophy: '哲学',
    religion: '宗教',
    finance: '金融',
};

export default function BandManagement() {
    const [bands, setBands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [newTTI, setNewTTI] = useState('');

    useEffect(() => {
        loadBands();
    }, []);

    const loadBands = async () => {
        try {
            setLoading(true);
            const data = await bandsAPI.getAll();
            setBands(data.bands || []);
        } catch (err) {
            alert('加载频段失败：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditTTI = (band) => {
        setEditing(band.id);
        setNewTTI(band.tti.toString());
    };

    const handleSaveTTI = async (id) => {
        const tti = parseInt(newTTI);

        if (isNaN(tti) || tti < 0 || tti > 100) {
            alert('TTI必须是0-100之间的数字');
            return;
        }

        try {
            await bandsAPI.updateTTI(id, tti);
            await loadBands();
            setEditing(null);
            setNewTTI('');
        } catch (err) {
            alert('更新失败：' + err.message);
        }
    };

    const handleCancelEdit = () => {
        setEditing(null);
        setNewTTI('');
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // 按领域分组
    const grouped = bands.reduce((acc, band) => {
        if (!acc[band.domain]) {
            acc[band.domain] = [];
        }
        acc[band.domain].push(band);
        return acc;
    }, {});

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">频段管理</h2>
                <p className="text-muted" style={{ margin: '8px 0 0 0' }}>
                    管理18个频段的张力指数(TTI)
                </p>
            </div>

            {Object.entries(grouped).map(([domain, domainBands]) => (
                <div key={domain} style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        color: 'var(--primary)',
                        marginBottom: '16px',
                        fontSize: '1.2rem'
                    }}>
                        {DOMAIN_LABELS[domain] || domain}
                        <span className="badge badge-neutral" style={{ marginLeft: '12px' }}>
                            {domainBands.length}个
                        </span>
                    </h3>

                    <div className="grid grid-2" style={{ gap: '12px' }}>
                        {domainBands.map(band => (
                            <div key={band.id} className="list-item">
                                <div className="flex-between mb-2">
                                    <div>
                                        <span className="badge badge-primary" style={{
                                            background: 'rgba(0, 255, 136, 0.2)',
                                            color: 'var(--primary)',
                                            fontWeight: 'bold'
                                        }}>
                                            {band.id}
                                        </span>
                                    </div>
                                    <div className="flex" style={{ gap: '8px', alignItems: 'center' }}>
                                        {editing === band.id ? (
                                            <>
                                                <input
                                                    type="number"
                                                    value={newTTI}
                                                    onChange={(e) => setNewTTI(e.target.value)}
                                                    className="form-input"
                                                    style={{ width: '80px', padding: '4px 8px' }}
                                                    min="0"
                                                    max="100"
                                                />
                                                <button
                                                    onClick={() => handleSaveTTI(band.id)}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    保存
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    取消
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{
                                                    padding: '4px 12px',
                                                    background: getTTIColor(band.tti),
                                                    borderRadius: '12px',
                                                    fontWeight: 'bold',
                                                    fontSize: '14px'
                                                }}>
                                                    TTI {band.tti}
                                                </div>
                                                <button
                                                    onClick={() => handleEditTTI(band)}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    编辑
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h4 style={{
                                    marginBottom: '12px',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}>
                                    {band.question}
                                </h4>

                                <div className="grid grid-2" style={{ gap: '8px', fontSize: '13px' }}>
                                    <div style={{
                                        padding: '8px',
                                        background: 'rgba(0, 255, 136, 0.05)',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(0, 255, 136, 0.2)'
                                    }}>
                                        <div className="text-muted" style={{ fontSize: '11px', marginBottom: '4px' }}>
                                            A极
                                        </div>
                                        <div style={{ color: 'var(--success)' }}>
                                            {band.side_a}
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '8px',
                                        background: 'rgba(245, 158, 11, 0.05)',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(245, 158, 11, 0.2)'
                                    }}>
                                        <div className="text-muted" style={{ fontSize: '11px', marginBottom: '4px' }}>
                                            B极
                                        </div>
                                        <div style={{ color: 'var(--warning)' }}>
                                            {band.side_b}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// 根据TTI值返回颜色
function getTTIColor(tti) {
    if (tti >= 80) return 'rgba(239, 68, 68, 0.2)'; // 高张力 - 红色
    if (tti >= 60) return 'rgba(245, 158, 11, 0.2)'; // 中张力 - 橙色
    return 'rgba(0, 255, 136, 0.2)'; // 低张力 - 绿色
}
