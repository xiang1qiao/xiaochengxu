from tools.user_jwt import GenToken, loginStateIs, ParseToekn
import uuid
from flask import request, jsonify
from model import db, UserModel
from sqlalchemy import desc
from tools import pageGet


# 登录
def login():
    result = {
        "code": 0,
        "msg": "",
        "data": None,
    }

    data = request.get_json()
    if not data:
        result["code"] = 503
        result["msg"] = "请提交数据"
        result["data"] = None
        return jsonify(result), 200

    username = data.get('username')
    password = data.get('password')
    if not username:
        result["code"] = 503
        result["msg"] = "请填写用户名"
        result["data"] = None
        return jsonify(result), 200
    if not password:
        result["code"] = 503
        result["msg"] = "请填写密码"
        result["data"] = None
        return jsonify(result), 200

    data = db.query(UserModel).filter(UserModel.username == username).first()
    if not data:
        return jsonify({'code': 503, "msg": "账号或密码错误", 'data': ""}), 200

    if data.password != password:
        return jsonify({'code': 503, "msg": "账号或密码错误", 'data': ""}), 200


    # 生成用户信息token
    level = 10 if data.role == 'admin' else 1
    token = GenToken(data.username, data.uid, level)

    result["code"] = 200
    result["msg"] = "登录成功"
    result["data"] = {
        "token": token,
        "name": data.name,
        "level": level,
        "username": data.username,
    }
    return jsonify(result), 200


# 注册
def register():
    # 获取请求数据
    data = request.get_json()
    if not data:
        return jsonify({'code': 503, "msg": "请提交数据", 'data': ""}), 200

    # 获取提交数据
    username = data.get('username')
    password = data.get('password')

    # 检测内容是否符合规则
    if username == "":
        return jsonify({'code': 503, "msg": "请输入账号", 'data': ""}), 200
    if password == "":
        return jsonify({'code': 503, "msg": "请输入密码", 'data': ""}), 200
    if len(password) < 6:
        return jsonify({'code': 503, "msg": "用户密码最少长度为6位", 'data': ""}), 200

    # 检查用户名是否已存在
    ex = db.query(UserModel).filter(UserModel.username == username).first()
    if ex:
        return jsonify({'code': 503, "msg": "用户名已存在", 'data': ""}), 200

    try:
        # 创建数据
        new_user = UserModel(
            uid=str(uuid.uuid4()),  # 生成用户ID
            username=username,
            name=username,
            password=password,
            level=1
        )
        # 添加到数据库
        db.add(new_user)
        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({'code': 503, "msg": "注册失败", 'data': str(e)}), 200

    # 返回成功响应
    return jsonify({'code': 200, "msg": "注册成功 请登录", 'data': ""}), 200


#个人信息管理
class UseClass():
    # 分配对应的处理请求函数
    def allot(self):
        if request.method == 'GET':
            return self.infoGet()
        elif request.method == 'PUT':
            return self.infoPut()
        else:
            return "Method not allowed", 405

    # 个人信息获取
    def infoGet(self):
        # 验证限权
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err != None:
            return jsonify({'code': 401, 'msg': '请重新登录', 'data': None}), 200
        data = db.query(UserModel).filter(UserModel.username == token_dic["data"]["username"]).first()
        if not data:
            return jsonify({'code': 503, 'msg': '数据不存在', 'data': None}), 200
        return jsonify({'code': 200, 'msg': f'查询成功', 'data': data.to_dict()}), 200


    # 个人信息修改
    def infoPut(self):

        # 限权验证
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err != None:
            return jsonify({'code': 401, 'msg': '请重新登录', 'data': None}), 200



        # 数据提取
        data = request.get_json()
        if not data:
            return jsonify({'code': 503, 'msg': '无效的JSON数据', 'data': None}), 200

        # 具体需要更新的数据提取
        name = data.get('name', "")
        phone = data.get('phone', "")  # 前端传的是phone
        password = data.get('password', "")


        if password != "":
            if len(password) < 6:
                return jsonify({'code': 503, "msg": "用户密码最少长度为6位", 'data': None}), 200


        dataObj = db.query(UserModel).filter(UserModel.username == token_dic["data"]["username"]).first()
        if not dataObj:
            return jsonify({'code': 503, "msg": "用户数据不存在", 'data': None}), 200

        if password != "":
            dataObj.password = password
        if name != "":
            dataObj.name = name
        if phone != "":
            dataObj.tel = phone  # 存储到tel字段

        try:
            db.commit()
        except Exception as e:
            db.rollback()
            return jsonify({'code': 503, "msg": "修改信息失败", 'data': str(e)}), 200

        return jsonify({'code': 200, "msg": "修改成功", 'data': None}), 200




UseApi = UseClass()
