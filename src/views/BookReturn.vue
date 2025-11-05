<template>
  <!-- 页面外层容器，包含返回页头和内容 -->
  <div class="page-wrapper">
    <!-- 返回页头区域，模仿示例图结构 -->
    <div class="header-bar">
      <div class="back-area" @click="handleBack">
        <i class="el-icon-arrow-left"></i>
        <span>返回</span>
      </div>
      <div class="title-sep">|</div>
      <div class="main-title">归还</div>
    </div>

    <div class="record-container">
      <!-- 卡片列表 -->
      <div 
        v-for="(record, index) in tableData" 
        :key="record.returnId + '-card'" 
        class="record-card"
      >
        <!-- 新增：右侧封面区域（用 flex 布局推到右侧） -->
        <div class="record-cover">
          <img 
            :src="getCoverUrl(record.bookId)"  
            alt="书籍封面" 
            class="cover-img"
            @error="handleImgError" 
          >
        </div>

        <!-- 原有内容容器：通过 flex 让内容挤到左侧 -->
        <div class="card-content">
          <!-- 标题及状态区域 -->
          <div class="card-top">
            <h2 class="book-title">{{ record.bookName }}</h2>
            <span class="status-tag" :class="{'returned': record.returnStatus === '归还'}">
              {{ record.returnStatus }}
            </span>
          </div>

          <!-- 基本信息区域，仅保留需要的内容 -->
          <div class="card-middle">
            <p class="meta-info">读者姓名：{{ record.readerName }}</p>
            <p class="meta-info">借阅日期：{{ formatDate(record.borrowDate) }}</p>
            <p class="meta-info">应还日期：{{ formatDate(record.dueDate) }}</p>
          </div>
        </div>

        <!-- 操作区域：单独放在底部，不跟随内容右移 -->
        <div class="card-bottom">
          <el-button
            :type="record.returnStatus === '归还' ? 'success' : 'success'"
            size="small"
            @click="handleReturn({ row: record })"
            :disabled="record.returnStatus === '归还'"
          >
            {{ record.returnStatus === '归还' ? '已归还' : '办理归还' }}
          </el-button>
        </div>
      </div>

      <!-- 原有分页组件 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 25, 30]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router'; 
import $api from '../axios';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';

// 定义归还记录的类型接口
interface ReturnRecord {
  returnId: string ;
  bookId: string ;
  bookName: string;
  readerId: string ;
  readerName: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string ;
  returnStatus: string;
  readerPhone?: string;
  readerGender?: string;
}

// 定义图书信息接口（包含封面）
interface Book {
  bookId: string | number;
  bookName: string;
  isbn: string;
  description: string;
  publicationDate: string;
  author: string;
  publisher: string;
  category: string;
  quantity: number;
  storageDate: string;
  bookStatus: string;
  coverUrl?: string; // 封面路径
}

// 路由实例，用于页面跳转
const router = useRouter(); 

// 日期格式化工具函数
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return dateString.split(' ')[0]; 
};

// 响应式数据
const allTableData = ref<ReturnRecord[]>([]);
const currentPage = ref(1);
const pageSize = ref(5);
const totalCount = ref(0);
const localBooks = ref<Book[]>([]);
const currentReaderId = ref('');
// 新增：默认封面（和书籍搜索组件保持一致）
const defaultCover = ref('/images/default-cover.png'); 

// 初始化时获取当前读者信息
onMounted(() => {
  const loadCurrentReader = () => {
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
  loadCurrentReader();
  getData();
});

// 分页和筛选逻辑（核心：增加读者ID过滤）
const tableData = computed(() => {
  const myRecords = allTableData.value.filter(
    item => item.readerId === currentReaderId.value
  );
  const unreturnedData = myRecords.filter(
    item => item.returnStatus === '未归还'
  );
  totalCount.value = unreturnedData.length;
  const startIndex = (currentPage.value - 1) * pageSize.value;
  return unreturnedData.slice(startIndex, startIndex + pageSize.value);
});

// 分页事件
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

// 返回上一界面方法
const handleBack = () => {
  router.back(); 
};

// 获取数据
const getData = async () => {
  if (!currentReaderId.value) return;
  try {
    const returnRes = await $api.get('/return/list');
    allTableData.value = (returnRes.data.data || []) as ReturnRecord[];
    const bookRes = await $api.get('/book/list');
    localBooks.value = (bookRes.data.data || []) as Book[];
  } catch (error) {
    ElMessage.error('获取数据失败');
    console.error('获取数据失败:', error);
  }
};

// 新增：封面加载失败处理
const handleImgError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = defaultCover.value; // 替换为默认封面
};

// 新增：根据 bookId 获取封面路径
const getCoverUrl = (bookId: string | number) => {
  const targetBook = localBooks.value.find(book => book.bookId === bookId);
  return targetBook?.coverUrl || defaultCover.value; 
};

// 验证库存更新结果
const verifyStockUpdate = async (bookId: string | number, expectedQuantity: number) => {
  try {
    const bookRes = await $api.get('/book/list');
    const latestBooks = (bookRes.data.data || []) as Book[];
    const updatedBook = latestBooks.find(book => book.bookId === bookId);
    localBooks.value = latestBooks;
    return updatedBook ? updatedBook.quantity === expectedQuantity : false;
  } catch (error) {
    console.error('验证库存失败:', error);
    return false;
  }
};

// 处理归还逻辑
const handleReturn = async (scope: { row: ReturnRecord }) => {
  if (!currentReaderId.value) {
    ElMessage.warning('请先登录后再办理归还');
    return;
  }
  const record = scope.row;
  if (record.readerId !== currentReaderId.value) {
    ElMessage.error('无权操作他人的借阅记录');
    return;
  }
  ElMessageBox.confirm(
    `确定要办理《${record.bookName}》的归还手续吗？`,
    '归还确认',
    {
      confirmButtonText: '确认归还',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(async () => {
    const loading = ElLoading.service({
      lock: true,
      text: '处理归还中...',
      background: 'rgba(0, 0, 0, 0.7)'
    });
    try {
const today = new Date().toISOString().slice(0, 19);
      let book: Book | undefined = localBooks.value.find(b => b.bookId === record.bookId);
      if (!book) {
        const freshBookRes = await $api.get('/book/list');
        const freshBooks = (freshBookRes.data.data || []) as Book[];
        localBooks.value = freshBooks;
        book = freshBooks.find(b => b.bookId === record.bookId);
      }
      if (!book) {
        ElMessage.error('图书信息不存在');
        return;
      }
      const originalQuantity = book.quantity;
      await $api.put('/return/update', {
        returnId: record.returnId,
        bookId: record.bookId,
        bookName: record.bookName,
        readerId: record.readerId,
        readerName: record.readerName,
        readerPhone: record.readerPhone || '',
        readerGender: record.readerGender || '',
        borrowDate: formatDate(record.borrowDate),
        dueDate: formatDate(record.dueDate),
        returnDate: today,
        returnStatus: '归还'
      });
      const newQuantity = originalQuantity + 1;
      const bookUpdateData: Book = {
        ...book,
        quantity: newQuantity,
        bookStatus: newQuantity > 0 ? '未借出' : '已借出',
        bookName: book.bookName,
        isbn: book.isbn || '',
        description: book.description || '',
        publicationDate: book.publicationDate || '',
        author: book.author || '',
        publisher: book.publisher || '',
        category: book.category || '',
        storageDate: book.storageDate || '',
        coverUrl: book.coverUrl 
      };
      await $api.put('/book/update', bookUpdateData);
      const isUpdated = await verifyStockUpdate(book.bookId, newQuantity);
      if (!isUpdated) {
        throw new Error(`库存更新异常: 预期${newQuantity}，实际未更新`);
      }
      ElMessage.success(`《${record.bookName}》已成功归还，库存已更新为${newQuantity}`);
      getData(); 
    } catch (error: any) {
      console.error('归还失败详情:', error);
      ElMessage.error(`归还失败: ${error.message}`);
    } finally {
      loading.close();
    }
  }).catch(() => {
    ElMessage.info('已取消归还');
  });
};
</script>

<style scoped>
/* 页面基础样式 */
.page-wrapper {
  position: relative;
  padding: 20px;
}

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

/* 卡片容器（核心：不修改封面相关布局） */
.record-card {
  position: relative; /* 仅用于状态标签和按钮的定位 */
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  margin-bottom: 16px;
  padding: 18px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  width: calc(100% - 36px);
}

/* 封面样式（完全保持原样） */
.record-cover {
  width: 80px;
  height: 120px;
  overflow: hidden;
  border-radius: 4px;
  align-self: flex-start;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 内容容器 */
.card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

/* 标题区域 */
.card-top {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
}
.book-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
  max-width: calc(100% - 80px); /* 避免被状态标签遮挡 */
}

/* 状态标签：固定到右上（不影响封面） */
.status-tag {
  position: absolute;
  top: 18px;
  right: 60px; /* 右侧距离 = 封面宽度(80px) + 间距(16px) + 内边距(20px) */
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1;
}
.status-tag.returned {
  background: #f0f9eb;
  color: #67c23a;
}
.status-tag:not(.returned) { /* 未归还样式 */
  background: #fef0f0;
  color: #f56c6c;
}

/* 基本信息区域 */
.card-middle {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  align-items: center;
  width: 100%;
  margin-top: 40px;
}
.meta-info {
  margin: 0;
  color: #666;
  line-height: 1.4;
  font-size: 14px;
}

/* 操作按钮：固定到右下（不影响封面） */
.card-bottom {
  position: absolute;
  bottom: 18px;
  right: 116px; /* 与状态标签保持相同右侧距离 */
  width: auto;
  text-align: right;
  margin-right: -60px;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
}

/* Element组件样式调整 */
::v-deep .el-pagination {
  --el-pagination-font-size: 14px;
}
::v-deep .el-button--success {
  --el-button-bg-color: #67c23a;
  --el-button-border-color: #67c23a;
  --el-button-hover-bg-color: #52b12c;
  --el-button-hover-border-color: #52b12c;
}</style>