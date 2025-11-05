<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import $api from '../axios'

interface Notice {
  noticeId: string | number;
  title: string;
  content: string;
  author: string;
  createTime: string;
  updateTime: string;
}

const tableData = ref<Notice[]>([]);
const currentPage = ref(1);
const pageSize = ref(4); // 配合两行两列，建议设为 4 的倍数
const totalCount = ref(0);

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getData();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getData();
};

const getData = async () => {
  try {
    const res = await $api.get('/notice/page', {
      params: {
        currentPage: currentPage.value,
        size: pageSize.value
      }
    });
    tableData.value = res.data.data.rows as Notice[];
    totalCount.value = res.data.data.total;
  } catch (error) {
    console.error('获取公告数据失败:', error);
  }
};

onMounted(() => {
  getData();
});
</script>

<template>
  <div class="notice-container">
    <!-- 卡片列表区域 -->
    <div class="notice-cards">
      <div 
        v-for="(item, index) in tableData" 
        :key="item.noticeId || index" 
        class="notice-card"
      >
        <div class="card-title">
          {{ item.title }}
        </div>
        <div class="card-content">
          <el-tooltip :content="item.content" placement="top">
            <div class="ellipsis">{{ item.content }}</div>
          </el-tooltip>
        </div>
        <div class="card-meta">
          <span>发布者：{{ item.author }}</span>
          <span>创建时间：{{ formatDate(item.createTime) }}</span>
          <span>更新时间：{{ formatDate(item.updateTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 分页组件 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[4, 8, 12, 16]" 
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalCount"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    />
  </div>
</template>

<style scoped>
.notice-container {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* 卡片容器：两行两列布局 */
.notice-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: flex-start;
}

/* 单张卡片样式 - 增加圆角和阴影 */
.notice-card {
  width: calc(50% - 10px); /* 两列平分，减去间距 */
  border-radius: 12px; /* 圆角效果 */
  padding: 20px;
  box-sizing: border-box;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* 阴影效果 */
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 180px; /* 确保卡片高度一致 */
}

/* 悬停效果增强 */
.notice-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); /* 加深阴影 */
  transform: translateY(-2px); /* 轻微上浮效果 */
}

/* 标题样式 */
.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

/* 内容样式 */
.card-content {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  flex: 1; /* 让内容区域占据剩余空间，将元信息推到底部 */
  line-height: 1.6;
}

/* 元信息（发布者、时间等）- 调整到右下角 */
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  margin-top: auto; /* 自动 margin 推到容器底部 */
  align-self: flex-end; /* 右对齐 */
  text-align: right;
}

/* 省略样式 */
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 分页样式 */
.pagination {
  margin-top: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式适配：小屏幕下改为单列 */
@media (max-width: 768px) {
  .notice-card {
    width: 100%;
  }
}
</style>
