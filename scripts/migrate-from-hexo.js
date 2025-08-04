#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 路徑配置
const HEXO_POSTS_DIR = path.join(__dirname, '../../source/_posts');
const ASTRO_POSTS_DIR = path.join(__dirname, '../src/content/posts');

// Hexo front matter 到 Astro front matter 的轉換
function convertFrontMatter(hexoFrontMatter) {
    const astroFrontMatter = {
        title: hexoFrontMatter.title || 'Untitled',
        published: new Date(hexoFrontMatter.date || Date.now()),
        description: hexoFrontMatter.description || '',
        tags: hexoFrontMatter.tags || [],
        category: hexoFrontMatter.categories ? 
            (Array.isArray(hexoFrontMatter.categories) ? hexoFrontMatter.categories[0] : hexoFrontMatter.categories) : 
            'general',
        draft: false
    };

    return astroFrontMatter;
}

// 解析 Hexo 文章的 front matter
function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
        return {
            frontMatter: {},
            content: content
        };
    }

    const frontMatterText = match[1];
    const bodyContent = match[2];
    
    // 簡單的 YAML 解析（基本版本）
    const frontMatter = {};
    const lines = frontMatterText.split('\n');
    
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // 移除引號
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            // 處理陣列（簡單版本）
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
            }
            
            frontMatter[key] = value;
        }
    }
    
    return {
        frontMatter,
        content: bodyContent
    };
}

// 生成 Astro 格式的 front matter
function generateAstroFrontMatter(frontMatter) {
    const lines = ['---'];
    
    lines.push(`title: "${frontMatter.title}"`);
    lines.push(`published: ${frontMatter.published.toISOString()}`);
    lines.push(`description: "${frontMatter.description}"`);
    
    if (frontMatter.tags.length > 0) {
        lines.push(`tags: [${frontMatter.tags.map(tag => `"${tag}"`).join(', ')}]`);
    } else {
        lines.push('tags: []');
    }
    
    lines.push(`category: "${frontMatter.category}"`);
    lines.push(`draft: ${frontMatter.draft}`);
    lines.push('---');
    lines.push('');
    
    return lines.join('\n');
}

// 主要轉換函數
async function migratePost(hexoFilePath, astroPostsDir) {
    try {
        const content = await fs.readFile(hexoFilePath, 'utf-8');
        const { frontMatter: hexoFrontMatter, content: bodyContent } = parseFrontMatter(content);
        
        const astroFrontMatter = convertFrontMatter(hexoFrontMatter);
        const astroContent = generateAstroFrontMatter(astroFrontMatter) + bodyContent;
        
        // 生成文件名（移除 .md 然後重新加上）
        const fileName = path.basename(hexoFilePath, '.md');
        const astroFilePath = path.join(astroPostsDir, `${fileName}.md`);
        
        await fs.writeFile(astroFilePath, astroContent, 'utf-8');
        console.log(`✅ 已轉換: ${fileName}.md`);
        
    } catch (error) {
        console.error(`❌ 轉換失敗 ${hexoFilePath}:`, error.message);
    }
}

// 主函數
async function main() {
    try {
        console.log('開始從 Hexo 遷移文章到 Astro...\n');
        
        // 確保目標目錄存在
        await fs.mkdir(ASTRO_POSTS_DIR, { recursive: true });
        
        // 讀取 Hexo 文章目錄
        const hexoFiles = await fs.readdir(HEXO_POSTS_DIR);
        const markdownFiles = hexoFiles.filter(file => 
            file.endsWith('.md') && !file.startsWith('_') // 跳過草稿文件（以 _ 開頭）
        );
        
        console.log(`找到 ${markdownFiles.length} 個文章檔案\n`);
        
        // 轉換每個文章
        for (const file of markdownFiles) {
            const hexoFilePath = path.join(HEXO_POSTS_DIR, file);
            await migratePost(hexoFilePath, ASTRO_POSTS_DIR);
        }
        
        console.log(`\n🎉 遷移完成！總共轉換了 ${markdownFiles.length} 篇文章`);
        console.log(`文章已保存到: ${ASTRO_POSTS_DIR}`);
        
    } catch (error) {
        console.error('遷移過程中發生錯誤:', error.message);
    }
}

// 執行遷移
main();
