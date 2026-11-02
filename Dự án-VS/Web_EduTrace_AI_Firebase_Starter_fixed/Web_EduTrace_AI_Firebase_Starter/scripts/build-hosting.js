import { copyFile, lstat, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, '.hosting-public');
const rootFiles = ['index.html', 'admin.html', 'style.css', 'admin.css', 'admin-pagination.css', 'script.js'];
const expected = new Map([['', new Set([...rootFiles, 'js', 'images'])]]);
for (const [dir, extension] of [['js', '.js'], ['images', '.jpg']]) {
  const entries = await readdir(join(root, dir), { withFileTypes: true });
  if (entries.some(entry => !entry.isFile() || !entry.name.endsWith(extension))) throw new Error(`Không hỗ trợ tệp trong ${dir}.`);
  expected.set(dir, new Set(entries.map(entry => entry.name)));
}
await mkdir(output, { recursive: true });
if (!(await lstat(output)).isDirectory() || (await lstat(output)).isSymbolicLink()) throw new Error('Thư mục đầu ra không hợp lệ.');
for (const [dir, allowed] of expected) {
  const target = join(output, dir);
  await mkdir(target, { recursive: true });
  if ((await lstat(target)).isSymbolicLink()) throw new Error('Không chấp nhận thư mục liên kết.');
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (!allowed.has(entry.name) || entry.isSymbolicLink()) throw new Error(`Tệp ngoài danh sách cho phép: ${join(dir, entry.name)}`);
  }
}
for (const file of rootFiles) await copyFile(join(root, file), join(output, file));
for (const dir of ['js', 'images']) {
  for (const name of expected.get(dir)) await copyFile(join(root, dir, name), join(output, dir, name));
}
console.log('Đã tạo bản hosting chỉ chứa tài nguyên website.');
