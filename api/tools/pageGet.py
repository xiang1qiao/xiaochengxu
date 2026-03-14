

def pageSizeGet(request):
    page = int(request.args.get('page', 1))  # 获取页码，默认为第 1 页
    page_size = int(request.args.get('page_size', 10))  # 每页显示条数，默认为 10 条

    return page,page_size
