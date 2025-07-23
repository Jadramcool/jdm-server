# 阿里云OSS上传功能使用指南

## 配置说明

### 环境变量配置

本项目使用独立的 `.env.oss` 文件来管理阿里云OSS配置，确保敏感信息的安全性。

#### 配置步骤

1. **复制配置模板**
   ```bash
   cp .env.oss.example .env.oss
   ```

2. **编辑配置文件**
   打开 `.env.oss` 文件，填入真实的OSS配置信息：
   ```env
   # OSS区域
   OSS_REGION="oss-cn-hangzhou"
   
   # OSS访问密钥ID
   OSS_ACCESS_KEY_ID="your-real-access-key-id"
   
   # OSS访问密钥Secret
   OSS_ACCESS_KEY_SECRET="your-real-access-key-secret"
   
   # OSS存储桶名称
   OSS_BUCKET_NAME="your-bucket-name"
   
   # OSS访问端点（可选，如果不设置将自动根据region生成）
   OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"
   ```

3. **安全注意事项**
   - `.env.oss` 文件已添加到 `.gitignore`，不会被上传到版本控制系统
   - 请勿将真实的AccessKey信息提交到代码仓库
   - 建议定期轮换AccessKey

## API接口

### 1. 头像上传到OSS

**接口地址：** `POST /upload/avatar/oss`

**请求参数：**
- `file`: 头像文件（multipart/form-data）

**响应示例：**
```json
{
  "data": {
    "fileUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/avatars/1703123456789_avatar.jpg",
    "fileName": "avatars/1703123456789_avatar.jpg",
    "fileSize": 102400,
    "mimeType": "image/jpeg"
  },
  "code": 200,
  "message": "文件上传到OSS成功"
}
```

### 2. 通用文件上传到OSS

**接口地址：** `POST /upload/file/oss`

**请求参数：**
- `file`: 文件（multipart/form-data）
- `folder`: 可选，指定OSS中的文件夹路径

**响应示例：**
```json
{
  "data": {
    "fileUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/files/1703123456789_document.pdf",
    "fileName": "files/1703123456789_document.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf"
  },
  "code": 200,
  "message": "文件上传到OSS成功"
}
```

### 3. 本地文件上传

**接口地址：** `POST /upload/file`

**请求参数：**
- `file`: 文件（multipart/form-data）

**响应示例：**
```json
{
  "data": {
    "fileUrl": "http://localhost:3000/uploads/document.pdf"
  },
  "code": 200,
  "message": "文件上传成功"
}
```

## 使用示例

### JavaScript/Fetch

```javascript
// 上传头像到OSS
const uploadAvatarToOSS = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/upload/avatar/oss', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-jwt-token'
    },
    body: formData
  });
  
  return await response.json();
};

// 上传文件到OSS
const uploadFileToOSS = async (file, folder = 'documents') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  const response = await fetch('/upload/file/oss', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-jwt-token'
    },
    body: formData
  });
  
  return await response.json();
};
```

### cURL

```bash
# 上传头像到OSS
curl -X POST \
  http://localhost:3000/upload/avatar/oss \
  -H 'Authorization: Bearer your-jwt-token' \
  -F 'file=@/path/to/avatar.jpg'

# 上传文件到OSS
curl -X POST \
  http://localhost:3000/upload/file/oss \
  -H 'Authorization: Bearer your-jwt-token' \
  -F 'file=@/path/to/document.pdf' \
  -F 'folder=documents'
```

## 功能特性

- **双模式上传**：支持本地存储和OSS云存储两种模式
- **自动清理**：OSS上传成功后自动删除本地临时文件
- **错误处理**：完善的错误处理和回滚机制
- **灵活配置**：通过独立的 `.env.oss` 文件管理OSS配置
- **类型安全**：完整的TypeScript类型定义
- **安全性**：敏感配置文件不会被提交到版本控制系统

## 错误码说明

- `200`: 上传成功
- `400`: 文件上传失败（文件格式不支持、文件过大等）
- `500`: 服务器内部错误（OSS配置错误、网络问题等）

## 注意事项

1. **文件大小限制**：建议单个文件不超过10MB
2. **文件格式**：支持常见的图片、文档、音视频格式
3. **OSS配置**：确保OSS Bucket的读写权限配置正确
4. **网络环境**：确保服务器能够访问阿里云OSS服务
5. **AccessKey安全**：定期轮换AccessKey，避免泄露

## 故障排除

### OSS上传失败

1. 检查 `.env.oss` 文件是否存在且配置正确
2. 验证OSS AccessKey是否有效
3. 确认OSS Bucket是否存在且有写入权限
4. 检查网络连接是否正常
5. **Endpoint错误**：如果遇到"must be addressed using the specified endpoint"错误，请检查：
   - OSS_REGION配置是否正确
   - OSS_ENDPOINT是否与region匹配
   - 建议显式设置OSS_ENDPOINT为：`https://oss-cn-{region}.aliyuncs.com`

### 配置文件问题

1. 确保 `.env.oss` 文件在项目根目录
2. 检查环境变量名称是否正确
3. 验证配置值是否包含特殊字符（需要转义）

如有其他问题，请查看服务器日志获取详细错误信息。