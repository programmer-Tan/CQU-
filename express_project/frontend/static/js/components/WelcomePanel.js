//file: frontend/static/js/components/WelcomePanel.js
export class WelcomePanel {
  constructor(onAIClick, onPvPClick, onSettingsClick) {
    this.onAIClick = onAIClick;
    this.onPvPClick = onPvPClick;
    this.onSettingsClick = onSettingsClick;
  }

  render() {
    return `
      <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105">
        <header class="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 text-center">
          <h1 class="text-3xl font-bold mb-2">五子棋对战</h1>
          <p class="text-amber-100">体验经典策略游戏的乐趣</p>
        </header>
        <div class="p-8 flex flex-col gap-6">
          <button id="btn-vs-ai" class="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-4 px-6 rounded-lg text-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
            <i class="fa fa-robot mr-2"></i>人机对战
            <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
          </button>
          
          <button id="btn-vs-player" class="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-lg text-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
            <i class="fa fa-users mr-2"></i>双人对战
            <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
          </button>
          
          <button id="btn-settings" class="group relative overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 py-4 px-6 rounded-lg text-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
            <i class="fa fa-cog mr-2"></i>游戏设置
            <span class="absolute inset-0 bg-black opacity-0 group-hover:opacity-05 transition-opacity duration-300"></span>
          </button>
        </div>
        <footer class="bg-gray-100 p-4 text-center text-gray-600 text-sm">
          © ${new Date().getFullYear()} 五子棋对战 | 经典策略游戏
        </footer>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('btn-vs-ai').addEventListener('click', this.onAIClick);
    document.getElementById('btn-vs-player').addEventListener('click', this.onPvPClick);
    document.getElementById('btn-settings').addEventListener('click', this.onSettingsClick);
  }

  destroy() {
    // 清理事件监听器
    document.getElementById('btn-vs-ai')?.removeEventListener('click', this.onAIClick);
    document.getElementById('btn-vs-player')?.removeEventListener('click', this.onPvPClick);
    document.getElementById('btn-settings')?.removeEventListener('click', this.onSettingsClick);
  }
}