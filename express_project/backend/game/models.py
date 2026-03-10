# backend/game/models.py
class Player:
    def __init__(self, sid, color):
        self.sid = sid      # SocketIO会话ID
        self.color = color  # 1:黑棋, 2:白棋
        self.name = f"Player-{sid[-4:]}"  # 默认玩家名

class GameRoom:
    def __init__(self, room_id):
        self.room_id = room_id
        self.players = []      # [Player1, Player2]
        self.board = None      # 15x15棋盘
        self.current_player = 1  # 当前玩家颜色
        self.move_history = [] # 落子历史
        self.reset_game()
    
    def reset_game(self):
        """重置游戏状态"""
        self.board = [[0 for _ in range(15)] for _ in range(15)]
        self.current_player = 1
        self.move_history = []
    
    def make_move(self, row, col, color):
        """处理落子逻辑"""
        if (self.current_player != color or
            not (0 <= row < 15 and 0 <= col < 15) or
            self.board[row][col] != 0):
            return False, None
        
        self.board[row][col] = color
        self.move_history.append((row, col, color))
        self.current_player = 2 if color == 1 else 1
        
        winner = self.check_winner(row, col, color)
        return True, winner
    
    def check_winner(self, row, col, color):
        """检查是否获胜"""
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]  # 横、竖、斜、反斜
        
        for dx, dy in directions:
            count = 1
            
            # 正方向检查
            for i in range(1, 5):
                x, y = row + i*dx, col + i*dy
                if not (0 <= x < 15 and 0 <= y < 15) or self.board[x][y] != color:
                    break
                count += 1
            
            # 反方向检查
            for i in range(1, 5):
                x, y = row - i*dx, col - i*dy
                if not (0 <= x < 15 and 0 <= y < 15) or self.board[x][y] != color:
                    break
                count += 1
            
            if count >= 5:
                return color
        
        # 检查平局
        if len(self.move_history) >= 15*15:
            return 0  # 0表示平局
        
        return None  # 游戏继续