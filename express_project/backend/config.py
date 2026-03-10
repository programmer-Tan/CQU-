# backend/config.py
import os
from datetime import timedelta

class Config:
    # 游戏常量
    BOARD_SIZE = 15       # 棋盘大小
    AI_MAX_DEPTH = 4      # AI搜索深度
    
    # 安全密钥配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')  # 生产环境应使用更复杂的密钥
    
    # 服务器网络配置
    HOST = os.getenv('HOST', '0.0.0.0')  # 默认监听所有接口
    PORT = int(os.getenv('PORT', 5000))   # 默认端口5000
    DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')  # 调试模式
    
    # 消息队列配置
    SOCKETIO_MESSAGE_QUEUE = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # 游戏参数配置
    AI_THINK_TIME = int(os.getenv('AI_THINK_TIME', 2))  # AI思考时间(秒)
    MAX_ROOMS = int(os.getenv('MAX_ROOMS', 100))        # 最大房间数
    GAME_TIMEOUT = timedelta(minutes=30)               # 房间超时时间
    AI_MAX_DEPTH = 4     # AI最大搜索深度
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')         # 日志级别
    LOG_OUTPUT = os.getenv('LOG_OUTPUT', 'True').lower() in ('true', '1', 't')
    
    # 数据库配置 (如需)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///game.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS配置
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '*').split(',')
    
    # 性能配置
    SOCKETIO_PING_TIMEOUT = int(os.getenv('SOCKETIO_PING_TIMEOUT', 60))  # 心跳超时(秒)
    SOCKETIO_PING_INTERVAL = int(os.getenv('SOCKETIO_PING_INTERVAL', 25))  # 心跳间隔(秒)

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    SOCKETIO_MESSAGE_QUEUE = os.getenv('REDIS_URL', 'redis://redis:6379/0')

# 环境配置映射
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}