```markdown
# SteamPY 批量上架激活码助手 (正式版) 🚀

> 自动化批量上架 Steam 激活码到 SteamPY 平台的 Tampermonkey 脚本，支持精确元素定位、智能价格确认、失败重试与键盘快捷键

[![GitHub license](https://img.shields.io/github/license/jamespaulzhang/SteamKeyBulkManager)](https://github.com/jamespaulzhang/SteamKeyBulkManager/LICENSE)
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-v4.19+-blue.svg)

## ✨ 核心功能

### 🧩 增强型批量处理
- **智能批量上架**：自动完成链接搜索、游戏选择、填表、提交等全流程。
- **多 Key 支持**：同一游戏多个激活码用英文逗号分隔，脚本自动换行填入。
- **自动价格策略**：自动抓取“近期最低挂单价格”，默认减 0.01 作为售价（低于 0.1 时固定 0.1）。
- **价格确认弹窗**：自动价格填入后弹出确认窗口，显示**近期成交价**与**最低挂单价**作为参考，可手动修改价格后提交或跳过。
- **失败重试**：处理完毕自动保存失败项，点击“重试上一次失败项”一键重新填入，方便再次运行。
- **全球区同步**：支持勾选“在全球区同步进行上架”，自动点击对应复选框。
- **错误恢复**：三级重试机制（失败自动重试最多 3 次），并妥善处理“游戏未收录”等异常。

### ⚙️ 精准操作控制
```javascript
// 配置参数（可在界面调整）
delayBetweenItems: 2000,  // 操作间隔 (ms)
batchSize: 5,             // 每批处理数量
maxWaitTime: 15000,       // 最大等待时间
```
- 精确等待 Vue 应用加载（超时检测）
- 模态窗口层级识别技术，自动定位最新弹窗
- 动态元素可见性检测（非隐藏、非透明、尺寸有效）
- 视觉定位系统：自动标记操作元素（蓝/绿/黄/红框）

### ⌨️ 键盘快捷键
- 价格确认弹窗中按下 **Enter** 键 → 立即提交价格
- 按下 **Esc** 键 → 跳过当前项目

### 📋 数据管理
```text
每行格式: Steam链接|激活码1,激活码2,...|价格(可选)
示例:
https://store.steampowered.com/app/730/CSGO/|ABCDE-FGHIJ-KLMNO,ABCDE-12345-67890|50
https://store.steampowered.com/app/292030/Witcher_3/|POIUY-MNBVC-LKJHG|
```
- 剪贴板一键导入
- 未指定价格时自动获取最低挂单价减 0.01
- 失败项详细报告，支持一键回填

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
- 失败重试按钮

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
  const modals = document.querySelectorAll('div.ivu-modal-wrap');
  return modals[modals.length - 1];
}
```

### 价格获取与确认
```javascript
// 自动提取近期最低挂单价格
function getPriceInfo() {
  // 从 <span class="color-red f12-rem"> 中解析“近期最低挂单价格: ￥6.6”
  // 返回 { recentDeal, lowestListing }
}
// 确认弹窗中显示参考价并允许修改，支持 Enter/Esc
```

### 操作安全保障
```javascript
async function safeClick(element) {
  element.scrollIntoViewIfNeeded();
  // 触发完整事件序列：mousedown → mouseup → click
}
```

## 📜 数据格式规范

### 输入格式
```text
Steam商店链接|激活码1,激活码2,...|价格(可选)
```
**示例：**
```
https://store.steampowered.com/app/292030/Witcher_3/|QWERT-ASDFG-ZXCVB|89.5
https://store.steampowered.com/app/578080/PUBG/|POIUY-MNBVC-LKJHG,WERTH-YUIOP-MNBVC|
```
价格字段可以省略，脚本会自动获取当前平台最低挂单价并减 0.01 作为建议价格。

### 配置参数（悬浮窗可调）
| 参数 | 默认值 | 说明 |
|------|--------|------|
| `操作延迟(ms)` | 2000 | 每个物品处理后的等待时间 |
| `每批数量` | 5 | 每批处理的游戏数量 |
| `全球区同步` | 不勾选 | 是否在全球区同步上架（需自行确认 Key 为全球 Key） |

## ❓ 常见问题

**Q：为什么有时会提示「等待 Vue 应用加载超时」？**  
A：请确保：1）页面完全加载完成 2）处于正确的 CDKey 管理页面 3）网络连接正常

**Q：多个 Key 如何输入？**  
A：用英文逗号分隔，如 `KEY1,KEY2,KEY3`，脚本会自动换行填入文本区。

**Q：如何重试失败的项目？**  
A：处理完成后界面会显示“重试上一次失败项”按钮，点击即可将失败项重新填入输入框，直接再次运行。

**Q：键盘快捷键是什么？**  
A：价格确认弹窗中按 `Enter` 提交当前价格，按 `Esc` 跳过该项目。

**Q：是否支持区分标准版/豪华版/DLC？**  
A：脚本会检测 URL 中的 `/dlc/` 和 `/bundle/` 关键字，防止将 DLC 混搭到本体，但版本区分仍需用户自行核对。

> ⚠️ 注意：使用前请确保遵守 SteamPY 平台规则
```
