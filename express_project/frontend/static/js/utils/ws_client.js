//file: frontend/static/js/utils/ws_client.js
import io from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

export class WSClient {
  constructor(onMove, onChat, onPlayerCount) {
    this.socket = null;
    this.roomId = null;
    this.onMove = onMove;
    // this.onSwap = onSwap;
    // this.onUndo = onUndo;
    this.onChat = onChat;
    this.onPlayerCount = onPlayerCount;
  }

  connect() {
    // this.socket = io('http://localhost:5000', { 
    //   transports: ['websocket'],
    //   path: '/socket.io'
    // });

    this.socket = io('http://localhost:5000', {  // 确保端口与后端一致
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });


    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      if (this.roomId) {
        this.joinRoom(this.roomId);
      }
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
    
    this.socket.on('move', (move) => {
      this.onMove?.(move);
    });
    
    // this.socket.on('swap', () => {
    //   this.onSwap?.();
    // });
    
    // this.socket.on('undo', (data) => {
    //   this.onUndo?.(data.accepted);
    // });
    
    this.socket.on('chat', (message) => {
      this.onChat?.(message, false);
    });
    
    this.socket.on('player_count', (data) => {
      this.onPlayerCount?.(data.count);
    });
  }

  joinRoom(roomId) {
    this.roomId = roomId;
    if (this.socket?.connected) {
      this.socket.emit('join', { room: roomId });
    }
  }

  sendMove(move) {
    if (this.socket?.connected && this.roomId) {
      this.socket.emit('move', { room: this.roomId, move });
    }
  }

  requestSwap() {
    if (this.socket?.connected && this.roomId) {
      this.socket.emit('swap', { room: this.roomId });
    }
  }

  requestUndo() {
    if (this.socket?.connected && this.roomId) {
      this.socket.emit('undo', { room: this.roomId });
    }
  }

  sendChatMessage(message) {
    if (this.socket?.connected && this.roomId) {
      this.socket.emit('chat', { room: this.roomId, message });
    }
  }

  disconnect() {
    if (this.socket) {
      if (this.roomId) {
        this.socket.emit('leave', { room: this.roomId });
      }
      this.socket.disconnect();
    }
  }


}

// 辅助函数：从URL获取房间号
export function getRoomId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('room') || '';
}