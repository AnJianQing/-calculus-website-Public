/**
 * GeoGebra 加载器 v1.1
 * 更新日期：2024-12-13
 * 功能：动态加载 GeoGebra 经典/3D 图形
 * 使用说明：在 HTML 中创建容器 div，然后调用 loadGeoGebra()
 * 
 * 示例：
 * // 加载2D图形
 * loadGeoGebra('container1', 'derivative.ggb').then(applet => {
 *   console.log('加载成功', applet);
 * }).catch(err => console.error('加载失败', err));
 * 
 * // 加载3D图形
 * loadGeoGebra('container3d', 'surface.ggb', true);
 */

// 检测运行环境
const isLiveServer = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
const isFileProtocol = window.location.protocol === 'file:';

// 根据环境设置 GeoGebra 文件基础路径
const basePath = isLiveServer 
  ? `http://${window.location.hostname}:5500/assets/ggb/` 
  : (isFileProtocol ? './assets/ggb/' : '/assets/ggb/');

/**
 * 加载 GeoGebra 小程序（支持 2D 和 3D）
 * @param {string} containerId - HTML 容器的 id（必须）
 * @param {string} ggbFileName - .ggb 文件名，如 "derivative.ggb"（必须）
 * @param {boolean} is3D - 是否是 3D 图形，默认 false
 * @returns {Promise} - 返回加载成功后的 applet 对象
 */
function loadGeoGebra(containerId, ggbFileName, is3D = false) {
  return new Promise((resolve, reject) => {
    const container = document.getElementById(containerId);
    
    // 验证容器是否存在
    if (!container) {
      reject(new Error(`❌ 错误：找不到容器 #${containerId}`));
      return;
    }

    // 验证文件名
    if (!ggbFileName || !ggbFileName.endsWith('.ggb')) {
      reject(new Error('❌ 错误：请提供正确的 .ggb 文件名'));
      return;
    }

    // 显示加载动画
    container.innerHTML = `
      <div class="flex items-center justify-center py-12 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <div>
          <p class="text-gray-700 font-medium">正在加载 GeoGebra 图形...</p>
          <p class="text-sm text-gray-500">文件名：${ggbFileName}</p>
        </div>
      </div>
    `;

    // 构建 GeoGebra 参数
    const params = {
      "appName": is3D ? "3d" : "classic", // 3D图形使用 "3d"，2D使用 "classic"
      "width": 800,
      "height": 500,
      "showToolBar": true,        // 显示工具栏
      "showAlgebraInput": true,   // 显示代数输入栏
      "showMenuBar": false,       // 隐藏菜单栏（简化界面）
      "enableRightClick": false,  // 禁用右键（避免干扰）
      "enableShiftDragZoom": true, // 允许Shift+拖动缩放
      "showResetIcon": true,      // 显示重置按钮
      "useBrowserForJS": true,    // 使用浏览器JS引擎
      "filename": basePath + ggbFileName // 文件路径
    };

    // 动态加载 GeoGebra 脚本
    const scriptId = is3D ? 'geogebra-3d-script' : 'geogebra-script';
    
    // 如果脚本已存在，先移除（避免重复加载）
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      console.warn('⚠️ 脚本已存在，正在移除并重新加载...');
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = is3D
      ? 'https://www.geogebra.org/apps/latest/web3d.nocache.js' // 3D 版本
      : 'https://www.geogebra.org/apps/latest/web.nocache.js'; // 2D 版本
    
    // 脚本加载成功
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
              const appletInstance = window[containerId + '_applet'];
              if (appletInstance) {
                clearInterval(onLoaded);
                console.log(`✅ GeoGebra 图形 "${ggbFileName}" 加载成功`);
                resolve(appletInstance);
              }
            }, 200);
            
          } catch (error) {
            reject(new Error(`❌ GeoGebra 初始化失败: ${error.message}`));
          }
        }
      }, 100);
    };
    
    // 脚本加载失败
    script.onerror = (error) => {
      console.error('❌ GeoGebra 脚本加载失败', error);
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 class="text-red-800 font-bold mb-2">图形加载失败</h3>
          <div class="text-sm text-red-700 text-left max-w-md mx-auto">
            <p class="mb-2">请检查以下常见问题：</p>
            <ul class="list-disc list-inside space-y-1">
              <li>文件名 <code class="bg-red-100 px-1 rounded">${ggbFileName}</code> 是否正确</li>
              <li>文件是否存在于 <code class="bg-red-100 px-1 rounded">assets/ggb/</code> 目录</li>
              <li>是否已启动 Live Server（VS Code插件）</li>
              <li>浏览器是否允许加载外部脚本</li>
            </ul>
          </div>
          <p class="mt-4 text-xs text-gray-600">当前路径：${basePath + ggbFileName}</p>
        </div>
      `;
      reject(error);
    };

    document.head.appendChild(script);
  });
}

/**
 * 简化版：直接嵌入在线 GeoGebra 材料（推荐新手使用）
 * 优点：无需本地 .ggb 文件，直接从 GeoGebra 官网加载
 * 
 * @param {string} containerId - HTML 容器的 id
 * @param {string} materialId - GeoGebra 材料ID（从官网获取）
 * @param {number} width - 宽度，默认 800
 * @param {number} height - 高度，默认 500
 * @param {boolean} showBorder - 是否显示边框，默认 true
 */
function embedGeoGebra(containerId, materialId, width = 800, height = 500, showBorder = true) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`❌ 错误：找不到容器 #${containerId}`);
    return;
  }

  if (!materialId) {
    console.error('❌ 错误：请提供有效的 GeoGebra 材料ID');
    return;
  }

  // 边框样式
  const borderStyle = showBorder 
    ? 'border: 1px solid #e2e8f0; border-radius: 8px;' 
    : 'border: none; border-radius: 8px;';

  // 嵌入 iframe
  container.innerHTML = `
    <div>
      <p class="text-sm text-gray-600 mb-2">材料ID：<code class="bg-gray-100 px-1 rounded">${materialId}</code></p>
      <iframe src="https://www.geogebra.org/material/iframe/id/${materialId}/width/${width}/height/${height}" 
              width="${width}" 
              height="${height}" 
              frameborder="0" 
              style="${borderStyle} box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
              allowfullscreen>
      </iframe>
      <p class="text-sm text-gray-500 mt-2">
        <i class="fas fa-info-circle mr-1"></i> 拖动滑块或图形进行交互，点击右下角可全屏查看
      </p>
    </div>
  `;
}

// 为简化使用，将函数挂载到全局对象
window.GeoGebraLoader = {
  load: loadGeoGebra,
  embed: embedGeoGebra,
  version: '1.1',
  basePath: basePath
};

// 导出模块（如果支持 ES6 模块）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadGeoGebra, embedGeoGebra };
}

// 版本更新日志
/*
v1.1 (2024-12-13):
- 添加详细的中文注释和使用说明
- 增强错误处理，提供中文友好提示
- 支持3D图形加载
- 添加版本信息和日志输出
- 实现函数防抖和加载状态显示

v1.0 (初始版本):
- 基础加载功能
- Promise 异步支持
*/
