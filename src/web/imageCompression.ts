/**
 * 图片压缩工具
 * 在上传前自动压缩大于5MB的图片
 */

import imageCompression from 'browser-image-compression';

const MAX_SIZE_MB = 4.5; // 压缩到4.5MB以下，留出余量

/**
 * 压缩单个图片文件
 */
export async function compressImage(file: File): Promise<File> {
  // 只处理图片文件
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // 如果文件小于5MB，直接返回
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB <= 5) {
    return file;
  }

  console.log(`🔄 开始压缩图片: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);

  try {
    const options = {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      fileType: file.type as any,
    };

    const compressedFile = await imageCompression(file, options);
    const compressedSizeMB = compressedFile.size / 1024 / 1024;

    console.log(`✅ 压缩完成: ${fileSizeMB.toFixed(2)}MB -> ${compressedSizeMB.toFixed(2)}MB`);

    return compressedFile;
  } catch (error) {
    console.error('❌ 图片压缩失败:', error);
    // 如果压缩失败，返回原文件
    return file;
  }
}
