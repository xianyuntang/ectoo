# AWS EC2 VM Monitor 規格文件

## 專案概述
開發一個基於 Next.js 的網頁應用程式，用於監控和控制 AWS EC2 虛擬機器實例。使用現代化的 Next.js + TypeScript + shadcn/ui 技術棧，提供簡潔美觀的使用者介面。

## 功能需求

### 1. 核心功能
1. **多區域支援**
   - 支援切換不同的 AWS 區域（Regions）
   - 自動載入所選區域的 EC2 實例列表
   - 記憶使用者最後選擇的區域

2. **EC2 實例控制**
   - 啟動實例（Start Instance）
   - 停止實例（Stop Instance）
   - 批次操作支援（選擇多個實例同時操作）

3. **實例狀態顯示**
   - 即時顯示實例狀態（running, stopped, pending, stopping 等）
   - 自動刷新狀態（可配置刷新間隔）
   - 顯示基本實例資訊：
     - Instance ID
     - Instance Name (Tag)
     - Instance Type
     - Public IP Address
     - Private IP Address
     - Launch Time

### 2. 使用者介面設計

#### 2.1 頁面佈局
- **頂部導航欄**
  - 應用程式標題
  - 區域選擇器（下拉選單）
  - 刷新按鈕
  - 設定按鈕（管理 AWS Credentials）

- **主要內容區**
  - 初次使用時顯示 AWS Credentials 輸入表單
  - EC2 實例列表（表格形式）
  - 篩選和搜尋功能
  - 批次操作工具列

- **狀態指示器**
  - 使用顏色和圖示表示不同狀態
  - Running: 綠色圓點
  - Stopped: 紅色方塊
  - Pending/Stopping: 橙色旋轉圖示

#### 2.2 UI 元件設計（使用 shadcn/ui）
- **表格元件**: 使用 shadcn/ui 的 Table 元件顯示 EC2 實例
- **表單元件**: 
  - Input（AWS Credentials 輸入）
  - Select（區域選擇）
  - Button（操作按鈕）
  - Checkbox（批次選擇）
- **回饋元件**:
  - Toast（操作結果通知）
  - Alert（錯誤和警告訊息）
  - Skeleton（載入狀態）
- **導航元件**:
  - Navigation Menu（頂部導航）
  - Dropdown Menu（更多操作選單）
  - Dialog（設定視窗）

#### 2.3 響應式設計
- 支援桌面、平板和手機裝置
- 使用 Tailwind CSS 的響應式工具類別
- 在小螢幕上使用卡片式佈局

## 技術規格

### 1. 前端技術棧
- **框架**: Next.js 14+ (App Router) + TypeScript
- **UI 元件庫**: shadcn/ui
- **樣式方案**: Tailwind CSS
- **狀態管理**: Zustand
- **其他工具**:
  - React Hook Form（表單處理）
  - Zod（資料驗證）
  - Tanstack Query（資料獲取和快取）
  - next-themes（深色模式支援）

### 2. AWS SDK 整合
- 使用 AWS SDK for JavaScript (Browser版本)
- 直接在前端使用 AWS Credentials（API Key 和 Secret）
- 實作以下 EC2 API 操作：
  - describeInstances
  - startInstances
  - stopInstances
  - describeRegions

## 安全性規格

### 1. 認證方式
- 使用者直接輸入 AWS Access Key ID 和 Secret Access Key
- Credentials 儲存在瀏覽器的 localStorage（加密儲存）
- 提供清除 Credentials 的選項
- Session 超時自動清除儲存的認證資訊

### 2. 安全注意事項
- **重要提醒**：此應用程式適合個人使用或內部工具使用
- 建議使用具有限定權限的 IAM 使用者，而非 root 帳戶
- IAM 使用者應僅具備必要的 EC2 操作權限：
  - ec2:DescribeInstances
  - ec2:StartInstances
  - ec2:StopInstances
  - ec2:DescribeRegions

### 3. 安全最佳實踐
- HTTPS 加密傳輸（部署時必須使用）
- Credentials 在客戶端加密儲存
- 提供 Credentials 遮罩顯示功能
- 定期提醒使用者更新 Access Key

## 效能需求
- 頁面載入時間 < 3 秒
- EC2 實例列表載入 < 2 秒
- 操作響應時間 < 1 秒
- 支援顯示最多 1000 個實例

## 部署需求
- Next.js 應用程式部署
- 建議選項：
  - **Vercel**（Next.js 原生支援，推薦）
  - Netlify（支援 Next.js）
  - AWS Amplify
  - 自建服務器（Node.js 環境）
- 支援 CI/CD 自動部署
- 環境變數管理（用於非敏感配置）

## 未來擴展考量
- 支援更多 EC2 操作（重啟、終止等）
- 整合 CloudWatch 監控指標
- 支援其他 AWS 服務（RDS、ECS 等）
- 多語言支援（中文、英文）