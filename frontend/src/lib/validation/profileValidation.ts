// Validation utilities for profile form
export interface FormErrors {
  [key: string]: string;
}
// Validates form data and returns any errors
export const validateForm = (formData: Record<string, unknown>): FormErrors => {
  const errors: FormErrors = {};
  const data = formData as Record<string, string | undefined>;

  // Username validation
  if (!data.username || data.username.trim().length < 3) {
    errors.username = '用户名至少需要3个字符';
  }
  // Email validation
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = '请输入有效的邮箱地址';
  }
  // Full name validation
  if (data.fullName && data.fullName.length > 50) {
    errors.fullName = '姓名长度不能超过50个字符';
  }
  // Bio validation
  if (data.bio && data.bio.length > 200) {
    errors.bio = '个人简介不能超过200个字符';
  }
  // Social links validation
  if (data.website && !isValidUrl(data.website)) {
    errors.website = '请输入有效的网站地址';
  }
  if (data.twitter && !isValidTwitterHandle(data.twitter)) {
    errors.twitter = '请输入有效的Twitter用户名';
  }
  if (data.github && !isValidGithubUsername(data.github)) {
    errors.github = '请输入有效的GitHub用户名';
  }
  if (data.linkedin && !isValidLinkedinUsername(data.linkedin)) {
    errors.linkedin = '请输入有效的LinkedIn用户名';
  }
  return errors;
};
// Sanitizes form data to prevent XSS and other attacks
export const sanitizeFormData = (formData: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const key in formData) {
    if (formData.hasOwnProperty(key)) {
      const value = formData[key];
      if (typeof value === 'string') {
        // Basic sanitization - remove potentially harmful characters
        sanitized[key] = value.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};
// Helper functions
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};
const isValidTwitterHandle = (handle: string): boolean => {
  if (!handle) {return true;} // Allow empty
  return /^@?[a-zA-Z0-9_]{1,15}$/.test(handle);
};
const isValidGithubUsername = (username: string): boolean => {
  if (!username) {return true;} // Allow empty
  return /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/.test(username);
};
const isValidLinkedinUsername = (username: string): boolean => {
  if (!username) {return true;} // Allow empty
  return /^[a-zA-Z0-9_-]{3,100}$/.test(username);
};