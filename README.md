# Super Mario — Android 迁移项目

## 项目概述

将经典 HTML5 Canvas Super Mario 网页游戏迁移为原生 Android APK 应用，封装在 WebView 中运行，适配移动端触控操作，支持 Android 7.0 (API 24) 至 Android 16 (API 36)。

---

## 技术架构

```
┌─────────────────────────────────┐
│     Android 原生壳 (Kotlin)      │
│  ┌───────────────────────────┐  │
│  │       WebView             │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  index.html          │  │  │
│  │  │  ├─ input.js         │  │  │
│  │  │  ├─ game.js          │  │  │
│  │  │  ├─ renderer.js      │  │  │
│  │  │  ├─ player.js        │  │  │
│  │  │  ├─ level.js         │  │  │
│  │  │  ├─ sprites.js       │  │  │
│  │  │  ├─ audio.js         │  │  │
│  │  │  └─ style.css        │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
│  Java ↔ JS 桥接                  │
│  • 安全区传递 (Edge-to-Edge)     │
│  • 震动反馈                      │
│  • 键盘事件注入                  │
│  • 生命周期管理                  │
└─────────────────────────────────┘
```

### 构建配置

| 项 | 值 |
|---|---|
| 包名 | `com.supermario.game` |
| 语言 | Kotlin + JavaScript |
| 最低 SDK | API 24 (Android 7.0) |
| 目标 SDK | API 36 (Android 16) |
| 编译 SDK | API 36 |
| 屏幕方向 | 强制横屏 |
| 主题 | 全屏沉浸式黑色 |

---

## 关键技术实现

### 1. Android 16 Edge-to-Edge 适配
Android 15+ 强制边缘到边缘显示，系统导航栏盖在应用上方。通过 `WindowInsetsCompat` 获取安全区（navigation bar + status bar 像素），转为 CSS 像素传给 WebView，`renderer.js` 的 `resize()` 据此缩减画布尺寸，保证游戏画面不被遮挡。

### 2. 触控操作
- 采用**内联 `ontouchstart` + `onpointerdown`**（绕过事件冒泡问题）
- 直接写入 `window.__keys` 状态对象
- 按钮按下带 `.pressed` 高亮视觉效果
- 每个按钮触发 15ms 短震动（触觉反馈）

### 3. 相机系统（renderer.js v7）
- 死锁 2x 缩放（16×16 源瓦片 → 32×32 屏幕瓦片），避免自适应缩放导致瓦片裂缝
- 水平相机：跟随 Mario，clamp 到关卡边界
- 垂直相机：Mario 始终在屏幕上方 1/4 处，地面自动露出
- 只渲染可见区域内的瓦片和实体（行+列裁剪），节省性能

### 4. 内存管理
- `onPause` / `onResume`：暂停/恢复游戏循环
- `onDestroy`：通知 JS 清理（移除事件监听、停止 rAF、清除 interval），然后 `webView.destroy()` 释放 WebView 资源
- JS 侧 `__stopGame` / `__startGame` / `__destroyGame` 全局钩子

### 5. 键盘桥接
三重拦截：`dispatchKeyEvent` → `onKeyDown` → `onKeyUp`，将 A/D/空格/Esc/Enter 按键直接注入 `window.__keys`。

---

## 项目文件结构

```
android-app/
├── build.gradle.kts              # 项目级 Gradle (AGP 8.2, Kotlin 1.9)
├── settings.gradle.kts
├── gradle.properties
├── gradle/wrapper/
├── app/
│   ├── build.gradle.kts          # compileSdk=36, targetSdk=36
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml   # 横屏 + 全屏 + VIBRATE 权限
│       ├── java/com/supermario/game/
│       │   └── MainActivity.kt   # WebView 管理 + 安全区 + 震动 + 键盘桥接
│       └── assets/
│           ├── index.html        # 入口 + 触控按钮 + 水印 "By 訸"
│           ├── css/style.css     # 全屏 + 按钮样式 + Safe Area
│           ├── img/
│           │   ├── characters.gif
│           │   └── tiles.png
│           └── js/
│               ├── input.js      # 键盘+触控统一输入管理
│               ├── audio.js      # Web Audio API 8-bit 音效
│               ├── sprites.js    # 精灵图加载与裁剪
│               ├── player.js     # Mario 物理+碰撞
│               ├── level.js      # 关卡瓦片地图+敌人+金币
│               ├── renderer.js   # Canvas 渲染器 + 相机 (v7)
│               └── game.js       # 主循环 (固定 60FPS)
```

---

## 操作方式

| 键盘 | 触控按钮 | 功能 |
|---|---|---|
| A / ← | ◄（左下） | 左移 |
| D / → | ►（左下） | 右移 |
| 空格 | A（右下） | 跳跃 |
| P / Esc | ⏸（右上角） | 暂停 |
| Enter | ↺（死亡时出现） | 重新开始 |

---

## 构建命令

```batch
cd android-app
gradlew.bat assembleDebug      # Debug APK
gradlew.bat assembleRelease    # Release APK
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

---

## 水印

游戏画面右侧中间竖排显示：**By 訸**
