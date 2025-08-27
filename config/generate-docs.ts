import swaggerJSDoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';

// 定义OpenAPI规范的类型
interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  tags?: Array<{
    name: string;
    description?: string;
  }>;
  security?: Array<Record<string, any>>;
}

/**
 * 生成OpenAPI文档的脚本
 * 用于生成Apifox可导入的API文档
 */
function generateApiDocs() {
  console.log('🚀 开始生成API文档...');
  
  // Swagger配置选项
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'JDM Server API',
        version: '1.0.0',
        description: '基于Express + TypeScript + Prisma的后端API项目',
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: '开发环境',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ['./src/modules/**/controller.ts'],
  };
  
  try {
    // 生成swagger规范
    const swaggerSpec = swaggerJSDoc(swaggerOptions) as OpenAPISpec;
    
    // 确保docs目录存在
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // 生成JSON文件
    const jsonPath = path.join(docsDir, 'openapi.json');
    fs.writeFileSync(jsonPath, JSON.stringify(swaggerSpec, null, 2));
    
    // 统计信息
    const pathCount = Object.keys(swaggerSpec.paths || {}).length;
    const tagCount = swaggerSpec.tags?.length || 0;
    
    console.log('✅ API文档生成成功!');
    console.log(`📊 统计信息:`);
    console.log(`   - API接口数量: ${pathCount}`);
    console.log(`   - 标签分类数量: ${tagCount}`);
    console.log(`📄 JSON文件: ${jsonPath}`);
    console.log('');
    console.log('🎯 导入到Apifox的步骤:');
    console.log('1. 打开Apifox应用');
    console.log('2. 创建新项目或打开现有项目');
    console.log('3. 点击"导入" → "OpenAPI"');
    console.log(`4. 选择生成的文件: ${jsonPath}`);
    console.log('5. 配置JWT认证: 设置 → 认证 → Bearer Token');
    console.log('6. 完成导入，开始使用API接口测试');
    
  } catch (error) {
    console.error('❌ 文档生成失败:', error);
    process.exit(1);
  }
}

// 运行生成函数
generateApiDocs();