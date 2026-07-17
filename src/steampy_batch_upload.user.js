// ==UserScript==
// @name         SteamPY 批量上架激活码助手 (正式版)
// @copyright    2026, Yuxiang ZHANG (https://github.com/jamespaulzhang)
// @license      MIT
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  自动化批量上架Steam激活码到SteamPY平台，精确元素定位，自动获取最低挂单价格并弹窗确认（显示参考价），支持失败重试、键盘快捷键，同一游戏多个KEY逗号分隔
// @author       Yuxiang ZHANG
// @icon         https://steampy.com/img/logo.63413a4f.png
// @match        https://steampy.com/pyUserInfo/sellerCDKey*
// @match        https://steampy.com/pyUserInfo/sellerCDKey/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        GM_notification
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @downloadURL https://update.greasyfork.org/scripts/540841/SteamPY%20%E6%89%B9%E9%87%8F%E4%B8%8A%E6%9E%B6%E6%BF%80%E6%B4%BB%E7%A0%81%E5%8A%A9%E6%89%8B%20%28%E6%AD%A3%E5%BC%8F%E7%89%88%29.user.js
// @updateURL https://update.greasyfork.org/scripts/540841/SteamPY%20%E6%89%B9%E9%87%8F%E4%B8%8A%E6%9E%B6%E6%BF%80%E6%B4%BB%E7%A0%81%E5%8A%A9%E6%89%8B%20%28%E6%AD%A3%E5%BC%8F%E7%89%88%29.meta.js
// ==/UserScript==

(function() {
    'use strict';

    class UnlistedGameError extends Error {
        constructor(message) {
            super(message);
            this.name = "UnlistedGameError";
        }
    }

    const config = {
        delayBetweenItems: 2000,
        batchSize: 5,
        maxWaitTime: 15000,
        retryTimes: 3,
        bundleKeywords: ['/bundle/', '/sub/']
    };

    let isProcessing = false;
    let isPaused = false;
    let shouldCancel = false;
    let cancelRequested = false;
    // 保存最近一次处理失败的项目，方便重试
    let lastFailedItems = [];

    function addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
        .bsp-batch-float {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            width: 380px;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            overflow: hidden;
            border: 1px solid #e4e7ed;
        }
        .bsp-batch-float .float-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            background: #f8f9fb;
            border-bottom: 1px solid #eef0f3;
            cursor: move;
            user-select: none;
        }
        .bsp-batch-float .float-header h4 {
            margin: 0;
            color: #17233d;
            font-size: 16px;
            font-weight: 600;
        }
        .bsp-batch-float .float-header .header-btns {
            display: flex;
            gap: 8px;
        }
        .bsp-batch-float .float-header .header-btn {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            line-height: 1;
            background: #f2f3f5;
            color: #606266;
            transition: all 0.2s;
        }
        .bsp-batch-float .float-header .header-btn:hover {
            background: #e4e7ed;
        }
        .bsp-batch-float .float-header .header-btn.close-btn:hover {
            background: #ff4d4d;
            color: #fff;
        }
        .bsp-batch-float .float-body {
            padding: 16px;
        }
        .bsp-batch-float .prompt-box {
            background: #fef6e7;
            border-left: 4px solid #f7b84e;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 16px;
        }
        .bsp-batch-float .prompt-box strong {
            color: #e6960f;
        }
        .bsp-batch-float .prompt-box ul {
            margin: 6px 0 0 0;
            padding-left: 18px;
            color: #6b6b6b;
            font-size: 12px;
            line-height: 1.6;
        }
        .bsp-batch-float .input-section textarea,
        .bsp-batch-float .input-section input {
            width: 100%;
            padding: 10px 12px;
            background: #f8f9fb;
            border: 1px solid #dcdfe6;
            border-radius: 6px;
            color: #333;
            font-size: 13px;
            transition: border-color 0.2s;
            box-sizing: border-box;
            resize: vertical;
            margin-bottom: 10px;
        }
        .bsp-batch-float .input-section textarea:focus,
        .bsp-batch-float .input-section input:focus {
            border-color: #2d8cf0;
            outline: none;
            box-shadow: 0 0 0 2px rgba(45,140,240,0.1);
        }
        .bsp-batch-float .btn-row {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
        }
        .bsp-batch-float .bsp-btn {
            flex: 1;
            padding: 9px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 13px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .bsp-batch-float .bsp-btn-primary { background: #2d8cf0; color: #fff; }
        .bsp-batch-float .bsp-btn-primary:hover { background: #2b85e4; }
        .bsp-batch-float .bsp-btn-danger { background: #ff4d4d; color: #fff; }
        .bsp-batch-float .bsp-btn-danger:hover { background: #e63e3e; }
        .bsp-batch-float .bsp-btn-success { background: #19be6b; color: #fff; }
        .bsp-batch-float .bsp-btn-success:hover { background: #18a963; }
        .bsp-batch-float .bsp-btn-warning { background: #ff9900; color: #fff; }
        .bsp-batch-float .bsp-btn-warning:hover { background: #e68a00; }
        .bsp-batch-float .bsp-btn-info { background: #2db7f5; color: #fff; }
        .bsp-batch-float .bsp-btn-info:hover { background: #28a4d7; }
        .bsp-batch-float .setting-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 13px;
            color: #515a6e;
        }
        .bsp-batch-float .setting-row label { white-space: nowrap; }
        .bsp-batch-float .setting-row input[type="number"] {
            width: 80px;
            padding: 6px 8px;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            background: #fff;
        }
        .bsp-batch-float .setting-row input[type="checkbox"] { margin-right: 6px; }
        .bsp-batch-float .control-row {
            display: flex;
            gap: 8px;
            margin-bottom: 14px;
        }
        .bsp-batch-float .status-box {
            background: #f8f9fb;
            border: 1px solid #eee;
            border-radius: 6px;
            padding: 10px;
            font-size: 13px;
            color: #515a6e;
            min-height: 40px;
            line-height: 1.6;
        }
        .bsp-mini-float {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 46px;
            height: 46px;
            background: #2d8cf0;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            transition: transform 0.2s;
        }
        .bsp-mini-float:hover { transform: scale(1.1); }
        .bsp-mini-float span { color: white; font-weight: bold; font-size: 18px; }

        /* SweetAlert2 层级提升 */
        .centered-swal-container {
            z-index: 100000 !important;
        }
        .centered-swal-backdrop {
            z-index: 100000 !important;
        }
        .centered-swal {
            z-index: 100000 !important;
        }
        .centered-swal .swal2-popup {
            width: 350px !important;
            max-width: 90vw !important;
            padding: 20px !important;
            font-size: 13px !important;
        }
        .centered-swal .swal2-title { font-size: 16px !important; margin: 0 0 12px 0 !important; }
        .centered-swal .swal2-html-container { margin: 0 !important; font-size: 14px !important; }
        .centered-swal .swal2-actions { margin-top: 16px !important; }
        .centered-swal .swal2-styled { padding: 8px 16px !important; font-size: 13px !important; }
        #swal-price-input {
            width: 140px;
            padding: 6px 8px;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            font-size: 14px;
        }
        #swal-price-input:focus {
            border-color: #2d8cf0;
            outline: none;
            box-shadow: 0 0 0 2px rgba(45,140,240,0.2);
        }
    `;
        document.head.appendChild(style);
    }

    async function init() {
        try {
            addCustomStyles();
            await waitForVueApp();
            createUI();
        } catch (err) {
            console.error('初始化失败:', err);
            showError('加载失败', `无法检测到SteamPY页面元素: ${err.message}`);
        }
    }

    function waitForVueApp() {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const addButton = findElementByText('button.wh150-rem.ht50-rem.button-detail-bg', '添加CDKey');
                if (addButton) {
                    clearInterval(interval);
                    resolve();
                } else if (Date.now() - startTime > config.maxWaitTime) {
                    clearInterval(interval);
                    reject(new Error('等待Vue应用加载超时'));
                }
            }, 300);
        });
    }

    function createUI() {
        if (document.getElementById('steampyBatchHelperUI')) return;
        const container = document.createElement('div');
        container.id = 'steampyBatchHelperUI';
        container.className = 'bsp-batch-float';

        const header = document.createElement('div');
        header.className = 'float-header';
        header.id = 'helperHeader';
        const title = document.createElement('h4');
        title.textContent = '批量上架助手';
        header.appendChild(title);
        const btnGroup = document.createElement('div');
        btnGroup.className = 'header-btns';
        const minimizeBtn = document.createElement('div');
        minimizeBtn.className = 'header-btn';
        minimizeBtn.id = 'helperMinimizeBtn';
        minimizeBtn.textContent = '−';
        const closeBtn = document.createElement('div');
        closeBtn.className = 'header-btn close-btn';
        closeBtn.id = 'helperCloseBtn';
        closeBtn.textContent = '×';
        btnGroup.appendChild(minimizeBtn);
        btnGroup.appendChild(closeBtn);
        header.appendChild(btnGroup);
        container.appendChild(header);

        const content = document.createElement('div');
        content.className = 'float-body';
        content.id = 'helperContent';

        const warning = document.createElement('div');
        warning.className = 'prompt-box';
        warning.innerHTML = `
            <strong>使用须知：</strong>
            <ul>
                <li>确保CDKey与游戏链接精确匹配</li>
                <li>本体和DLC必须分开上架</li>
                <li>合集包请使用 /bundle/ 链接</li>
                <li>高级版可向下兼容，反之不行</li>
                <li>同一游戏多个KEY用<strong>英文逗号</strong>分隔</li>
                <li>不输入价格会自动获取最低挂单价-0.01</li>
                <li>弹窗时按<strong>Enter</strong>确认，<strong>Esc</strong>跳过</li>
            </ul>
        `;
        content.appendChild(warning);

        const inputSection = document.createElement('div');
        inputSection.className = 'input-section';
        const textarea = document.createElement('textarea');
        textarea.id = 'batchDataInput';
        textarea.placeholder = "格式: Steam链接|激活码1,激活码2|价格(可选)\n例如:\nhttps://store.steampowered.com/app/730/CSGO/|ABCDE-FGHIJ-KLMNO,ABCDE-12345-67890|50\n不输入价格会自动获取最低挂单价减0.01";
        textarea.rows = 5;
        inputSection.appendChild(textarea);
        content.appendChild(inputSection);

        const pasteClearRow = document.createElement('div');
        pasteClearRow.className = 'btn-row';
        const pasteBtn = document.createElement('button');
        pasteBtn.className = 'bsp-btn bsp-btn-info';
        pasteBtn.id = 'pasteBtn';
        pasteBtn.textContent = '从剪贴板粘贴';
        const clearBtn = document.createElement('button');
        clearBtn.className = 'bsp-btn bsp-btn-danger';
        clearBtn.id = 'clearBtn';
        clearBtn.textContent = '清空';
        pasteClearRow.appendChild(pasteBtn);
        pasteClearRow.appendChild(clearBtn);
        content.appendChild(pasteClearRow);

        const globalRow = document.createElement('div');
        globalRow.className = 'setting-row';
        const globalCheckbox = document.createElement('input');
        globalCheckbox.type = 'checkbox';
        globalCheckbox.id = 'globalRegionCheckbox';
        const globalLabel = document.createElement('label');
        globalLabel.textContent = '在全球区同步进行上架';
        globalRow.appendChild(globalCheckbox);
        globalRow.appendChild(globalLabel);
        content.appendChild(globalRow);

        const delayRow = document.createElement('div');
        delayRow.className = 'setting-row';
        const delayLabel = document.createElement('label');
        delayLabel.textContent = '操作延迟(ms)';
        const delayInput = document.createElement('input');
        delayInput.type = 'number';
        delayInput.id = 'delayBetweenItems';
        delayInput.value = config.delayBetweenItems;
        delayRow.appendChild(delayLabel);
        delayRow.appendChild(delayInput);
        content.appendChild(delayRow);

        const batchRow = document.createElement('div');
        batchRow.className = 'setting-row';
        const batchLabel = document.createElement('label');
        batchLabel.textContent = '每批数量';
        const batchInput = document.createElement('input');
        batchInput.type = 'number';
        batchInput.id = 'batchSize';
        batchInput.value = config.batchSize;
        batchRow.appendChild(batchLabel);
        batchRow.appendChild(batchInput);
        content.appendChild(batchRow);

        const startBtn = document.createElement('button');
        startBtn.className = 'bsp-btn bsp-btn-success';
        startBtn.id = 'startBtn';
        startBtn.textContent = '开始批量上架';
        startBtn.style.width = '100%';
        startBtn.style.marginBottom = '8px';
        content.appendChild(startBtn);

        // 失败重试按钮
        const retryBtn = document.createElement('button');
        retryBtn.className = 'bsp-btn bsp-btn-warning';
        retryBtn.id = 'retryBtn';
        retryBtn.textContent = '重试上一次失败项';
        retryBtn.style.width = '100%';
        retryBtn.style.marginBottom = '12px';
        retryBtn.style.display = 'none';
        content.appendChild(retryBtn);

        const controlRow = document.createElement('div');
        controlRow.className = 'control-row';
        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'bsp-btn bsp-btn-warning';
        pauseBtn.id = 'pauseBtn';
        pauseBtn.textContent = '暂停';
        pauseBtn.style.display = 'none';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'bsp-btn bsp-btn-danger';
        cancelBtn.id = 'cancelBtn';
        cancelBtn.textContent = '取消';
        cancelBtn.style.display = 'none';
        controlRow.appendChild(pauseBtn);
        controlRow.appendChild(cancelBtn);
        content.appendChild(controlRow);

        const statusBox = document.createElement('div');
        statusBox.className = 'status-box';
        statusBox.id = 'batchStatus';
        statusBox.textContent = '等待操作...';
        content.appendChild(statusBox);

        container.appendChild(content);
        document.body.appendChild(container);

        const minimizedUI = document.createElement('div');
        minimizedUI.className = 'bsp-mini-float';
        minimizedUI.id = 'minimizedHelperUI';
        const miniText = document.createElement('span');
        miniText.textContent = 'S';
        minimizedUI.appendChild(miniText);
        document.body.appendChild(minimizedUI);

        addDragFunctionality(container, header);
        setupMinimizeFunctionality(container, minimizedUI);

        pasteBtn.addEventListener('click', pasteFromClipboard);
        clearBtn.addEventListener('click', () => { textarea.value = ''; });
        startBtn.addEventListener('click', startBatchProcess);
        retryBtn.addEventListener('click', retryFailedItems);
        pauseBtn.addEventListener('click', togglePause);
        cancelBtn.addEventListener('click', cancelBatchProcess);
        closeBtn.addEventListener('click', () => {
            container.style.display = 'none';
            minimizedUI.style.display = 'none';
        });
    }

    function addDragFunctionality(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function setupMinimizeFunctionality(mainUI, minimizedUI) {
        const minimizeBtn = document.getElementById('helperMinimizeBtn');
        minimizeBtn.addEventListener('click', () => {
            mainUI.style.display = 'none';
            minimizedUI.style.display = 'flex';
            minimizedUI.style.top = mainUI.style.top || '20px';
            minimizedUI.style.left = mainUI.style.left || '20px';
        });
        minimizedUI.addEventListener('click', () => {
            minimizedUI.style.display = 'none';
            mainUI.style.display = 'block';
            mainUI.style.top = minimizedUI.style.top;
            mainUI.style.left = minimizedUI.style.left;
        });
        addDragFunctionality(minimizedUI, minimizedUI);
    }

    async function closeModal(modal) {
        try {
            const closeButton = modal.querySelector('.ivu-modal-close');
            if (closeButton) {
                closeButton.style.outline = '3px solid red';
                await safeClick(closeButton);
                await waitForElementDisappear('div.ivu-modal-wrap:not(.ivu-modal-hidden)', 3000);
                return true;
            }
        } catch (err) {
            console.error('关闭模态窗口失败:', err);
        }
        return false;
    }

    async function processItem(item, isGlobal, attempt = 1) {
        let visibleModal = null;
        try {
            console.group(`处理物品 [尝试 ${attempt}]:`, item);
            if (cancelRequested) throw new Error('用户取消处理');

            const addButton = await waitForElement('button.wh150-rem.ht50-rem.button-detail-bg', '添加CDKey');
            await safeClick(addButton);
            visibleModal = await waitForModalReady();

            const input = await waitForElementWithin(visibleModal, 'input.addCdkIpt');
            await safeType(input, item.url);
            const searchBtn = await waitForElementWithin(visibleModal, 'button.addCDKBtn:not([disabled])');
            await safeClick(searchBtn);

            await processSearchResults(visibleModal, item);
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { finalPrice } = await fillForm(visibleModal, item, isGlobal);
            const confirmedPrice = await awaitUserPriceConfirmation(item, finalPrice);
            if (confirmedPrice === null) throw new Error('用户跳过价格确认');

            if (confirmedPrice !== finalPrice) {
                const priceInput = await waitForElementWithin(visibleModal, 'input.ivu-input[type="number"]');
                priceInput.value = confirmedPrice.toString();
                priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                priceInput.dispatchEvent(new Event('change', { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            await submitForm(visibleModal);
            console.groupEnd();
            return { success: true };
        } catch (err) {
            console.groupEnd();
            console.error(`处理失败: ${err.message}`);
            if (visibleModal) await closeModal(visibleModal);
            if (err instanceof UnlistedGameError || err.message.includes('未收录该游戏')) throw new UnlistedGameError('游戏未收录');
            if (err.message.includes('用户跳过价格确认')) throw err;
            if (attempt >= config.retryTimes) throw new Error(`处理失败: ${err.message}`);
            await new Promise(resolve => setTimeout(resolve, config.delayBetweenItems));
            return processItem(item, isGlobal, attempt + 1);
        }
    }

    async function processSearchResults(visibleModal, item) {
        const gameCard = await waitForElementWithin(visibleModal, 'div.flex-row.mt-5.c-point', null, 20000);
        if (!gameCard) throw new Error('无法找到游戏卡片');

        const errorMsg = await checkForUnlistedGameError(visibleModal);
        if (errorMsg) throw new UnlistedGameError('游戏未收录');

        gameCard.style.outline = '3px solid blue';
        await simulateClick(gameCard);
        await waitForElement('button.ivu-btn-error.ivu-btn-long', null, 15000);

        const gameNameElement = gameCard.querySelector('.game-name, .game-title');
        if (gameNameElement) {
            const actualName = gameNameElement.textContent.trim();
            const expectedName = item.name;
            const isUpgrade = actualName.toLowerCase().includes(expectedName.toLowerCase());
            const isDowngrade = expectedName.toLowerCase().includes(actualName.toLowerCase());
            if (!isUpgrade && !isDowngrade) throw new Error(`游戏名称不匹配！预期: ${expectedName}, 实际: ${actualName}`);
            if (isDowngrade && !isUpgrade) throw new Error(`禁止将基础版作为高级版上架`);
        }
        if (item.isDLC && !/dlc|下载内容|附加内容/i.test(gameCard.textContent)) throw new Error('DLC链接未匹配到DLC');
        if (item.isBundle && !/bundle|pack|合集|捆绑包/i.test(gameCard.textContent)) throw new Error('合集链接未匹配到合集包');
    }

    function checkForUnlistedGameError(modal) {
        return new Promise((resolve) => {
            const check = () => {
                const allErrors = [
                    ...modal.querySelectorAll('.ivu-message-notice-content-error span, .ivu-message-error span'),
                    ...document.querySelectorAll('.ivu-message-notice-content-error span, .ivu-message-error span')
                ];
                for (const el of allErrors) {
                    if (el.textContent.includes('未收录该游戏')) {
                        resolve('游戏未收录');
                        return;
                    }
                }
                setTimeout(check, 100);
            };
            setTimeout(() => resolve(null), 2000);
            check();
        });
    }

    // 返回一个对象，包含获取到的各个价格，供弹窗参考
    function getPriceInfo() {
        const info = { recentDeal: null, lowestListing: null };
        try {
            const container = document.querySelector('span.color-red.f12-rem');
            if (!container) return info;
            const spans = container.querySelectorAll('span');
            for (const span of spans) {
                if (span.textContent.includes('最近成交价格')) {
                    const m = span.textContent.match(/￥(\d+(?:\.\d+)?)/);
                    if (m) info.recentDeal = parseFloat(m[1]);
                } else if (span.textContent.includes('近期最低挂单价格')) {
                    const m = span.textContent.match(/￥(\d+(?:\.\d+)?)/);
                    if (m) info.lowestListing = parseFloat(m[1]);
                }
            }
        } catch (e) {}
        return info;
    }

    // 计算自动价格，与之前一致
    async function getAutoPrice() {
        try {
            const info = getPriceInfo();
            if (info.lowestListing !== null) {
                let price = info.lowestListing - 0.01;
                if (price < 0.1) price = 0.1;
                return Math.round(price * 100) / 100;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    async function fillForm(visibleModal, item, isGlobal) {
        try {
            const keyTextarea = await waitForElementWithin(visibleModal, 'textarea.ivu-input');
            keyTextarea.value = (item.keys || []).join('\n');
            keyTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            keyTextarea.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 100));

            let finalPrice = item.price;
            if (item.autoPrice) {
                finalPrice = await getAutoPrice();
            }
            const priceInput = await waitForElementWithin(visibleModal, 'input.ivu-input[type="number"]');
            if (finalPrice !== null) {
                priceInput.value = finalPrice.toString();
                priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                priceInput.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                priceInput.value = '';
            }
            await new Promise(resolve => setTimeout(resolve, 100));

            if (isGlobal) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 800));
                    const globalText = await waitForElementWithin(visibleModal, 'span', '在全球区同步进行上架', 5000);
                    if (globalText) {
                        const section = globalText.closest('div.mt-15.f15');
                        if (section) {
                            const checkbox = section.querySelector('input[type="checkbox"]');
                            if (checkbox && !checkbox.checked) {
                                await safeClick(checkbox);
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                    }
                } catch (e) {}
            }
            return { finalPrice };
        } catch (err) {
            console.error('填写表单失败:', err);
            throw err;
        }
    }

    // 增强版确认弹窗，显示价格参考，并支持键盘快捷键
    async function awaitUserPriceConfirmation(item, currentPrice) {
        const gameName = item.name || '未知游戏';
        const keyCount = item.keys.length;
        const priceInfo = getPriceInfo();
        const recentDeal = priceInfo.recentDeal !== null ? `¥${priceInfo.recentDeal}` : '暂无';
        const lowestListing = priceInfo.lowestListing !== null ? `¥${priceInfo.lowestListing}` : '暂无';
        const inputValue = currentPrice !== null ? currentPrice : '';
        const placeholder = currentPrice === null ? '请手动输入价格' : '';

        const result = await Swal.fire({
            title: '请确认上架价格',
            html: `
                <div style="font-size:14px; text-align:left; line-height:1.8;">
                    <p><b>游戏：</b>${gameName} （${keyCount}个key）</p>
                    <p><b>参考价：</b><span style="color:#808695;font-size:12px;">成交：${recentDeal} / 挂单：${lowestListing}</span></p>
                    <p><b>当前价格：</b>
                        <input id="swal-price-input" type="number" value="${inputValue}" step="0.01" min="0.1"
                               placeholder="${placeholder}"
                               style="width:140px; padding:6px 8px; border:1px solid #dcdfe6; border-radius:4px; font-size:14px;">
                    </p>
                    <p style="color:#999; font-size:12px;">可修改价格，或 Enter 确认 / Esc 跳过</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '确认提交',
            cancelButtonText: '跳过',
            reverseButtons: true,
            target: document.body,
            preConfirm: () => {
                const priceInput = document.getElementById('swal-price-input');
                if (!priceInput) return false;
                const val = parseFloat(priceInput.value);
                if (isNaN(val) || val < 0.1) {
                    Swal.showValidationMessage('请输入有效价格（最低 0.1 元）');
                    return false;
                }
                return Math.round(val * 100) / 100;
            },
            didOpen: () => {
                const container = Swal.getContainer();
                if (container) container.style.zIndex = '100000';
                const popup = Swal.getPopup();
                const backdrop = Swal.getBackdrop();
                if (popup) popup.style.zIndex = '100000';
                if (backdrop) backdrop.style.zIndex = '100000';

                // 自动聚焦输入框，便于编辑
                const input = document.getElementById('swal-price-input');
                if (input) {
                    input.focus();
                    input.select();
                }

                // 键盘监听：Enter 确认，Esc 取消
                const keyHandler = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        Swal.clickConfirm();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        Swal.clickCancel();
                    }
                };
                window.addEventListener('keydown', keyHandler, { once: false });
                // 关闭时移除监听
                const cleanup = () => {
                    window.removeEventListener('keydown', keyHandler);
                };
                Swal.getPopup().addEventListener('remove', cleanup, { once: true });
            },
            customClass: {
                container: 'centered-swal-container',
                popup: 'centered-swal',
                backdrop: 'centered-swal-backdrop'
            }
        });

        return result.isConfirmed ? result.value : null;
    }

    function findElementByText(selector, text, parent = document) {
        for (const el of parent.querySelectorAll(selector)) {
            if (el.textContent.includes(text)) return el;
        }
        return null;
    }

    async function submitForm(visibleModal) {
        try {
            const submitBtn = await waitForElementWithin(visibleModal, 'button.ivu-btn-error.ivu-btn-long');
            const modalCount = document.querySelectorAll('div.ivu-modal-wrap:not(.ivu-modal-hidden)').length;
            await safeClick(submitBtn);

            let confirmModal;
            try {
                confirmModal = await waitForNewModal(modalCount, 10000);
            } catch {
                confirmModal = await waitForVisibleElementWithText('div.ivu-modal-wrap:not(.ivu-modal-hidden)', '注意！！', 5000);
            }
            const confirmButton = await waitForElementWithin(confirmModal, 'button.ivu-btn-info.ivu-btn-long.ivu-btn-large', '确认出售');
            await safeClick(confirmButton);
            await waitForElementDisappear('div.ivu-modal-wrap:not(.ivu-modal-hidden)', 10000);
        } catch (err) {
            console.error('提交失败:', err);
            throw err;
        }
    }

    async function simulateClick(selectorOrElement) {
        const element = typeof selectorOrElement === 'string' ? await waitForElement(selectorOrElement) : selectorOrElement;
        element.scrollIntoViewIfNeeded();
        await new Promise(r => setTimeout(r, 300));
        const rect = element.getBoundingClientRect();
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 }));
    }

    async function safeType(inputElement, value) {
        if (!(inputElement instanceof HTMLInputElement) && !(inputElement instanceof HTMLTextAreaElement)) throw new Error('无效输入元素');
        inputElement.value = '';
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 300));
        for (const char of value) {
            inputElement.value += char;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 10));
        }
        inputElement.dispatchEvent(new Event('blur', { bubbles: true }));
        await new Promise(r => setTimeout(r, 500));
    }

    function waitForElementWithin(parent, selector, text = null, timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (!(parent instanceof Element)) return reject(new Error('parent必须是DOM元素'));
            const start = Date.now();
            const check = () => {
                const elements = parent.querySelectorAll(selector);
                let found = null;
                for (const el of elements) {
                    if (el.offsetWidth > 0 && (!text || el.textContent.includes(text))) { found = el; break; }
                }
                if (found) resolve(found);
                else if (Date.now() - start >= timeout) reject(new Error(`查找超时: ${selector}`));
                else setTimeout(check, 100);
            };
            check();
        });
    }

    async function safeClick(element) {
        element.scrollIntoViewIfNeeded();
        await new Promise(r => setTimeout(r, 500));
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 1000));
    }

    async function waitForModalReady() {
        const modal = await waitForVisibleElement('div.ivu-modal-wrap:not(.ivu-modal-hidden)', 10000);
        modal.style.outline = '3px solid green';
        return modal;
    }

    function waitForVisibleElement(selector, timeout = 20000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    if (el.offsetWidth > 0 && !el.classList.contains('ivu-modal-hidden')) return resolve(el);
                }
                if (Date.now() - start >= timeout) reject(new Error(`等待可见元素超时: ${selector}`));
                else setTimeout(check, 100);
            };
            check();
        });
    }

    function waitForElement(selector, text = null, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                let element = text ? findElementByText(selector, text) : document.querySelector(selector);
                if (element) resolve(element);
                else if (Date.now() - start >= timeout) reject(new Error(`等待元素超时: ${selector}`));
                else setTimeout(check, 100);
            };
            check();
        });
    }

    function waitForElementDisappear(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (!el || window.getComputedStyle(el).display === 'none') resolve();
                else if (Date.now() - start >= timeout) reject(new Error(`等待消失超时: ${selector}`));
                else setTimeout(check, 100);
            };
            check();
        });
    }

    function waitForNewModal(baseCount, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const modals = document.querySelectorAll('div.ivu-modal-wrap:not(.ivu-modal-hidden)');
                if (modals.length > baseCount) resolve(modals[modals.length - 1]);
                else if (Date.now() - start >= timeout) reject(new Error('等待新模态窗口超时'));
                else setTimeout(check, 100);
            };
            check();
        });
    }

    function waitForVisibleElementWithText(selector, text, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                for (const el of document.querySelectorAll(selector)) {
                    if (el.offsetWidth > 0 && el.textContent.includes(text)) return resolve(el);
                }
                if (Date.now() - start >= timeout) reject(new Error('等待可见元素超时'));
                else setTimeout(check, 100);
            };
            check();
        });
    }

    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('batchDataInput').value = text;
            showSuccess('已从剪贴板粘贴数据');
        } catch (err) {
            showError('无法访问剪贴板', '请手动粘贴数据');
        }
    }

    async function startBatchProcess() {
        const ui = {
            input: document.getElementById('batchDataInput'),
            delay: document.getElementById('delayBetweenItems'),
            batchSize: document.getElementById('batchSize'),
            globalCheck: document.getElementById('globalRegionCheckbox'),
            status: document.getElementById('batchStatus'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            retryBtn: document.getElementById('retryBtn')
        };
        if (isProcessing) return;

        const items = parseInputData(ui.input.value.trim());
        if (!items.length) return showError('输入错误', '没有有效的上架数据');

        const conf = await Swal.fire({
            title: '确认批量上架?',
            html: `<div>将上架 <b>${items.length}</b> 个游戏<br>每批处理: <b>${ui.batchSize.value}</b> 个<br><span style="color:#e6960f;">每个游戏需确认价格（Enter确认 / Esc跳过）</span></div>`,
            icon: 'question',
            showCancelButton: true,
            customClass: {
                popup: 'centered-swal',
                backdrop: 'centered-swal-backdrop',
                container: 'centered-swal-container'
            }
        });
        if (!conf.isConfirmed) return;

        isProcessing = true;
        isPaused = false;
        shouldCancel = false;
        cancelRequested = false;
        lastFailedItems = [];

        ui.startBtn.disabled = true;
        ui.startBtn.style.opacity = '0.5';
        ui.pauseBtn.style.display = 'inline-flex';
        ui.cancelBtn.style.display = 'inline-flex';
        ui.retryBtn.style.display = 'none';

        const settings = {
            isGlobal: ui.globalCheck.checked,
            delay: parseInt(ui.delay.value) || config.delayBetweenItems,
            batchSize: parseInt(ui.batchSize.value) || config.batchSize
        };
        runBatchProcessing(items, settings, ui);
    }

    // 重试上一次失败的项目
    function retryFailedItems() {
        if (isProcessing) return;
        if (!lastFailedItems || lastFailedItems.length === 0) {
            showError('无失败项', '没有可重试的失败项目');
            return;
        }
        const input = document.getElementById('batchDataInput');
        // 重新生成文本并填入
        const lines = lastFailedItems.map(item => {
            const priceStr = item.autoPrice ? '' : `|${item.price}`;
            return `${item.url}|${item.keys.join(',')}${priceStr}`;
        });
        input.value = lines.join('\n');
        showSuccess(`已填入 ${lines.length} 个失败项，可再次开始`);
    }

    function togglePause() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (isPaused) {
            isPaused = false;
            pauseBtn.textContent = '暂停';
            pauseBtn.className = 'bsp-btn bsp-btn-warning';
        } else {
            isPaused = true;
            pauseBtn.textContent = '继续';
            pauseBtn.className = 'bsp-btn bsp-btn-info';
        }
    }

    function cancelBatchProcess() {
        shouldCancel = true;
        cancelRequested = true;
        const cancelBtn = document.getElementById('cancelBtn');
        cancelBtn.textContent = '取消中...';
        cancelBtn.disabled = true;
    }

    function parseInputData(data) {
        return data.split('\n').map(line => line.trim()).filter(line => line).map(line => {
            const parts = line.split('|').map(p => p.trim());
            const url = parts[0] || '';
            const rawKeys = parts[1] || '';
            let price = 0, autoPrice = true;
            if (parts.length >= 3 && parts[2]) {
                price = parseFloat(parts[2]);
                autoPrice = false;
            }
            const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k);
            return {
                url,
                keys,
                price,
                autoPrice,
                isBundle: config.bundleKeywords.some(kw => url.includes(kw)),
                isDLC: url.includes('/dlc/'),
                appId: extractAppIdFromUrl(url),
                name: extractNameFromUrl(url)
            };
        }).filter(item => item.url && item.keys.length > 0);
    }

    function extractAppIdFromUrl(url) {
        const match = url.match(/app\/(\d+)/);
        return match ? match[1] : null;
    }
    function extractNameFromUrl(url) {
        const match = url.match(/app\/\d+\/([^\/]+)/);
        return match ? decodeURIComponent(match[1].replace(/_/g, ' ')) : 'Unknown';
    }

    async function runBatchProcessing(items, settings, ui) {
        let processed = 0, successful = 0, failed = 0;
        const failedItems = [];
        try {
            for (let i = 0; i < items.length; i += settings.batchSize) {
                if (shouldCancel) break;
                const batch = items.slice(i, i + settings.batchSize);
                for (const item of batch) {
                    if (shouldCancel) break;
                    while (isPaused && !shouldCancel) await new Promise(r => setTimeout(r, 500));
                    if (shouldCancel) break;
                    ui.status.innerHTML = `处理中: ${++processed}/${items.length} ${item.name}<br>成功: ${successful}, 失败: ${failed}`;
                    try {
                        await processItem(item, settings.isGlobal);
                        successful++;
                    } catch (err) {
                        failed++;
                        failedItems.push(item);
                        const reason = err instanceof UnlistedGameError ? '未收录' : err.message.includes('跳过价格') ? '取消价格' : '异常';
                        ui.status.innerHTML += `<br><span style="color:#ed4014">失败 [${reason}]: ${item.name}</span>`;
                    }
                    if (processed < items.length && !shouldCancel) await new Promise(r => setTimeout(r, settings.delay));
                }
                if (i + settings.batchSize < items.length && !shouldCancel) {
                    ui.status.innerHTML += `<br>已完成一批，暂停5秒...`;
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
        } finally {
            isProcessing = false;
            shouldCancel = false;
            cancelRequested = false;
            lastFailedItems = failedItems; // 保存失败项
            ui.startBtn.disabled = false;
            ui.startBtn.style.opacity = '1';
            ui.pauseBtn.style.display = 'none';
            ui.cancelBtn.style.display = 'none';
            ui.pauseBtn.textContent = '暂停';
            ui.pauseBtn.className = 'bsp-btn bsp-btn-warning';
            ui.cancelBtn.disabled = false;

            // 显示重试按钮（如果有失败项）
            if (failedItems.length > 0) {
                ui.retryBtn.style.display = 'block';
                ui.retryBtn.textContent = `重试失败项 (${failedItems.length})`;
            } else {
                ui.retryBtn.style.display = 'none';
            }

            ui.status.innerHTML += `<br><b>处理完成! 成功: ${successful}, 失败: ${failed}</b>`;
            showCompletion(successful, failed, failedItems);
        }
    }

    function showCompletion(success, failed, failedItems) {
        let html = `<div>批量上架完成!<br>成功: <b>${success}</b>, 失败: <b>${failed}</b></div>`;
        if (failed) {
            html += `<div style="max-height:120px;overflow-y:auto;margin-top:10px;"><b>失败项:</b><br>`;
            html += failedItems.slice(0,5).map(i => `• ${i.name} (${i.url.substring(0,30)}...)`).join('<br>');
            if (failedItems.length > 5) html += `<br>...及其他 ${failedItems.length-5} 项</div>`;
        }
        Swal.fire({
            title: '完成',
            html,
            icon: failed ? 'warning' : 'success',
            customClass: {
                popup: 'centered-swal',
                backdrop: 'centered-swal-backdrop',
                container: 'centered-swal-container'
            }
        });
    }

    function showSuccess(text) {
        Swal.fire({
            text,
            icon: 'success',
            timer: 1500,
            customClass: {
                popup: 'centered-swal',
                backdrop: 'centered-swal-backdrop',
                container: 'centered-swal-container'
            }
        });
    }
    function showError(title, text) {
        Swal.fire({
            title,
            text,
            icon: 'error',
            customClass: {
                popup: 'centered-swal',
                backdrop: 'centered-swal-backdrop',
                container: 'centered-swal-container'
            }
        });
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();