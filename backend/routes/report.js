/**
 * 运营报告路由 (Report Routes)
 * 
 * API:
 * - POST /api/report/send-daily - 发送每日报告
 * - GET /api/report/preview/:date - 预览报告
 * - GET /api/report/config - 获取报告配置
 */

const express = require('express');
const router = express.Router();
const { generateDailyReport, renderReportHTML, renderReportText } = require('../services/daily-report');
const { sendReportEmail, getEmailConfig } = require('../services/email-service');

/**
 * POST /api/report/send-daily
 * 发送当日运营报告
 */
router.post('/send-daily', async (req, res) => {
    try {
        // 使用北京时区计算"今天"
        const beijingDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });

        console.log(`📊 Generating daily report for ${beijingDate}...`);

        // 生成报告
        const report = await generateDailyReport(beijingDate);
        const html = renderReportHTML(report);

        // 发送邮件
        const result = await sendReportEmail(report, html);

        res.json({
            success: result.success,
            date: beijingDate,
            method: result.method,
            recipient: result.recipient,
            contentCount: report.content.total,
            upcomingEventsCount: report.upcomingEvents.length
        });
    } catch (error) {
        console.error('Error sending daily report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/report/preview/:date
 * 预览指定日期的报告（JSON格式）
 */
router.get('/preview/:date', async (req, res) => {
    try {
        const { date } = req.params;

        // 验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const report = await generateDailyReport(date);

        res.json({
            success: true,
            report
        });
    } catch (error) {
        console.error('Error generating report preview:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/report/preview/:date/html
 * 预览指定日期的报告（HTML格式）
 */
router.get('/preview/:date/html', async (req, res) => {
    try {
        const { date } = req.params;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const report = await generateDailyReport(date);
        const html = renderReportHTML(report);

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error generating HTML report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/report/preview/:date/text
 * 预览指定日期的报告（纯文本格式）
 */
router.get('/preview/:date/text', async (req, res) => {
    try {
        const { date } = req.params;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const report = await generateDailyReport(date);
        const text = renderReportText(report);

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(text);
    } catch (error) {
        console.error('Error generating text report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/report/config
 * 获取报告配置信息
 */
router.get('/config', async (req, res) => {
    try {
        const config = getEmailConfig();

        res.json({
            success: true,
            config
        });
    } catch (error) {
        console.error('Error getting report config:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
