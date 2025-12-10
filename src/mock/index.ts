import Mock from "mockjs";

// --- 固定的“正常产品名称列表” ---
const productNameList = [
  "苹果手机",
  "耳机套装",
  "蓝牙音箱",
  "智能手表",
  "运动水杯",
  "男士外套",
  "女士背包",
  "办公鼠标",
  "机械键盘",
  "无线路由器",
  "显示器支架",
  "护眼台灯"
];

// 产品收入统计（使用专业名称）
Mock.mock("/api/revenue", "get", () => {
  return Mock.mock({
    "list|5-8": [
      {
        "productName|1": productNameList,  // 从列表中随机抽取
        "quantity|50-500": 1,
        "revenue|1000-8000": 1
      }
    ]
  }).list;
});

// 产品列表
Mock.mock("/api/products", "get", () => {
  return productNameList.map((name, index) => ({
    id: index + 1,
    name
  }));
});

// 新增库存
Mock.mock("/api/inventory/add", "post", () => {
  return {
    code: 200,
    message: "新增成功（Mock）"
  };
});

console.log("%c Mock 数据已启动（专业版产品名称）", "color: #42b983; font-weight: bold;");
