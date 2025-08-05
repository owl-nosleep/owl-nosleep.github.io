// 簡單的密碼保護中間件
export function checkAdminAccess(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');
    
    // 從環境變數獲取管理員憑證
    const adminUsername = import.meta.env.ADMIN_USERNAME || 'admin';
    const adminPassword = import.meta.env.ADMIN_PASSWORD;
    
    // 如果沒有設定密碼，則不允許存取
    if (!adminPassword) {
      console.warn('Admin password not set in environment variables');
      return false;
    }
    
    return username === adminUsername && password === adminPassword;
  } catch {
    return false;
  }
}

export function createAuthResponse(): Response {
  return new Response('請提供管理員憑證', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
