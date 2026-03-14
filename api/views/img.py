import os
import uuid
from flask import request, jsonify, send_file
from model import db, ImgModel
from tools.user_jwt import ParseToekn
from tools import pageGet
from ultralytics import YOLO
from sqlalchemy import desc
from datetime import datetime
from utils import chatApi

path = "file/img"
os.makedirs(path, exist_ok=True)
modelPath = 'ultralytics-main/best.pt'


class ImgFileClass:
    # 分配对应的处理请求函数
    def allot(self):
        if request.method == 'GET':
            return self.imgGet()
        elif request.method == 'POST':
            return self.imgPost()
        else:
            return "Method not allowed", 405

    # 图片显示
    def imgGet(self):
        try:
            mode = request.args.get("mode")
            mid = request.args.get("mid")
            
            file_path = None
            
            # 尝试将mid转换为整数，检查是否是数据库ID
            try:
                mid_id = int(mid)
                # 检查输入图片
                obj = db.query(ImgModel).filter(ImgModel.id == mid_id).first()
                if obj:
                    # 首先尝试小程序端的图片路径
                    if obj.input_img_name:
                        file_path = os.path.join(path, obj.input_img_name)
                    elif obj.out_img_name:
                        file_path = os.path.join(path, obj.out_img_name)
                    
                    # 如果小程序端没有找到，尝试网页端的图片
                    if not file_path or not os.path.exists(file_path):
                        # 构建网页端文件的绝对路径
                        web_file_path = os.path.join('..', '..', 'medicinedetection_springboot', 'files')
                        
                        # 尝试直接访问网页端的文件
                        import glob
                        
                        # 查找所有可能的图片文件
                        all_files = glob.glob(os.path.join(web_file_path, '*'))
                        for web_file in all_files:
                            # 检查文件名是否在input_img或out_img中
                            if os.path.basename(web_file) in (obj.input_img or obj.out_img):
                                file_path = web_file
                                break
            except ValueError:
                # mid不是整数，可能是UUID，直接在目录中查找
                # 尝试小程序端的图片
                file_path = os.path.join(path, f"{mid}.jpg")
                if not os.path.exists(file_path):
                    # 尝试其他扩展名
                    import glob
                    files = glob.glob(os.path.join(path, f"{mid}.*"))
                    if files:
                        file_path = files[0]
                    else:
                        # 尝试网页端的图片
                        web_file_path = os.path.join('..', '..', 'medicinedetection_springboot', 'files')
                        files = glob.glob(os.path.join(web_file_path, f"{mid}.*"))
                        if files:
                            file_path = files[0]
                        else:
                            # 尝试匹配包含mid的文件
                            all_files = glob.glob(os.path.join(web_file_path, '*'))
                            for web_file in all_files:
                                if mid in os.path.basename(web_file):
                                    file_path = web_file
                                    break
            
            # 最后的尝试：遍历所有可能的图片目录
            if not file_path or not os.path.exists(file_path):
                import glob
                # 检查小程序端的file/img目录
                all_files = glob.glob(os.path.join(path, '*'))
                for f in all_files:
                    if os.path.exists(f):
                        file_path = f
                        break
                
                # 检查网页端的files目录
                if not file_path:
                    web_file_path = os.path.join('..', '..', 'medicinedetection_springboot', 'files')
                    all_files = glob.glob(os.path.join(web_file_path, '*'))
                    for f in all_files:
                        if os.path.exists(f):
                            file_path = f
                            break
            
            if not file_path or not os.path.exists(file_path):
                return jsonify({"code": 503, "msg": "未找该图片", "data": ""}), 200
            
            if mode:
                # 下载模式
                return send_file(file_path, as_attachment=True, download_name=os.path.basename(file_path))
            else:
                # 预览模式
                return send_file(file_path)

        except Exception as e:
            return jsonify({"code": 503, "msg": "未找到该文件", "data": str(e)}), 200

    # 图片上传
    def imgPost(self):
        file_obj = request.files.get('file')
        if not file_obj:
            return jsonify({"code": 503, "msg": "请提交文件", "data": None}), 200

        # 生成文件名
        file_uuid = str(uuid.uuid4())
        file_ext = file_obj.filename.split(".")[-1]
        file_name = f"{file_uuid}.{file_ext}"
        save_path = f"{path}/{file_name}"

        # 上传人验证
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err:
            return jsonify({"code": 401, "msg": "请重新登录", "data": None}), 200
        username = token_dic['data']['username']

        # 保存文件
        file_obj.save(save_path)

        # 存入数据库
        new_dic = {
            "username": username,
            "input_img_name": file_name,  # 存储文件名
            "start_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }

        try:
            new_img = ImgModel(**new_dic)
            db.add(new_img)
            db.commit()
            # 构建文件 URL，使用数据库生成的id作为mid参数
            file_url = f"https://127.0.0.1:8000/api/img?mid={new_img.id}"
            # 更新input_img字段
            new_img.input_img = file_url
            db.commit()
            # 返回数据库生成的id
            return jsonify({"code": 200, "msg": "上传成功", "data": new_img.id}), 200
        except Exception as e:
            db.rollback()
            os.remove(save_path)
            return jsonify({"code": 503, "msg": "图片保存失败", "data": str(e)}), 200


class ImgListClass:
    def allot(self):
        if request.method == 'GET':
            return self.imgList()
        elif request.method == 'DELETE':
            return self.imgDel()
        else:
            return "Method not allowed", 405

    # 图片列表
    def imgList(self):

        # 验证是否已登录
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err:
            return jsonify({"code": 401, "msg": "请重新登录", "data": None}), 200

        # 分页计算
        page, pagesize = pageGet.pageSizeGet(request)
        start_page = page * pagesize - pagesize

        # 查询条件
        username = request.args.get("username", "")
        file_name = request.args.get("file_name", "")
        created_at_start = request.args.get("created_at_start", "")
        created_at_end = request.args.get("created_at_end", "")

        # 构建查询
        query = db.query(ImgModel)
        
        # 权限控制 管理员可以看所有的  普通用户只能查看自己的
        if token_dic["data"]['level'] != 10:
            query = query.filter(ImgModel.username == token_dic['data']['username'])
        elif username:
            query = query.filter(ImgModel.username.like(f"%{username}%"))

        # 执行查询
        datas = query.order_by(desc(ImgModel.id)).offset(start_page).limit(pagesize).all()
        result = []
        for i in datas:
            item = i.to_dict()
            # 转换字段名以匹配前端期望
            # 从input_img_name中提取UUID作为mid_raw
            if i.input_img_name:
                item['mid_raw'] = i.input_img_name.split('.')[0]  # 使用input_img_name中的UUID作为mid_raw
            else:
                item['mid_raw'] = i.id  #  fallback到数据库id
            # 从out_img_name中提取UUID作为mid_handle
            if i.out_img_name:
                item['mid_handle'] = i.out_img_name.split('.')[0]  # 使用out_img_name中的UUID作为mid_handle
            else:
                item['mid_handle'] = i.id  # fallback到数据库id
            item['file_name'] = i.input_img_name  # 使用input_img_name作为file_name
            item['CreatedAt'] = i.start_time  # 使用start_time作为CreatedAt
            item['item'] = i.label  # 使用label作为item
            result.append(item)

        # 查询总数
        total = query.count()

        return jsonify({
            "code": 200,
            "msg": "查询成功",
            "data": {
                "data": result,
                "total": total
            }
        }), 200

    # 删除图片
    def imgDel(self):
        # 验证是否登录
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err:
            return jsonify({"code": 401, "msg": "请重新登录", "data": None}), 200

        ids = request.args.get("id", "")
        if not ids:
            return jsonify({"code": 503, "msg": "请选择需要删除的数据", "data": ""}), 200
        ids = [int(i) for i in ids.split(",") if i]

        # 权限控制 管理员可以删除所有数据 普通用户只能删除自己的
        if token_dic["data"]['level'] == 10:
            objs = db.query(ImgModel).filter(ImgModel.id.in_(ids)).all()
        else:
            objs = db.query(ImgModel).filter(
                ImgModel.id.in_(ids),
                ImgModel.username == token_dic['data']['username']
            ).all()

        if not objs:
            return jsonify({"code": 503, "msg": "数据不存在", "data": ""}), 200

        # 删除文件和记录
        count = 0
        for obj in objs:
            try:
                # 从 URL 中提取文件路径并删除
                if obj.input_img:
                    file_name = obj.input_img.split('/')[-1]
                    file_path = os.path.join(path, file_name)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                if obj.out_img:
                    file_name = obj.out_img.split('/')[-1]
                    file_path = os.path.join(path, file_name)
                    if os.path.exists(file_path):
                        os.remove(file_path)
            except Exception as e:
                print(f"删除文件时出错: {e}")
                
            db.delete(obj)
            count += 1
                

        db.commit()
        return jsonify({"code": 200, "msg": f"成功删除了{count}条数据", "data": ""}), 200



cnName = {

}


# 图片检测
def ImgDetection():
    # 验证是否登录
    auth_header = request.headers.get('Authorization')
    token_dic, err = ParseToekn(auth_header)
    if err:
        return jsonify({"code": 401, "msg": "请重新登录", "data": None}), 200

    mid_raw = request.json.get("mid_raw", "")
    if not mid_raw:
        return jsonify({"code": 503, "msg": "请先选择上传图片", "data": None}), 200

    # 查找图片数据
    obj = db.query(ImgModel).filter(ImgModel.id == mid_raw).first()
    if not obj:
        return jsonify({"code": 503, "msg": "未找到对应图片信息", "data": None}), 200

    # 使用数据库中存储的文件名来查找文件
    if obj.input_img_name:
        img_path = os.path.join(path, obj.input_img_name)
    else:
        # 尝试从input_img URL中提取文件名
        import glob
        files = glob.glob(os.path.join(path, '*'))
        img_path = None
        for file in files:
            if os.path.basename(file) in obj.input_img:
                img_path = file
                break
    
    if not img_path or not os.path.exists(img_path):
        return jsonify({"code": 503, "msg": "未找到对应图片文件", "data": None}), 200

    # 进行预测
    try:
        model = YOLO(modelPath)
        results = model.predict(img_path)

        nameDic = {}
        mid_handle = str(uuid.uuid4())
        output_path = f"{path}/{mid_handle}.jpg"
        
        # 存储置信度和标签的列表，用于与网页格式保持一致
        confidences = []
        labels = []

        for result in results:
            if result.boxes is not None:
                for i, box in enumerate(result.boxes):  
                    class_id = int(box.cls.item())
                    class_name = model.names[class_id]
                    
                    x1, y1, x2, y2 = box.xyxy.tolist()[0]

                    name = cnName.get(class_name)
                    if name == None:
                        name = class_name
                    nameDic[f"{name} {i}"] = {
                        "id":i+1,
                        "置信度":  round(box.conf.item(), 2), 
                        "类别":name,
                        "坐标": {
                                "x1":  round(x1, 2),
                                "y1": round(y1, 2),
                                "x2": round(x2, 2) ,
                                "y2": round(y2, 2) 
                            }
                    }
                    
                    # 添加到置信度和标签列表
                    confidences.append(round(box.conf.item(), 2))
                    labels.append(name)

            # 保存图片
            result.save(filename=output_path)

        nameList = []
        for key,val in nameDic.items():
            nameList.append(key)
        
        name = ",".join(nameList)

        # 构建输出图片 URL，使用mid_handle作为mid参数
        output_url = f"https://127.0.0.1:8000/api/img?mid={mid_handle}"

        # 导入json模块，用于将列表转换为JSON字符串
        import json
        
        # 生成AI建议
        ai = 'Qwen'  # 默认使用Qwen AI
        suggestion = '未选择AI，无AI建议！'
        
        if labels:
            chat = chatApi.ChatAPI(
                deepseek_api_key='',
                qwen_api_key='sk-etlmfnyowtlavwiyezgyqanqehsgvmncbyjsnhpvyfcibwsc'
            )
            list_input = labels
            text = ("我使用yolo对中药材进行检测。接下来我会告诉你检测到了哪些目标。"\
                    "请你帮我生成一些实质性的分析。只需回答我要的结果。这是我检测到的结果：")
            for i in list_input:
                text += i
                text += "，"
            messages = [
                {"role": "user",
                 "content": text}
            ]
            suggestion = chat.qwen_request(messages)
        
        # 更新数据，使用与网页一致的格式
        obj.out_img = output_url
        obj.out_img_name = f"{mid_handle}.jpg"  # 存储输出图片文件名
        obj.confidence = json.dumps(confidences)  # 存储为JSON格式的置信度列表
        obj.label = json.dumps(labels)  # 存储为JSON格式的标签列表
        obj.ai = ai
        obj.suggestion = suggestion
        db.commit()

        return jsonify({"code": 200, "msg": "检测完成", "data": {"mid":mid_handle, "name":nameDic, "suggestion": suggestion}}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"code": 503, "msg": f"检测失败: {str(e)}", "data": None}), 200


imgFileApi = ImgFileClass()
imgListApi = ImgListClass()
