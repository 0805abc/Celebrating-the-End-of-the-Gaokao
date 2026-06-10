# Celebrating the End of the Gaokao · 高考结束了

> 一个纯前端的沉浸式情绪仪式网页：十个环节，陪刚走出考场的你，把这三年的重量慢慢放下。

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)

**Author:** 黑龙 · [GitHub](https://github.com/0805abc/Celebrating-the-End-of-the-Gaokao)

---

## 简介

这不是查分工具，也不是励志鸡汤生成器。

它是一段**可以亲手走完的叙事体验**：推门、落笔、卸甲、回望、致谢、放飞……从封面到日出，约 10 个仪式，配合打字机文案、音效与轻交互，像有人坐在你旁边，不说教，只陪着。

- 纯 **HTML / CSS / JavaScript**，无框架、无后端、无数据库  
- 昵称等信息**仅在本页内存中使用**，不上传、不写入 `localStorage`  
- 文案大量**程序化随机组合**，每次打开略有不同  
- 内置**微信 / QQ 内置浏览器引导页**，建议复制链接到系统浏览器打开  

---

## 快速开始

### 本地预览

将整个目录放到任意静态服务器根目录，或用本地工具启动：

```bash
npx serve .
```

浏览器访问提示的地址（如 `http://localhost:3000`）。

> 若直接双击 `index.html` 用 `file://` 打开，部分音效与作者信息校验可能受限，**推荐通过 HTTP 访问**。

### 部署

上传目录内**全部文件**到任意静态托管（GitHub Pages、Cloudflare Pages、Nginx、对象存储等均可）。

**务必包含以下 10 个文件：**

| 文件 | 说明 |
|------|------|
| `index.html` | 页面结构 |
| `styles.css` | 样式与动画 |
| `script.js` | 仪式流程与交互 |
| `content-generators.js` | 组合式文案生成 |
| `content-pools.js` | 随机内容池 API |
| `audio-engine.js` | Web Audio 场景音效 |
| `intro-privacy.js` | 开场隐私说明（**可自由修改**） |
| `intro-protected.js` | 作者信息保护载荷 |
| `intro-guard.js` | 作者信息解码与校验 |
| `inapp-block.js` | 微信 / QQ 内置浏览器拦截 |

缺少任一文件可能导致开场弹窗、音效或拦截页异常。

---

## 十个仪式

| 序号 | 名称 | 概要 |
|------|------|------|
| 0 | 封面 | 输入昵称，进入旅程 |
| 1 | 推门 | 按住推开考场门 |
| 2 | 落笔 | 陪了三年的那支笔 |
| 3 | 卸甲 | 放下背上的重量 |
| 4 | 允许哭 | 雨声与眼泪 |
| 5 | 回望 | 手动翻阅记忆卡片 |
| 6 | 写信 | 给刚走出考场的自己 |
| 7 | 致谢 | 向重要的人道谢 |
| 8 | 释放 | 按住，把话说出来 |
| 9 | 放飞 | 万千愿望气球升起 |
| 10 | 新生 | 日出与「再走一遍」 |

---

## 自定义

### 修改隐私说明（推荐给二次开发者）

编辑 **`intro-privacy.js`** 中的 `paragraphs` 即可，无需改动作者信息保护模块。

### 修改仪式文案池

- 叙事与组合逻辑：`content-generators.js`  
- 随机抽取接口：`content-pools.js`  

### 作者信息

作者、GitHub、MIT 全文等由 `intro-protected.js` + `intro-guard.js` 保护加载。  
若需更新作者信息，请重新生成保护载荷，勿直接改 HTML 中的对应区块。

---

## 微信 / QQ 打开说明

在 **微信** 或 **QQ 内置浏览器** 中打开时，会显示引导页：

> 微信 / QQ 暂不支持显示，请复制链接到浏览器中打开。

这是为了避免内置 WebView 对页面、音效或外链的兼容性问题。请使用 Chrome、Safari、Edge 等系统浏览器访问。

---

## 技术栈

- 原生 HTML5 / CSS3 / ES6+  
- Web Audio API（场景氛围与交互音效）  
- Canvas（环境粒子、雨、释放特效等）  
- 无第三方 CDN 字体或追踪脚本  

---

## 开源协议

本项目采用 **[MIT License](https://opensource.org/licenses/MIT)** 开源。

```
Copyright (c) 2026 black_dragon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

二次分发或修改时，请保留上述版权声明与许可全文。

---

## 作者

**黑龙** · [Celebrating-the-End-of-the-Gaokao](https://github.com/0805abc/Celebrating-the-End-of-the-Gaokao)

若这个项目在某一刻陪到了你，欢迎 Star 或分享给同样需要喘口气的人。

---

## 致谢

献给每一位刚走出考场、还没想好下一步的你。  
高考结束了——今晚，属于你。
