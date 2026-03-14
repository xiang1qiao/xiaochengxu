from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

import pytz

shanghai_tz = pytz.timezone('Asia/Shanghai')  # 获取上海时区

Base = declarative_base()


# 用户信息表
class UserModel(Base):
    __tablename__ = 'user'  # 表名
    # 序号
    id = Column(Integer, primary_key=True)
    # 用户ID
    uid = Column(String(64), unique=True, comment='用户ID')
    
    # 用户名
    username = Column(String(32), unique=True, comment='用户名')
    # 密码
    password = Column(String(64), comment='密码')
    # 昵称
    name = Column(String(32), default='', comment='昵称')
    # 性别
    sex = Column(String(10), default='', comment='性别')
    # 邮箱
    email = Column(String(64), default='', comment='邮箱')
    # 电话
    tel = Column(String(11), default='', comment='电话')
    # 角色
    role = Column(String(20), default='common', comment='角色')

    # 将模型转换为字典
    def to_dict(self):
        return {
            'id': self.id,
            'uid': self.uid,
            'username': self.username,
            'password': self.password,
            'name': self.name,
            'sex': self.sex,
            'email': self.email,
            'tel': self.tel,
            'role': self.role,
            'level': 10 if self.role == 'admin' else 1  # 兼容level字段
        }


# 图片管理上传表
class ImgModel(Base):
    __tablename__ = 'imgrecords'  # 表名

    # 序号
    id = Column(Integer, primary_key=True)

    # 输入图片路径
    input_img = Column(String(255), comment='输入图片路径')
    # 输入图片文件名
    input_img_name = Column(String(255), comment='输入图片文件名')
    # 输出图片路径
    out_img = Column(String(255), comment='输出图片路径')
    # 输出图片文件名
    out_img_name = Column(String(255), comment='输出图片文件名')
    # 置信度
    confidence = Column(Text, comment='置信度')
    # 总时间
    all_time = Column(String(255), comment='总时间')
    # 配置
    conf = Column(String(255), comment='配置')
    # 权重
    weight = Column(String(255), comment='权重')
    # 用户名
    username = Column(String(255), comment='用户名')
    # 开始时间
    start_time = Column(String(255), comment='开始时间')
    # 标签
    label = Column(Text, comment='标签')
    # AI 结果
    ai = Column(String(255), comment='AI 结果')
    # 建议
    suggestion = Column(Text, comment='建议')

    # 将模型转换为字典
    def to_dict(self):
        return {
            'id': self.id,
            'input_img': self.input_img,
            'input_img_name': self.input_img_name,
            'out_img': self.out_img,
            'out_img_name': self.out_img_name,
            'confidence': self.confidence,
            'all_time': self.all_time,
            'conf': self.conf,
            'weight': self.weight,
            'username': self.username,
            'start_time': self.start_time,
            'label': self.label,
            'ai': self.ai,
            'suggestion': self.suggestion,
        }


# 视频管理上传表（统一使用videorecords表）
class VideoModel(Base):
    __tablename__ = 'videorecords'  # 表名：统一使用网页端的videorecords表

    # 序号
    id = Column(Integer, primary_key=True)

    # 网页端字段
    weight = Column('weight', String(255), default='best.pt', comment='模型权重')
    inputVideo = Column('input_video', String(255), default='', comment='原视频URL（网页端使用）')
    outVideo = Column('out_video', String(255), default='', comment='处理结果URL（网页端使用）')
    conf = Column('conf', String(255), default='0.5', comment='置信度阈值')
    username = Column('username', String(64), comment='用户名')
    startTime = Column('start_time', String(255), comment='识别时间（网页端使用）')

    # 小程序端字段
    file_name = Column('file_name', String(255), default='', comment='文件名称')
    mid_raw = Column('mid_raw', String(64), default='', comment='原文件ID（小程序端使用）')
    mid_handle = Column('mid_handle', String(64), default='', comment='检测后文件ID（小程序端使用）')
    path_raw = Column('path_raw', String(128), default='', comment='原文件路径（小程序端使用）')
    path_handle = Column('path_handle', String(128), default='', comment='处理后文件路径（小程序端使用）')
    item = Column('item', Text, default='', comment='检测到的中药材类别（逗号分隔）')
    kind = Column('kind', String(255), default='', comment='视频类型')
    created_at = Column('created_at', DateTime, default=lambda: datetime.now(shanghai_tz), comment='上传时间')
    updated_at = Column('updated_at', DateTime, default=lambda: datetime.now(shanghai_tz), onupdate=lambda: datetime.now(shanghai_tz), comment='最近修改时间')

    # 兼容旧字段（保持向后兼容）
    @property
    def CreatedAt(self):
        return self.created_at

    @property
    def UpdatedAt(self):
        return self.updated_at

    # 将模型转换为字典
    def to_dict(self):
        return {
            'id': self.id,
            # 网页端字段
            'weight': self.weight,
            'inputVideo': self.inputVideo,
            'outVideo': self.outVideo,
            'conf': self.conf,
            'username': self.username,
            'startTime': self.startTime,
            # 小程序端字段
            'file_name': self.file_name,
            'mid_raw': self.mid_raw,
            'mid_handle': self.mid_handle,
            'path_raw': self.path_raw,
            'path_handle': self.path_handle,
            'item': self.item,
            'kind': self.kind,
            # 兼容旧字段
            'CreatedAt': self.created_at.astimezone(shanghai_tz).strftime(
                '%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'UpdatedAt': self.updated_at.astimezone(shanghai_tz).strftime(
                '%Y-%m-%d %H:%M:%S') if self.updated_at else None,
            'created_at': self.created_at.astimezone(shanghai_tz).strftime(
                '%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.astimezone(shanghai_tz).strftime(
                '%Y-%m-%d %H:%M:%S') if self.updated_at else None,
        }


# # 创建数据库引擎
# engine = create_engine('sqlite:///db.sqlite', connect_args={'check_same_thread': False}, echo=False,
#     pool_size=30,  # 增加核心连接数
#     max_overflow=30,  # 增加溢出连接数
#     pool_timeout=10,  # 连接等待超时时间
#     )

mysql_database = 'medicine'  # 数据库名
mysql_username = 'root'  # 数据库用户名
mysql_password = '123456'  # 数据库密码
mysql_host = 'localhost'  #服务器地址
mysql_port = '3306'  # 端口，默认3306

# 创建MySQL连接
engine = create_engine(
      f'mysql+pymysql://{mysql_username}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}',
      echo=False,
      pool_size=30,  # 增加核心连接数
      max_overflow=30,  # 增加溢出连接数#     pool_timeout=10,  # 连接等待超时时间
  )

# 创建会话
Session = sessionmaker(bind=engine)
db = scoped_session(Session)

# 创建表
Base.metadata.create_all(engine)
