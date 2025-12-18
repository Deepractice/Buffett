/**
 * 图片自动压缩 Hook
 * 拦截所有文件输入，在上传前自动压缩大图片
 */

import { useEffect } from 'react';
import { compressImage } from './imageCompression';

export function useImageCompression() {
  useEffect(() => {
    // 拦截所有文件输入的change事件
    const handleFileInput = async (e: Event) => {
      const target = e.target as HTMLInputElement;

      if (target.type === 'file' && target.files && target.files.length > 0) {
        const files = Array.from(target.files);
        const hasLargeImage = files.some(f => f.type.startsWith('image/') && f.size > 5 * 1024 * 1024);

        if (hasLargeImage) {
          e.preventDefault();
          e.stopPropagation();

          // 压缩所有图片
          const compressedFiles = await Promise.all(
            files.map(file => compressImage(file))
          );

          // 创建新的FileList (使用DataTransfer)
          const dataTransfer = new DataTransfer();
          compressedFiles.forEach(file => dataTransfer.items.add(file));

          // 替换文件列表
          target.files = dataTransfer.files;

          // 触发change事件，让React检测到变化
          const changeEvent = new Event('change', { bubbles: true });
          target.dispatchEvent(changeEvent);
        }
      }
    };

    // 使用捕获阶段拦截，确保在其他处理器之前执行
    document.addEventListener('change', handleFileInput, true);

    return () => {
      document.removeEventListener('change', handleFileInput, true);
    };
  }, []);
}
