# 素材使用指南

## 快速開始

1. **放入素材**
   ```
   input/images/ → 放你的圖片
   input/videos/ → 放你的影片
   input/audio/  → 放你的音樂
   ```

2. **在 CLI 中告訴 Claude Code**
   ```
   "在第 1 個場景加上 input/images/logo.png"
   "用 input/audio/bgm.mp3 做背景音樂"
   "把 input/videos/intro.mp4 插入影片中"
   ```

3. **Claude Code 會自動處理**
   - 讀取素材檔案
   - 整合到 content.ts
   - 生成影片時自動引用

## 支援的格式

### 圖片
- PNG, JPG, JPEG, GIF, SVG, WebP

### 影片
- MP4, MOV, WebM, AVI

### 音訊
- MP3, WAV, AAC, OGG

## 範例

### 加入標誌圖片
```
對話：「在每個場景的右上角加 input/images/logo.png」
```

### 自訂背景音樂
```
對話：「用 input/audio/my-music.mp3 當背景音樂」
```

### 插入素材影片
```
對話：「第 2 場景用 input/videos/demo.mp4」
```

## 💡 建議

- 用簡單的英文檔名：`logo.png`, `bgm.mp3`, `intro.mp4`
- 檔名不要有特殊符號或空格
- 保持檔案大小合理（圖片 < 5MB，影片 < 100MB）
