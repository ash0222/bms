<template>
  <el-card class="recording-container">
    <!-- 页头返回区域 -->
    <div class="header-bar">
      <div class="back-area" @click="handleBack">
        <i class="el-icon-arrow-left"></i>
        <span>返回</span>
      </div>
      <div class="title-sep">|</div>
      <div class="main-title">借阅记录</div>
    </div>

    <!-- 顶部统计卡片区域（基于归还表） -->
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-value">{{ totalRecords }}</div>
        <div class="stat-label">总记录数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ returnedCount }}</div>
        <div class="stat-label">已归还</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ notReturnedCount }}</div>
        <div class="stat-label">未归还</div>
      </div>
    </div>

    <!-- 借阅记录展示区域（数据完全来自归还表） -->
    <el-table 
      :data="formattedReturnRecords" 
      border 
      style="width: 100%" 
      class="mb-20"
    >
      <el-table-column
        label="序号"
        type="index"
        align="center"
        width="60"
        :index="(index: number) => (borrowCurrentPage - 1) * borrowPageSize + index + 1"
      />
      <el-table-column
        prop="bookId"
        label="图书ID"
        align="center"
        width="100"
      />
      <el-table-column
        prop="bookName"
        label="图书名称"
        align="center"
      />
      <el-table-column
        prop="borrowDate"
        label="借阅日期"
        align="center"
        width="120"
        :formatter="formatDate"
      />
      <el-table-column
        prop="returnDate"
        label="归还日期"
        align="center"
        width="120"
        :formatter="formatDate"
      />
    </el-table>
    <el-pagination
      v-model:current-page="borrowCurrentPage"
      v-model:page-size="borrowPageSize"
      :page-sizes="[5, 10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalRecords"
      @size-change="handleBorrowSizeChange"
      @current-change="handleBorrowCurrentChange"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import $api from '../axios';
import { ElMessage } from 'element-plus';

// 定义归还记录类型，包含借阅及归还相关信息
interface ReturnRecord {
  id?: string;
  bookId: string;
  bookName: string;
  readerId: string;
  borrowDate: string | Date;
  returnDate?: string | Date;
  returnStatus: '归还' | '未归还';
}

// 路由实例
const router = useRouter(); 

// 归还记录相关响应式数据
const allReturnRecords = ref<ReturnRecord[]>([]); 
const borrowCurrentPage = ref(1);
const borrowPageSize = ref(10);
const currentReaderId = ref(''); 

// 返回上一界面方法
const handleBack = () => {
  router.back();
};

// 获取当前登录读者ID
const getCurrentReaderId = () => {
  try {
    const readerInfo = sessionStorage.getItem('user');
    if (readerInfo) {
      const info = JSON.parse(readerInfo);
      currentReaderId.value = info.readerId || '';
      if (!currentReaderId.value) {
        ElMessage.warning('未获取到读者ID，请重新登录');
      }
    } else {
      ElMessage.warning('未检测到登录信息，请先登录');
    }
  } catch (error) {
    console.error('读取当前读者信息失败:', error);
    ElMessage.error('获取用户信息失败');
  }
};

// 日期格式化函数
const formatDate = (row: any, column: any, cellValue: any) => {
  if (!cellValue) return '未归还';
  const date = new Date(cellValue);
  if (isNaN(date.getTime())) {
    console.warn('无效的日期格式:', cellValue);
    return '未归还';
  }
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

// 计算属性：过滤并分页当前读者的归还记录
const formattedReturnRecords = computed(() => {
  const myRecords = allReturnRecords.value.filter(
    (item) => item.readerId === currentReaderId.value
  );
  const startIndex = (borrowCurrentPage.value - 1) * borrowPageSize.value;
  return myRecords.slice(startIndex, startIndex + borrowPageSize.value);
});

// 总记录数（当前读者的归还记录总数）
const totalRecords = computed(() => {
  return allReturnRecords.value.filter(
    (item) => item.readerId === currentReaderId.value
  ).length;
});

// 统计数据（基于归还表）
const returnedCount = computed(() => {
  return allReturnRecords.value.filter(
    (item) => item.readerId === currentReaderId.value && item.returnStatus === '归还'
  ).length; 
});
const notReturnedCount = computed(() => {
  return allReturnRecords.value.filter(
    (item) => item.readerId === currentReaderId.value && item.returnStatus === '未归还'
  ).length; 
});

// 分页变化处理
const handleBorrowSizeChange = (val: number) => {
  borrowPageSize.value = val;
  borrowCurrentPage.value = 1; 
};
const handleBorrowCurrentChange = (val: number) => {
  borrowCurrentPage.value = val;
};

// 获取所有归还记录数据（包含借阅/归还信息）
const getReturnRecords = async () => {
  if (!currentReaderId.value) return;
  try {
    const res = await $api.get('/return/page', {
      params: {
        currentPage: 1,
        size: 10000 
      }
    });
    allReturnRecords.value = res.data.data.rows || []; 
    console.log('获取到的归还记录:', allReturnRecords.value);
  } catch (error) {
    ElMessage.error('获取归还记录失败');
    console.error('获取归还记录失败:', error);
  }
};

// 页面加载时初始化数据
onMounted(async () => {
  getCurrentReaderId(); 
  await nextTick(); 
  if (currentReaderId.value) {
    await getReturnRecords();
    // 可根据需求添加数据完整性检查等逻辑，类似下面注释的方法
    // checkDataIntegrity();
  }
});

// // 检查归还表数据完整性（用于调试，按需启用）
// const checkDataIntegrity = () => {
//   formattedReturnRecords.value.forEach(record => {
//     if (!record.bookId) console.log(`记录 ${record.id} 缺少 bookId`);
//     if (!record.borrowDate) console.log(`记录 ${record.id} 缺少 borrowDate`);
//     if (record.returnStatus === '归还' && !record.returnDate) {
//       console.log(`记录 ${record.id} 已归还但无归还日期`);
//     }
//   });
// };
</script>

<style scoped>
.recording-container {
  padding: 20px;
  margin: 20px;
}

/* 页头样式 */
.header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
}
.back-area {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.3s ease;
}
.back-area:hover {
  color: #409eff;
}
.back-area i {
  margin-right: 6px;
  font-size: 18px;
}
.title-sep {
  margin: 0 10px;
  color: #999;
}
.main-title {
  font-weight: bold;
  font-size: 18px;
}

/* 统计卡片容器 */
.stats-card {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px; 
  gap: 20px;
}

.stat-item {
  text-align: center;
  width: 110px; 
  height: 110px; 
  padding: 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: box-shadow 0.3s ease; 
}

.stat-item:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

/* 总记录数 蓝色 可根据需求调整，这里先保持原色调示例 */
.stat-item:nth-child(1) .stat-value {
  font-size: 28px; 
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

/* 已归还 绿色 */
.stat-item:nth-child(2) .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #67c23a;
  margin-bottom: 8px;
}

/* 未归还 橙色 */
.stat-item:nth-child(3) .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #f7a325;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px; 
  color: #666;
}

.mb-20 {
  margin-bottom: 30px;
}

::v-deep .el-table {
  font-size: 14px;
}

::v-deep .el-table th {
  background-color: #f5f7fa;
  font-weight: bold;
}

::v-deep .el-pagination {
  margin-top: 20px;
  justify-content: center;
}
</style>