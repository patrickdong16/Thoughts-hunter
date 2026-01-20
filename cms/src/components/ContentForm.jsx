import { useState, useEffect } from 'react';
import { radarAPI, bandsAPI, statsAPI } from '../services/api';

const FREQUENCIES = [
    'T1', 'T2', 'T3',
    'P1', 'P2', 'P3',
    'H1', 'H2', 'H3',
    'Φ1', 'Φ2', 'Φ3',
    'R1', 'R2',
    'F1', 'F2'
];

export default function ContentForm({ item, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        freq: 'T1',
        stance: 'A',
        title: '',
        author_name: '',
        author_avatar: '',
        author_bio: '',
        source: '',
        content: '',
        tension_q: '',
        tension_a: '',
        tension_b: '',
        keywords: '',
    });

    const [bands, setBands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [todayCount, setTodayCount] = useState(0);
    const [weekUncovered, setWeekUncovered] = useState([]);

    useEffect(() => {
        loadBands();
        loadStats();

        if (item) {
            // 编辑模式
            setFormData({
                date: item.date ? new Date(item.date).toISOString().split('T')[0] : formData.date,
                freq: item.freq || 'T1',
                stance: item.stance || 'A',
                title: item.title || '',
                author_name: item.author_name || '',
                author_avatar: item.author_avatar || '',
                author_bio: item.author_bio || '',
                source: item.source || '',
                content: item.content || '',
                tension_q: item.tension_q || '',
                tension_a: item.tension_a || '',
                tension_b: item.tension_b || '',
                keywords: Array.isArray(item.keywords) ? item.keywords.join(', ') : '',
            });
        }
    }, [item]);

    const loadBands = async () => {
        try {
            const data = await bandsAPI.getAll();
            setBands(data.bands || []);
        } catch (err) {
            console.error('Failed to load bands:', err);
        }
    };

    const loadStats = async () => {
        try {
            const count = await statsAPI.getTodayCount();
            setTodayCount(count);

            const uncovered = await statsAPI.getWeekUncoveredBands();
            setWeekUncovered(uncovered);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 验证
        if (!formData.title.trim()) {
            setError('请输入标题');
            return;
        }

        if (!formData.author_name.trim()) {
            setError('请输入作者姓名');
            return;
        }

        if (formData.content.length < 500) {
            setError(`正文至少需要500字（当前${formData.content.length}字）`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 处理关键词
            const keywords = formData.keywords
                .split(',')
                .map(k => k.trim())
                .filter(k => k);

            const payload = {
                ...formData,
                keywords
            };

            if (item) {
                // 更新
                await radarAPI.update(item.id, payload);
            } else {
                // 创建
                await radarAPI.create(payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedBand = bands.find(b => b.id === formData.freq);
    const contentLength = formData.content.length;
    const contentStatus = contentLength >= 500 ? 'success' : contentLength >= 400 ? 'warning' : 'error';

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {item ? '编辑内容' : '添加新内容'}
                    </h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                {error && (
                    <div className="alert alert-error mb-3">
                        {error}
                    </div>
                )}

                {/* 统计信息 */}
                <div className="grid grid-2 mb-3">
                    <div className="alert alert-warning">
                        📅 今日已有 <strong>{todayCount}</strong> 条内容
                        {todayCount < 6 && ' (建议6-8条)'}
                        {todayCount >= 6 && todayCount <= 8 && ' ✓'}
                        {todayCount > 8 && ' ⚠️ 已超过建议数量'}
                    </div>

                    {weekUncovered.length > 0 && (
                        <div className="alert alert-warning">
                            📊 本周未覆盖: {weekUncovered.map(b => b.id).join(', ')}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-3">
                        <div className="form-group">
                            <label className="form-label required">发布日期</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">频段</label>
                            <select
                                name="freq"
                                value={formData.freq}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                {FREQUENCIES.map(freq => {
                                    const band = bands.find(b => b.id === freq);
                                    return (
                                        <option key={freq} value={freq}>
                                            {freq} {band ? `- ${band.question.substring(0, 15)}...` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            {selectedBand && (
                                <div className="form-help">
                                    {selectedBand.question}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label required">立场倾向</label>
                            <select
                                name="stance"
                                value={formData.stance}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="A">A极 {selectedBand && `- ${selectedBand.side_a}`}</option>
                                <option value="B">B极 {selectedBand && `- ${selectedBand.side_b}`}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">标题</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="输入吸引人的标题"
                            required
                        />
                    </div>

                    <div className="grid grid-3">
                        <div className="form-group">
                            <label className="form-label required">作者姓名</label>
                            <input
                                type="text"
                                name="author_name"
                                value={formData.author_name}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Sam Altman"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">头像缩写</label>
                            <input
                                type="text"
                                name="author_avatar"
                                value={formData.author_avatar}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="SA"
                                maxLength={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">出处信息</label>
                            <input
                                type="text"
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Twitter @username"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">作者简介</label>
                        <input
                            type="text"
                            name="author_bio"
                            value={formData.author_bio}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="OpenAI CEO，硅谷最具影响力的AI领袖"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">
                            正文内容
                            <span className={`badge badge-${contentStatus}`} style={{ marginLeft: '12px' }}>
                                {contentLength}/500字
                            </span>
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            className="form-textarea"
                            style={{ minHeight: '200px' }}
                            placeholder="输入至少500字的正文内容..."
                            required
                        />
                        {contentLength < 500 && (
                            <div className="form-error">
                                还需要 {500 - contentLength} 字
                            </div>
                        )}
                    </div>

                    <div className="grid grid-3">
                        <div className="form-group">
                            <label className="form-label">张力问题</label>
                            <input
                                type="text"
                                name="tension_q"
                                value={formData.tension_q}
                                onChange={handleChange}
                                className="form-input"
                                placeholder={selectedBand?.question || ''}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">A极描述</label>
                            <input
                                type="text"
                                name="tension_a"
                                value={formData.tension_a}
                                onChange={handleChange}
                                className="form-input"
                                placeholder={selectedBand?.side_a || ''}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">B极描述</label>
                            <input
                                type="text"
                                name="tension_b"
                                value={formData.tension_b}
                                onChange={handleChange}
                                className="form-input"
                                placeholder={selectedBand?.side_b || ''}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">关键词</label>
                        <input
                            type="text"
                            name="keywords"
                            value={formData.keywords}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="GPT-5, 创意产业, AI艺术, 技术失业（逗号分隔）"
                        />
                    </div>

                    <div className="flex-between mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || contentLength < 500}
                        >
                            {loading ? '保存中...' : (item ? '更新' : '创建')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
