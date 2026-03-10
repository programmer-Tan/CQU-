// frontend/static/js/utils/api.js
const API_BASE_URL = 'http://localhost:5000';

export async function getAIMove(board, lastMove, difficulty = 'normal') {
  try {
    const requestData = {
      board: board,
      lastMove: lastMove || null,
      difficulty: difficulty
    };

    const response = await fetch(`${API_BASE_URL}/api/ai-move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取AI移动失败:', error);
    throw error;
  }
}

// 其他API函数可以在这里添加
export async function createRoom() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/create-room`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('创建房间失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('创建房间失败:', error);
    throw error;
  }
}

export async function joinRoom(roomId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/join-room/${roomId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('加入房间失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('加入房间失败:', error);
    throw error;
  }
}