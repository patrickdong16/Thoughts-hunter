/**
 * 邮件发送服务 (Email Service)
 * 
 * 支持 SendGrid 和 Nodemailer 两种发送方式
 */

const reportConfig = require('../config/report-config.json');

// 检测是否有 SendGrid API Key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

/**
 * 发送每日运营报告邮件
 * @param {Object} report - 报告数据
 * @param {string} html - HTML 格式的报告
 * @returns {Object} 发送结果
 */
async function sendReportEmail(report, html) {
    const subject = reportConfig.email.subject.replace('{date}', report.date);

    if (SENDGRID_API_KEY) {
        return await sendViaSendGrid(subject, html);
    } else {
        console.log('📧 SendGrid API Key not configured, logging report instead');
        return await logReport(report, subject);
    }
}

/**
 * 通过 SendGrid 发送邮件
 */
async function sendViaSendGrid(subject, html) {
    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(SENDGRID_API_KEY);

        const msg = {
            to: reportConfig.email.recipient,
            from: {
                email: reportConfig.email.sender,
                name: reportConfig.email.senderName
            },
            subject,
            html
        };

        await sgMail.send(msg);

        console.log(`✅ Report email sent to ${reportConfig.email.recipient}`);
        return {
            success: true,
            method: 'sendgrid',
            recipient: reportConfig.email.recipient
        };
    } catch (error) {
        console.error('❌ SendGrid error:', error.message);
        return {
            success: false,
            method: 'sendgrid',
            error: error.message
        };
    }
}

/**
 * 备选：记录报告到控制台/日志
 */
async function logReport(report, subject) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL WOULD BE SENT:');
    console.log('='.repeat(60));
    console.log(`To: ${reportConfig.email.recipient}`);
    console.log(`Subject: ${subject}`);
    console.log(`Date: ${report.date}`);
    console.log(`Content Items: ${report.content.total}`);
    console.log(`New Users: ${report.users.newUsers}`);
    console.log(`Upcoming Events: ${report.upcomingEvents.length}`);
    console.log('='.repeat(60) + '\n');

    return {
        success: true,
        method: 'log',
        note: 'SendGrid not configured, report logged to console'
    };
}

/**
 * 获取邮件配置信息
 */
function getEmailConfig() {
    return {
        recipient: reportConfig.email.recipient,
        sender: reportConfig.email.sender,
        senderName: reportConfig.email.senderName,
        sendgridConfigured: !!SENDGRID_API_KEY,
        scheduleTime: reportConfig.schedule.time,
        scheduleTimezone: reportConfig.schedule.timezone,
        enabled: reportConfig.schedule.enabled
    };
}

module.exports = {
    sendReportEmail,
    getEmailConfig
};
