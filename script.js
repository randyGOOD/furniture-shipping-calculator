document.addEventListener('DOMContentLoaded', () => {
    const lengthInput = document.getElementById('length');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const furnitureTypeSelect = document.getElementById('furnitureType');
    const deliveryAreaSelect = document.getElementById('deliveryArea'); // 使用新的配送地區下拉選單ID
    const calculateBtn = document.getElementById('calculateBtn');

    const outputCBM = document.getElementById('outputCBM');
    const outputChargeableUnit = document.getElementById('outputChargeableUnit');
    const outputFurnitureType = document.getElementById('outputFurnitureType');
    const outputSubtotal = document.getElementById('outputSubtotal');
    const outputRemoteFee = document.getElementById('outputRemoteFee');
    const outputTotal = document.getElementById('outputTotal');

    calculateBtn.addEventListener('click', () => {
        const length_cm = parseFloat(lengthInput.value);
        const width_cm = parseFloat(widthInput.value);
        const height_cm = parseFloat(heightInput.value);
        const weight_kg = parseFloat(weightInput.value);
        const furniture_type = furnitureTypeSelect.value;
        const selected_delivery_area = deliveryAreaSelect.value;

        // 判斷是否為偏遠地區
        const is_remote_area = (selected_delivery_area !== '一般地區');
        const remote_area_group_name = is_remote_area ? selected_delivery_area : ""; // 如果是偏遠地區，則傳遞選擇的地區組

        // 輸入驗證
        if (isNaN(length_cm) || isNaN(width_cm) || isNaN(height_cm) || isNaN(weight_kg) ||
            length_cm <= 0 || width_cm <= 0 || height_cm <= 0 || weight_kg <= 0) {
            alert('請輸入有效的長度、寬度、高度和重量！');
            return;
        }

        // 運費計算邏輯
        const result = calculateShippingCost(length_cm, width_cm, height_cm, weight_kg, furniture_type, is_remote_area, remote_area_group_name);

        // 顯示結果
        if (result.error) {
            alert(result.error);
        } else {
            outputCBM.textContent = result['材積'].toFixed(0); // 材積顯示為整數
            outputChargeableUnit.textContent = result['計費基準'];
            outputFurnitureType.textContent = result['家具種類'];
            outputSubtotal.textContent = result['運費小計'].toFixed(0);
            outputRemoteFee.textContent = result['偏遠地區派送費'].toFixed(0);
            outputTotal.textContent = result['總預估運費'].toFixed(0);
        }
    });

    // 運費計算核心函數 (從之前的Python邏輯轉換為JavaScript)
    function calculateShippingCost(length_cm, width_cm, height_cm, weight_kg, furniture_type, is_remote_area, remote_area_name) {
        // 1. 材積計算
        const cbm = (length_cm * width_cm * height_cm) / 28317;
        const cbm_rounded = Math.ceil(cbm); // 無條件取整

        // 2. 確定收費標準 (材積 vs 重量)
        const chargeable_unit_value = Math.max(cbm_rounded, weight_kg);
        const chargeable_unit_type = (weight_kg >= cbm_rounded) ? '公斤' : '材積';
        const chargeable_unit_display = `${chargeable_unit_value} ${chargeable_unit_type}`;


        // 3. 獲取收費標準
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
        
        // 實際運費計算 (材積跟重量取大值)
        let shipping_subtotal = chargeable_unit_value * (chargeable_unit_type === '公斤' ? selected_rate.per_kg : selected_rate.per_cbm);

        // 4. 低消處理 (偏遠地區不列入低消)
        if (!is_remote_area && shipping_subtotal < 2000) {
            shipping_subtotal = 2000;
        }

        // 5. 偏遠地區派送費
        let remote_fee = 0;
        if (is_remote_area) {
            // 將「方」換算成「材積」: 1方 = 35.3材
            const CBM_PER_CUBIC_METER = 35.3;

            // 偏遠地區費率字典 (每方費用)
            const remote_rates_per_cubic_meter = {
                '東勢區、水里鄉、和平區、大雪山、谷關、新社區、石岡區、伸港鄉、線西鄉、秀水鄉、芬園鄉、芳苑鄉、大村鄉、大城鄉、竹塘鄉、北斗鄉': 1800,
                '三芝、石門、烏來、坪林、石碇、萬里、平溪、雙溪、深坑、福隆、貢寮、三峽、淡水、竹圍、復興、新埔、關西、橫山、北埔、尖石、五峰、寶山、造橋、峨嵋、三灣、芎林、香山、頭屋、銅鑼、三義、通霄、苑裡、大湖、卓蘭、泰安、公館鄉、竹南': 2000,
                '名間、四湖鄉、東勢鄉、台西鄉、古坑鄉、口湖鄉、崙背鄉、麥寮、東石鄉、六腳鄉、竹崎鄉、燕巢、內門區、大樹、茄萣、林園、旗津、杉林、美濃、永安、阿蓮、田寮、旗山': 2500,
                '布袋、北門區、將軍區、七股區、楠西區、南化區、白河區、東山區、大內區、玉井區、山上區、龍崎區、後壁區、左鎮區': 3000,
                '竹山、鹿谷、集集、中寮、國姓、仁愛、信義、水里、梨山、奧萬大、埔里': 4000,
                '陽明山、金山、魚池、南莊、獅潭、那瑪夏區、桃源區、茂林、甲仙、六龜': 4500,
                '阿里山、梅山鄉、番路、中埔鄉、大埔鄉': 5000,
                '車城、滿洲、小琉球、牡丹、獅子、枋山、春日、枋寮、佳冬、來義、泰武、瑪家、霧臺、三地門、南澳、釣魚臺、恒春、墾丁、鵝鑾鼻': 7000,
            };
            
            let found_rate_per_cubic_meter = 0;
            for (const areas in remote_rates_per_cubic_meter) {
                if (areas === remote_area_name) { 
                    found_rate_per_cubic_meter = remote_rates_per_cubic_meter[areas];
                    break;
                }
            }
            
            if (found_rate_per_cubic_meter > 0) {
                const cbm_to_cubic_meters = cbm_rounded / CBM_PER_CUBIC_METER;
                const chargeable_cubic_meters = Math.max(cbm_to_cubic_meters, 1);
                remote_fee = chargeable_cubic_meters * found_rate_per_cubic_meter;
                remote_fee = Math.ceil(remote_fee);
            }
        }

        const total_cost = shipping_subtotal + remote_fee;

        return {
            "材積": cbm_rounded,
            "計費基準": chargeable_unit_display,
            "家具種類": furniture_type,
            "運費小計": shipping_subtotal,
            "偏遠地區派送費": remote_fee,
            "總預估運費": total_cost
        };
    }
});