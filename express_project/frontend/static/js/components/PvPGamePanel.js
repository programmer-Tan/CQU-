//file: frontend/static/js/components/PvPGamePanel.js
export class PvPGamePanel {
  constructor(onBackClick, onSendMessage, onSettingsClick) {
    this.onBackClick = onBackClick;
    // this.onSwapClick = onSwapClick;
    // this.onUndoClick = onUndoClick;
    this.onSendMessage = onSendMessage;
    this.onSettingsClick = onSettingsClick;
    this.playerColor = 1; // 默认玩家颜色，1:黑棋，2:白棋
    this.isRoomOwner = false; // 是否是房主
    this.opponentConnected = false; // 对手是否连接
  }

  render() {
    return `
      <div class="max-w-6xl w-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
        <header class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
          <button id="pvp-back-btn" class="flex items-center px-4 py-2 bg-blue-800/90 hover:bg-blue-900 rounded-lg transition-colors duration-200">
            <i class="fa fa-arrow-left mr-2"></i>返回
          </button>
          <h1 class="text-xl font-bold">双人对战</h1>
          <div id="connection-status" class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span class="text-sm">已连接</span>
          </div>
        </header>
        
        <main class="p-6 flex flex-col lg:flex-row gap-6">
          <!-- 棋盘区域 -->
          <div class="relative w-full lg:w-2/3 aspect-square max-w-2xl mx-auto">
            <div id="board" class="w-full h-full board-wood rounded-lg shadow-inner"></div>
          </div>
          
          <!-- 控制面板 -->
          <div class="w-full lg:w-1/3 flex flex-col gap-6">
            <!-- 游戏状态区域 -->
            <div class="bg-gray-50 rounded-lg p-6 shadow-sm flex flex-col gap-6">
              <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-lg font-semibold text-gray-800">游戏状态</h2>
                  <span id="current-player" class="px-3 py-1 rounded-full bg-black text-white text-sm font-medium">
                    <i class="fa fa-circle mr-1"></i>黑方回合
                  </span>
                </div>
                
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center">
                    <i class="fa fa-clock-o text-blue-600 mr-2"></i>
                    <span class="text-gray-700">思考时间:</span>
                  </div>
                  <span id="timer" class="font-mono text-gray-800">00:10</span>
                </div>
                
                <div id="game-message" class="text-center py-2 px-3 bg-gray-100 rounded text-gray-700">
                  等待对手加入...
                </div>
              </div>
              
              <!-- 玩家信息 -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-3 rounded-lg shadow text-center">
                  <div class="w-12 h-12 mx-auto mb-2 rounded-full ${this.playerColor === 1 ? 'bg-black' : 'bg-gray-200'} flex items-center justify-center text-white text-xl">
                    <i class="fa fa-user"></i>
                  </div>
                  <h3 class="font-medium text-gray-800">你 (${this.playerColor === 1 ? '黑棋' : '白棋'})</h3>
                  <p class="text-xs text-gray-500">${this.isRoomOwner ? '房主' : '玩家'}</p>
                </div>
                <div class="bg-white p-3 rounded-lg shadow text-center">
                  <div class="w-12 h-12 mx-auto mb-2 rounded-full ${this.playerColor === 1 ? 'bg-gray-200' : 'bg-black'} flex items-center justify-center text-white text-xl">
                    <i class="fa fa-user"></i>
                  </div>
                  <h3 class="font-medium text-gray-800">对手 (${this.playerColor === 1 ? '白棋' : '黑棋'})</h3>
                  <p id="opponent-status" class="text-xs ${this.opponentConnected ? 'text-green-500' : 'text-gray-500'}">
                    ${this.opponentConnected ? '已连接' : '等待连接...'}
                  </p>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="grid grid-cols-2 gap-3">
                <button id="settings-btn" class="col-span-2 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                  <i class="fa fa-cog mr-2"></i>游戏设置
                </button>
                <button id="invite-btn" class="col-span-2 ${this.isRoomOwner ? 'block' : 'hidden'} bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 shadow">
                  <i class="fa fa-share-alt mr-2"></i>邀请好友
                </button>
              </div>
            </div>
            
            <!-- 聊天区域 -->
            <div class="flex-1 bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col">
              <h3 class="text-lg font-semibold text-gray-800 mb-3">聊天</h3>
              <div id="chat-messages" class="flex-1 overflow-y-auto mb-4 flex flex-col gap-2 p-2 bg-white rounded-lg"></div>
              <div class="flex gap-2">
                <input id="chat-input" type="text" placeholder="输入消息..." 
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button id="send-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  发送
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('pvp-back-btn').addEventListener('click', this.onBackClick);
    // document.getElementById('swap-btn').addEventListener('click', this.onSwapClick);
    // // document.getElementById('undo-btn').addEventListener('click', this.onUndoClick);
    // document.getElementById('undo-btn')?.addEventListener('click', this.onUndoClick);
    document.getElementById('send-btn').addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      this.onSendMessage(input.value);
      input.value = '';
    });
    document.getElementById('settings-btn').addEventListener('click', this.onSettingsClick);
    
    // 回车发送消息
    document.getElementById('send-btn').addEventListener('click', (e) => {
      if (e.key === 'Enter') {
        const input = document.getElementById('chat-input');
        this.onSendMessage(input.value);
        input.value = '';
      }
    });

    document.getElementById('invite-btn')?.addEventListener('click', this.onInviteClick);
  }

  addChatMessage(message, isSelf = true) {
    const chatContainer = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isSelf ? 'self' : 'other'} p-3 rounded-lg`;
    messageElement.innerHTML = `
      <div class="font-medium">${isSelf ? '你' : '对手'}</div>
      <div class="text-sm">${message}</div>
      <div class="text-xs text-gray-500 text-right mt-1">${new Date().toLocaleTimeString()}</div>
    `;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  destroy() {
    document.getElementById('pvp-back-btn')?.removeEventListener('click', this.onBackClick);
    // document.getElementById('swap-btn')?.removeEventListener('click', this.onSwapClick);
    // document.getElementById('undo-btn')?.removeEventListener('click', this.onUndoClick);
    document.getElementById('send-btn')?.removeEventListener('click', this.onSendMessage);
    document.getElementById('settings-btn')?.removeEventListener('click', this.onSettingsClick);
    document.getElementById('invite-btn')?.removeEventListener('click', this.onInviteClick);
  }

  updatePlayerStatus(playerColor, isRoomOwner, opponentConnected) {
      this.playerColor = playerColor;
      this.isRoomOwner = isRoomOwner;
      this.opponentConnected = opponentConnected;
      
      // 重新渲染玩家信息部分
      const playerInfoContainer = document.querySelector('.grid.grid-cols-2.gap-4');
      if (playerInfoContainer) {
          playerInfoContainer.innerHTML = `
          <div class="bg-white p-3 rounded-lg shadow text-center">
              <div class="w-12 h-12 mx-auto mb-2 rounded-full ${this.playerColor === 1 ? 'bg-black' : 'bg-gray-200'} flex items-center justify-center text-white text-xl">
                  <i class="fa fa-user"></i>
              </div>
              <h3 class="font-medium text-gray-800">你 (${this.playerColor === 1 ? '黑棋' : '白棋'})</h3>
              <p class="text-xs text-gray-500">${this.isRoomOwner ? '房主' : '玩家'}</p>
          </div>
          <div class="bg-white p-3 rounded-lg shadow text-center">
              <div class="w-12 h-12 mx-auto mb-2 rounded-full ${this.playerColor === 1 ? 'bg-gray-200' : 'bg-black'} flex items-center justify-center text-white text-xl">
                  <i class="fa fa-user"></i>
              </div>
              <h3 class="font-medium text-gray-800">对手 (${this.playerColor === 1 ? '白棋' : '黑棋'})</h3>
              <p id="opponent-status" class="text-xs ${this.opponentConnected ? 'text-green-500' : 'text-gray-500'}">
                  ${this.opponentConnected ? '已连接' : '等待连接...'}
              </p>
          </div>
          `;
      }
      
      // 更新当前玩家显示
      const currentPlayerElement = document.getElementById('current-player');
      if (currentPlayerElement) {
          currentPlayerElement.innerHTML = `
          <i class="fa ${this.playerColor === 1 ? 'fa-circle' : 'fa-circle-o'} mr-1"></i>
          ${this.playerColor === 1 ? '黑棋' : '白棋'} (你)
          `;
      }
  }

}