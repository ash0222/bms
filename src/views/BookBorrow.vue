<template>
  <el-card class="search-container">
    <!-- 高级搜索区域 -->
    <el-card class="search-card mb-20">
      <div class="search-title">
        <span>搜索</span>
      </div>
      
      <el-form :model="advancedForm" label-width="100px" class="search-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="书名">
              <el-input v-model="advancedForm.bookName" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="作者">
              <el-input v-model="advancedForm.author" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="ISBN">
              <el-input v-model="advancedForm.isbn" clearable />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="类别">
              <el-select
                v-model="advancedForm.category"
                placeholder="请选择书籍类别"
                clearable
              >
                <el-option
                  v-for="category in categoryOptions"
                  :key="category.value"
                  :label="category.label"
                  :value="category.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出版日期">
              <el-date-picker
                v-model="advancedForm.publicationDate"
                type="date"
                placeholder="选择日期"
                clearable
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="24" class="text-right">
            <el-button type="primary" @click="handleAdvancedSearch" style="margin-right: 10px;">搜索</el-button>
            <el-button @click="resetAdvancedForm">重置条件</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-loading-spinner></el-loading-spinner>
      <span class="loading-text">加载数据中...</span>
    </div>

    <!-- 搜索结果数量展示 -->
    <div class="search-result" v-if="filteredTotalCount > 0 && !loading">
      找到 {{ filteredTotalCount }} 条匹配记录
    </div>
    
    <!-- 无结果提示 -->
    <div class="no-result" v-if="filteredTotalCount === 0 && totalData.length > 0 && !loading">
      没有找到匹配的书籍
    </div>

    <!-- 书籍卡片列表（核心区域：左侧新增封面） -->
    <div class="book-cards mb-20" v-if="!loading">
      <div 
        v-for="(book, index) in currentPageData" 
        :key="book.bookId || index" 
        class="book-card"
      >
        <!-- 左侧封面（新增部分） -->
        <div class="book-cover">
          <img 
            :src="book.coverUrl ? book.coverUrl : defaultCover"  
            :alt="`《${book.bookName}》封面`"
            class="cover-img"
            @error="handleImgError(book)"  >
        </div>

        <!-- 右上角图书类型（原有） -->
        <div class="book-type" v-if="book.category">
          {{ book.category }}
        </div>

        <!-- 卡片内容（原有格式不变） -->
        <div class="book-info">
          <div class="book-header">
            <h2 class="book-title">{{ book.bookName }}</h2>
            <p class="book-meta">
              {{ book.author }}，{{ book.publisher || '未知出版社' }} 
            </p>
            <div class="divider"></div>
          </div>

          <div class="book-details">
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">ISBN编号：</span>
                <span class="value">{{ book.isbn }}</span>
              </div>
              <div class="detail-item">
                <span class="label">出版时间：</span>
                <span class="value">{{ book.publicationDate || '未记录' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item" v-if="book.dueDate">
                <span class="label">预计归还：</span>
                <span class="value">{{ book.dueDate }}</span>
              </div>
              <div class="detail-item" v-if="book.actualReturn">
                <span class="label">实际归还：</span>
                <span class="value">{{ book.actualReturn }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item full-width">
                <span class="label">图书简介：</span>
                <span class="value">{{ book.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 借阅按钮和库存（原有） -->
        <div class="action-area">
          <div class="stock-info" :class="{ low: book.quantity <= 3 && book.quantity > 0, out: book.quantity <= 0 }">
            库存: {{ book.quantity }}
          </div>
          <el-button
            type="primary"
            size="medium"
            @click="handleBorrow(book)"
            :disabled="book.quantity <= 0 || book.bookStatus === '已借出'"
            class="borrow-btn"
          >
            借阅
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页组件（原有） -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[6,12,18,24]" 
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="filteredTotalCount"
      class="text-right"
      v-if="!loading"
    />
  </el-card>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import $api from '../axios'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'

// 封面相关（新增部分）
const defaultCover = ref('/images/default-cover.png') // 默认封面路径（需确保前端有此图片）

// 加载状态（原有）
const loading = ref(true)

// 读者信息（原有）
const currentReader = ref({
  id: '',
  name: '',
  phone: '',
  gender: ''
})

// 初始化（原有逻辑+封面相关）
onMounted(() => {
  const loadReaderInfo = () => {
    try {
      const readerInfo = sessionStorage.getItem('user')
      if (readerInfo) {
        const info = JSON.parse(readerInfo)
        currentReader.value = {
          id: info.readerId || '',
          name: info.readerName || '',
          phone: info.readerPhone || '',
          gender: info.readerGender || ''
        }
      } else {
        ElMessage.warning('未检测到登录信息，请先登录')
      }
    } catch (error) {
      console.error('读取读者信息失败:', error)
      ElMessage.error('读取用户信息失败')
    }
  }
  loadReaderInfo()
  
  // 加载所有书籍数据（包含封面路径）
  loadAllData()
})

// 封面加载失败处理（新增部分）
const handleImgError = (book: Book) => {
  book.coverUrl = defaultCover.value // 失败时显示默认图
}

// 计算应还日期（原有）
const calculateDueDate = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// 借阅处理逻辑（原有）
const handleBorrow = async (book: any) => {
  if (!currentReader.value.id) {
    ElMessage.warning('请先登录后再借阅')
    return
  }
  if (book.quantity <= 0 || book.bookStatus === '已借出') {
    ElMessage.warning('当前书籍无法借阅')
    return
  }
  ElMessageBox.confirm(
    `确定要借阅《${book.bookName}》吗？借书期限为30天`,
    '借阅确认',
    {
      confirmButtonText: '确认借阅',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    const loading = ElLoading.service({
      lock: true,
      text: '处理借阅中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    try {
      const today = new Date().toISOString().split('T')[0]
      const dueDate = calculateDueDate(30)
      const borrowData = {
        bookId: book.bookId,
        bookName: book.bookName,
        readerId: currentReader.value.id,
        readerName: currentReader.value.name,
        readerPhone: currentReader.value.phone,
        readerGender: currentReader.value.gender,
        borrowDate: today,
        dueDate: dueDate
      }
      await $api.post('/borrow/add', borrowData)
      await $api.post('/return/add', { ...borrowData, returnStatus: '未归还', returnDate: null })
      await $api.put('/book/update', { ...book, quantity: book.quantity - 1 })
      
      // 更新本地数据
      const index = totalData.value.findIndex(item => item.bookId === book.bookId)
      if (index !== -1) {
        totalData.value[index].quantity -= 1
      }
      
      ElMessage.success({
        message: `《${book.bookName}》已成功借阅，应还日期：${dueDate}`,
        type: 'success'
      })
    } catch (error: any) {
      console.error('借阅过程异常：', error)
      ElMessage.error(error.message || '系统异常，借阅失败')
    } finally {
      loading.close()
    }
  }).catch(() => {
    ElMessage.info('已取消借阅')
  })
}

// 搜索、分页相关逻辑（原有）
const advancedForm = ref({
  bookName: '',
  author: '',
  isbn: '',
  category: '',
  publicationDate: ''
})

// 书籍类别选项（原有）
const categoryOptions = ref([
  { label: '文学', value: '文学' },
  { label: '科幻', value: '科幻' },
  { label: '历史', value: '历史' },
  { label: '小说', value: '小说' },
  { label: '科学', value: '科学' },
  { label: '童话', value: '童话' },
  { label: '悬疑', value: '悬疑' }
])

// 分页参数（原有）
const currentPage = ref(1)
const pageSize = ref(6)
const totalData = ref<Book[]>([])

// 书籍接口定义（新增coverUrl字段）
interface Book {
  bookId: string | number
  bookName: string
  isbn: string
  description: string
  publicationDate: string
  author: string
  category: string
  quantity: number
  storageDate: string
  bookStatus: string
  publisher?: string 
  borrowDate?: string 
  dueDate?: string 
  actualReturn?: string 
  coverUrl?: string  // 封面路径（从书籍表获取）
}

// 加载所有数据（原有逻辑，自动包含coverUrl）
const loadAllData = async () => {
  try {
    loading.value = true
    totalData.value = []
    let page = 1
    const pageSize = 50
    let hasMore = true
    
    while (hasMore) {
      const res = await $api.get('/book/page', {
        params: { currentPage: page, size: pageSize }
      })
      
      const data = res.data.data || {}
      const rows = data.rows || []
      
      totalData.value = [...totalData.value, ...rows]
      
      if (rows.length < pageSize) {
        hasMore = false
      } else {
        page++
      }
    }
  } catch (error) {
    console.error('获取书籍列表失败：', error)
    ElMessage.error('获取书籍列表失败')
  } finally {
    loading.value = false
  }
}

// 过滤数据（原有）
const filteredData = computed(() => {
  return totalData.value.filter(book => {
    if (advancedForm.value.bookName && 
        !book.bookName.toLowerCase().includes(advancedForm.value.bookName.toLowerCase())) {
      return false
    }
    if (advancedForm.value.author && 
        !book.author.toLowerCase().includes(advancedForm.value.author.toLowerCase())) {
      return false
    }
    if (advancedForm.value.isbn && book.isbn !== advancedForm.value.isbn) {
      return false
    }
    if (advancedForm.value.category && book.category !== advancedForm.value.category) {
      return false
    }
    if (advancedForm.value.publicationDate && book.publicationDate !== advancedForm.value.publicationDate) {
      return false
    }
    return true
  })
})

// 处理书籍状态（原有）
const processedFilteredData = computed(() => {
  return filteredData.value.map(book => {
    if (book.quantity <= 0) {
      return { ...book, bookStatus: '已借出' }
    }
    return { ...book, bookStatus: '未借出' }
  })
})

// 过滤后总数量（原有）
const filteredTotalCount = computed(() => processedFilteredData.value.length)

// 当前页数据（原有）
const currentPageData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return processedFilteredData.value.slice(startIndex, endIndex)
})

// 执行搜索（原有）
const handleAdvancedSearch = () => {
  currentPage.value = 1
}

// 重置搜索条件（原有）
const resetAdvancedForm = () => {
  advancedForm.value = {
    bookName: '',
    author: '',
    isbn: '',
    category: '',
    publicationDate: ''
  }
  currentPage.value = 1
}

// 分页大小改变（原有）
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

// 页码改变（原有）
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}
</script>


<style scoped>
/* 整体容器样式 */
.search-container {
  padding: 24px; 
  margin: 0 auto;
  max-width: 1200px;
}

.mb-20 {
  margin-bottom: 20px; 
}

.text-right {
  text-align: right;
}

/* 搜索卡片样式 */
.search-card {
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  overflow: hidden;
}

/* 搜索标题样式（居中放大） */
.search-title {
  width: 100%;
  text-align: center;
  padding: 16px 0;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.search-title span {
  font-size: 22px;  /* 放大文字 */
  font-weight: 700;  /* 加粗 */
  color: #4f4141;
}

/* 搜索表单样式 */
.search-form {
  padding: 20px;
}

/* 加载状态样式 */
.loading-state {
  text-align: center;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-text {
  color: #666;
  font-size: 14px;
}

/* 无结果样式 */
.no-result {
  text-align: center;
  padding: 60px 0;
  color: #999;
  font-size: 16px;
}

/* 卡片布局（长条） */
.book-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 单张卡片样式 */
.book-card {
  width: 100%;
  padding: 16px 24px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: all 0.3s ease;
  display: flex;
  justify-content: flex-start; /* 调整为从左开始排列，适配封面+内容布局 */
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.book-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

/* 左侧封面容器样式 */
.book-cover {
  width: 120px; /* 设定封面宽度，可根据需求调整 */
  height: 180px; /* 设定封面高度，可根据需求调整，保证比例协调 */
  margin-right: 20px; /* 与右侧内容保持间距 */
  overflow: hidden;
  border-radius: 8px;
}

/* 封面图片样式：适应容器大小 */
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持图片比例，填充容器，裁剪多余部分 */
}

/* 右上角图书类型 */
.book-type {
  position: absolute;
  top: 12px;
  right: 40px;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  border: 1px solid #ebeef5;
  z-index: 1;
}

/* 卡片信息容器：让内容自适应剩余空间 */
.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 标题和元信息 */
.book-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.book-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.book-meta {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* 出版社下方的分割横线 */
.divider {
  width: 100%;
  height: 1px;
  background: #e2e8f0;
  margin-top: 4px;
}

/* 详情项 */
.book-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-item.full-width {
  width: 100%;
}

.detail-item .label {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
}

.detail-item .value {
  font-size: 13px;
  color: #2d3748;
  line-height: 1.5;
}

/* 操作区域（借阅按钮和库存） */
.action-area {
  position: absolute;
  bottom: 16px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 库存信息样式 */
.stock-info {
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f8f9fa;
  color: #495057;
}

/* 库存紧张样式 */
.stock-info.low {
  color: #e6a23c;
  background: #fdf6ec;
}

/* 库存不足样式 */
.stock-info.out {
  color: #f56c6c;
  background: #fef0f0;
}

/* 借阅按钮样式 */
.borrow-btn {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 6px;
}
</style>