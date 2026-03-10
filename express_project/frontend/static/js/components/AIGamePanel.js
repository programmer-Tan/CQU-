//file: frontend/static/js/components/AIGamePanel.js
export class AIGamePanel {
  constructor(onBackClick, onRestartClick, onUndoClick, onSettingsClick) {
    this.onBackClick = onBackClick;
    this.onRestartClick = onRestartClick;
    this.onUndoClick = onUndoClick;
    this.onSettingsClick = onSettingsClick;
  }

  render() {
    return `
      <div class="max-w-5xl w-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
        <header class="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 flex justify-between items-center">
          <button id="ai-back-btn" class="flex items-center px-4 py-2 bg-amber-800/90 hover:bg-amber-900 rounded-lg transition-colors duration-200">
            <i class="fa fa-arrow-left mr-2"></i>返回
          </button>
          <h1 class="text-xl font-bold">人机对战</h1>
          <div class="w-10"></div> <!-- 保持对称 -->
        </header>
        
        <main class="p-6 flex flex-col lg:flex-row gap-6">
          <!-- 棋盘区域 -->
          <div class="relative w-full lg:w-2/3 aspect-square max-w-2xl mx-auto">
            <div id="board" class="w-full h-full board-wood rounded-lg shadow-inner"></div>
          </div>
          
          <!-- 控制面板 -->
          <div class="w-full lg:w-1/3 bg-gray-50 rounded-lg p-6 flex flex-col gap-6 shadow-sm">
            <!-- 游戏状态 -->
            <div class="bg-white p-4 rounded-lg shadow">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold text-gray-800">游戏状态</h2>
                <span id="current-player" class="px-3 py-1 rounded-full bg-black text-white text-sm font-medium">
                  <i class="fa fa-circle mr-1"></i>黑方回合
                </span>
              </div>
              
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <i class="fa fa-clock-o text-amber-600 mr-2"></i>
                  <span class="text-gray-700">思考时间:</span>
                </div>
                <span id="timer" class="font-mono text-gray-800">00:10</span>
              </div>
              
              <div id="game-message" class="text-center py-2 px-3 bg-gray-100 rounded text-gray-700">
                请开始你的回合
              </div>
            </div>
            
            <!-- 棋手选择 -->
            <div class="bg-white p-4 rounded-lg shadow">
              <h3 class="text-sm font-semibold text-gray-600 mb-2">棋手选择</h3>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="first-player" value="black" checked 
                    class="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500">
                  <span class="text-gray-700">黑棋先手</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="first-player" value="white" 
                    class="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500">
                  <span class="text-gray-700">白棋先手</span>
                </label>
              </div>
            </div>
            
            <!-- 难度选择 -->
            <div class="bg-white p-4 rounded-lg shadow">
              <h3 class="text-sm font-semibold text-gray-600 mb-2">AI难度</h3>
              <select id="ai-difficulty" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="easy">简单</option>
                <option value="normal" selected>普通</option>
                <option value="hard">困难</option>
              </select>
            </div>
            
            <!-- 操作按钮 -->
            <div class="grid grid-cols-2 gap-3">
              <button id="restart-btn" class="col-span-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 shadow">
                <i class="fa fa-refresh mr-2"></i>重新开始
              </button>
              <button id="undo-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                <i class="fa fa-undo mr-2"></i>悔棋
              </button>
              <button id="settings-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                <i class="fa fa-cog mr-2"></i>设置
              </button>
            </div>
            
            <!-- 游戏规则 -->
            <div class="bg-white p-4 rounded-lg shadow">
              <h3 class="text-sm font-semibold text-gray-600 mb-2">游戏规则</h3>
              <ul class="text-xs text-gray-600 space-y-1">
                <li class="flex items-start">
                  <span class="text-amber-600 mr-1">•</span> 黑方先手，双方轮流落子
                </li>
                <li class="flex items-start">
                  <span class="text-amber-600 mr-1">•</span> 先在横、竖、斜方向连成五子者获胜
                </li>
                <li class="flex items-start">
                  <span class="text-amber-600 mr-1">•</span> 点击棋盘交叉点落子
                </li>
                <li class="flex items-start">
                  <span class="text-amber-600 mr-1">•</span> 超时未落子将自动随机落子
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('ai-back-btn').addEventListener('click', this.onBackClick);
    document.getElementById('restart-btn').addEventListener('click', this.onRestartClick);
    document.getElementById('undo-btn').addEventListener('click', this.onUndoClick);
    document.getElementById('settings-btn').addEventListener('click', this.onSettingsClick);
  }

  destroy() {
    document.getElementById('ai-back-btn')?.removeEventListener('click', this.onBackClick);
    document.getElementById('restart-btn')?.removeEventListener('click', this.onRestartClick);
    document.getElementById('undo-btn')?.removeEventListener('click', this.onUndoClick);
    document.getElementById('settings-btn')?.removeEventListener('click', this.onSettingsClick);
  }
}