# 素材輸入資料夾 (Input Assets)

將素材放在這個資料夾，Claude Code 可以直接讀取並用於影片製作。

## 📁 結構

```
input/
├── images/      # 圖片素材 (PNG, JPG, etc)
├── videos/      # 影片素材 (MP4, MOV, etc)
└── audio/       # 音訊素材 (MP3, WAV, etc)
```

## 📝 在 content.ts 中使用

```typescript
// 圖片示例
visual: {
  type: "...",
  image: "../../input/images/my-image.png"
}

// 影片或音訊路徑參考
bgm: {
  file: "input/audio/background.mp3"
}
```

## 💡 CLI 使用範例

```bash
# Claude Code 會自動讀取 input/ 中的檔案
# 只需在對話中提及「加上 input/images 中的圖片」
# Claude Code 會自動找到並使用

# 例如：
# "把 input/images/logo.png 加到第一個場景"
# "用 input/audio/bgm.mp3 當背景音樂"
```

## 📌 提示

- 保持檔名簡短且有意義
- 使用中文或英文檔名都可以
- 檔案會自動被 Claude Code 掃描使用
