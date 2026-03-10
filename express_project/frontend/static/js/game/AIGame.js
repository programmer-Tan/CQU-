//file: frontend/static/js/game/AIGame.js
import { getAIMove } from '../utils/api.js';
import { showEffectText, showFireworks, showFailEffect } from './effects.js';

// 游戏常量
const BOARD_SIZE = 15;
const PLAYER_COLOR = 1; // 玩家颜色
const AI_COLOR = 2;     // AI颜色
const EMPTY = 0;

export class AIGame {
  constructor() {
    this.gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    this.currentPlayer = PLAYER_COLOR;
    this.gameOver = false;
    this.moveHistory = [];
    this.timer = null;
    this.timeCount = 10; // 默认10秒思考时间
    this.playerFirst = true; // 默认玩家先手
    this.aiDifficulty = localStorage.getItem('ai-difficulty') || 'normal';
    this.boardElement = document.getElementById('board');
    this.timerElement = document.getElementById('timer');
    this.gameMessageElement = document.getElementById('game-message');
    this.currentPlayerElement = document.getElementById('current-player');
    
    // 绑定事件
    this.bindEvents();
  }

  init() {
    this.initializeBoard();
    this.updateGameStatus();
  }

  bindEvents() {
    // 绑定棋盘点击事件
    this.boardElement.addEventListener('click', (e) => {
      const cell = e.target.closest('[data-row][data-col]');
      if (cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        this.handleCellClick(row, col);
      }
    });

    // 绑定先手选择事件
    document.querySelectorAll('input[name="first-player"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.playerFirst = e.target.value === 'black';
        this.initializeBoard();
      });
    });

    // 绑定难度选择事件
    document.getElementById('ai-difficulty').addEventListener('change', (e) => {
      this.aiDifficulty = e.target.value;
      localStorage.setItem('ai-difficulty', this.aiDifficulty);
    });
  }

  initializeBoard() {
    this.boardElement.innerHTML = '';
    this.gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    this.currentPlayer = this.playerFirst ? PLAYER_COLOR : AI_COLOR;
    this.gameOver = false;
    this.moveHistory = [];
    this.resetTimer();

    // 创建棋盘交叉点
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const cell = document.createElement('div');
        cell.className = 'absolute cursor-pointer hover:bg-black/5 transition-colors';
        cell.style.width = `calc(100% / ${BOARD_SIZE})`;
        cell.style.height = `calc(100% / ${BOARD_SIZE})`;
        cell.style.left = `calc(${j} * (100% / ${BOARD_SIZE}))`;
        cell.style.top = `calc(${i} * (100% / ${BOARD_SIZE}))`;
        cell.dataset.row = i;
        cell.dataset.col = j;
        this.boardElement.appendChild(cell);
      }
    }

    // 如果AI先手，自动下第一步
    if (!this.playerFirst) {
      setTimeout(() => this.makeAIMove(), 500);
    }
  }

  startTimer() {
    clearInterval(this.timer);
    this.timeCount = 10;
    this.updateTimerDisplay();
    
    this.timer = setInterval(() => {
      this.timeCount--;
      this.updateTimerDisplay();
      
      if (this.timeCount <= 0) {
        clearInterval(this.timer);
        this.handleTimeout();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timer);
  }

  resetTimer() {
    this.stopTimer();
    this.timeCount = 10;
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    this.timerElement.textContent = `00:${String(this.timeCount).padStart(2, '0')}`;
  }

  handleCellClick(row, col) {
    if (this.gameOver || this.currentPlayer !== PLAYER_COLOR || this.gameBoard[row][col] !== EMPTY) {
      return;
    }

    // 玩家落子
    this.placePiece(row, col, PLAYER_COLOR);
    this.moveHistory.push({ row, col, player: PLAYER_COLOR });
    this.startTimer();

    // 检查玩家是否获胜
    if (this.checkWin(row, col, PLAYER_COLOR)) {
      this.gameOver = true;
      this.updateGameStatus('黑方获胜！');
      this.stopTimer();
      this.playSound('win');
      showEffectText('恭喜你，胜利啦！', '#ffd700');
      showFireworks();
      return;
    }

    // 切换到AI回合
    this.currentPlayer = AI_COLOR;
    this.updateGameStatus();
    
    // 延迟一下让玩家看到AI回合提示
    setTimeout(() => {
      this.makeAIMove();
    }, 500);
  }

  async makeAIMove() {
    if (this.gameOver || this.currentPlayer !== AI_COLOR) return;
    
    this.stopTimer();
    this.updateGameStatus('AI思考中...');
    
    try {
      const { row: aiRow, col: aiCol, winner } = await getAIMove(
        this.gameBoard, 
        this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length-1] : null, 
        this.aiDifficulty
      );
      
      // 验证AI返回的位置是否有效
      if (
        aiRow >= 0 && aiRow < BOARD_SIZE &&
        aiCol >= 0 && aiCol < BOARD_SIZE &&
        this.gameBoard[aiRow][aiCol] === EMPTY
      ) {
        this.placePiece(aiRow, aiCol, AI_COLOR);
        this.moveHistory.push({ row: aiRow, col: aiCol, player: AI_COLOR });

        if (this.checkWin(aiRow, aiCol, AI_COLOR)) {
          this.gameOver = true;
          this.updateGameStatus('白方获胜！');
          this.playSound('fail');
          showFailEffect();
          return;
        }

        this.currentPlayer = PLAYER_COLOR;
        this.updateGameStatus();
        this.startTimer();
      } else {
        console.error('AI返回无效位置:', aiRow, aiCol);
        // 如果AI返回无效位置，随机选择一个有效位置
        this.makeRandomMove();
      }
    } catch (error) {
      console.error('AI计算错误:', error);
      // 如果API请求失败，随机选择一个位置
      this.makeRandomMove();
    }
  }

  makeRandomMove() {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.placePiece(row, col, AI_COLOR);
      this.moveHistory.push({ row, col, player: AI_COLOR });
      
      if (this.checkWin(row, col, AI_COLOR)) {
        this.gameOver = true;
        this.updateGameStatus('白方获胜！');
        this.playSound('fail');
        return;
      }
    }
    this.currentPlayer = PLAYER_COLOR;
    this.updateGameStatus();
    this.startTimer();
  }

  getEmptyCells() {
    const emptyCells = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (this.gameBoard[i][j] === EMPTY) {
          emptyCells.push([i, j]);
        }
      }
    }
    return emptyCells;
  }

  placePiece(row, col, color) {
    this.gameBoard[row][col] = color;

    const piece = document.createElement('div');
    piece.className = `absolute rounded-full shadow-md transform transition-all duration-200`;
    piece.style.width = `calc(60% / ${BOARD_SIZE})`;
    piece.style.height = `calc(60% / ${BOARD_SIZE})`;
    piece.style.left = `calc(${col} * (100% / (${BOARD_SIZE} - 1)) - (30% / ${BOARD_SIZE}))`;
    piece.style.top = `calc(${row} * (100% / (${BOARD_SIZE} - 1)) - (30% / ${BOARD_SIZE}))`;

    // 根据当前玩家先手设置显示颜色
    const isBlack = (color === PLAYER_COLOR && this.playerFirst) || 
                   (color === AI_COLOR && !this.playerFirst);
    
    piece.classList.add(isBlack ? 'piece-black' : 'piece-white');

    piece.style.transform = 'scale(0)';
    this.boardElement.appendChild(piece);

    setTimeout(() => {
      piece.style.transform = 'scale(1)';
    }, 10);

    this.playMoveSound();
  }

  checkWin(row, col, player) {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1] // 水平、垂直、对角线、反对角线
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // 正方向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dx;
        const newCol = col + i * dy;

        if (
          newRow < 0 || newRow >= BOARD_SIZE ||
          newCol < 0 || newCol >= BOARD_SIZE ||
          this.gameBoard[newRow][newCol] !== player
        ) {
          break;
        }

        count++;
      }

      // 反方向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dx;
        const newCol = col - i * dy;

        if (
          newRow < 0 || newRow >= BOARD_SIZE ||
          newCol < 0 || newCol >= BOARD_SIZE ||
          this.gameBoard[newRow][newCol] !== player
        ) {
          break;
        }

        count++;
      }

      if (count >= 5) {
        return true;
      }
    }

    // 检查平局
    if (this.moveHistory.length === BOARD_SIZE * BOARD_SIZE) {
      this.gameOver = true;
      this.updateGameStatus('游戏平局！');
      this.stopTimer();
      return true;
    }

    return false;
  }

  handleTimeout() {
    // 玩家超时，系统自动为玩家随机落子
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.placePiece(row, col, PLAYER_COLOR);
      this.moveHistory.push({ row, col, player: PLAYER_COLOR });
      
      // 检查是否胜利
      if (this.checkWin(row, col, PLAYER_COLOR)) {
        this.gameOver = true;
        this.updateGameStatus('黑方获胜！');
        this.stopTimer();
        this.playSound('win');
        return;
      }
      
      // 进入AI回合
      this.currentPlayer = AI_COLOR;
      this.updateGameStatus();
      this.stopTimer();
      setTimeout(() => this.makeAIMove(), 500);
    }
  }

  updateGameStatus(message = null) {
    if (message) {
      this.gameMessageElement.textContent = message;
    } else {
      this.gameMessageElement.textContent = this.currentPlayer === PLAYER_COLOR 
        ? '你的回合，请落子' 
        : 'AI思考中...';
    }

    this.currentPlayerElement.innerHTML = this.currentPlayer === PLAYER_COLOR 
      ? `<i class="fa ${this.playerFirst ? 'fa-circle' : 'fa-circle-o'} mr-1"></i>${this.playerFirst ? '黑方' : '白方'}回合` 
      : `<i class="fa ${!this.playerFirst ? 'fa-circle-o' : 'fa-circle'} mr-1"></i>${!this.playerFirst ? '白方' : '黑方'}回合`;

    this.currentPlayerElement.className = this.currentPlayer === PLAYER_COLOR 
      ? 'px-3 py-1 rounded-full bg-black text-white' 
      : 'px-3 py-1 rounded-full bg-white border border-gray-300 text-black';
  }

  undoLastMove() {
    if (this.moveHistory.length === 0) return;

    // 撤销最后一步（无论是AI还是玩家）
    let last = this.moveHistory.pop();
    if (last) {
      this.gameBoard[last.row][last.col] = EMPTY;
      this.removeLastPiece();
    }

    // 如果还有一步，并且上一手是AI，也撤销
    if (this.moveHistory.length > 0 && this.moveHistory[this.moveHistory.length - 1].player !== PLAYER_COLOR) {
      let prev = this.moveHistory.pop();
      this.gameBoard[prev.row][prev.col] = EMPTY;
      this.removeLastPiece();
    }

    // 恢复到玩家回合
    this.currentPlayer = PLAYER_COLOR;
    this.gameOver = false;
    this.updateGameStatus();
    this.startTimer();
  }

  removeLastPiece() {
    const pieces = this.boardElement.querySelectorAll('.piece-black, .piece-white');
    if (pieces.length > 0) {
      const lastPiece = pieces[pieces.length - 1];
      lastPiece.style.transform = 'scale(0)';
      setTimeout(() => lastPiece.remove(), 200);
    }
  }

  playSound(type) {
    if (type === 'win') {
      document.getElementById('win-sound')?.play();
    } else if (type === 'fail') {
      document.getElementById('fail-sound')?.play();
    }
  }

  playMoveSound() {
    document.getElementById('move-sound')?.play();
  }

  destroy() {
    this.stopTimer();
    this.boardElement.innerHTML = '';
    // 清理所有事件监听器
    document.querySelectorAll('input[name="first-player"]').forEach(radio => {
      radio.removeEventListener('change', this.handleFirstPlayerChange);
    });
    document.getElementById('ai-difficulty')?.removeEventListener('change', this.handleDifficultyChange);
  }
}