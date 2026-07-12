'use client';

import { useState } from 'react';
import { User, Mail, Globe, Twitter, Github, Linkedin, FileText, Save, X, Check } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { validateSocialLink } from '@/lib/validation';

interface EditModeFormProps {
  initialData: {
    fullName?: string;
    email?: string;
    bio?: string;
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function EditModeForm({ initialData, onSave, onCancel }: EditModeFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 实时验证社交链接
    if (['website', 'twitter', 'github', 'linkedin'].includes(name)) {
      const validation = validateSocialLink(name, value);
      if (touched[name] && !validation.isValid) {
        setErrors(prev => ({ ...prev, [name]: validation.message || '' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSave(formData);
    setIsSaving(false);
  };

  const fieldGroups = [
    {
      title: '基本信息',
      fields: [
        { name: 'fullName', label: '姓名', icon: User, type: 'text' },
        { name: 'email', label: '邮箱', icon: Mail, type: 'email' },
      ]
    },
    {
      title: '个人简介',
      fields: [
        { name: 'bio', label: '关于我', icon: FileText, type: 'textarea' },
      ]
    },
    {
      title: '社交链接',
      fields: [
        { name: 'website', label: '个人网站', icon: Globe, type: 'url', placeholder: 'https://example.com' },
        { name: 'twitter', label: 'Twitter', icon: Twitter, type: 'text', placeholder: '@username' },
        { name: 'github', label: 'GitHub', icon: Github, type: 'text', placeholder: 'username' },
        { name: 'linkedin', label: 'LinkedIn', icon: Linkedin, type: 'text', placeholder: 'username' },
      ]
    }
  ];

  return (
    <GlassCard 
      padding="lg" 
      className="border-tech-cyan/20 hover:shadow-[0_0_30px_var(--shadow-tech-cyan)] transition-all duration-300 animate-fade-in-up"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-tech-cyan/20 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-gradient-primary">编辑个人资料</h2>
            <p className="text-sm text-muted-foreground mt-1">更新您的个人信息和社交链接</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-tech-cyan/50 hover:bg-tech-cyan/10 hover:text-tech-cyan transition-all duration-300 hover:scale-105"
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">取消</span>
            </Button>
            <Button
              type="submit"
              className="bg-tech-cyan hover:bg-tech-sky text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              disabled={isSaving || Object.keys(errors).length > 0}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span className="hidden sm:inline ml-2">保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">保存更改</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 表单字段 */}
        {fieldGroups.map((group, groupIndex) => (
          <div key={group.title} className="space-y-4 animate-fade-in-up" style={{ animationDelay: `${groupIndex * 100}ms` }}>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-tech-cyan to-tech-sky rounded-full" />
              {group.title}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {group.fields.map((field) => {
                const Icon = field.icon;
                const hasError = touched[field.name] && errors[field.name];

                return (
                  <div key={field.name} className="space-y-2">
                    <Label 
                      htmlFor={field.name} 
                      className="text-foreground flex items-center gap-2 font-medium"
                    >
                      <Icon className="w-4 h-4 text-tech-cyan" />
                      {field.label}
                    </Label>
                    
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={formData[field.name as keyof typeof formData] || ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur(field.name)}
                        rows={4}
                        placeholder="介绍一下自己..."
                        className={`bg-muted/50 border-tech-cyan/20 focus:border-tech-cyan/50 focus:ring-2 focus:ring-tech-cyan/20 transition-all duration-300 resize-none ${
                          hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                        }`}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        value={formData[field.name as keyof typeof formData] || ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur(field.name)}
                        placeholder={(field as any).placeholder || ''}
                        className={`bg-muted/50 border-tech-cyan/20 focus:border-tech-cyan/50 focus:ring-2 focus:ring-tech-cyan/20 transition-all duration-300 ${
                          hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                        }`}
                      />
                    )}

                    {hasError && (
                      <p className="text-sm text-red-500 flex items-center gap-1 animate-fade-in">
                        <X className="w-3 h-3" />
                        {errors[field.name]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 底部状态 */}
        {Object.keys(errors).length === 0 && touched.email && touched.fullName && (
          <div className="flex items-center gap-2 p-4 bg-tech-cyan/10 border border-tech-cyan/20 rounded-lg animate-fade-in-up">
            <Check className="w-5 h-5 text-tech-cyan" />
            <span className="text-foreground">所有字段已填写正确</span>
          </div>
        )}
      </form>
    </GlassCard>
  );
}
