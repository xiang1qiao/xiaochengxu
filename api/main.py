import os
from flask import Flask, send_from_directory
from flask import request, jsonify
from flask_cors import CORS
from views import user, user_list, img, video

import mimetypes



app = Flask(__name__, static_folder='dist')

# 设置跨域
CORS(app, resources={r"/api/*": {"origins": "*",
                                 "methods": ["GET", "POST", "PUT", "DELETE", 'OPTIONS'],
                                 "allow_headers": ["Content-Type", "Authorization"],
                                 "expose_headers": ["Content-Disposition", "Content-Type"],
                                 "supports_credentials": True}})

# 设置js资源类型
mimetypes.add_type('application/javascript', '.js')
# 设置视频资源类型
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/avi', '.avi')
mimetypes.add_type('video/mov', '.mov')




# 路由
app.route('/api/user/login', methods=['POST'], endpoint='user_login')(user.login)
app.route('/api/user/register', methods=['POST'], endpoint='user_register')(user.register)
app.route('/api/user/info', methods=['GET', 'PUT'], endpoint='user_info')(user.UseApi.allot)
app.route('/api/admin/user', methods=['GET', 'POST', 'PUT', 'DELETE'], endpoint='user_list')(user_list.UseApi.allot)
app.route('/api/admin/user/one', methods=['GET'], endpoint='user_list_one')(user_list.UseApi.oneGet)

#图片检测
app.route('/api/img', methods=['GET', 'POST'], endpoint='img_file')(img.imgFileApi.allot)
app.route('/api/img_list', methods=['GET', 'DELETE'], endpoint='img_list')(img.imgListApi.allot)
app.route('/api/img/detection', methods=['POST'], endpoint='img_detection')(img.ImgDetection)

#视频检测
app.route('/api/video', methods=['GET', 'POST'], endpoint='video_file')(video.FileApi.allot)
app.route('/api/video_list', methods=['GET', 'DELETE'], endpoint='video_list')(video.ListApi.allot)
app.route('/api/video/detection', methods=['POST'], endpoint='video_detection')(video.videoDetection)




# 前端页面路径
@app.route('/')
def index():
    return app.send_static_file('index.html')


# 提供前端页面资源
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def static_proxy(path):
    static_path = os.path.join('dist', path)
    if os.path.exists(static_path):  # 判断文件是否存在
        return send_from_directory('dist', path)  # 返回资源文件
    else:
        return app.send_static_file('index.html')  # 不存在则返回html文件


if __name__ == '__main__':
    # 启用HTTPS
    import ssl
    context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    # 生成自签名证书
    import os
    if not os.path.exists('cert.pem') or not os.path.exists('key.pem'):
        import subprocess
        subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:4096', '-nodes', '-out', 'cert.pem', '-keyout', 'key.pem', '-days', '365', '-subj', '/CN=localhost'])
    context.load_cert_chain('cert.pem', 'key.pem')
    app.run(debug=True, host="0.0.0.0", port=8000, ssl_context=context)
