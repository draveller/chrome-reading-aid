// content.js - 阅读辅助线功能核心逻辑

// 定义高亮矩形元素
let highlightRect
// 默认宽高
let RECT_WIDTH = 200
let RECT_HEIGHT = 100

// 辅助线开关状态
let assistLineEnabled = false
let mouseMoveHandler = null
let mouseLeaveHandler = null

// 简单的节流函数，限制事件处理频率以优化性能
function throttle(func, limit) {
  let inThrottle
  return function () {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 初始化高亮矩形 DOM 元素
function initializeRect() {
  if (highlightRect) return
  highlightRect = document.createElement("div")
  highlightRect.classList.add("reading-highlight-rect")
  Object.assign(highlightRect.style, {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 999999,
    borderRadius: "16px",
    background: "rgba(255,255,180,0.35)",
    boxShadow: "0 0 0 2px #2196F3",
    transition: "width 0.1s, height 0.1s, left 0.1s, top 0.1s",
    display: "none",
  })
  document.body.appendChild(highlightRect)
}

// 鼠标移动事件处理函数
function handleMouseMove(event) {
  window.lastMouseX = event.clientX
  window.lastMouseY = event.clientY
  if (!highlightRect) initializeRect()
  highlightRect.style.display = "block"
  highlightRect.style.width = RECT_WIDTH + "px"
  highlightRect.style.height = RECT_HEIGHT + "px"
  highlightRect.style.left = event.clientX - RECT_WIDTH / 2 + "px"
  highlightRect.style.top = event.clientY - RECT_HEIGHT / 2 + "px"
}

// 鼠标移出页面时隐藏辅助线
function handleMouseLeave() {
  if (highlightRect) {
    highlightRect.style.display = "none"
  }
}

// 动态启用高亮区域功能
function enableAssistLine() {
  if (assistLineEnabled) return
  assistLineEnabled = true
  mouseMoveHandler = throttle(handleMouseMove, 16)
  document.addEventListener("mousemove", mouseMoveHandler)
  initializeRect()
}

// 动态禁用高亮区域功能
function disableAssistLine() {
  if (!assistLineEnabled) return
  assistLineEnabled = false
  if (mouseMoveHandler) document.removeEventListener("mousemove", mouseMoveHandler)
  if (highlightRect) highlightRect.style.display = "none"
}

// 监听 popup 消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_ASSIST_LINE") {
    if (message.enabled) {
      enableAssistLine()
    } else {
      disableAssistLine()
    }
  } else if (message.type === "UPDATE_RECTANGLE_SIZE") {
    RECT_WIDTH = message.width
    RECT_HEIGHT = message.height
    // 立即更新位置
    if (assistLineEnabled && highlightRect && window.lastMouseX !== undefined && window.lastMouseY !== undefined) {
      handleMouseMove({ clientX: window.lastMouseX, clientY: window.lastMouseY })
    }
  }
})

// 页面加载时读取 storage 状态和矩形宽高
chrome.storage.sync.get(["assistLineEnabled", "rectangleWidth", "rectangleHeight"], function (result) {
  RECT_WIDTH = result.rectangleWidth || 200
  RECT_HEIGHT = result.rectangleHeight || 100
  if (result.assistLineEnabled) {
    enableAssistLine()
  } else {
    disableAssistLine()
  }
})

// 设置事件监听器
function setupEventListeners() {
  // 防止重复添加监听器，尤其是在SPA应用中可能导致内容脚本重复执行
  if (window.hasReadingGuideListeners) {
    return
  }
  window.hasReadingGuideListeners = true

  // 监听鼠标移动事件，并使用节流优化性能
  document.addEventListener("mousemove", throttle(handleMouseMove, 16)) // 大约每秒60帧更新

  // 监听鼠标离开文档区域事件
  document.addEventListener("mouseleave", handleMouseLeave)

  // 初始创建线条，但默认隐藏
  initializeRect()
}

// 移除自动初始化辅助线的逻辑
// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", setupEventListeners)
// } else {
//   setupEventListeners()
// }

// 页面卸载或跳转时清理
window.addEventListener("beforeunload", () => {
  disableAssistLine()
  window.hasReadingGuideListeners = false
})
