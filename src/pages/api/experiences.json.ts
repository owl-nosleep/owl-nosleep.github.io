import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { parse, stringify } from 'yaml';
// import { checkAdminAccess, createAuthResponse } from '../../utils/auth';

// export const prerender = false;

// 定義經歷類型
interface Experience {
  year: string;
  title: string;
  description: string;
  type: "achievement" | "education" | "competition" | "certification";
  content?: string;
  order?: number;
}

interface ExperienceData {
  experiences: Experience[];
}

// 驗證經歷數據的函數
function validateExperience(exp: any): Experience | null {
  // 必要欄位檢查
  if (!exp.year || !exp.title || !exp.description || !exp.type) {
    return null;
  }

  // 類型檢查
  if (!['achievement', 'education', 'competition', 'certification'].includes(exp.type)) {
    return null;
  }

  // 返回驗證後的經歷對象
  return {
    year: exp.year,
    title: exp.title,
    description: exp.description,
    type: exp.type as "achievement" | "education" | "competition" | "certification",
    content: exp.content || '',
    order: exp.order !== undefined ? parseInt(exp.order) : undefined
  };
}

export const GET: APIRoute = async ({ request }) => {
  // 檢查身份驗證 - 暫時註解以支援靜態建構
  // if (!checkAdminAccess(request)) {
  //   return createAuthResponse();
  // }

  try {
    // 獲取 YAML 檔案路徑
    const yamlPath = new URL('../../../public/data/experiences.yaml', import.meta.url);
    
    // 讀取檔案
    const yamlContent = await readFile(yamlPath, 'utf-8');
    
    // 解析為 JSON
    const data = parse(yamlContent) as ExperienceData;
    
    // 回傳 JSON 格式數據
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '讀取經歷資料失敗' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  // 檢查身份驗證 - 暫時註解以支援靜態建構
  // if (!checkAdminAccess(request)) {
  //   return createAuthResponse();
  // }

  try {
    // 獲取請求體
    const body = await request.json() as { experiences: any[] };
    
    // 基本驗證
    if (!body || !Array.isArray(body.experiences)) {
      return new Response(JSON.stringify({ error: '無效的資料格式' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // 驗證每個經歷
    const validatedExperiences: Experience[] = [];
    for (const exp of body.experiences) {
      const validExp = validateExperience(exp);
      if (validExp) {
        validatedExperiences.push(validExp);
      } else {
        return new Response(JSON.stringify({ error: '存在無效的經歷數據' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // 組織數據
    const yamlData: ExperienceData = {
      experiences: validatedExperiences
    };
    
    // 轉換為 YAML
    const yamlContent = stringify(yamlData);
    
    // 獲取 YAML 檔案路徑
    const yamlPath = new URL('../../../public/data/experiences.yaml', import.meta.url);
    
    // 寫入檔案
    await writeFile(yamlPath, yamlContent, 'utf-8');
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '保存經歷資料失敗' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
