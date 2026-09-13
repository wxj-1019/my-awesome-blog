import asyncio
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Tuple
from urllib.parse import quote
from pydantic import EmailStr
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.sender_email = settings.SMTP_FROM
        self.enabled = all([
            self.smtp_host,
            self.smtp_port,
            self.smtp_username,
            self.smtp_password,
            self.sender_email
        ])

    def send_email(
        self,
        to_emails: List[EmailStr],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        cc: Optional[List[EmailStr]] = None,
        bcc: Optional[List[EmailStr]] = None,
        attachments: Optional[List[str]] = None
    ) -> bool:
        """
        发送电子邮件
        """
        if not self.enabled:
            logging.warning("邮件服务未启用，请检查SMTP配置")
            return False

        try:
            # 创建邮件对象
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.sender_email
            msg['To'] = ', '.join(to_emails)
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            
            # 添加文本正文
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)
            
            # 添加HTML正文（如果有）
            if html_body:
                html_part = MIMEText(html_body, 'html', 'utf-8')
                msg.attach(html_part)
            
            # 添加附件（如果有）
            if attachments:
                for file_path in attachments:
                    with open(file_path, 'rb') as attachment:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(attachment.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {file_path.split("/")[-1]}'
                        )
                        msg.attach(part)

            # 准备收件人列表
            all_recipients = to_emails.copy()
            if cc:
                all_recipients.extend(cc)
            if bcc:
                all_recipients.extend(bcc)

            # 发送邮件
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()  # 启用TLS加密
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg, to_addrs=all_recipients)

            logging.info(f"邮件发送成功: {subject} -> {to_emails}")
            return True

        except Exception as e:
            logging.error(f"邮件发送失败: {str(e)}")
            return False

    async def send_email_async(
        self,
        to_emails: List[EmailStr],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        cc: Optional[List[EmailStr]] = None,
        bcc: Optional[List[EmailStr]] = None,
        attachments: Optional[List[str]] = None
    ) -> bool:
        """
        异步发送电子邮件（smtplib 为阻塞 IO，在线程池中执行，供 async 端点调用）
        """
        return await asyncio.to_thread(
            self.send_email, to_emails, subject, body, html_body, cc, bcc, attachments
        )

    def send_verification_email(self, email: EmailStr, token: str) -> bool:
        """
        发送订阅验证邮件
        """
        subject = "请验证您的邮箱订阅"
        verification_url = f"{settings.FRONTEND_URL}/verify-subscription/{token}"
        
        body = f"""
        您好，
        
        感谢您订阅我们的博客！
        
        请点击以下链接验证您的邮箱地址：
        {verification_url}
        
        如果您没有订阅我们的博客，请忽略此邮件。
        
        此致，
        博客团队
        """
        
        html_body = f"""
        <html>
            <body>
                <p>您好，</p>
                <p>感谢您订阅我们的博客！</p>
                <p>请点击以下链接验证您的邮箱地址：</p>
                <p><a href="{verification_url}">验证邮箱</a></p>
                <p>如果您没有订阅我们的博客，请忽略此邮件。</p>
                <br/>
                <p>此致，<br/>博客团队</p>
            </body>
        </html>
        """
        
        return self.send_email([email], subject, body, html_body)

    def send_welcome_email(self, email: EmailStr, name: Optional[str] = None) -> bool:
        """
        发送欢迎邮件给新订阅者
        """
        subject = "欢迎订阅我们的博客！"
        
        name_text = f"{name}, " if name else ""
        body = f"""
        {name_text}您好，
        
        欢迎订阅我们的技术博客！
        
        您将定期收到我们的最新文章和技术分享。
        我们致力于为您提供高质量的内容。
        
        如有任何问题，请随时联系我们。
        
        此致，
        博客团队
        """
        
        html_body = f"""
        <html>
            <body>
                <p>{name_text}您好，</p>
                <p>欢迎订阅我们的技术博客！</p>
                <p>您将定期收到我们的最新文章和技术分享。<br/>
                我们致力于为您提供高质量的内容。</p>
                <p>如有任何问题，请随时联系我们。</p>
                <br/>
                <p>此致，<br/>博客团队</p>
            </body>
        </html>
        """
        
        return self.send_email([email], subject, body, html_body)

    def _build_new_article_content(
        self,
        article_title: str,
        article_url: str,
        article_excerpt: str,
        unsubscribe_url: str,
    ) -> Tuple[str, str]:
        """构建新文章通知邮件的文本/HTML 正文（退订链接因收件人而异，需逐人生成）"""
        body = f"""
        您好，

        我们刚刚发布了新文章，相信您会感兴趣：

        标题: {article_title}
        链接: {article_url}

        内容预览:
        {article_excerpt}

        欢迎阅读完整内容！

        此致，
        博客团队

        ---
        如果您不想再收到此类邮件，请访问 {unsubscribe_url} 取消订阅。
        """

        html_body = f"""
        <html>
            <body>
                <p>您好，</p>
                <p>我们刚刚发布了新文章，相信您会感兴趣：</p>
                <h3>{article_title}</h3>
                <p><a href="{article_url}">点击阅读完整文章</a></p>
                <div>
                    <strong>内容预览:</strong>
                    <p>{article_excerpt}</p>
                </div>
                <p>欢迎阅读完整内容！</p>
                <br/>
                <p>此致，<br/>博客团队</p>
                <hr/>
                <small>如果您不想再收到此类邮件，请<a href="{unsubscribe_url}">点击取消订阅</a>。</small>
            </body>
        </html>
        """
        return body, html_body

    def send_new_article_notification(
        self,
        subscribers: List[EmailStr],
        article_title: str,
        article_url: str,
        article_excerpt: str
    ) -> bool:
        """
        发送新文章通知邮件

        逐订阅者单独发送（每封邮件 To 只有一个收件人），
        避免把所有订阅者邮箱暴露在 To 头里；单封失败仅记日志，不中断其余发送。

        Returns:
            bool: 全部发送成功返回 True，任一封失败返回 False
        """
        subject = f"新文章发布: {article_title}"
        all_sent = True

        for subscriber in subscribers:
            # 退订链接带上订阅者邮箱（URL 编码），供前端 /unsubscribe 页面使用
            unsubscribe_url = f"{settings.FRONTEND_URL}/unsubscribe?email={quote(str(subscriber))}"
            body, html_body = self._build_new_article_content(
                article_title, article_url, article_excerpt, unsubscribe_url
            )
            if not self.send_email([subscriber], subject, body, html_body):
                all_sent = False

        return all_sent

    async def send_new_article_notification_async(
        self,
        subscribers: List[EmailStr],
        article_title: str,
        article_url: str,
        article_excerpt: str
    ) -> bool:
        """
        异步发送新文章通知邮件（smtplib 为阻塞 IO，在线程池中执行，供 async 端点调用）
        """
        return await asyncio.to_thread(
            self.send_new_article_notification,
            subscribers, article_title, article_url, article_excerpt
        )

    def send_contact_notification(
        self, 
        admin_emails: List[EmailStr], 
        sender_name: str, 
        sender_email: EmailStr, 
        subject: str, 
        message: str
    ) -> bool:
        """
        发送联系表单通知邮件给管理员
        """
        notification_subject = f"新联系消息: {subject}"
        
        body = f"""
        您收到一条新的联系消息：
        
        发送者姓名: {sender_name}
        发送者邮箱: {sender_email}
        主题: {subject}
        
        消息内容:
        {message}
        
        请及时回复。
        """
        
        html_body = f"""
        <html>
            <body>
                <p>您收到一条新的联系消息：</p>
                <table border="1" cellpadding="5" cellspacing="0">
                    <tr><td><strong>发送者姓名:</strong></td><td>{sender_name}</td></tr>
                    <tr><td><strong>发送者邮箱:</strong></td><td>{sender_email}</td></tr>
                    <tr><td><strong>主题:</strong></td><td>{subject}</td></tr>
                </table>
                <br/>
                <strong>消息内容:</strong>
                <div>{message}</div>
                <br/>
                <p>请及时回复。</p>
            </body>
        </html>
        """
        
        return self.send_email(admin_emails, notification_subject, body, html_body)

    def send_password_reset_email(self, email: EmailStr, reset_token: str) -> bool:
        """
        发送密码重置邮件
        """
        subject = "密码重置请求"
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
        
        body = f"""
        您好，
        
        您请求重置密码。请点击以下链接进行重置：
        {reset_url}
        
        如果您没有请求重置密码，请忽略此邮件。
        
        此链接将在24小时后失效。
        
        此致，
        博客团队
        """
        
        html_body = f"""
        <html>
            <body>
                <p>您好，</p>
                <p>您请求重置密码。请点击以下链接进行重置：</p>
                <p><a href="{reset_url}">重置密码</a></p>
                <p>如果您没有请求重置密码，请忽略此邮件。</p>
                <p><em>此链接将在24小时后失效。</em></p>
                <br/>
                <p>此致，<br/>博客团队</p>
            </body>
        </html>
        """
        
        return self.send_email([email], subject, body, html_body)


# 全局邮件服务实例
email_service = EmailService()