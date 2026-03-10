#backend/game/game_manager.py
from uuid import uuid4
from .models import GameRoom, Player
from config import Config  # 添加这行导入

class GameManager:
    def __init__(self):
        self.rooms = {}  # {room_id: GameRoom}
    
    def create_room(self):
        """创建新房间"""
        if len(self.rooms) >= Config.MAX_ROOMS:  # 现在Config已正确导入
            return None
        
        room_id = str(uuid4())
        self.rooms[room_id] = GameRoom(room_id)  # 修正拼写错误
        return room_id
    
    def get_room(self, room_id):
        """获取房间实例"""
        return self.rooms.get(room_id)
    
    def join_room(self, room_id, sid, player_name=None):
        """玩家加入房间"""
        room = self.get_room(room_id)
        if not room:
            return False, "房间不存在"
        
        if len(room.players) >= 2:
            return False, "房间已满"
        
        # 设置玩家颜色：第一个加入的是黑棋，第二个是白棋
        color = 1 if len(room.players) == 0 else 2
        player = Player(sid, color)
        if player_name:
            player.name = player_name
        room.players.append(player)
        
        # 如果房间已有两个玩家，开始游戏
        if len(room.players) == 2:
            room.reset_game()
        
        
        return True, f"分配为{'黑棋' if color == 1 else '白棋'}" 
    
    def remove_player(self, sid):
        """玩家离开房间"""
        room_to_leave = None
        for room in self.rooms.values():
            for player in room.players:
                if player.sid == sid:
                    room_to_leave = room
                    break
            if room_to_leave:
                break
        
        if room_to_leave:
            # 移除玩家
            room_to_leave.players = [p for p in room_to_leave.players if p.sid != sid]
            
            # 如果房间为空则清理
            if not room_to_leave.players:
                del self.rooms[room_to_leave.room_id]
                return None
                
            # 如果只剩一个玩家，重置游戏状态
            if len(room_to_leave.players) == 1:
                room_to_leave.reset_game()
                return room_to_leave.room_id
                
        return None