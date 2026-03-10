// file: frontend/static/js/game/PvPGame.js
import { Board } from './Board.js';
import { showEffectText, showFireworks, showFailEffect } from './effects.js';

export class PvPGame {
  constructor(roomId = null) {
    this.roomId = roomId;
    this.boardSize = 15;
    this.board = new Board(this.boardSize, (row, col) => this.handleCellClick(row, col));
    this.gameState = {
      board: Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0)),
      currentPlayer: 1, // 1: 黑棋, 2: 白棋
      gameOver: false,
      moveHistory: [],
      playerColor: 1, // 默认邀请方为黑棋
      timer: null,
      timeLeft: 15,
      isRoomOwner: !roomId // 如果没有roomId，则是房主
    };
    
    this.initElements();
    this.initSocket();
    this.updateGameStatus();
    // this.requestUndo = this.requestUndo.bind(this); // 绑定 this
  }

  initElements() {
    this.timerElement = document.getElementById('timer');
    this.gameMessageElement = document.getElementById('game-message');
    this.currentPlayerElement = document.getElementById('current-player');
    this.chatMessagesElement = document.getElementById('chat-messages');
    this.chatInputElement = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-btn');
    // this.swapButton = document.getElementById('swap-btn');
    // this.undoButton = document.getElementById('undo-btn');
    this.inviteButton = document.getElementById('invite-btn');
    
    this.bindEvents();
    
    // 如果是房主，显示邀请按钮
    if (this.gameState.isRoomOwner && this.inviteButton) {
      this.inviteButton.style.display = 'block';
    } else if (this.inviteButton) {
      this.inviteButton.style.display = 'none';
    }
  }

  bindEvents() {
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.chatInputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    
    // this.swapButton.addEventListener('click', () => this.requestSwap());
    // this.undoButton.addEventListener('click', () => this.requestUndo());
    
    if (this.inviteButton) {
      this.inviteButton.addEventListener('click', () => this.generateInviteLink());
    }
  }

  initSocket() {
    this.socket = io('http://localhost:5000', {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
        console.log('WebSocket 已连接');
        if (this.roomId) {
            this.socket.emit('join', { 
                room: this.roomId,
                isReconnect: false,
                playerName: '玩家' + Math.floor(Math.random() * 1000) // 添加玩家标识
            });
            this.gameState.isRoomOwner = false;
        } else {
            this.socket.emit('create_room',{
              room: this.roomId
            });
        }
    });

    // 确保正确处理房间创建和加入
    this.socket.on('room_created', (data) => {
        this.roomId = data.room_id;
        window.history.pushState({}, '', `?room=${this.roomId}`);
        this.gameState.isRoomOwner = true;
        this.gameState.playerColor = 1; // 房主为黑棋
        this.updateGameStatus('房间已创建，等待对手加入...');
    });

    this.socket.on('player_joined', (data) => {
        if (!this.gameState.isRoomOwner) {
            this.gameState.playerColor = 2; // 加入者为白棋
        }
        this.updateGameStatus('对手已加入，游戏开始！');
        this.startGame();
    });

    // 确保正确处理游戏状态同步
    this.socket.on('game_state', (state) => {
        this.gameState.board = state.board;
        this.gameState.currentPlayer = state.currentPlayer;
        this.board.clear();
        
        state.board.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell !== 0) {
                    const isBlack = cell === this.gameState.playerColor;
                    this.board.placePiece(rowIndex, colIndex, cell, isBlack);
                }
            });
        });
        this.updateGameStatus();
    });

    
    this.socket.on('disconnect', () => {
      this.updateConnectionStatus(false);
    });

    this.socket.on('move_made', (move) => {
        console.log("收到落子:", move);
        // 仅处理对手的落子（避免重复处理自己的落子）
        if (move.color !== this.gameState.playerColor) {
            this.makeMove(move.row, move.col, move.color);
        }
        // 如果有获胜者，触发游戏结束逻辑
        if (move.winner) {
            this.handleWin(move.winner);
        }
    });
    
    // this.socket.on('swap', () => {
    //   this.handleSwap();
    // });
    
    // this.socket.on('undo', ({ accepted }) => {
    //   this.handleUndoResponse(accepted);
    // });

    // // 修改事件监听器，确保与后端发送的事件名称一致
    // this.socket.on('undo_requested', (data) => {
    //     console.log('收到悔棋请求:', data);  // 调试用
    //     const accept = confirm('对方请求悔棋，是否同意？');
        
    //     // 发送响应给后端
    //     this.socket.emit('undo_response', {
    //         room: this.roomId,
    //         accepted: accept,
    //         requestor: data.requestor
    //     });
    // });
    
    // // 监听悔棋结果
    // this.socket.on('undo_result', (data) => {
    //     if (data.accepted) {
    //       this.undoLastMove();  // 执行悔棋
    //       this.addChatMessage('悔棋已生效', true);
    //     } else {
    //       this.addChatMessage('对方拒绝了悔棋', false);
    //     }
    // });

    // 修改消息接收逻辑
    this.socket.on('chat', (data) => {
        console.log('Received chat message:', data); // 调试日志
        if (data.sender_sid !== this.socket.id) {  // 避免重复处理自己的消息
            this.addChatMessage(data.message, false);
        }
    });

    this.socket.on('connect_error', (err) => {
        console.error('连接失败:', err);
    });
    this.socket.on('reconnect_attempt', () => {
        console.log('尝试重连...');
    });
    
    this.socket.on('player_count', (data) => {
      this.updatePlayerCount(data.count);
    });

    this.socket.on('player_joined', (data) => {
        if (!this.gameState.isRoomOwner) {
            this.gameState.playerColor = 2; // 强制被邀请方为白棋
        }
        this.updateGameStatus('对手已加入，游戏开始！');
        
        // 更新面板显示
        if (this.panel?.updatePlayerStatus) {
            this.panel.updatePlayerStatus(
                this.gameState.playerColor,
                this.gameState.isRoomOwner,
                true // opponentConnected
            );
        }
        
        this.startGame();
    });

    this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        if (error.message && error.message.includes('玩家不足')) {
            this.addChatMessage('需要等待对手加入才能悔棋', true);
        } else {
            this.updateGameStatus(error.message || '发生错误');
        }
    });
  }

  generateInviteLink() {
      if (!this.roomId) {
          this.addChatMessage('房间尚未准备好，请稍候...', true);
          return;
      }
      
      const inviteLink = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
      
      // 现代浏览器复制方案
      if (navigator.share) {
          navigator.share({
              title: '五子棋对战邀请',
              text: '快来和我一起玩五子棋吧！',
              url: inviteLink
          }).catch(err => {
              console.log('分享失败:', err);
              this.copyToClipboard(inviteLink);
          });
      } else {
          this.copyToClipboard(inviteLink);
      }
  }

  copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
          this.addChatMessage('邀请链接已复制，发送给好友即可加入', true);
      }).catch(() => {
          prompt('请手动复制邀请链接:', text);
      });
  }

  startGame() {
    this.board.initialize();
    this.gameState.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    this.gameState.currentPlayer = 1;
    this.gameState.gameOver = false;
    this.gameState.moveHistory = [];
    
    // 房主为黑棋，加入者为白棋
    this.gameState.playerColor = this.gameState.isRoomOwner ? 1 : 2;
    
    this.startTimer();
    this.updateGameStatus();
  }

handleCellClick(row, col) {
    if (this.gameState.gameOver || 
        this.gameState.currentPlayer !== this.gameState.playerColor || 
        this.gameState.board[row][col] !== 0) {
        return;
    }
    
    // 发送移动给服务器
    this.socket.emit('move', { 
        room: this.roomId, 
        move: { 
            row, 
            col, 
            color: this.gameState.playerColor // 使用当前玩家的颜色
        } 
    });
    
    // 本地处理移动
    this.makeMove(row, col, this.gameState.playerColor);
}

  handleRemoteMove(move) {
    if (this.gameState.gameOver || 
        this.gameState.currentPlayer === move.color || 
        this.gameState.board[move.row][move.col] !== 0) {
      return;
    }
    
    this.makeMove(move.row, move.col, move.color);
  }

  makeMove(row, col, color) {
      this.gameState.board[row][col] = color;
      this.gameState.moveHistory.push({ row, col, player: color });
      
      // 修复棋子颜色显示逻辑
      const isBlack = color === 1; // 直接根据颜色参数判断是否为黑棋
      this.board.placePiece(row, col, color, isBlack);
      
      if (this.checkWin(row, col, color)) {
        this.handleWin(color);
        return;
      }
      
      this.gameState.currentPlayer = color === 1 ? 2 : 1;
      this.resetTimer();
      this.updateGameStatus();
  }

  checkWin(row, col, color) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const winPositions = [];

    for (const [dx, dy] of directions) {
      let count = 1;
      const positions = [[row, col]];

      // 正方向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dx;
        const newCol = col + i * dy;
        
        if (newRow < 0 || newRow >= this.boardSize || 
            newCol < 0 || newCol >= this.boardSize || 
            this.gameState.board[newRow][newCol] !== color) {
          break;
        }
        count++;
        positions.push([newRow, newCol]);
      }

      // 反方向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dx;
        const newCol = col - i * dy;
        
        if (newRow < 0 || newRow >= this.boardSize || 
            newCol < 0 || newCol >= this.boardSize || 
            this.gameState.board[newRow][newCol] !== color) {
          break;
        }
        count++;
        positions.unshift([newRow, newCol]);
      }

      if (count >= 5) {
        this.board.highlightWinLine(positions);
        return true;
      }
    }

    // 检查平局
    if (this.gameState.moveHistory.length === this.boardSize * this.boardSize) {
      this.gameState.gameOver = true;
      this.updateGameStatus('游戏平局！');
      this.stopTimer();
      return true;
    }

    return false;
  }

  handleWin(color) {
    this.gameState.gameOver = true;
    this.stopTimer();
    
    const winner = color === 1 ? '黑方' : '白方';
    this.updateGameStatus(`${winner}获胜！`);
    
    if (color === this.gameState.playerColor) {
      showEffectText('恭喜你，胜利啦！', '#ffd700');
      showFireworks();
      document.getElementById('win-sound')?.play();
    } else {
      showFailEffect(); // 添加失败特效
      document.getElementById('fail-sound')?.play();
    }
  }

  // requestSwap() {
  //   this.socket.emit('swap', { room: this.roomId });
  // }

  // handleSwap() {
  //     this.gameState.playerColor = this.gameState.playerColor === 1 ? 2 : 1;
  //     this.updateGameStatus();
  //     this.addChatMessage('双方已交换棋子颜色', false);
      
  //     // 更新面板显示
  //     if (this.panel?.updatePlayerStatus) {
  //         this.panel.updatePlayerStatus(
  //             this.gameState.playerColor,
  //             this.gameState.isRoomOwner,
  //             true // opponentConnected
  //         );
  //     }
  // }

// requestUndo() {
//     if (!this.socket || !this.roomId) {
//         console.error("Socket或房间未初始化");
//         return;
//     }
    
//     // 检查游戏状态
//     if (this.gameState.gameOver) {
//         this.addChatMessage('游戏已结束，不能悔棋', true);
//         return;
//     }
    
//     if (this.gameState.moveHistory.length === 0) {
//         this.addChatMessage('没有可悔棋的步骤', true);
//         return;
//     }
    
//     this.socket.emit('undo_request', {
//         room: this.roomId,
//         requestor: this.socket.id,
//         move_count: 1
//     });
    
//     this.addChatMessage('悔棋请求已发送', true);
// }

//   // 添加处理悔棋请求的方法
//   handleUndoRequest() {
//     const accept = confirm('对方请求悔棋，是否同意？');
//     this.socket.emit('undo_response', {
//       room: this.roomId,
//       accepted: accept,
//       requestor: this.socket.id
//     });
//   }

//   // 更新处理悔棋响应的方法
//   handleUndoResult(data) {
//     if (data.accepted) {
//       this.gameState.board = data.new_board;
//       this.gameState.currentPlayer = data.current_player;
//       this.board.updateState(data.new_board);
//       this.addChatMessage('对方同意了你的悔棋请求', false);
//     } else {
//       this.addChatMessage('对方拒绝了你的悔棋请求', false);
//     }
//   }

//   handleUndoResponse(accepted) {
//     if (accepted) {
//       this.undoLastMove();
//       this.addChatMessage('对方同意了你的悔棋请求', false);
//     } else {
//       this.addChatMessage('对方拒绝了你的悔棋请求', false);
//     }
//   }

  // undoLastMove() {
  //   if (this.gameState.moveHistory.length < 1) return;
    
  //   // 撤销最后一步
  //   const lastMove = this.gameState.moveHistory.pop();
  //   this.gameState.board[lastMove.row][lastMove.col] = 0;
  //   this.board.removeLastPiece();
    
  //   // 如果还有上一步且是对方下的，也撤销
  //   if (this.gameState.moveHistory.length > 0 && 
  //       this.gameState.moveHistory[this.gameState.moveHistory.length - 1].player !== this.gameState.playerColor) {
  //     const prevMove = this.gameState.moveHistory.pop();
  //     this.gameState.board[prevMove.row][prevMove.col] = 0;
  //     this.board.removeLastPiece();
  //   }
    
  //   this.gameState.currentPlayer = this.gameState.playerColor;
  //   this.gameState.gameOver = false;
  //   this.resetTimer();
  //   this.updateGameStatus();
  // }

  // 修改 sendMessage 方法
  sendMessage() {
    const message = this.chatInputElement.value.trim();
    if (message) {
      this.socket.emit('chat', { 
        room: this.roomId, 
        message,
        sender_name: '玩家' + Math.floor(Math.random() * 1000) // 添加发送者名称
      });
      this.addChatMessage(message, true);
      this.chatInputElement.value = '';
    }
  }

  addChatMessage(message, isSelf) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isSelf ? 'self' : 'other'} p-3 rounded-lg`;
    messageElement.innerHTML = `
      <div class="font-medium">${isSelf ? '你' : '对手'}</div>
      <div class="text-sm">${message}</div>
      <div class="text-xs text-gray-500 text-right mt-1">${new Date().toLocaleTimeString()}</div>
    `;
    this.chatMessagesElement.appendChild(messageElement);
    this.chatMessagesElement.scrollTop = this.chatMessagesElement.scrollHeight;
  }

  startTimer() {
    this.stopTimer();
    this.gameState.timeLeft = 15;
    this.updateTimer();
    
    this.gameState.timer = setInterval(() => {
      this.gameState.timeLeft--;
      this.updateTimer();
      
      if (this.gameState.timeLeft <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.gameState.timer) {
      clearInterval(this.gameState.timer);
      this.gameState.timer = null;
    }
  }

  resetTimer() {
    this.stopTimer();
    this.gameState.timeLeft = 15;
    this.updateTimer();
  }

  updateTimer() {
    const minutes = Math.floor(this.gameState.timeLeft / 60);
    const seconds = this.gameState.timeLeft % 60;
    this.timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  handleTimeout() {
    this.stopTimer();
    this.addChatMessage('思考超时，请尽快落子！', false);
  }

  updateGameStatus(message = null) {
    if (message) {
      this.gameMessageElement.textContent = message;
    } else {
      const playerText = this.gameState.currentPlayer === this.gameState.playerColor 
        ? '你的回合' 
        : '对手回合';
      this.gameMessageElement.textContent = playerText;
    }

    const playerColorText = this.gameState.playerColor === 1 ? '黑棋' : '白棋';
    this.currentPlayerElement.innerHTML = `
      <i class="fa ${this.gameState.playerColor === 1 ? 'fa-circle' : 'fa-circle-o'} mr-1"></i>
      ${playerColorText} ${this.gameState.currentPlayer === this.gameState.playerColor ? '(你)' : '(对手)'}
    `;
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
        <span class="text-sm">${connected ? '已连接' : '已断开'}</span>
      `;
    }
  }

  updatePlayerCount(count) {
    const opponentElement = document.querySelector('.bg-white p-3.rounded-lg.shadow.text-center:nth-child(2) p');
    if (opponentElement) {
      opponentElement.textContent = count > 1 ? '已连接' : '等待连接...';
    }
  }

  destroy() {
    this.stopTimer();
    this.board.destroy();
    this.socket?.disconnect();
    
    // 清理事件监听器
    this.sendButton?.removeEventListener('click', this.sendMessage);
    this.chatInputElement?.removeEventListener('keypress', this.handleChatInput);
    // this.swapButton?.removeEventListener('click', this.requestSwap);
    // this.undoButton?.removeEventListener('click', this.requestUndo);
    this.inviteButton?.removeEventListener('click', this.generateInviteLink);
  }
}