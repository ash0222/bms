<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessageBox, ElMessage, ElEmpty } from 'element-plus'
import type { FormInstance } from 'element-plus'
import $api from '../axios'
import dayjs from 'dayjs'
// 引入所需图标
import { Delete, Search, RefreshRight } from '@element-plus/icons-vue'

// 定义评论类型接口
interface Review {
  reviewId: string
  bookId: string
  bookName: string
  readerId: string
  readerLoginName: string
  rating: number
  reviewContent: string
  isAnonymous: string // '是'/'否'
  publishTime: string
  lastModifiedTime: string
  rawIsAnonymous?: string // 原始数据中的匿名状态（1/0）
}

// 评论列表数据
const tableData = ref<Review[]>([])
const allData = ref<Review[]>([]) // 存储全量数据用于前端分页和过滤
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const queryLoading = ref(false)
const hasResults = ref(true)
const batchDeleteLoading = ref(false) // 批量删除加载状态

// 批量选择相关
const multipleSelection = ref<Review[]>([]) // 存储选中的行数据
const checkAll = ref(false) // 全选状态

// 查询表单数据
const queryForm = reactive({
  reviewId: '',
  bookId: '',
  bookName: '',
  readerId: '',
  readerLoginName: '',
  rating: '',
  reviewContent: '',
  isAnonymous: '',
  publishTime: '',
  lastModifiedTime: ''
})

// 时间格式化函数
const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 表单引用
const queryFormRef = ref<FormInstance>()

// 获取全量数据
const getAllData = async () => {
  try {
    queryLoading.value = true
    const res = await $api.get('/review/page', {
      params: {
        currentPage: 1,
        size: 10000 // 获取足够多的全量数据
      }
    })

    if (res.data.code === 200 && res.data.data) {
      // 处理原始数据并格式化
      allData.value = res.data.data.rows.map((item: any) => ({
        ...item,
        rating: Number(item.rating),
        publishTime: formatTime(item.publishTime),
        lastModifiedTime: formatTime(item.lastModifiedTime),
        isAnonymous: item.isAnonymous === '1' ? '是' : '否',
        rawIsAnonymous: item.isAnonymous
      })) as Review[]
      return true
    }
    return false
  } catch (error) {
    ElMessage({
      message: '获取评论数据失败',
      type: 'error'
    })
    return false
  } finally {
    queryLoading.value = false
  }
}

// 过滤并分页数据
const filterAndPaginateData = () => {
  // 1. 过滤数据
  let filteredData = [...allData.value]
  
  // 评论ID精确匹配
  if (queryForm.reviewId) {
    filteredData = filteredData.filter(review => 
      review.reviewId === queryForm.reviewId
    )
  }
  
  // 图书ID精确匹配
  if (queryForm.bookId) {
    filteredData = filteredData.filter(review => 
      review.bookId === queryForm.bookId
    )
  }
  
  // 图书名称模糊匹配（不区分大小写）
  if (queryForm.bookName) {
    const keyword = queryForm.bookName.toLowerCase()
    filteredData = filteredData.filter(review => 
      review.bookName.toLowerCase().includes(keyword)
    )
  }
  
  // 读者ID精确匹配
  if (queryForm.readerId) {
    filteredData = filteredData.filter(review => 
      review.readerId === queryForm.readerId
    )
  }
  
  // 读者登录名模糊匹配（不区分大小写）
  if (queryForm.readerLoginName) {
    const keyword = queryForm.readerLoginName.toLowerCase()
    filteredData = filteredData.filter(review => 
      review.readerLoginName.toLowerCase().includes(keyword)
    )
  }
  
  // 评分精确匹配
  if (queryForm.rating) {
    const rating = Number(queryForm.rating)
    filteredData = filteredData.filter(review => 
      review.rating === rating
    )
  }
  
  // 评论内容模糊匹配（不区分大小写）
  if (queryForm.reviewContent) {
    const keyword = queryForm.reviewContent.toLowerCase()
    filteredData = filteredData.filter(review => 
      review.reviewContent.toLowerCase().includes(keyword)
    )
  }
  
  // 匿名状态精确匹配
  if (queryForm.isAnonymous) {
    filteredData = filteredData.filter(review => 
      review.isAnonymous === queryForm.isAnonymous
    )
  }
  
  // 发布时间匹配（仅日期部分）
  if (queryForm.publishTime) {
    filteredData = filteredData.filter(review => 
      review.publishTime.startsWith(queryForm.publishTime)
    )
  }
  
  // 最后修改时间匹配（仅日期部分）
  if (queryForm.lastModifiedTime) {
    filteredData = filteredData.filter(review => 
      review.lastModifiedTime.startsWith(queryForm.lastModifiedTime)
    )
  }

  // 2. 更新总数和空状态
  totalCount.value = filteredData.length
  hasResults.value = totalCount.value > 0

  // 3. 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  tableData.value = filteredData.slice(startIndex, endIndex)
}

// 核心：获取数据并处理
const getData = async () => {
  const success = await getAllData()
  if (success) {
    filterAndPaginateData()
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
  filterAndPaginateData()
  // 清除选择状态
  multipleSelection.value = []
  checkAll.value = false
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  filterAndPaginateData()
  // 清除选择状态
  multipleSelection.value = []
  checkAll.value = false
}

// 处理多选框选择
const handleSelectionChange = (selection: Review[]) => {
  multipleSelection.value = selection
  checkAll.value = selection.length > 0 && selection.length === tableData.value.length
}

// 处理全选
const handleCheckAllChange = (checked: boolean) => {
  checkAll.value = checked
  if (checked) {
    multipleSelection.value = [...tableData.value]
  } else {
    multipleSelection.value = []
  }
}

// 处理查询
const handleQuery = () => {
  currentPage.value = 1 // 重置到第一页
  // 清除选择状态
  multipleSelection.value = []
  checkAll.value = false
  getData()
}

// 重置查询条件
const resetQuery = () => {
  // 清空所有查询条件
  Object.keys(queryForm).forEach(key => {
    queryForm[key as keyof typeof queryForm] = ''
  })
  currentPage.value = 1
  // 清除选择状态
  multipleSelection.value = []
  checkAll.value = false
  getData()
}

// 批量删除
const batchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage({
      message: '请选择需要删除的评论',
      type: 'warning'
    })
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 条评论吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      batchDeleteLoading.value = true
      // 循环调用单条删除接口
      const deletePromises = multipleSelection.value.map(review => 
        $api.delete('/review/delete', { params: { id: review.reviewId } })
      )
      
      // 等待所有删除请求完成
      const results = await Promise.all(deletePromises)
      
      // 检查是否所有删除都成功
      const allSuccess = results.every(res => res.data.code === 200)
      
      if (allSuccess) {
        ElMessage({
          message: `成功删除 ${multipleSelection.value.length} 条评论`,
          type: 'success',
        })
        // 清除选择状态
        multipleSelection.value = []
        checkAll.value = false
        getData() // 删除成功后重新获取数据
      } else {
        ElMessage({
          message: '部分评论删除失败',
          type: 'error'
        })
      }
    } catch (error) {
      ElMessage({
        message: '请求失败',
        type: 'error'
      })
    } finally {
      batchDeleteLoading.value = false
    }
  }).catch(() => {
    ElMessage({
      message: '已取消删除',
      type: 'info',
    })
  })
}

// 删除单条评论
const delReview = async (reviewId: string) => {
  ElMessageBox.confirm(
    '确定要删除这条评论吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await $api.delete('/review/delete', {
          params: { id: reviewId }
        })
        if (res.data.code === 200) {
          ElMessage({
            message: '删除成功',
            type: 'success',
          })
          // 清除选择状态中的当前项
          multipleSelection.value = multipleSelection.value.filter(item => item.reviewId !== reviewId)
          checkAll.value = multipleSelection.value.length > 0 && multipleSelection.value.length === tableData.value.length
          getData() // 重新获取全量数据
        } else {
          ElMessage({
            message: '删除失败',
            type: 'error',
          })
        }
      } catch (error) {
        ElMessage({
          message: '请求失败',
          type: 'error'
        })
      }
    })
    .catch(() => {
      ElMessage({
        message: '已取消删除',
        type: 'info',
      })
    })
}

// 页面挂载时获取数据
onMounted(() => {
  getData()
})
</script>
<template>
  <div class="review-container">
    <!-- 功能按钮 -->
    <el-button 
      type="danger" 
      @click="batchDelete" 
      :loading="batchDeleteLoading"
      :disabled="multipleSelection.length === 0"
      style="margin-bottom: 10px;"
    >
      <el-icon><Delete /></el-icon>
      批量删除
    </el-button>
    
    <!-- 查询表单 -->
    <el-form 
      :model="queryForm" 
      inline 
      style="margin: 10px 0;"
      @keyup.enter.native="handleQuery"
    >
      <el-form-item label="评论ID">
        <el-input v-model="queryForm.reviewId" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="图书ID">
        <el-input v-model="queryForm.bookId" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="图书名称">
        <el-input v-model="queryForm.bookName" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="读者ID">
        <el-input v-model="queryForm.readerId" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="读者登录名">
        <el-input v-model="queryForm.readerLoginName" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="评分">
        <el-input v-model="queryForm.rating" placeholder="请输入" clearable style="width: 80px;" type="number" />
      </el-form-item>
      <el-form-item label="评论内容">
        <el-input v-model="queryForm.reviewContent" placeholder="请输入" clearable style="width: 160px;" />
      </el-form-item>
      <el-form-item label="是否匿名">
        <el-select v-model="queryForm.isAnonymous" placeholder="请选择" clearable style="width: 100px;">
          <el-option label="是" value="是" />
          <el-option label="否" value="否" />
        </el-select>
      </el-form-item>
      <el-form-item label="发布时间">
        <el-date-picker
          v-model="queryForm.publishTime"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 140px;"
        />
      </el-form-item>
      <el-form-item label="最后修改时间">
        <el-date-picker
          v-model="queryForm.lastModifiedTime"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 160px;"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery" :loading="queryLoading">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetQuery">
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 查询条件提示 -->
    <div v-if="Object.values(queryForm).some(v => v)" class="query-tips">
      <span>当前查询条件: </span>
      <el-tag v-if="queryForm.reviewId" type="info" closable @close="queryForm.reviewId = ''; handleQuery()">评论ID: {{ queryForm.reviewId }}</el-tag>
      <el-tag v-if="queryForm.bookName" type="info" closable @close="queryForm.bookName = ''; handleQuery()">书名: {{ queryForm.bookName }}</el-tag>
      <el-tag v-if="queryForm.readerLoginName" type="info" closable @close="queryForm.readerLoginName = ''; handleQuery()">读者: {{ queryForm.readerLoginName }}</el-tag>
      <el-tag v-if="queryForm.rating" type="info" closable @close="queryForm.rating = ''; handleQuery()">评分: {{ queryForm.rating }}</el-tag>
      <el-tag v-if="queryForm.isAnonymous" type="info" closable @close="queryForm.isAnonymous = ''; handleQuery()">匿名: {{ queryForm.isAnonymous }}</el-tag>
    </div>

    <!-- 评论列表表格 -->
    <div class="table-container" v-loading="queryLoading">
      <el-table 
        v-if="hasResults" 
        :data="tableData" 
        border 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <!-- 多选框列 -->
        <el-table-column 
          type="selection" 
          width="55"
          :reserve-selection="false"
          :selectable="() => !queryLoading"
        >
          <template #header>
            <el-checkbox 
              v-model="checkAll" 
              @change="handleCheckAllChange"
              size="large"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="reviewId" label="评论ID" align="center" />
        <el-table-column prop="bookId" label="图书ID" align="center" />
        <el-table-column prop="bookName" label="图书名称" align="center" />
        <el-table-column prop="readerId" label="读者ID" align="center" />
        <el-table-column prop="readerLoginName" label="读者登录名" align="center" />
        
        <!-- 评分列 -->
        <el-table-column label="评分" align="center">
          <template #default="scope">
            <div class="rating-container">
              <span class="rating-value">{{ scope.row.rating }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="reviewContent" label="评论内容" align="center">
          <template #default="scope">
            <el-tooltip :content="scope.row.reviewContent" placement="top">
              <div class="content-cell">
                {{ scope.row.reviewContent.length > 20 ? scope.row.reviewContent.slice(0, 20) + '...' : scope.row.reviewContent }}
              </div>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="isAnonymous" label="是否匿名" align="center" />
        <el-table-column prop="publishTime" label="发布时间" align="center" />
        <el-table-column prop="lastModifiedTime" label="最后修改时间" align="center" />
        
        <el-table-column label="操作" align="center" width="100">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button type="danger" size="small" @click="delReview(scope.row.reviewId)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="没有找到符合条件的评论" />
        <el-button style="margin-top: 16px;" @click="resetQuery">清除查询条件</el-button>
      </div>
    </div>

    <!-- 分页组件 -->
    <el-pagination
      v-if="totalCount > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 25, 30]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalCount"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="margin-top: 10px; display: flex; justify-content: center;"
    />
  </div>
</template>
<style scoped>
.review-container {
  padding: 20px;
}

.content-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rating-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.rating-value {
  min-width: 30px;
  text-align: center;
  color: #606266;
}

.el-pagination {
  margin-top: 10px;
  align-items: center;
  justify-content: center;
  display: flex;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.el-table th, .el-table td {
  padding: 10px 20px;
}

.el-form-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.query-tips {
  margin: 10px 0;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.query-tips .el-tag {
  margin-left: 10px;
  cursor: pointer;
}

.table-container {
  min-height: 300px;
  position: relative;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

/* 按钮间距调整 */
:deep(.el-button) {
  margin-right: 8px;
  margin-bottom: 8px;
}

/* 图标与文字间距 */
:deep(.el-button .el-icon) {
  margin-right: 5px;
}
</style>