/**
 * GeoGebra 加载器 - 新手版
 * 使用说明：在 HTML 中创建一个容器 div，然后调用 loadGeoGebra()
 */

// 检测环境
const isLiveServer = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
const basePath = isLiveServer 
  ? `http://${window.location.hostname}:5500/assets/ggb/` 
  : `/assets/ggb/`;

/**
 * 加载 GeoGebra 小程序
 * @param {string} containerId - HTML 容器的 id
 * @param {string} ggbFileName - .ggb 文件名，如 "derivative.ggb"
 * @param {boolean} is3D - 是否是 3D 图形
 * @returns {Promise} - 加载成功后的 applet 对象
 */
function loadGeoGebra(containerId, ggbFileName, is3D = false) {
  return new Promise((resolve, reject) => {
    const container = document.getElementById(containerId);
    if (!container) {
      reject('❌ 错误：找不到容器 #' + containerId);
      return;
    }

    // 显示加载提示
    container.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">正在加载 GeoGebra...</span>
      </div>
    `;

    // 构建参数
    const params = {
      "appName": is3D ? "3d" : "classic",
      "width": 800,
      "height": 500,
      "showToolBar": true,
      "showAlgebraInput": true,
      "showMenuBar": false,
      "enableRightClick": false,
      "enableShiftDragZoom": true,
      "showResetIcon": true,
      "useBrowserForJS": true,
      "filename": basePath + ggbFileName
    };

    // 动态加载 GeoGebra 脚本
    const scriptId = is3D ? 'geogebra-3d-script' : 'geogebra-script';
    
    // 如果脚本已存在，先移除
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = is3D
      ? 'https://www.geogebra.org/apps/latest/web3d.nocache.js'
      : 'https://www.geogebra.org/apps/latest/web.nocache.js';
    
    script.onload = () => {
      console.log('✅ GeoGebra 脚本加载成功');
      
      // 等待 GeoGebra API 准备就绪
      const checkInterval = setInterval(() => {
        if (window.GGBApplet) {
          clearInterval(checkInterval);
          
          try {
            const applet = new GGBApplet(params, true);
            applet.inject(containerId);
            
            // 监听加载完成
            const onLoaded = setInterval(() => {
              if (window[containerId + '_applet']) {
                clearInterval(onLoaded);
                resolve(window[containerId + '_applet']);
              }
            }, 200);
            
          } catch (error) {
            reject('❌ GeoGebra 初始化失败: ' + error.message);
          }
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <strong>加载失败</strong><br>
          请检查：<br>
          1. 文件名是否正确<br>
          2. 文件是否在 assets/ggb/ 目录<br>
          3. Live Server 是否运行
        </div>
      `;
      reject(error);
    };

    document.head.appendChild(script);
  });
}

// 简化版：直接嵌入在线材料（推荐新手）
function embedGeoGebra(containerId, materialId, width = 800, height = 500) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <iframe src="https://www.geogebra.org/material/iframe/id/${materialId}/width/${width}/height/${height}" 
            width="${width}" height="${height}" frameborder="0" 
            style="border: 1px solid #e2e8f0; border-radius: 8px;">
    </iframe>
    <p class="text-sm text-gray-500 mt-2">
      💡 拖动滑块或图形进行交互
    </p>
  `;
}
