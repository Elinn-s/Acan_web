// 扫描 ../../data/gallery/<分类>/ 文件夹，自动生成 manifest.json
// 用法：node modules/gallery/gen-manifest.js
// 加完图片后跑一下这个脚本，再测试/部署即可，不用手动敲文件名
//
// 额外功能：手机（尤其 iPhone）传出来的照片经常是 HEIC 格式但后缀被改成
// .jpg/.jpeg，浏览器无法直接显示。这个脚本会先扫一遍文件的真实格式（看文件头，
// 不看后缀名），把伪装成 .jpg 的 HEIC 自动转换成真正的 JPEG 再生成 manifest。

const fs = require('fs');
const path = require('path');

let heicConvert;
try {
  heicConvert = require('heic-convert');
} catch {
  console.error('缺少依赖 heic-convert，请先在项目根目录运行: npm install');
  process.exit(1);
}

const IMAGES_DIR = path.join(__dirname, '..', '..', 'data', 'gallery');
const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const CHECKABLE_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif']);
const HEIC_BRANDS = new Set([
  'heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1',
]);

function isJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

// HEIC/HEIF 文件是 ISO 基础媒体容器格式，头部结构是 [size(4)] "ftyp" [brand(4)] ...
function detectContainerBrand(buf) {
  if (buf.length < 12 || buf.toString('ascii', 4, 8) !== 'ftyp') return null;
  return buf.toString('ascii', 8, 12).trim().toLowerCase();
}

// 扫描一个分类文件夹，把伪装成图片后缀的 HEIC 原地转换成真正的 JPEG
async function convertDisguisedHeicFiles(folderPath) {
  const converted = [];
  for (const name of fs.readdirSync(folderPath)) {
    const filePath = path.join(folderPath, name);
    if (!fs.statSync(filePath).isFile()) continue;

    const ext = path.extname(name).toLowerCase();
    if (!CHECKABLE_EXT.has(ext)) continue;

    const buf = fs.readFileSync(filePath);
    if (isJpeg(buf)) continue;

    const brand = detectContainerBrand(buf);
    if (!brand || !HEIC_BRANDS.has(brand)) continue;

    const outputBuffer = await heicConvert({ buffer: buf, format: 'JPEG', quality: 0.92 });
    const newName = `${name.slice(0, -ext.length)}.jpg`;
    const newPath = path.join(folderPath, newName);

    fs.writeFileSync(newPath, outputBuffer);
    if (newPath !== filePath) fs.unlinkSync(filePath);

    converted.push(newPath === filePath ? name : `${name} -> ${newName}`);
  }
  return converted;
}

async function main() {
  const manifest = {};

  for (const entry of fs.readdirSync(IMAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folderPath = path.join(IMAGES_DIR, entry.name);

    const converted = await convertDisguisedHeicFiles(folderPath);
    if (converted.length) {
      console.log(`[${entry.name}] 检测到伪装成图片的 HEIC，已转换: ${converted.join(', ')}`);
    }

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));

    manifest[entry.name] = files;
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  const summary = Object.entries(manifest)
    .map(([folder, files]) => `${folder}: ${files.length}`)
    .join(', ');
  console.log(`manifest.json 已更新 -> ${summary}`);
}

main().catch((err) => {
  console.error('生成 manifest 失败:', err);
  process.exit(1);
});
