import uuid
from flask import request, jsonify
from model import db, UserModel
from sqlalchemy import desc
from tools import pageGet
from tools.user_jwt import ParseToekn

#创建默认管理员账号
def adminCreate():
    # 检测账号是否已存在

    ex = db.query(UserModel).filter_by(username="admin").first()
    if ex:
         print("管理员账号已存在")
         return

    # 创建数据
    user_uid = str(uuid.uuid4())  # 生成 UUID
    data = UserModel(
        uid=user_uid,
        username="admin",
        password="admin",
        name="初始管理员",
        role='admin'
    )
    # 保存数据
    try:
        db.add(data)  # 添加
        db.commit()  # 提交操作
    except Exception as e:
        db.rollback()
        print("管理员账号添加失败")
        return

    print("初始管理员创建成功")


def normalUserCreate(username, password, name="普通用户", phone=""):
    # 1. 检查账号是否已存在
    ex = db.query(UserModel).filter_by(username=username).first()
    if ex:
        print(f"普通用户 {username} 已存在")
        return
    # 2. 创建普通用户（level=0）
    user_uid = str(uuid.uuid4())
    normal_user = UserModel(
        uid=user_uid,
        username=121212,
        password=123,  # 注意：实际项目需加密！
        name=name,
        phone=phone,
        level=0  # 普通用户权限
    )
    # 3. 保存到数据库
    try:
        db.add(normal_user)
        db.commit()
        print(f"普通用户 {username} 创建成功，UID：{user_uid}")
    except Exception as e:
        db.rollback()
        print(f"普通用户 {username} 创建失败：{str(e)}")



class UseClass():
    # 分配对应的处理请求函数
    def allot(self):
        if request.method == 'GET':
            return self.listGet()
        elif request.method == 'POST':
            return self.listPost()
        elif request.method == 'PUT':
            return self.listPut()
        elif request.method == 'DELETE':
            return self.listDel()
        else:
            return "Method not allowed", 405

    # 列表获取
    def listGet(self):
        # 验证限权
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err != None:
            return jsonify({'code': 401, 'msg': '请重新登录', 'data': None}), 200
        if token_dic["data"]["level"] != 10:
            # 权限不足
            return jsonify({'code': 403, 'msg': '限权不足', 'data': None}), 200


        page, page_size = pageGet.pageSizeGet(request)
        start = (page - 1) * page_size

        query = db.query(UserModel).order_by(desc(UserModel.id))

        name = request.args.get('name', '')  # 获取搜索参数
        # 有数据的时候就搜索 没有数据的时候就不搜索
        if name != "":
            query = query.filter((UserModel.name.like(f"%{name.strip()}%")))

        username = request.args.get('username', '')
        if username != "":
            query = query.filter((UserModel.username.like(f"%{username}%")))

        phone = request.args.get('phone', '')
        if phone != "":
            query = query.filter((UserModel.phone.like(f"%{phone}%")))

        # 获取数据
        data = query.offset(start).limit(page_size).all()

        # 获取总条数
        total = query.count()

        result = {
            "code": 200,
            "msg": "查询成功",
            "data": {
                "data": [item.to_dict() for item in data],
                "total": total
            }
        }

        return jsonify(result), 200

    # 新增
    def listPost(self):

        # 验证限权
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err != None:
            return jsonify({'code': 401, 'msg': '请重新登录', 'data': None}), 200
        if token_dic["data"]["level"] != 10:
            # 权限不足
            return jsonify({'code': 403, 'msg': '限权不足', 'data': None}), 200

        data = request.get_json()  # 获取json数据
        if not data:
            return jsonify({'code': 503, 'msg': '无效的JSON数据', 'data': None}), 200

        # 提取前端提交的数据
        username = data.get('username', "")
        password = data.get('password', "")
        name = data.get('name', "")
        phone = data.get('phone', "")
        level = data.get('level', "")

        # 验证参数是否添加
        if username == "":
            return jsonify({'code': 503, "msg": "请输入账号", 'data': ""}), 200
        if password == "":
            return jsonify({'code': 503, "msg": "请输入密码", 'data': ""}), 200
        if len(password) < 6:
            return jsonify({'code': 503, "msg": "用户密码最少长度为6位", 'data': ""}), 200
        if name == "":
            return jsonify({'code': 503, "msg": "请填写账号昵称", 'data': ""}), 200

        if level == "":
            level = 1
        else:
            level = int(level)

        # 检测账号是否已存在
        ex = db.query(UserModel).filter_by(username=username).first()
        if ex:
            return jsonify({'code': 503, "msg": "账号已存在", 'data': ""}), 200

        # 创建数据
        data = UserModel(
            username=username,
            password=password,
            name=name,
            tel=phone,  # 存储到tel字段
            role='admin' if level == 10 else 'common'  # 转换为role
        )

        # 保存数据
        try:
            db.add(data)  # 添加
            db.commit()  # 提交操作
        except Exception as e:
            db.rollback()
            return jsonify({'code': 503, "msg": "新建用户失败", 'data': str(e)}), 200

        # 返回数据
        return jsonify({'code': 200, "msg": "新建用户成功", 'data': ""}), 200

    # 修改
    def listPut(self):

        # 限权验证
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err != None:
            return jsonify({'code': 401, 'msg': '请重新登录', 'data': None}), 200
        if token_dic["data"]["level"] != 10:
            return jsonify({'code': 403, 'msg': '权限不足', 'data': None}), 200

        # 数据提取
        data = request.get_json()
        if not data:
            return jsonify({'code': 503, 'msg': '无效的JSON数据', 'data': None}), 200

        # 具体需要更新的数据提取
        uid = data.get('uid')
        name = data.get('name', "")
        phone = data.get('phone', "")
        password = data.get('password', "")
        level = data.get('level', "")

        if uid == "":
            return jsonify({'code': 503, "msg": "请选择数据", 'data': None}), 200

        if name == "":
            return jsonify({'code': 503, "msg": "请填写昵称", 'data': None}), 200

        if password != "":
            if len(password) < 6:
                return jsonify({'code': 503, "msg": "用户密码最少长度为6位", 'data': None}), 200

        if level == "":
            return jsonify({'code': 503, "msg": "请选择限权等级", 'data': None}), 200
        try:
            level_int = int(level)
        except (ValueError, TypeError):
            return jsonify({'code': 503, "msg": "限权等级错误", 'data': None}), 200

        # 注意：这里使用id而不是uid，因为user表的主键是id
        dataObj = db.query(UserModel).filter(UserModel.id == uid).first()
        if not dataObj:
            return jsonify({'code': 503, "msg": "用户数据不存在", 'data': None}), 200

        if password != "":
            dataObj.password = password

        dataObj.name = name
        dataObj.tel = phone  # 存储到tel字段
        dataObj.role = 'admin' if level_int == 10 else 'common'  # 转换为role

        try:
            db.commit()
        except Exception as e:
            db.rollback()
            return jsonify({'code': 503, "msg": "修改用户失败", 'data': str(e)}), 200

        return jsonify({'code': 200, "msg": "修改成功", 'data': None}), 200

    # 删除
    def listDel(self):
        # 限权验证
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err != None:
            return jsonify({'code': 401, 'msg': '请重新登录', 'data': None}), 200
        if token_dic["data"]["level"] != 10:
            return jsonify({'code': 403, 'msg': '权限不足', 'data': None}), 200

        id = request.args.get('id', "")
        if id == "":
            return jsonify({'code': 503, 'msg': '请选择要删除的数据', 'data': None}), 200
        ids = [i for i in id.split(",") if i]

        # 删除数据
        count = db.query(UserModel).filter(UserModel.id.in_(ids)).delete()
        db.commit()

        return jsonify({'code': 200, 'msg': f'成功删了的{count}条数据', 'data': None}), 200



    # 单条获取
    def oneGet(self):
        # 限权验证
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err != None:
            return jsonify({'code': 401, 'msg': '请重新登录', 'data': None}), 200
        if token_dic["data"]["level"] != 10:
            return jsonify({'code': 403, 'msg': '权限不足', 'data': None}), 200

        # 查询单条数据
        uid = request.args.get('uid', '')
        if uid == "":
            return jsonify({'code': 503, 'msg': '数据不存在', 'data': None}), 200

        # 注意：这里使用id而不是uid，因为user表的主键是id
        data = db.query(UserModel).filter(UserModel.id == uid).first()
        if not data:
            return jsonify({'code': 503, 'msg': '数据不存在', 'data': None}), 200

        return jsonify({'code': 200, 'msg': f'查询成功', 'data': data.to_dict()}), 200

adminCreate()
#normalUserCreate(username="user1", password="123456", name="用户1", phone="13800138000")
UseApi = UseClass()
