document.addEventListener('DOMContentLoaded', () => {
    // === DOM 元素獲取 ===
    const lengthInput = document.getElementById('length');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const furnitureTypeSelect = document.getElementById('furnitureType');
    const deliveryAreaSelect = document.getElementById('deliveryArea');
    const calculateBtn = document.getElementById('calculateBtn');

    // 輸出結果元素
    const outputCBM = document.getElementById('outputCBM');
    const outputDeliveryArea = document.getElementById('outputDeliveryArea');
    const outputFurnitureType = document.getElementById('outputFurnitureType');
    const outputPerKgRate = document.getElementById('outputPerKgRate');
    const outputPerCbmRate = document.getElementById('outputPerCbmRate');
    const outputCBMPrice = document.getElementById('outputCBMPrice');
    const outputWeightPrice = document.getElementById('outputWeightPrice');
    const outputChargeableUnitHighlight = document.getElementById('outputChargeableUnitHighlight');
    const outputSubtotal = document.getElementById('outputSubtotal');
    const outputRemoteFee = document.getElementById('outputRemoteFee');
    const outputRemoteCBMValue = document.getElementById('outputRemoteCBMValue'); // 更新了ID以匹配新說明
    const outputTotal = document.getElementById('outputTotal');

    // 導航和內容區塊元素
    const navCalculate = document.getElementById('navCalculate');
    const navHistory = document.getElementById('navHistory');
    const navFurnitureType = document.getElementById('navFurnitureType');
    const navRemoteArea = document.getElementById('navRemoteArea');

    const calculatorContent = document.getElementById('calculatorContent');
    const historyContent = document.getElementById('historyContent');
    const furnitureTypeInfoContent = document.getElementById('furnitureTypeInfoContent');
    const remoteAreaInfoContent = document.getElementById('remoteAreaInfoContent');

    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const noHistoryMessage = document.querySelector('.no-history-message');

    // === 通用內容切換函數 ===
    function showContent(activeNavLink, contentToShow) {
        // 移除所有導航項的 active 類別
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        // 為點擊的導航項添加 active 類別
        activeNavLink.classList.add('active');

        // 隱藏所有內容區塊
        calculatorContent.style.display = 'none';
        historyContent.style.display = 'none';
        furnitureTypeInfoContent.style.display = 'none';
        remoteAreaInfoContent.style.display = 'none';

        // 顯示指定的內容區塊
        contentToShow.style.display = 'block';
    }

    // === 事件監聽器 ===
    calculateBtn.addEventListener('click', () => {
        const length_cm = parseFloat(lengthInput.value);
        const width_cm = parseFloat(widthInput.value);
        const height_cm = parseFloat(heightInput.value);
        const weight_kg = parseFloat(weightInput.value);
        const furniture_type = furnitureTypeSelect.value;
        const selected_delivery_area_option_text = deliveryAreaSelect.options[deliveryAreaSelect.selectedIndex].text; // 獲取顯示的文本
        const selected_delivery_area_value = deliveryAreaSelect.value; // 獲取選項的value

        let is_remote_area = (selected_delivery_area_value !== '一般地區');
        let remote_area_group_name = "";
        if (is_remote_area) {
            // 從 value 中提取地區名稱部分，例如 "1800台幣/方起 - 東勢區..." 提取 "東勢區..."
            const parts = selected_delivery_area_value.split(' - ');
            if (parts.length > 1) {
                // 如果是 "約XX台幣/材起 - 地區", 則取第二部分
                remote_area_group_name = parts[1]; 
            } else {
                remote_area_group_name = selected_delivery_area_value; // Fallback if no price prefix
            }
        }

        // 輸入驗證
        if (isNaN(length_cm) || isNaN(width_cm) || isNaN(height_cm) || isNaN(weight_kg) ||
            length_cm <= 0 || width_cm <= 0 || height_cm <= 0 || weight_kg <= 0) {
            alert('請輸入有效的長度、寬度、高度和重量！');
            return;
        }

        const result = calculateShippingCost(length_cm, width_cm, height_cm, weight_kg, furniture_type, is_remote_area, remote_area_group_name);

        if (result.error) {
            alert(result.error);
        } else {
            // 顯示計算結果
            outputCBM.textContent = result['材積'].toFixed(0);
            outputDeliveryArea.textContent = selected_delivery_area_option_text; // 顯示帶有價格的地區文本
            outputFurnitureType.textContent = result['家具種類'];

            // 顯示家具種類收費標準
            outputPerKgRate.textContent = result['每公斤費用'].toFixed(0);
            outputPerCbmRate.textContent = result['每材費用'].toFixed(0);

            // 顯示材積價格和重量價格
            outputCBMPrice.textContent = result['材積價格'].toFixed(0);
            outputWeightPrice.textContent = result['重量價格'].toFixed(0);

            outputChargeableUnitHighlight.textContent = result['計費基準'];
            
            outputSubtotal.textContent = result['運費小計'].toFixed(0);
            outputRemoteFee.textContent = result['偏遠地區派送費'].toFixed(0);
            
            // 顯示偏遠地區派送的實際材積（已無條件進位）
            outputRemoteCBMValue.textContent = result['材積'].toFixed(0); 

            outputTotal.textContent = result['總預估運費'].toFixed(0);

            // 將當前計算結果存入歷史記錄
            saveCalculationToHistory({
                date: new Date().toLocaleString(), // 儲存日期時間
                length: length_cm,
                width: width_cm,
                height: height_cm,
                weight: weight_kg,
                furnitureType: furniture_type,
                deliveryArea: selected_delivery_area_option_text, // 歷史記錄也使用顯示文本
                cbm: result['材積'].toFixed(0),
                chargeableUnit: result['計費基準'], // 歷史記錄也更新為新的計費基準文本
                perKgRate: result['每公斤費用'].toFixed(0), // 儲存每公斤費率
                perCbmRate: result['每材費用'].toFixed(0), // 儲存每材費率
                cbmPrice: result['材積價格'].toFixed(0),
                weightPrice: result['重量價格'].toFixed(0),
                subtotal: result['運費小計'].toFixed(0),
                remoteFee: result['偏遠地區派送費'].toFixed(0),
                remoteCBMValue: result['材積'].toFixed(0), // 歷史記錄也儲存材積值
                totalCost: result['總預估運費'].toFixed(0)
            });
        }
    });

    // 導航欄點擊事件
    navCalculate.addEventListener('click', (e) => {
        e.preventDefault();
        showContent(navCalculate, calculatorContent);
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        showContent(navHistory, historyContent);
        renderHistory(); // 每次點擊歷史記錄時重新渲染
    });

    navFurnitureType.addEventListener('click', (e) => {
        e.preventDefault();
        showContent(navFurnitureType, furnitureTypeInfoContent);
    });

    navRemoteArea.addEventListener('click', (e) => {
        e.preventDefault();
        showContent(navRemoteArea, remoteAreaInfoContent);
    });

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('確定要清除所有歷史記錄嗎？')) {
            localStorage.removeItem('shippingHistory');
            renderHistory();
            alert('歷史記錄已清除。');
        }
    });

    // === 運費計算核心函數 ===
    function calculateShippingCost(length_cm, width_cm, height_cm, weight_kg, furniture_type, is_remote_area, remote_area_name) {
        // 1. 材積計算
        const cbm = (length_cm * width_cm * height_cm) / 28317;
        const cbm_rounded = Math.ceil(cbm); // 無條件取整

        // 2. 獲取收費標準
        const rates = {
            '一般家具': { per_kg: 22, per_cbm: 125 },
            '特殊家具A': { per_kg: 32, per_cbm: 184 },
            '特殊家具B': { per_kg: 40, per_cbm: 224 },
            '特殊家具C': { per_kg: 50, per_cbm: 274 },
        };

        if (!(furniture_type in rates)) {
            return { error: "無效的家具種類" };
        }

        const selected_rate = rates[furniture_type];
        
        // 計算材積價格
        const cbm_price = cbm_rounded * selected_rate.per_cbm;
        // 計算重量價格
        const weight_price = weight_kg * selected_rate.per_kg;

        // 取材積價格和重量價格中的較大值作為運費小計
        let shipping_subtotal = Math.max(cbm_price, weight_price);

        // 確定計費基準的顯示文本
        let chargeable_unit_display_text;
        if (weight_price >= cbm_price) {
            chargeable_unit_display_text = `重量價格 (${weight_price.toFixed(0)} 台幣)`; // 顯示實際的價格
        } else {
            chargeable_unit_display_text = `材積價格 (${cbm_price.toFixed(0)} 台幣)`; // 顯示實際的價格
        }

        // 4. 低消處理 (偏遠地區不列入低消)
        if (!is_remote_area && shipping_subtotal < 2000) {
            shipping_subtotal = 2000;
        }

        // 5. 偏遠地區派送費 (現在按材積計費)
        let remote_fee = 0;
        const CBM_PER_CUBIC_METER = 35.3; // 1立方公尺約等於 35.3 材

        // 轉換原始每立方公尺的費率為每材的費率 (取小數點第一位，無條件進位)
        const remote_rates_per_cbm = {
            '東勢區、水里鄉、和平區、大雪山、谷關、新社區、石岡區、伸港鄉、線西鄉、秀水鄉、芬園鄉、芳苑鄉、大村鄉、大城鄉、竹塘鄉、北斗鄉': Math.ceil((1800 / CBM_PER_CUBIC_METER) * 10) / 10, // 51.0
            '三芝、石門、烏來、坪林、石碇、萬里、平溪、雙溪、深坑、福隆、貢寮、三峽、淡水、竹圍、復興、新埔、關西、橫山、北埔、尖石、五峰、寶山、造橋、峨嵋、三灣、芎林、香山、頭屋、銅鑼、三義、通霄、苑裡、大湖、卓蘭、泰安、公館鄉、竹南': Math.ceil((2000 / CBM_PER_CUBIC_METER) * 10) / 10, // 56.7
            '名間、四湖鄉、東勢鄉、台西鄉、古坑鄉、口湖鄉、崙背鄉、麥寮、東石鄉、六腳鄉、竹崎鄉、燕巢、內門區、大樹、茄萣、林園、旗津、杉林、美濃、永安、阿蓮、田寮、旗山': Math.ceil((2500 / CBM_PER_CUBIC_METER) * 10) / 10, // 70.8
            '布袋、北門區、將軍區、七股區、楠西區、南化區、白河區、東山區、大內區、玉井區、山上區、龍崎區、後壁區、左鎮區': Math.ceil((3000 / CBM_PER_CUBIC_METER) * 10) / 10, // 84.9
            '竹山、鹿谷、集集、中寮、國姓、仁愛、信義、水里、梨山、奧萬大、埔里': Math.ceil((4000 / CBM_PER_CUBIC_METER) * 10) / 10, // 113.3
            '陽明山、金山、魚池、南莊、獅潭、那瑪夏區、桃源區、茂林、甲仙、六龜': Math.ceil((4500 / CBM_PER_CUBIC_METER) * 10) / 10, // 127.5
            '阿里山、梅山鄉、番路、中埔鄉、大埔鄉': Math.ceil((5000 / CBM_PER_CUBIC_METER) * 10) / 10, // 141.6
            '車城、滿洲、小琉球、牡丹、獅子、枋山、春日、枋寮、佳冬、來義、泰武、瑪家、霧臺、三地門、南澳、釣魚臺、恒春、墾丁、鵝鑾鼻': Math.ceil((7000 / CBM_PER_CUBIC_METER) * 10) / 10, // 198.3
        };
        
        let found_rate_per_cbm_actual = 0; // 實際找到的每材費率
        for (const areas in remote_rates_per_cbm) {
            if (areas === remote_area_name) { 
                found_rate_per_cbm_actual = remote_rates_per_cbm[areas];
                break;
            }
        }
        
        if (found_rate_per_cbm_actual > 0) {
            // 直接用材積乘以每材費率，並無條件進位到整數
            remote_fee = Math.ceil(cbm_rounded * found_rate_per_cbm_actual); 
        }

        const total_cost = shipping_subtotal + remote_fee;

        return {
            "材積": cbm_rounded,
            "每公斤費用": selected_rate.per_kg,
            "每材費用": selected_rate.per_cbm,
            "材積價格": cbm_price,
            "重量價格": weight_price,
            "計費基準": chargeable_unit_display_text,
            "家具種類": furniture_type,
            "運費小計": shipping_subtotal,
            "偏遠地區派送費": remote_fee,
            // 由於現在偏遠地區也按材積計費，顯示的「偏遠地區材積值」就是總材積
            "總預估運費": total_cost
        };
    }

    // === 歷史記錄功能相關函數 ===
    function getHistory() {
        const history = localStorage.getItem('shippingHistory');
        return history ? JSON.parse(history) : [];
    }

    function saveCalculationToHistory(calculationResult) {
        const history = getHistory();
        history.unshift(calculationResult);
        if (history.length > 10) { // 只保留最新的10條記錄
            history.pop();
        }
        localStorage.setItem('shippingHistory', JSON.stringify(history));
    }

    function renderHistory() {
        const history = getHistory();
        historyList.innerHTML = ''; // 清空現有列表

        if (history.length === 0) {
            noHistoryMessage.style.display = 'block';
            clearHistoryBtn.style.display = 'none';
        } else {
            noHistoryMessage.style.display = 'none';
            clearHistoryBtn.style.display = 'block';
            history.forEach((item, index) => {
                const historyItemDiv = document.createElement('div');
                historyItemDiv.classList.add('history-item');
                historyItemDiv.innerHTML = `
                    <p><strong>日期:</strong> ${item.date}</p>
                    <p><strong>尺寸:</strong> ${item.length}x${item.width}x${item.height} cm</p>
                    <p><strong>重量:</strong> ${item.weight} kg</p>
                    <p><strong>家具種類:</strong> ${item.furnitureType}</p>
                    <p><strong>收費標準:</strong> 每公斤 ${item.perKgRate} 台幣, 每材 ${item.perCbmRate} 台幣</p>
                    <p><strong>配送地區:</strong> ${item.deliveryArea}</p>
                    <p><strong>計費材積:</strong> ${item.cbm} 材</p>
                    <p><strong>材積價格:</strong> ${item.cbmPrice} 台幣</p>
                    <p><strong>重量價格:</strong> ${item.weightPrice} 台幣</p>
                    <p><strong>實際收費以:</strong> ${item.chargeableUnit}</p>
                    <p><strong>運費小計:</strong> ${item.subtotal} 台幣</p>
                    <p><strong>偏遠地區派送費:</strong> ${item.remoteFee} 台幣</p>
                    <p><strong>偏遠地區派送計費材積:</strong> ${item.cbm} 材</p> <p class="total-cost"><strong>總預估運費:</strong> ${item.totalCost} 台幣</p>
                `;
                historyList.appendChild(historyItemDiv);
            });
        }
    }

    // 頁面載入時，預設顯示計算器內容
    showContent(navCalculate, calculatorContent);
});