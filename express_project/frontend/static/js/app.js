//frontend/static/js/app.js
// app.js - 前端主入口文件
import { WelcomePanel } from './components/WelcomePanel.js';
import { AIGamePanel } from './components/AIGamePanel.js';
import { PvPGamePanel } from './components/PvPGamePanel.js';
import { SettingsPanel } from './components/SettingPanel.js';
import { AIGame } from './game/AIGame.js';
import { PvPGame } from './game/PvPGame.js';

// 主应用类
class App {
  constructor() {
    this.currentPanel = null;
    this.init();
  }

  init() {
    // 初始化主容器
    this.appElement = document.getElementById('app');
    
    // 显示欢迎面板
    this.showWelcomePanel();
    
    // 初始化音效
    this.initAudio();
  }

  showWelcomePanel() {
    this.clearCurrentPanel();
    
    this.currentPanel = new WelcomePanel(
      () => this.showAIGame(),      // 人机对战回调
      () => this.showPvPGame(),     // 双人对战回调
      () => this.showSettings()      // 设置回调
    );
    
    this.appElement.innerHTML = this.currentPanel.render();
    this.currentPanel.bindEvents();
  }

  showAIGame() {
    this.clearCurrentPanel();
    
    this.currentPanel = new AIGamePanel(
      () => this.showWelcomePanel(), // 返回回调
      () => this.restartAIGame(),   // 重新开始回调
      () => this.undoMove(),        // 悔棋回调
      () => this.showSettings()      // 设置回调
    );
    
    this.appElement.innerHTML = this.currentPanel.render();
    this.currentPanel.bindEvents();
    
    // 初始化AI游戏逻辑
    this.game = new AIGame();
    this.game.init();
  }

  showPvPGame() {
    this.clearCurrentPanel();
    
    this.currentPanel = new PvPGamePanel(
      () => this.showWelcomePanel(),
      // () => this.swapPieces(),
      // () => this.game?.requestUndo(), // 确保这里正确指向game实例
      // () => this.requestUndo(),
      (msg) => this.game?.addChatMessage(msg, true),
      () => this.showSettings()
    );
    
    this.appElement.innerHTML = this.currentPanel.render();
    this.currentPanel.bindEvents();
    
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    this.game = new PvPGame(roomId);
    this.game.panel = this.currentPanel; // 将面板实例传递给游戏
    
    if (!roomId) {
      this.generateInviteLink();
    }
  }

  showSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    settingsPanel.classList.remove('hidden');
    
    this.settingsPanel = new SettingsPanel(
      () => this.closeSettings(),    // 关闭回调
      (difficulty) => this.changeAIDifficulty(difficulty), // 修正为小写c的changeAIDifficulty
      (enabled) => this.toggleBGM(enabled), // BGM开关回调
      (style) => this.changeBgStyle(style) // 新增背景风格回调
    );
    
    settingsPanel.innerHTML = this.settingsPanel.render();
    this.settingsPanel.bindEvents();
  }

  // 其他功能方法
  clearCurrentPanel() {
    if (this.currentPanel && this.currentPanel.destroy) {
      this.currentPanel.destroy();
    }
    this.appElement.innerHTML = '';
  }

  closeSettings() {
    document.getElementById('settings-panel').classList.add('hidden');
    if (this.settingsPanel && this.settingsPanel.destroy) {
      this.settingsPanel.destroy();
    }
  }

  initAudio() {
    // 预加载音效
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = 0.5; // 设置默认音量
    });
  }

  // 游戏控制方法
  restartAIGame() {
    if (this.game) {
      this.game.destroy();
      this.game = new AIGame();
      this.game.init();
    }
  }

  undoMove() {
    if (this.game && this.game.undoLastMove) {
      this.game.undoLastMove();
    }
  }

  // AI难度设置方法
  changeAIDifficulty(difficulty) {
    if (this.game && this.game.setDifficulty) {
      this.game.setDifficulty(difficulty);
    }
    localStorage.setItem('ai-difficulty', difficulty);
  }

  // 其他方法实现...
  changeBgStyle(style) {
    document.getElementById('main-body').className = `bg-style-${style} min-h-screen`;
    localStorage.setItem('bg-style', style);
  }

  toggleBGM(enabled) {
    const bgm = document.getElementById('bgm-audio');
    if (enabled) {
      bgm.play().catch(e => console.log('自动播放被阻止:', e));
    } else {
      bgm.pause();
    }
    localStorage.setItem('bgm', enabled ? 'on' : 'off');
  }

  generateInviteLink() {
    if (!this.game) return;
    
    // 如果是房主，创建房间；如果是加入者，使用现有房间ID
    const roomId = this.game.roomId || Math.random().toString(36).substring(2, 8);
    const inviteLink = `${window.location.origin}?room=${roomId}`;
    
    // 复制到剪贴板
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert(`邀请链接已复制到剪贴板:\n${inviteLink}`);
    }).catch(() => {
      prompt('请手动复制邀请链接:', inviteLink);
    });
    
    return roomId;
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  // 恢复用户设置
  const savedBgStyle = localStorage.getItem('bg-style') || 'default';
  document.getElementById('main-body').className = `bg-style-${savedBgStyle} min-h-screen`;
  
  const bgmEnabled = localStorage.getItem('bgm') === 'on';
  if (bgmEnabled) {
    document.getElementById('bgm-audio').play().catch(e => console.log('BGM自动播放被阻止:', e));
  }

  // 启动应用
  window.app = new App();
});