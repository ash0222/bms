<template>
  <el-card class="violation-container">
    <!-- 页头返回区域 -->
    <div class="header-bar">
      <div class="back-area" @click="handleBack">
        <i class="el-icon-arrow-left"></i>
        <span>返回</span>
      </div>
      <div class="title-sep">|</div>
      <div class="main-title">违规记录</div>
    </div>

    <!-- 卡片列表区域 -->
    <div class="violation-cards">
      <div 
        v-for="(item, index) in filteredRecords" 
        :key="item.violationId || index" 
        class="violation-card"
      >
        <!-- 违规类型标签 -->
        <div class="violation-type" :class="getTypeClass(item.violationType)">
          {{ item.violationType }}
        </div>
        
        <!-- 主内容区 -->
        <div class="card-main">
          <!-- 左侧：读者信息 -->
          <div class="reader-info">
            <div v-if="item.violationType === '丢失图书'" class="loss-tag">
              丢失标记
            </div>
            
            <div class="info-item">
              <span class="info-label">读者姓名：</span>
              <span class="info-value">{{ item.readerName }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">联系电话：</span>
              <span class="info-value">{{ item.readerPhone }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">违规原因：</span>
              <el-tooltip :content="item.reason" placement="top">
                <span class="info-value ellipsis">{{ item.reason }}</span>
              </el-tooltip>
            </div>

            <div v-if="item.returnId" class="info-item">
              <span class="info-label">归还ID：</span>
              <span class="info-value">{{ item.returnId }}</span>
            </div>
          </div>
          
          <!-- 右侧：图书信息（修改图片部分） -->
          <div class="book-info">
            <!-- 图书图片（从数据表获取） -->
            <div class="book-img">
              <img 
                :src="getBookCoverUrl(item.bookId)" 
                alt="图书封面" 
                class="book-cover"
                @error="handleImgError"  
              >
            </div>
            
            <div class="book-details">
              <div class="book-name">{{ item.bookName }}</div>
              
              <div class="info-item">
                <span class="info-label">图书ID：</span>
                <span class="info-value">{{ item.bookId }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态提示 -->
    <div v-if="filteredRecords.length === 0" class="empty-state">
      暂无违规记录数据~
    </div>
    
    <!-- 分页组件 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="filteredTotalCount"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    />
  </el-card>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import $api from '../axios'
import { ElMessage, ElTooltip } from 'element-plus'
import { useRouter } from 'vue-router'

// 定义违规记录接口
interface ViolationRecord {
  violationId: string
  violationType: string
  reason: string
  borrowId: string
  returnId?: string
  bookId: string
  bookName: string
  readerId: string
  readerName: string
  readerPhone: string
}

// 复用图书信息接口（包含封面）
interface Book {
  bookId: string | number
  bookName: string
  coverUrl?: string  // 封面路径
  // 其他图书属性（保持不变）
  isbn?: string
  description?: string
  publicationDate?: string
  author?: string
  publisher?: string
  category?: string
  quantity?: number
  storageDate?: string
  bookStatus?: string
}

const router = useRouter()

// 响应式数据
const allRecords = ref<ViolationRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const currentReaderId = ref('')
const localBooks = ref<Book[]>([])  // 新增：存储图书信息（含封面）
const defaultCover = ref('/images/default-cover.png')  // 新增：默认封面

// 页面返回
const handleBack = () => {
  router.back()
}

// 获取当前读者ID
const getCurrentReaderId = () => {
  try {
    const readerInfo = sessionStorage.getItem('user')
    if (readerInfo) {
      const info = JSON.parse(readerInfo)
      currentReaderId.value = info.readerId || ''
      if (!currentReaderId.value) {
        ElMessage.warning('未获取到读者ID，请重新登录')
      }
    } else {
      ElMessage.warning('未检测到登录信息，请先登录')
    }
  } catch (error) {
    console.error('读取当前读者信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 筛选违规记录
const filteredRecords = computed(() => {
  const myRecords = allRecords.value.filter(
    item => item.readerId === currentReaderId.value
  )
  const startIndex = (currentPage.value - 1) * pageSize.value
  return myRecords.slice(startIndex, startIndex + pageSize.value)
})

// 总记录数
const filteredTotalCount = computed(() => {
  return allRecords.value.filter(
    item => item.readerId === currentReaderId.value
  ).length
})

// 违规类型样式
const getTypeClass = (type: string) => {
  switch(type) {
    case '逾期期未还':
      return 'type-overdue';
    case '损坏图书':
      return 'type-damage';
    case '丢失图书':
      return 'type-loss';
    default:
      return 'type-other';
  }
}

// 分页事件
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 新增：根据bookId获取封面路径
const getBookCoverUrl = (bookId: string | number) => {
  const targetBook = localBooks.value.find(book => book.bookId === bookId)
  return targetBook?.coverUrl || defaultCover.value
}

// 新增：图片加载失败处理
const handleImgError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = defaultCover.value  // 加载失败时显示默认封面
}

// 获取数据（新增获取图书信息逻辑）
const getData = async () => {
  if (!currentReaderId.value) return
  try {
    // 1. 获取违规记录
    const violationRes = await $api.get('/violation/page', {
      params: { currentPage: 1, size: 10000 }
    })
    allRecords.value = violationRes.data.data.rows || []

    // 2. 新增：获取图书信息（含封面）
    const bookRes = await $api.get('/book/list')
    localBooks.value = (bookRes.data.data || []) as Book[]
  } catch (error) {
    ElMessage.error('获取数据失败')
    console.error('获取数据失败:', error)
  }
}

// 页面挂载时加载数据
onMounted(() => {
  getCurrentReaderId()
  setTimeout(getData, 100)  // 延迟确保读者ID已获取
})
</script>

<style scoped>
.violation-container {
  padding: 20px;
  margin: 20px;
}

/* 新增页头样式 */
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
  color: #409eff; /*  hover 时变色，增强交互感 */
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

/* 原标题样式移除，使用新的页头样式，若有需要可删除原.title相关样式 */
.title {
  display: none; 
}

.violation-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 单卡片样式 */
.violation-card {
  width: 100%;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden; /* 防止内部元素溢出圆角 */
  box-sizing: border-box;
}

.violation-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* 违规类型标签（顶部通栏） */
.violation-type {
  padding: 6px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  width: 100%;
  box-sizing: border-box;
background-color: #f56c6c;
 } 

/* 主内容区：左右布局容器 */
.card-main {
  display: flex;
  padding: 20px;
  gap: 20px;
}

/* 左侧读者信息区域 */
.reader-info {
  flex: 1;
  padding: 10px;
  border-right: 1px dashed #f0f0f0; /* 分隔线 */
}

/* 丢失标记 */
.loss-tag {
  display: inline-block;
  padding: 4px 10px;
  background-color: #f56c6c;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 15px;
}

/* 右侧图书信息区域 */
.book-info {
  flex: 1;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 图书图片 */
.book-img {
  width: 100px;
  height: 140px; /* 标准书籍比例 */
  flex-shrink: 0; /* 防止图片被压缩 */
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持比例填充 */
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 图书详情 */
.book-details {
  flex: 1;
}

.book-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

/* 信息项通用样式（重点调整间距） */
.info-item {
  display: flex;
  align-items: center;
  /* 缩小标签与内容的间距 */
  gap: 4px; /* 比默认更小，可根据需求微调 */
  margin-bottom: 12px;
}

.info-label {
  font-size: 14px;
  color: #606266;
  /* 固定标签宽度，让内容对齐更整齐（可选） */
  width: 80px; 
  flex-shrink: 0; 
  text-align: right; /* 让冒号贴近内容 */
}

.info-value {
  font-size: 14px;
  color: #303133;
  flex: 1;
}

/* 文本溢出处理 */
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
  font-size: 14px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

/* 分页 */
.pagination {
  margin-top: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .violation-container {
    padding: 10px;
    margin: 10px;
  }

  /* 小屏幕改为上下布局 */
  .card-main {
    flex-direction: column;
  }

  .reader-info {
    border-right: none;
    border-bottom: 1px dashed #f0f0f0;
    padding-bottom: 15px;
    margin-bottom: 15px;
  }

  .book-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .info-item {
    justify-content: flex-start; /* 小屏幕恢复左对齐 */
  }
}
</style>