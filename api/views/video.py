import os
import uuid
from flask import request, jsonify, send_file
from werkzeug.utils import secure_filename
from model import db, VideoModel
from tools.user_jwt import ParseToekn
from tools import pageGet
from ultralytics import YOLO
import cv2
from sqlalchemy import desc
from datetime import datetime


path = "file/video"
os.makedirs(path, exist_ok=True)
modelPath = 'ultralytics-main/best.pt'


class FileClass():
    # 分配对应的处理请求函数
    def allot(self):
        if request.method == 'GET':
            return self.videoGet()
        elif request.method == 'POST':
            return self.videoPost()
        else:
            return "Method not allowed", 405


    #视频获取显示
    def videoGet(self):
        try:
            mode = request.args.get("mode")
            mid = request.args.get("mid")

            # 查询视频文件数据
            video = db.query(VideoModel).filter(VideoModel.mid_raw == mid).first()
            if video:
                file_path = video.path_raw
            else:
                # 查询检测后的文件
                video = db.query(VideoModel).filter(VideoModel.mid_handle == mid).first()
                if not video:
                    return jsonify({"code": 503, "msg": "未找该文件", "data": ""}), 200
                file_path = video.path_handle

            file_name = video.file_name

            # 检查 file_path 是否是 HTTP URL
            if file_path.startswith("http://") or file_path.startswith("https://"):
                # 如果是 HTTP URL，直接重定向
                from flask import redirect
                return redirect(file_path)
            else:
                # 如果是本地文件路径，使用 send_file
                if mode:
                    # 下载模式
                    return send_file(file_path, as_attachment=True, download_name=file_name)
                else:
                    # 预览模式
                    return send_file(file_path, as_attachment=False)

        except Exception as e:
            return jsonify({"code": 503, "msg": "未找到该文件", "data": ""}), 200

    #视频上传
    def videoPost(self):
        if 'file' not in request.files:
            return jsonify({"code": 503, "msg": "请上传文件", "data": None}), 200

        file_obj = request.files['file']

        # 验证是否登录
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err:
            return jsonify({"code": 401, "msg": "请重新登录", "data": None}), 200

        # 生成文件名
        file_name = file_obj.filename
        file_type = file_name.split('.')[-1]
        file_uuid = f"{uuid.uuid4()}.{file_type}"
        save_path = f"{path}/{file_uuid}"

        # 保存文件
        file_obj.save(save_path)

        # 生成视频URL（用于网页端访问）
        video_url = f"https://127.0.0.1:8000/api/video?mid={file_uuid}"

        # 存入数据库（适配新表结构）
        current_time = datetime.now()
        new_video = VideoModel(
            # 小程序端字段
            username=token_dic['data']['username'],
            file_name=file_name,
            mid_raw=file_uuid,
            path_raw=save_path,
            # 网页端字段（默认值）
            weight='best.pt',
            inputVideo=video_url,
            outVideo='',
            conf='0.5',
            startTime=current_time.strftime('%Y-%m-%d %H:%M:%S'),
            # 其他字段
            mid_handle='',
            path_handle='',
            item='',
            kind='',
            created_at=current_time,
            updated_at=current_time
        )

        try:
            db.add(new_video)
            db.commit()
            return jsonify({"code": 200, "msg": "上传成功", "data": file_uuid}), 200
        except Exception as e:
            db.rollback()
            os.remove(save_path)
            return jsonify({"code": 503, "msg": f"文件保存失败: {str(e)}", "data": None}), 200


class ListClass():
    def allot(self):
        if request.method == 'GET':
            return self.videoList()
        elif request.method == 'DELETE':
            return self.videoDel()
        else:
            return "Method not allowed", 405

    #视频列表
    def videoList(self):
        # 验证是否登录
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err:
            return jsonify({"code": 401, "msg": "请重新登录", "data": None}), 200

        # 分页计算
        page, pagesize = pageGet.pageSizeGet(request)
        start_page = page * pagesize - pagesize

        # 提取查询条件
        filters = {}
        username = request.args.get("username", "")
        file_name = request.args.get("file_name", "")
        created_at_start = request.args.get("created_at_start", "")
        created_at_end = request.args.get("created_at_end", "")

        if file_name:
            filters["file_name__icontains"] = file_name
        if created_at_start:
            filters["created_at__gte"] = created_at_start + " 00:00:00"
        if created_at_end:
            filters["created_at__lte"] = created_at_end + " 23:59:59"
        if username:
            filters["username"] = username

        # 权限控制 管理员可以看所有的  普通用户只能查看自己的
        if token_dic["data"]['level'] != 10:
            filters['username'] = token_dic['data']['username']

        # 构建查询
        query = db.query(VideoModel)
        for key, value in filters.items():
            if key.endswith('__icontains'):
                field = key.replace('__icontains', '')
                query = query.filter(getattr(VideoModel, field).like(f"%{value}%"))
            elif key.endswith('__gte'):
                field = key.replace('__gte', '')
                query = query.filter(getattr(VideoModel, field) >= value)
            elif key.endswith('__lte'):
                field = key.replace('__lte', '')
                query = query.filter(getattr(VideoModel, field) <= value)
            else:
                query = query.filter(getattr(VideoModel, key) == value)

        # 执行查询（按创建时间倒序）
        videos = query.order_by(desc(VideoModel.created_at)).offset(start_page).limit(pagesize).all()
        result = []
        for video in videos:
            video_data = video.to_dict()
            result.append(video_data)

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

    #删除视频
    def videoDel(self):
        # 验证是否登录
        auth_header = request.headers.get('Authorization')
        token_dic, err = ParseToekn(auth_header)
        if err:
            return jsonify({"code": 401, "msg": "请重新登录", "data": None}), 200

        ids = request.args.get("id", "")
        if not ids:
            return jsonify({"code": 503, "msg": "请选择需要删除的数据", "data": ""}), 200
        id_list = [int(i) for i in ids.split(",") if i]

        # 权限控制 管理员可以删除所有数据 普通用户只能删除自己的
        query = db.query(VideoModel).filter(VideoModel.id.in_(id_list))
        if token_dic["data"]['level'] != 10:
            query = query.filter(VideoModel.username == token_dic['data']['username'])

        # 获取要删除的视频
        videos = query.all()
        if not videos:
            return jsonify({"code": 503, "msg": "数据不存在", "data": ""}), 200

        # 删除文件和记录
        count = 0
        for video in videos:
            try:
                os.remove(video.path_raw)
                os.remove(video.path_handle)
            except Exception as e:
                print(f"删除文件时出错: {e}")
                
            db.delete(video)
            count += 1


        db.commit()

        return jsonify({"code": 200, "msg": f"成功删除了{count}条数据", "data": ""}), 200



cnName = {

}

# 视频检测
def videoDetection():
    #验证是否登录
    auth_header = request.headers.get('Authorization')
    token_dic, err = ParseToekn(auth_header)
    if err:
        return jsonify({"code": 401, "msg": "请重新登录", "data": None}), 200

    #获取要检查的视频id
    mid_raw = request.json.get("mid_raw", "")
    if not mid_raw:
        return jsonify({"code": 503, "msg": "请先选择上传的文件", "data": None}), 200

    # 查找视频数据
    video = db.query(VideoModel).filter(VideoModel.mid_raw == mid_raw).first()
    if not video:
        return jsonify({"code": 503, "msg": "未找到对应文件信息", "data": None}), 200

    # 进行检测
    try:
        mid_handle = f"{uuid.uuid4()}.mp4"  #检测后视频的名称
        path_handle = f"{path}/{mid_handle}"  #保存地址
        nameDic = detect_objects_in_video(video.path_raw, path_handle)

        # 生成检测后视频URL（用于网页端访问）
        out_video_url = f"https://127.0.0.1:8000/api/video?mid={mid_handle}"

        # 更新数据库（适配新表结构）
        video.mid_handle = mid_handle
        video.path_handle = path_handle
        video.outVideo = out_video_url  # 网页端字段
        video.updated_at = datetime.now()  # 更新修改时间

        # 分类转换为字符串
        nameList = list(nameDic.keys())
        video.item = ",".join(nameList)
        db.commit()
        return jsonify({"code": 200, "msg": "检测完成", "data": {"mid":mid_handle, "name":nameDic}}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"code": 503, "msg": f"检测失败: {str(e)}", "data": None}), 200


#视频检测函数
def detect_objects_in_video(video_path, output_path):
    # 加载模型
    model = YOLO(modelPath)

    # 加载数据
    results = model.predict(video_path, stream=True)


    # 打开视频文件
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("无法打开视频文件")
        return ""

    # 获取视频参数
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # 关闭原视频
    cap.release()

    # 创建需要保存的视频流
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    nameDic = {}
    # 预测每一帧的内容并写入到视频流中
    for item in results:
        out.write(item.plot())
        if item.boxes is not None:
            for i, box in enumerate(item.boxes):  
                class_id = int(box.cls.item())
                class_name = model.names[class_id]
                x1, y1, x2, y2 = box.xyxy.tolist()[0]

                name = cnName.get(class_name)
                if name == None:
                    name = class_name
                
                nameDic[f"{name}"] = {
                    "id":i+1,
                    "置信度":  round(box.conf.item(), 2), 
                    "类别":name,
                    "坐标": {
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2) ,
                            "y2": round(y2, 2) 
                        }
                }
                




    # 保存预测后的视频
    out.release()


    return nameDic



FileApi = FileClass()
ListApi = ListClass()
