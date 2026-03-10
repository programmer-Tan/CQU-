# backend/game/ai.py
import random
import time
import math
from config import Config

# 扩展的开局库定义
OPENING_BOOK = {
    # 空棋盘时的开局
    "empty_board": [
        (7, 7),  # 天元
        (6, 6), (6, 8), (8, 6), (8, 8),  # 星位
        (7, 6), (6, 7), (7, 8), (8, 7)   # 小目
    ],
    
    # 对手下在天元后的应对
    "7_7": [
        (6, 6), (6, 7), (6, 8),
        (7, 6),         (7, 8),
        (8, 6), (8, 7), (8, 8)
    ],
    
    # 新增更多开局模式
    "common_patterns": [
        # 斜指开局
        [(7, 7), (6, 6), (5, 5), (6, 7), (7, 6)],
        # 横指开局
        [(7, 7), (7, 6), (7, 5), (6, 7), (8, 7)],
        # 竖指开局
        [(7, 7), (6, 7), (5, 7), (7, 6), (7, 8)],
        # 花月开局
        [(7, 7), (7, 6), (8, 5), (6, 7), (5, 8)],
        # 云月开局
        [(7, 7), (7, 6), (8, 6), (6, 5), (5, 4)]
    ],
    
    # 对手下在星位后的应对
    "star_points": {
        (6, 6): [(5, 5), (5, 7), (7, 5), (7, 7)],
        (6, 8): [(5, 7), (5, 9), (7, 7), (7, 9)],
        (8, 6): [(7, 5), (7, 7), (9, 5), (9, 7)],
        (8, 8): [(7, 7), (7, 9), (9, 7), (9, 9)]
    }
}

class AIPlayer:
    @staticmethod
    def get_move(board, last_move, difficulty='normal'):
        """主入口方法，根据难度返回AI落子位置"""
        start_time = time.time()
        
        # 1. 检查AI是否有直接获胜的机会
        win_move = AIPlayer.find_winning_move(board, 2)
        if win_move:
            return win_move
            
        # 2. 检查玩家是否有直接获胜的机会，需要拦截
        block_move = AIPlayer.find_winning_move(board, 1)
        if block_move:
            return block_move
            
        # 3. 检查开局库
        if difficulty != 'easy':
            opening_move = AIPlayer.get_opening_move(board, last_move)
            if opening_move:
                return opening_move
        
        # 4. 根据难度选择搜索深度
        if difficulty == 'easy':
            depth = 1
        elif difficulty == 'normal':
            depth = 3
        else:  # hard
            depth = 5
            
        best_move = AIPlayer.find_best_move(board, depth, last_move)
        
        # 确保AI不会思考太久
        elapsed = time.time() - start_time
        if elapsed < Config.AI_THINK_TIME:
            time.sleep(Config.AI_THINK_TIME - elapsed)
        
        return best_move if best_move else AIPlayer.get_fallback_move(board)

    @staticmethod
    def find_winning_move(board, player):
        """寻找能直接获胜的落子点"""
        for i in range(15):
            for j in range(15):
                if board[i][j] == 0:
                    board[i][j] = player
                    if AIPlayer.check_five_in_row(board, player):
                        board[i][j] = 0
                        return (i, j)
                    board[i][j] = 0
        return None

    @staticmethod
    def get_opening_move(board, last_move):
        """增强版的开局库检查"""
        move_count = sum(1 for row in board for cell in row if cell != 0)
        
        # 只在开局前8步使用开局库
        if move_count > 8:
            return None
        
        if move_count == 0:
            # 空棋盘时随机选择一种开局
            return random.choice(OPENING_BOOK["empty_board"])
        
        if move_count == 1 and last_move == (7,7):
            # 对手下在天元后的应对
            return random.choice(OPENING_BOOK["7_7"])
        
        if move_count == 1 and last_move in OPENING_BOOK["star_points"]:
            # 对手下在星位后的应对
            return random.choice(OPENING_BOOK["star_points"][last_move])
        
        # 检查常见开局模式
        for pattern in OPENING_BOOK["common_patterns"]:
            if len(pattern) > move_count:
                match = True
                for i in range(move_count):
                    if board[pattern[i][0]][pattern[i][1]] != (1 if i % 2 == 0 else 2):
                        match = False
                        break
                if match:
                    return pattern[move_count]
        
        return None

    @staticmethod
    def get_fallback_move(board):
        """备用落子策略"""
        # 优先选择中心区域
        center_cells = [(i,j) for i in range(5,10) for j in range(5,10) if board[i][j] == 0]
        if center_cells:
            return random.choice(center_cells)
            
        # 如果没有中心位置可选，随机选择
        empty_cells = [(i,j) for i in range(15) for j in range(15) if board[i][j] == 0]
        return random.choice(empty_cells) if empty_cells else None

    @staticmethod
    def find_best_move(board, depth, last_move):
        """使用极小极大算法寻找最佳移动"""
        best_move = None
        best_score = -float('inf')
        alpha = -float('inf')
        beta = float('inf')
        
        candidate_moves = AIPlayer.get_candidate_moves(board, last_move)
        
        # 按位置价值排序候选移动
        candidate_moves.sort(
            key=lambda move: AIPlayer.evaluate_position(board, move[0], move[1], 2),
            reverse=True
        )
        
        # 限制搜索的候选移动数量，提高效率
        candidate_moves = candidate_moves[:min(20, len(candidate_moves))]
        
        for move in candidate_moves:
            row, col = move
            board[row][col] = 2  # AI是白棋
            
            score = AIPlayer.minimax(board, depth-1, alpha, beta, False, 2)
            board[row][col] = 0  # 撤销移动
            
            if score > best_score:
                best_score = score
                best_move = move
            
            alpha = max(alpha, best_score)
            if beta <= alpha:
                break
        
        return best_move

    @staticmethod
    def minimax(board, depth, alpha, beta, maximizing_player, player):
        """增强版极小极大算法"""
        # 检查终止条件
        if depth == 0 or AIPlayer.is_terminal(board):
            return AIPlayer.evaluate_board(board, player)
            
        opponent = 3 - player
        
        if maximizing_player:
            max_eval = -float('inf')
            for move in AIPlayer.get_candidate_moves(board, None):
                row, col = move
                board[row][col] = player
                eval = AIPlayer.minimax(board, depth-1, alpha, beta, False, player)
                board[row][col] = 0
                max_eval = max(max_eval, eval)
                alpha = max(alpha, eval)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in AIPlayer.get_candidate_moves(board, None):
                row, col = move
                board[row][col] = opponent
                eval = AIPlayer.minimax(board, depth-1, alpha, beta, True, player)
                board[row][col] = 0
                min_eval = min(min_eval, eval)
                beta = min(beta, eval)
                if beta <= alpha:
                    break
            return min_eval

    @staticmethod
    def get_candidate_moves(board, last_move):
        """智能候选移动生成"""
        candidate_moves = set()
        threat_moves = set()
        
        # 1. 优先检查威胁位置
        for i in range(15):
            for j in range(15):
                if board[i][j] == 0:
                    # 检查对手在这个位置的威胁
                    board[i][j] = 1
                    if AIPlayer.check_five_in_row(board, 1):
                        threat_moves.add((i,j))
                    board[i][j] = 0
                    
        if threat_moves:
            return list(threat_moves)
            
        # 2. 在已有棋子附近搜索
        search_range = 2
        for i in range(15):
            for j in range(15):
                if board[i][j] != 0:
                    for di in range(-search_range, search_range+1):
                        for dj in range(-search_range, search_range+1):
                            ni, nj = i+di, j+dj
                            if 0 <= ni < 15 and 0 <= nj < 15 and board[ni][nj] == 0:
                                candidate_moves.add((ni,nj))
        
        # 3. 如果没有找到候选，返回中心区域
        if not candidate_moves:
            return [(i,j) for i in range(5,10) for j in range(5,10) if board[i][j] == 0]
            
        return list(candidate_moves)

    @staticmethod
    def evaluate_board(board, player):
        """增强版棋盘评估"""
        opponent = 3 - player
        player_score = 0
        opponent_score = 0
        
        # 检查是否有连五
        if AIPlayer.check_five_in_row(board, player):
            return 1000000
        if AIPlayer.check_five_in_row(board, opponent):
            return -1000000
            
        # 评估每个空位
        for i in range(15):
            for j in range(15):
                if board[i][j] == 0:
                    player_score += AIPlayer.evaluate_position(board, i, j, player)
                    opponent_score += AIPlayer.evaluate_position(board, i, j, opponent)
        
        # 给对手的威胁更高权重
        return player_score - opponent_score * 1.2

    @staticmethod
    def evaluate_position(board, row, col, player):
        """增强版位置评估"""
        directions = [(0,1),(1,0),(1,1),(1,-1)]
        total_score = 0
        opponent = 3 - player
        
        # 中心位置加成
        center_dist = math.sqrt((row-7)**2 + (col-7)**2)
        total_score += (7 - center_dist) * 5
        
        # 评估四个方向
        for dx, dy in directions:
            line = []
            for i in range(-4, 5):
                x, y = row + i*dx, col + i*dy
                if 0 <= x < 15 and 0 <= y < 15:
                    line.append(board[x][y])
                else:
                    line.append(-1)
            
            # 评估这个方向的多个5连片段
            for i in range(5):
                segment = line[i:i+5]
                score = AIPlayer.evaluate_segment(segment, player)
                total_score += score
        
        # 特殊棋型检测
        if player == 2:  # 只对AI进行特殊棋型检测
            # 检查双活三
            if AIPlayer.count_threats(board, row, col, player, 3) >= 2:
                total_score += 20000
            
            # 检查双冲四
            if AIPlayer.count_threats(board, row, col, player, 4) >= 2:
                total_score += 40000
        
        return total_score

    @staticmethod
    def count_threats(board, row, col, player, threat_level):
        """计算在(row,col)落子后能形成的特定级别威胁数量"""
        count = 0
        original = board[row][col]
        board[row][col] = player
        
        directions = [(0,1),(1,0),(1,1),(1,-1)]
        
        for dx, dy in directions:
            line = []
            for i in range(-4, 5):
                x, y = row + i*dx, col + i*dy
                if 0 <= x < 15 and 0 <= y < 15:
                    line.append(board[x][y])
                else:
                    line.append(-1)
            
            for i in range(5):
                segment = line[i:i+5]
                player_count = segment.count(player)
                empty_count = segment.count(0)
                
                if threat_level == 3:  # 活三
                    if player_count == 3 and empty_count == 2:
                        count += 1
                elif threat_level == 4:  # 冲四
                    if player_count == 4:
                        count += 1
        
        board[row][col] = original
        return count

    @staticmethod
    def evaluate_segment(segment, player):
        """增强版片段评估"""
        opponent = 3 - player
        player_count = segment.count(player)
        opponent_count = segment.count(opponent)
        empty_count = segment.count(0)
        
        # 对手已经有棋子，这个方向对我们没有价值
        if opponent_count > 0:
            return 0
        
        # 连五
        if player_count == 5:
            return 1000000
        
        # 活四: XXXX_
        if player_count == 4 and empty_count == 1:
            return 100000
        
        # 冲四: _XXXX 或 X_XXX 或 XX_XX 或 XXX_X
        if player_count == 4:
            return 10000
        
        # 活三: _XXX_
        if player_count == 3 and empty_count == 2:
            return 5000
        
        # 眠三: _XXXO 或 OXXX_ 等
        if player_count == 3:
            return 1000
        
        # 活二: _XX_
        if player_count == 2 and empty_count == 3:
            return 500
        
        # 眠二
        if player_count == 2:
            return 100
        
        # 活一: _X_
        if player_count == 1 and empty_count == 4:
            return 10
        
        return 0


    @staticmethod
    def is_terminal(board):
        """检查游戏是否结束"""
        return (AIPlayer.check_five_in_row(board, 1) or 
                AIPlayer.check_five_in_row(board, 2) or
                all(board[i][j] != 0 for i in range(15) for j in range(15)))

    @staticmethod
    def check_five_in_row(board, color):
        """检查指定颜色是否五连珠"""
        for i in range(15):
            for j in range(15):
                if board[i][j] == color and AIPlayer.check_five_from_point(board, i, j, color):
                    return True
        return False

    @staticmethod
    def check_five_from_point(board, row, col, color):
        """从指定点检查五连珠"""
        directions = [(0,1),(1,0),(1,1),(1,-1)]
        
        for dx, dy in directions:
            count = 1
            for i in range(1, 5):
                x, y = row + i*dx, col + i*dy
                if 0 <= x < 15 and 0 <= y < 15 and board[x][y] == color:
                    count += 1
                else:
                    break
            for i in range(1, 5):
                x, y = row - i*dx, col - i*dy
                if 0 <= x < 15 and 0 <= y < 15 and board[x][y] == color:
                    count += 1
                else:
                    break
            
            if count >= 5:
                return True
        
        return False