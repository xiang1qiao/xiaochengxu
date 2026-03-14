from model import Base, engine

# 删除所有表
Base.metadata.drop_all(engine)

# 重新创建所有表
Base.metadata.create_all(engine)

print("数据库表已重置")