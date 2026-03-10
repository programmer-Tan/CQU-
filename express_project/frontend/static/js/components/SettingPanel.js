//file: frontend/static/js/components/SettingsPanel.js
export class SettingsPanel {
    // 修改构造函数
  constructor(onClose, onChangeAIDifficulty, onToggleBGM, onChangeBgStyle) {
    this.onClose = onClose;
    this.onChangeAIDifficulty = onChangeAIDifficulty; // 确保变量名一致
    this.onToggleBGM = onToggleBGM;
    this.onChangeBgStyle = onChangeBgStyle; // 新增
    this.bgmEnabled = false; 
  }

  render() {
    return `
      <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-800">游戏设置</h2>
          <button id="close-settings" class="text-gray-500 hover:text-gray-700">
            <i class="fa fa-times text-xl"></i>
          </button>
        </div>

        <!-- 背景音乐开关 -->
        <div class="flex items-center justify-between mb-6">
          <label class="text-sm font-medium text-gray-700">背景音乐</label>
          <label class="switch">
            <input type="checkbox" id="bgm-toggle" ${this.bgmEnabled ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>

        <!-- 难度设置 -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-600 mb-3">AI难度</h3>
          <select id="ai-difficulty" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="easy">简单</option>
            <option value="normal" selected>普通</option>
            <option value="hard">困难</option>
          </select>
        </div>
        
        <!-- 页面背景风格 -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-600 mb-3">页面背景风格</h3>
          <div class="grid grid-cols-5 gap-2">
            <button data-bg-style="default" class="w-10 h-10 rounded border-2 border-gray-300" style="background-color: #f3f4f6;"></button>
            <button data-bg-style="dark" class="w-10 h-10 rounded border-2 border-gray-300" style="background: linear-gradient(135deg, #232526 0%, #414345 100%);"></button>
            <button data-bg-style="blue" class="w-10 h-10 rounded border-2 border-gray-300" style="background: linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%);"></button>
            <button data-bg-style="green" class="w-10 h-10 rounded border-2 border-gray-300" style="background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);"></button>
            <button data-bg-style="pink" class="w-10 h-10 rounded border-2 border-gray-300" style="background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);"></button>
          </div>
        </div>
        
        <!-- 关于 -->
        <div class="pt-4 border-t border-gray-200">
          <h3 class="text-sm font-semibold text-gray-600 mb-2">关于</h3>
          <p class="text-xs text-gray-500">五子棋对战 v1.0.0</p>
          <p class="text-xs text-gray-500">© ${new Date().getFullYear()} 五子棋项目组</p>
        </div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('close-settings').addEventListener('click', this.onClose);

    document.getElementById('ai-difficulty').addEventListener('change', (e) => {
      this.onChangeAIDifficulty(e.target.value); // 确保调用的是正确的方法名
    });

    document.getElementById('bgm-toggle').addEventListener('change', (e) => {
      this.bgmEnabled = e.target.checked;
      this.onToggleBGM(this.bgmEnabled);
    });

      // 添加背景风格按钮事件
    document.querySelectorAll('[data-bg-style]').forEach(button => {
      button.addEventListener('click', (e) => {
        const style = e.currentTarget.dataset.bgStyle;
        this.onChangeBgStyle(style);
      });
    });
  }

  destroy() {
    document.getElementById('close-settings')?.removeEventListener('click', this.onClose);
    document.getElementById('bgm-toggle')?.removeEventListener('change', this.onToggleBGM);
    document.getElementById('ai-difficulty')?.removeEventListener('change', this.onChangeAIDifficulty);
  }
}