#backend/app.py
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from game.game_manager import GameManager
from game.ai import AIPlayer
from config import Config
import logging
from datetime import datetime


# 配置日志系统
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.SECRET_KEY


# 2. 然后初始化SocketIO（关键位置）
socketio = SocketIO(
    app,
    cors_allowed_origins="*",          # 允许所有跨域请求
    async_mode='gevent',               # 使用gevent异步模式
    logger=True,                       # 启用Socket.IO日志
    engineio_logger=True,              # 启用Engine.IO日志
    ping_timeout=30,                   # 心跳超时(秒)
    ping_interval=25                   # 心跳间隔(秒)
)


game_manager = GameManager()  # 游戏管理器实例

def api_response(success, message=None, data=None, status_code=200):
    """统一API响应格式"""
    response = {
        'success': success,
        'timestamp': datetime.now().isoformat()  # 添加时间戳
    }
    if message:
        response['message'] = message
    if data:
        response['data'] = data
    return jsonify(response), status_code

# HTTP API路由
@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return api_response(True, "服务运行正常")

@app.route('/api/create-room', methods=['POST'])
def create_room():
    """创建新游戏房间"""
    try:
        # 可选：检查最大房间数限制
        if len(game_manager.rooms) >= Config.MAX_ROOMS:
            return api_response(False, "服务器房间已满", status_code=429)
            
        room_id = game_manager.create_room()
        logger.info(f"房间创建成功: {room_id}")
        return api_response(True, "房间创建成功", {'room_id': room_id})
    except Exception as e:
        logger.error(f"创建房间失败: {str(e)}")
        return api_response(False, "创建房间失败", status_code=500)

@app.route('/api/join-room/<room_id>', methods=['POST'])
def join_room_api(room_id):
    """加入现有游戏房间"""
    try:
        player_name = request.json.get('player_name', '匿名玩家')
        success, message = game_manager.join_room(room_id, request.sid, player_name)
        if success:
            logger.info(f"玩家 {player_name} 加入房间 {room_id}")
            return api_response(True, message)
        else:
            logger.warning(f"加入房间失败 {room_id}: {message}")
            return api_response(False, message, status_code=400)
    except Exception as e:
        logger.error(f"加入房间出错: {str(e)}")
        return api_response(False, "服务器内部错误", status_code=500)

@app.route('/api/ai-move', methods=['POST'])
def ai_move():
    """获取AI落子位置"""
    try:
        data = request.json
        if not data or 'board' not in data:
            return api_response(False, "请求数据无效", status_code=400)
            
        # 调用AI算法获取落子位置
        row, col = AIPlayer.get_move(
            data['board'],
            data.get('lastMove'),
            data.get('difficulty', 'normal')  # 默认普通难度
        )
        logger.info(f"AI生成落子位置: ({row}, {col})")
        return api_response(True, data={'row': row, 'col': col})
    except Exception as e:
        logger.error(f"AI落子生成失败: {str(e)}")
        return api_response(False, "AI落子生成失败", status_code=500)

# WebSocket事件处理
@socketio.on('connect')
def handle_connect():
    """处理客户端连接事件"""
    logger.info(f'客户端已连接: {request.sid}')
    emit('connection_ack', {'message': '连接成功', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    """处理客户端断开事件"""
    logger.info(f'客户端断开连接: {request.sid}')
    room_id = game_manager.remove_player(request.sid)
    if room_id:
        emit('player_left', {
            'sid': request.sid,
            'timestamp': datetime.now().isoformat()
        }, room=room_id)

        
@socketio.on('create_room')
def handle_create_room(data=None):
    """处理创建房间事件"""
    try:
        if len(game_manager.rooms) >= Config.MAX_ROOMS:
            emit('error', {'message': '服务器房间已满'})
            return
            
        room_id = game_manager.create_room()
        join_room(room_id)
        emit('room_created', {'room_id': room_id})
        logger.info(f"房间创建成功: {room_id}")
    except Exception as e:
        logger.error(f"创建房间失败: {str(e)}")
        emit('error', {'message': '创建房间失败'})

   
@socketio.on('join')
def handle_join(data):
    try:
        room_id = data['room']
        player_name = data.get('player_name', '匿名玩家')
        join_room(room_id)
        
        # 获取房间当前玩家数量
        room = game_manager.get_room(room_id)
        if not room:
            emit('error', {'message': '房间不存在'})
            return
            
        # 设置玩家颜色：第一个玩家为黑棋(1)，第二个为白棋(2)
        color = 1 if len(room.players) == 0 else 2
        
        success, message = game_manager.join_room(room_id, request.sid, player_name)
        if not success:
            emit('error', {'message': message})
            return
            
        # 发送玩家加入通知
        emit('player_joined', {
            'sid': request.sid,
            'player_name': player_name,
            'color': color,
            'is_owner': len(room.players) == 1,
            'timestamp': datetime.now().isoformat()
        }, room=room_id)
        
        # 如果是第二个玩家加入，发送游戏开始事件
        if len(room.players) == 2:
            emit('game_start', {
                'black_player': room.players[0].sid,
                'white_player': room.players[1].sid,
                'current_player': 1,  # 黑棋先手
                'board': room.board,
                'timestamp': datetime.now().isoformat()
            }, room=room_id)
            
    except Exception as e:
        logger.error(f"加入房间出错: {str(e)}")
        emit('error', {'message': '加入房间失败'})     

        
@socketio.on('move')
def handle_move(data):
    """处理玩家落子事件"""
    try:
        room_id = data['room']
        room = game_manager.get_room(room_id)
        if not room:
            emit('error', {'message': '房间不存在'})
            return
        
        move_data = data['move']
        # 验证落子是否有效并判断胜负
        valid, winner = room.make_move(
            move_data['row'],
            move_data['col'],
            move_data['color']
        )
        
        if valid:
            logger.info(f"房间 {room_id} 落子位置: ({move_data['row']}, {move_data['col']})")
            # 广播落子事件，包含完整的落子信息和获胜状态
            emit('move_made', {
                'row': move_data['row'],
                'col': move_data['col'],
                'color': move_data['color'],  # 明确传递棋子颜色（1:黑棋，2:白棋）
                'winner': winner,             # 获胜方（None表示游戏继续）
                'player_sid': request.sid,    # 发送方的SocketIO会话ID
                'timestamp': datetime.now().isoformat()
            }, room=room_id)  # 关键：确保广播到同一房间
            
            if winner:
                logger.info(f"房间 {room_id} 游戏结束. 获胜方: {winner}")
                # 可额外广播游戏结束事件（可选）
                emit('game_over', {'winner': winner}, room=room_id)
        else:
            emit('invalid_move', {'message': '无效的落子位置'})
    except Exception as e:
        logger.error(f"处理落子出错: {str(e)}")
        emit('error', {'message': '处理落子失败'})

# @socketio.on('swap')
# def handle_swap(data):
#     """处理交换棋子颜色事件"""
#     try:
#         room_id = data['room']
#         room = game_manager.get_room(room_id)
#         if room and len(room.players) == 2:
#             # 交换双方棋子颜色
#             for player in room.players:
#                 player.color = 2 if player.color == 1 else 1
#             logger.info(f"房间 {room_id} 棋子颜色已交换")
#             emit('swap_made', {
#                 'timestamp': datetime.now().isoformat()
#             }, room=room_id)
#     except Exception as e:
#         logger.error(f"交换棋子颜色出错: {str(e)}")
#         emit('error', {'message': '交换棋子颜色失败'})

# @socketio.on('undo')
# def handle_undo(data):
#     """处理悔棋事件"""
#     try:
#         room_id = data['room']
#         room = game_manager.get_room(room_id)
#         if room and len(room.move_history) >= 1:
#             # 从历史记录中移除最后一步
#             last_move = room.move_history.pop()
#             # 清空棋盘上的该位置
#             room.board[last_move[0]][last_move[1]] = 0
#             # 切换当前玩家
#             room.current_player = last_move[2]
#             logger.info(f"房间 {room_id} 悔棋位置: ({last_move[0]}, {last_move[1]})")
#             emit('undo_accepted', {
#                 'row': last_move[0],
#                 'col': last_move[1],
#                 'timestamp': datetime.now().isoformat()
#             }, room=room_id)
#     except Exception as e:
#         logger.error(f"处理悔棋出错: {str(e)}")
#         emit('error', {'message': '悔棋失败'})

# backend/app.py (修改部分)
# @socketio.on('undo_request')
# def handle_undo_request(data):
#     room_id = data['room']
#     requestor_sid = data['requestor']
#     print(f"[DEBUG] 悔棋请求: room={room_id}, requestor={requestor_sid}")
    
#     room = game_manager.get_room(room_id)
#     if not room:
#         print(f"[ERROR] 房间不存在: {room_id}")
#         emit('error', {'message': '房间不存在'}, to=requestor_sid)
#         return
    
#     if len(room.players) < 2:
#         print(f"[ERROR] 玩家不足: 当前玩家数={len(room.players)}")
#         emit('error', {'message': '需要等待对手加入才能悔棋'}, to=requestor_sid)
#         return
    
#     # 找到对手的socket.id
#     opponent = next((p for p in room.players if p.sid != requestor_sid), None)
#     if not opponent:
#         emit('error', {'message': '对手未找到'}, to=requestor_sid)
#         return
    
#     # 向对手发送悔棋请求
#     emit('undo_requested', {
#         'requestor': requestor_sid,
#         'timestamp': datetime.now().isoformat()
#     }, to=opponent.sid)
    
#     logger.info(f"悔棋请求已转发: {requestor_sid} -> {opponent.sid}")

# @socketio.on('undo_response')
# def handle_undo_response(data):
#     room_id = data['room']
#     accepted = data['accepted']
#     requestor_sid = data['requestor']
    
#     room = game_manager.get_room(room_id)
#     if not room:
#         return
    
#     # 1. 通知请求者结果
#     emit('undo_result', {
#         'accepted': accepted,
#         'new_board': room.board if accepted else None,
#         'current_player': room.current_player if accepted else None
#     }, to=requestor_sid)
    
#     # 2. 如果同意，执行悔棋逻辑
#     if accepted:
#         if room.move_history:
#             last_move = room.move_history.pop()
#             room.board[last_move[0]][last_move[1]] = 0
#             room.current_player = last_move[2]
        
#         # 广播更新后的棋盘状态
#         emit('game_state_update', {
#             'board': room.board,
#             'current_player': room.current_player
#         }, room=room_id)        
        
@socketio.on('chat')
def handle_chat(data):
    try:
        room_id = data['room']
        message = data.get('message', '')
        sender_name = data.get('sender_name', '匿名玩家')
        if message.strip():
            logger.info(f"房间 {room_id} 聊天消息来自 {request.sid}: {message}")
            # 广播给房间内其他玩家（跳过发送者）
            emit('chat', {
                'sender_sid': request.sid,
                'sender_name': sender_name,
                'message': message,
                'timestamp': datetime.now().isoformat()
            }, room=room_id, skip_sid=request.sid)  # 关键：跳过发送者
    except Exception as e:
        logger.error(f"处理聊天消息出错: {str(e)}")


# @socketio.on('undo_response')
# def handle_undo_response(data):
#     room_id = data['room']
#     accepted = data['accepted']
#     requestor = data['requestor']
    
#     if accepted:
#         room = game_manager.get_room(room_id)
#         if room:
#             # 执行悔棋逻辑
#             for _ in range(data.get('move_count', 1)):
#                 if room.move_history:
#                     last_move = room.move_history.pop()
#                     room.board[last_move[0]][last_move[1]] = 0
#                     room.current_player = last_move[2]
    
#     emit('undo_result', {
#         'accepted': accepted,
#         'new_board': room.board if accepted else None,
#         'current_player': room.current_player if accepted else None
#     }, to=requestor)

if __name__ == '__main__':
    logger.info("启动服务器...")
    socketio.run(app, 
                host=Config.HOST,  # 监听地址
                port=Config.PORT,  # 监听端口
                debug=Config.DEBUG,  # 调试模式
                log_output=Config.LOG_OUTPUT)  # 日志输出