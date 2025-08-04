#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../src/content/posts');

// 修正程式碼區塊語法的對應表
const languageFixMap = {
    '=python': 'python',
    '=py': 'python', 
    'python=': 'python',
    'python!=': 'python',
    'cpp=': 'cpp',
    '=js': 'javascript',
    '=wasm': 'wasm',
    'mar=': 'markdown'
};

async function fixCodeBlockSyntax(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf-8');
        let hasChanges = false;
        
        // 修正程式碼區塊語法
        for (const [badSyntax, goodSyntax] of Object.entries(languageFixMap)) {
            const pattern = new RegExp(`\`\`\`${badSyntax.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
            if (pattern.test(content)) {
                content = content.replace(pattern, `\`\`\`${goodSyntax}`);
                hasChanges = true;
                console.log(`  ✅ 修正 ${badSyntax} -> ${goodSyntax}`);
            }
        }
        
        if (hasChanges) {
            await fs.writeFile(filePath, content, 'utf-8');
            console.log(`✅ 已修正: ${path.basename(filePath)}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ 修正失敗 ${filePath}:`, error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('開始修正程式碼區塊語法...\n');
        
        const files = await fs.readdir(POSTS_DIR);
        const markdownFiles = files.filter(file => file.endsWith('.md'));
        
        let fixedCount = 0;
        
        for (const file of markdownFiles) {
            const filePath = path.join(POSTS_DIR, file);
            console.log(`檢查: ${file}`);
            
            const wasFixed = await fixCodeBlockSyntax(filePath);
            if (wasFixed) {
                fixedCount++;
            }
            
            console.log('');
        }
        
        console.log(`🎉 修正完成！總共修正了 ${fixedCount} 個檔案`);
        
    } catch (error) {
        console.error('修正過程中發生錯誤:', error.message);
    }
}

main();
