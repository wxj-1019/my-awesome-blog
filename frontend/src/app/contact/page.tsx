import type { Metadata } from 'next';
import ContactPageContent from './contact-content';

export const metadata: Metadata = {
  title: '联系我 - My Awesome Blog',
  description: '有问题或合作意向？通过联系表单、社交媒体或邮件与我取得联系。',
};

export default function ContactPage() {
  return <ContactPageContent />;
}
