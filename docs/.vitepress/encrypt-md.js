// encrypt-md.js (增强版 v2)
const fs = require("fs");
const path = require("path");
const CryptoJS = require("crypto-js");
const matter = require("gray-matter");

const targetDir = path.resolve(__dirname, "../");
const LINE_THRESHOLD = 150;

function encryptText(text, password) {
  return CryptoJS.AES.encrypt(text, password).toString();
}

function processMarkdownFile(filePath) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(rawContent);

  if (!data.encrypted || !data.password) {
    // console.log(`⏭ 跳过未设置 encrypted: true + password 的文件: ${filePath}`);
    return;
  }

  const lines = content.split("\n");
  if (lines.length <= LINE_THRESHOLD) return;

  const publicPart = lines.slice(0, LINE_THRESHOLD).join("\n");
  const secretPart = lines.slice(LINE_THRESHOLD).join("\n");
  const encrypted = encryptText(secretPart, data.password);

  const encryptedComponent = `<EncryptedContent
  :encrypted="'${encrypted}'"
  password="'${data.password}'"
  :renderMarkdown="true"
/>`;

  const finalContent = matter.stringify(
    `${publicPart}\n\n${encryptedComponent}`,
    data
  );
  fs.writeFileSync(filePath, finalContent, "utf-8");
  console.log(`✅ 已处理加密: ${filePath}`);
}

function processAllMarkdown(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && file.endsWith(".md")) {
      processMarkdownFile(fullPath);
    } else if (stat.isDirectory()) {
      processAllMarkdown(fullPath);
    }
  }
}

processAllMarkdown(targetDir);
