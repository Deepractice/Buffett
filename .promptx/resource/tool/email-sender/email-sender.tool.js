/**
 * QQ邮箱发送工具
 * 用于发送交易汇报邮件
 */

module.exports = {
  getDependencies() {
    return {
      'nodemailer': '^6.9.0'
    };
  },

  getMetadata() {
    return {
      id: 'email-sender',
      name: 'QQ邮箱发送',
      description: '通过QQ邮箱SMTP发送邮件',
      version: '1.0.0',
      author: 'luban'
    };
  },

  getSchema() {
    return {
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['send'],
            description: '操作类型: send-发送邮件'
          },
          to: {
            type: 'string',
            description: '收件人邮箱地址'
          },
          subject: {
            type: 'string',
            description: '邮件主题'
          },
          content: {
            type: 'string',
            description: '邮件正文内容(支持HTML)'
          }
        },
        required: ['action', 'to', 'subject', 'content']
      },
      environment: {
        type: 'object',
        properties: {
          QQ_EMAIL: {
            type: 'string',
            description: 'QQ邮箱地址'
          },
          QQ_EMAIL_AUTH_CODE: {
            type: 'string',
            description: 'QQ邮箱授权码(非登录密码)'
          }
        },
        required: ['QQ_EMAIL', 'QQ_EMAIL_AUTH_CODE']
      }
    };
  },

  async execute(params) {
    const { api } = this;
    const nodemailer = await api.importx('nodemailer');

    const qqEmail = await api.environment.get('QQ_EMAIL');
    const authCode = await api.environment.get('QQ_EMAIL_AUTH_CODE');

    if (!qqEmail || !authCode) {
      return {
        success: false,
        error: '缺少QQ邮箱配置，请设置 QQ_EMAIL 和 QQ_EMAIL_AUTH_CODE 环境变量'
      };
    }

    const { action, to, subject, content } = params;

    if (action !== 'send') {
      return { success: false, error: '未知操作: ' + action };
    }

    if (!to || !subject || !content) {
      return { success: false, error: '缺少必要参数: to, subject, content' };
    }

    try {
      // 创建SMTP传输器
      const transporter = nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 465,
        secure: true,
        auth: {
          user: qqEmail,
          pass: authCode
        }
      });

      // 发送邮件
      const info = await transporter.sendMail({
        from: `巴菲特AI <${qqEmail}>`,
        to: to,
        subject: subject,
        html: content
      });

      api.logger.info('邮件发送成功', { messageId: info.messageId });

      return {
        success: true,
        data: {
          messageId: info.messageId,
          to: to,
          subject: subject
        },
        summary: `邮件已发送至 ${to}\n主题: ${subject}`
      };
    } catch (error) {
      api.logger.error('邮件发送失败', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
