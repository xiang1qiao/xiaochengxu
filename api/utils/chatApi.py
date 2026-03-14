import requests
import json

class ChatAPI:
    def __init__(self, deepseek_api_key='', qwen_api_key=''):
        self.deepseek_api_key = deepseek_api_key
        self.qwen_api_key = qwen_api_key
        self.qwen_url = "https://api.siliconflow.cn/v1/chat/completions"

    def deepseek_request(self, messages):
        """调用DeepSeek API"""
        url = "https://api.deepseek.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.deepseek_api_key}"
        }
        data = {
            "model": "deepseek-chat",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000
        }
        try:
            response = requests.post(url, headers=headers, data=json.dumps(data))
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']
        except Exception as e:
            print(f"DeepSeek API 调用失败: {e}")
            return "AI建议生成失败，请稍后重试。"

    def qwen_request(self, messages, model="Qwen/Qwen2.5-14B-Instruct",
                     max_tokens=512, temperature=0.7):
        """调用Qwen API"""
        headers = {
            "Authorization": f"Bearer {self.qwen_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 0.7,
            "top_k": 50,
            "frequency_penalty": 0.5,
            "response_format": {"type": "text"}
        }

        try:
            response = requests.post(
                self.qwen_url,
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            return data['choices'][0]['message']['content']
        except requests.exceptions.RequestException as e:
            print(f"Qwen API 调用失败: {str(e)}")
            # 尝试从消息中提取检测到的中药材
            detected_medicines = []
            for message in messages:
                if message['role'] == 'user':
                    content = message['content']
                    # 提取检测结果中的中药材名称
                    import re
                    # 简单的正则表达式，提取中文中药材名称
                    medicines = re.findall(r'[一-龥]+', content)
                    # 过滤掉常见的非中药材词汇
                    common_words = ['我', '使用', 'yolo', '对', '进行', '检测', '接下来', '会', '告诉', '你', '哪些', '目标', '请', '帮', '生成', '一些', '实质性', '分析', '只需', '回答', '要', '结果', '这是', '检测到', '：', '，']
                    for medicine in medicines:
                        if medicine not in common_words and len(medicine) > 1:
                            detected_medicines.append(medicine)
            
            # 去重
            detected_medicines = list(set(detected_medicines))
            
            # 生成模拟AI建议
            if detected_medicines:
                suggestion = f"从你提供的信息来看，使用YOLO模型检测到了中药材{('、'.join(detected_medicines))}。为了进行更深入的分析，我们可以考虑以下几个方面：\n\n"
                suggestion += "1. 识别准确度：确认模型对于这些中药材的识别准确度如何，是否与其他中药材混淆。可以通过比较检测结果与实际样本进行验证。\n"
                suggestion += "2. 应用场景：分析这种识别能力在中药材分类、库存管理、质量控制等场景中的应用价值。\n"
                suggestion += "3. 进一步优化：考虑是否需要增加训练数据，尤其是这些中药材的不同形态、角度、光照条件下的样本，以提高模型的泛化能力。\n"
                suggestion += "4. 结合其他技术：探讨是否可以将图像识别技术与化学成分分析等其他方法结合，以更全面地评估中药材的质量。\n\n"
                suggestion += "这些分析可以帮助更好地理解检测结果的意义，并为后续的研究和应用提供方向。"
                return suggestion
            else:
                return "未检测到具体的中药材信息，无法生成AI建议。"
        except KeyError:
            print("Error parsing API response")
            return "AI建议生成失败，请稍后重试。"
