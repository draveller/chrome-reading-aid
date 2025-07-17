document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("toggleSwitch")
  const widthSlider = document.getElementById("widthSlider")
  const widthInput = document.getElementById("widthInput")
  const widthValue = document.getElementById("widthValue")
  const heightSlider = document.getElementById("heightSlider")
  const heightInput = document.getElementById("heightInput")
  const heightValue = document.getElementById("heightValue")

  // 读取存储的开关状态和尺寸配置
  chrome.storage.sync.get(["assistLineEnabled", "rectangleWidth", "rectangleHeight"], function (result) {
    toggle.checked = !!result.assistLineEnabled
    const width = result.rectangleWidth || 200
    const height = result.rectangleHeight || 100
    widthSlider.value = width
    widthInput.value = width
    widthValue.textContent = width + "px"
    heightSlider.value = height
    heightInput.value = height
    heightValue.textContent = height + "px"
  })

  // 监听开关切换
  toggle.addEventListener("change", function () {
    const enabled = toggle.checked
    chrome.storage.sync.set({ assistLineEnabled: enabled })
    // 广播到所有标签页
    chrome.tabs.query({}, function (tabs) {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_ASSIST_LINE", enabled })
        }
      }
    })
  })

  // 监听宽度滑块变化
  widthSlider.addEventListener("input", function () {
    const width = parseInt(widthSlider.value)
    widthInput.value = width
    widthValue.textContent = width + "px"
    updateRectangleSize(width, parseInt(heightSlider.value))
  })

  // 监听宽度输入框变化
  widthInput.addEventListener("input", function () {
    const width = parseInt(widthInput.value)
    if (width >= 200 && width <= 2000) {
      widthSlider.value = width
      widthValue.textContent = width + "px"
      updateRectangleSize(width, parseInt(heightSlider.value))
    }
  })

  // 监听高度滑块变化
  heightSlider.addEventListener("input", function () {
    const height = parseInt(heightSlider.value)
    heightInput.value = height
    heightValue.textContent = height + "px"
    updateRectangleSize(parseInt(widthSlider.value), height)
  })

  // 监听高度输入框变化
  heightInput.addEventListener("input", function () {
    const height = parseInt(heightInput.value)
    if (height >= 50 && height <= 500) {
      heightSlider.value = height
      heightValue.textContent = height + "px"
      updateRectangleSize(parseInt(widthSlider.value), height)
    }
  })

  // 更新矩形尺寸配置并广播
  function updateRectangleSize(width, height) {
    chrome.storage.sync.set({
      rectangleWidth: width,
      rectangleHeight: height,
    })
    // 广播到所有标签页
    chrome.tabs.query({}, function (tabs) {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "UPDATE_RECTANGLE_SIZE",
            width: width,
            height: height,
          })
        }
      }
    })
  }
})
