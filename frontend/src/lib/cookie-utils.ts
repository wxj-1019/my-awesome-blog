// 设置 Cookie
export const setCookie = (name: string, value: string, days?: number) => {
  try {
    // 验证输入参数
    if (!name || typeof name !== 'string') {
      console.error('无效的cookie名称:', name);
      return;
    }
    
    if (typeof value !== 'string') {
      console.error('cookie值必须是字符串:', typeof value);
      return;
    }
    
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    
    // 对名称和值进行编码，确保特殊字符不会破坏cookie格式
    const encodedName = encodeURIComponent(name);
    const encodedValue = encodeURIComponent(value);
    
    document.cookie = `${encodedName}=${encodedValue}${expires}; path=/; SameSite=Strict; Secure`;
  } catch (error) {
    console.error('设置cookie时出错:', error);
  }
};

// 获取 Cookie
export const getCookie = (name: string) => {
  try {
    // 验证输入参数
    if (!name || typeof name !== 'string') {
      console.error('无效的cookie名称:', name);
      return null;
    }
    
    // 对名称进行解码以处理特殊字符
    const decodedName = decodeURIComponent(name);
    const nameEQ = decodedName + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {c = c.substring(1, c.length);}
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length, c.length);
        return decodeURIComponent(value); // 解码返回的值
      }
    }
    return null;
  } catch (error) {
    console.error('获取cookie时出错:', error);
    return null;
  }
};

// 删除 Cookie
export const eraseCookie = (name: string) => {
  try {
    // 验证输入参数
    if (!name || typeof name !== 'string') {
      console.error('无效的cookie名称:', name);
      return;
    }
    
    // 对名称进行编码
    const encodedName = encodeURIComponent(name);
    document.cookie = `${encodedName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  } catch (error) {
    console.error('删除cookie时出错:', error);
  }
};