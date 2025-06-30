```markdown
# SteamPY 批量上架激活码助手 (正式版) 🚀

> 自动化批量上架 Steam 激活码到 SteamPY 平台的 Tampermonkey 脚本，支持精确元素定位和错误恢复

[![GitHub license](https://img.shields.io/github/license/jamespaulzhang/SteamKeyBulkManager)](https://github.com/jamespaulzhang/SteamKeyBulkManager/LICENSE)
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-v4.19+-blue.svg)

## ✨ 核心功能

### 🧩 增强型批量处理
- **智能批量上架**：自动处理多游戏激活码上架流程
- **错误恢复机制**：三级重试机制（`retryTimes: 3`）
- **全球区同步**：支持一键全球同步上架（通过复选框控制）
- **视觉定位系统**：自动标记操作元素（蓝/绿/黄/红框）

### ⚙️ 精准操作控制
```javascript
// 配置参数
delayBetweenItems: 2000,  // 操作间隔(ms)
batchSize: 5,             // 每批处理量
maxWaitTime: 15000,       // 最大等待时间
```
- 精确等待 Vue 应用加载（超时检测）
- 模态窗口层级识别技术
- 动态元素可见性检测（非隐藏/非透明/尺寸有效）

### 📋 数据管理
```text
每行格式: Steam链接|激活码|价格(可选)
示例:
https://store.steampowered.com/app/730/CSGO/|ABCDE-FGHIJ-KLMNO|50
```
- 剪贴板一键导入
- 自定义默认价格
- 失败项详细报告

## 🛠️ 安装使用

### 安装步骤
1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展（v4.19+）
2. [点击安装脚本](https://greasyfork.org/zh-CN/scripts/540841-steampy-%E6%89%B9%E9%87%8F%E4%B8%8A%E6%9E%B6%E6%BF%80%E6%B4%BB%E7%A0%81%E5%8A%A9%E6%89%8B-%E6%AD%A3%E5%BC%8F%E7%89%88)
3. 访问 [SteamPY CDKey 管理页面](https://steampy.com/pyUserInfo/sellerCDKey)

### 操作界面
![浮动控制面板](https://github.com/jamespaulzhang/SteamKeyBulkManager/blob/main/docs/screenshot.png)
- 可拖动/最小化悬浮窗
- 实时状态监控
- 批量进度显示（成功/失败计数）

## ⚙️ 技术亮点

### 智能元素定位
```javascript
// 多维度元素检测
function waitForVisibleElement(selector) {
  const style = window.getComputedStyle(el);
  return style.display !== 'none' 
    && style.visibility !== 'hidden'
    && el.offsetWidth > 0;
}
```

### 模态窗口处理
```javascript
// 模态窗口层级管理
function waitForNewModal(baseCount) {
  // 识别最新模态窗口
  const modals = document.querySelectorAll('div.ivu-modal-wrap');
  return modals[modals.length - 1];
}
```

### 操作安全保障
```javascript
// 安全点击机制
async function safeClick(element) {
  element.scrollIntoViewIfNeeded();
  await new Promise(resolve => setTimeout(resolve, 500));
  // 触发完整点击事件序列
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
```

## 📜 数据格式规范

### 输入格式
```text
Steam商店链接|激活码|价格(可选)
```
**示例：**
```
https://store.steampowered.com/app/292030/Witcher_3/|QWERT-ASDFG-ZXCVB|89.5
https://store.steampowered.com/app/578080/PUBG/|POIUY-MNBVC-LKJHG|
```

### 配置参数
| 参数 | 默认值 | 说明 |
|------|--------|------|
| `defaultPrice` | 10 | 未指定价格时的默认值 |
| `delayBetweenItems` | 2000ms | 物品间操作延迟 |
| `batchSize` | 5 | 每批处理数量 |
| `maxWaitTime` | 15000ms | 元素等待超时 |
| `retryTimes` | 3 | 失败重试次数 |

## ❓ 常见问题

**Q：为什么有时会提示「等待 Vue 应用加载超时」？**  
A：请确保：1）页面完全加载完成 2）处于正确的 CDKey 管理页面 3）网络连接正常

**Q：全球同步选项有什么作用？**  
A：启用后会在全球区同步上架激活码（需要用户自行确认激活码是否为全球key）

**Q：如何处理失败项？**  
A：脚本完成后会显示失败列表，建议：1）检查格式 2）手动重试 3）降低批量大小

**Q：是否支持区分标准版/豪华版/DLC？**  
A：目前的1.0版本暂时不支持，未来会考虑更新

> ⚠️ 注意：使用前请确保遵守 SteamPY 平台规则

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```text
MIT License

Copyright (c) 2025 Yuxiang ZHANG

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
```
