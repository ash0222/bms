<template>
  <div class="notice-container">
    <!-- 页面标题 -->
    <div class="page-title">公告管理</div>
    
    <!-- 操作栏 -->
    <!-- 修改操作栏区域 -->
    <div class="operation-bar">
      <div class="search-group">
        <!-- 标题搜索 -->
        <el-input 
          v-model="searchForm.title" 
          placeholder="请输入标题关键词" 
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        />
        
        <!-- 发布人搜索 -->
        <el-input 
          v-model="searchForm.author" 
          placeholder="请输入发布人姓名" 
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        />
        
        <!-- 发布人ID搜索 -->
        <el-input 
          v-model="searchForm.authorId" 
          placeholder="请输入发布人ID" 
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        />
        
        <!-- 日期范围搜索 -->
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />
        
        <!-- 查询按钮 -->
        <el-button 
          type="primary" 
          @click="handleSearch"
          class="search-btn"
        >
          <el-icon><Search /></el-icon> 查询
        </el-button>
        
        <!-- 重置按钮 -->
        <el-button 
          type="default" 
          @click="resetSearch"
          class="reset-btn"
        >
          重置
        </el-button>
      </div>
      
      <el-button 
        type="primary" 
        @click="addNotice"
        class="add-btn"
      >
        <el-icon><Plus /></el-icon> 添加公告
      </el-button>
    </div>
    <!-- 公告表格 -->
    <el-card class="table-card">
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        border
        stripe
        highlight-current-row
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="noticeId" label="公告ID" align="center" width="100" />
        <el-table-column prop="title" label="公告标题" align="center" min-width="100">
          <template #default="scope">
            <span class="title-cell">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="公告内容" align="center" min-width="250">
          <template #default="scope">
            <el-tooltip :content="scope.row.content" placement="top">
              <div class="content-cell">{{ scope.row.content.length > 25 ? scope.row.content.slice(0, 25) + '...' : scope.row.content }}</div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="发布者" align="center" width="100" />
        <el-table-column prop="authorId" label="发布者ID" align="center" width="110" />
        <el-table-column prop="createTime" label="创建时间" align="center" width="150" />
        <el-table-column prop="updateTime" label="更新时间" align="center" width="150" />
        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="editNotice(scope.row)"
              class="edit-btn"
            >
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="delNotice(scope.row.noticeId)"
              class="del-btn"
            >
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 分页控件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 25]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加公告对话框 -->
    <el-dialog 
      v-model="addDialogVisible" 
      title="添加公告" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="120px"
        class="form-container"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input v-model="addForm.content" type="textarea" rows="4" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="发布者" prop="author">
          <el-input v-model="addForm.author" placeholder="请输入发布者姓名" />
        </el-form-item>
        <el-form-item label="发布者ID" prop="authorId">
          <el-input v-model="addForm.authorId" placeholder="请输入发布者ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSubmitForm(addFormRef)">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑公告对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      title="编辑公告" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
        class="form-container"
      >
        <el-form-item label="公告ID" prop="noticeId">
          <el-input v-model="editForm.noticeId" disabled />
        </el-form-item>
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input v-model="editForm.content" type="textarea" rows="4" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="发布者" prop="author">
          <el-input v-model="editForm.author" placeholder="请输入发布者姓名" />
        </el-form-item>
        <el-form-item label="发布者ID" prop="authorId">
          <el-input v-model="editForm.authorId" placeholder="请输入发布者ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm(editFormRef)">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import $api from '../axios'
import dayjs from 'dayjs'
// 引入Element图标
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

const tableData = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const dialogVisible = ref(false)
const addDialogVisible = ref(false)
// 当前登录管理员ID
const currentSuperId = ref('')

// 编辑表单
const editForm = reactive({
  noticeId: '',
  title: '',
  content: '',
  author: '',
  authorId: ''
})

// 添加表单
const addForm = reactive({
  title: '',
  content: '',
  author: '',
  authorId: ''
})

// 表单验证规则
const editRules = reactive({
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在2-50个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 5, max: 1000, message: '内容长度在5-1000个字符之间', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入发布者', trigger: 'blur' }
  ],
  authorId: [
    { required: true, message: '请输入发布者ID', trigger: 'blur' }
  ]
})

const addRules = reactive({
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在2-50个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 5, max: 500, message: '内容长度在5-500个字符之间', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入发布者', trigger: 'blur' }
  ],
  authorId: [
    { required: true, message: '请输入发布者ID', trigger: 'blur' }
  ]
})

const editFormRef = ref<FormInstance>()
const addFormRef = ref<FormInstance>()

// 从sessionStorage获取当前登录管理员ID
const getCurrentSuperId = () => {
  const superData = sessionStorage.getItem('user')
  if (superData) {
    const parsedData = JSON.parse(superData)
    currentSuperId.value = parsedData.superId || ''
    
    // 自动填充添加公告的发布者信息
    addForm.authorId = currentSuperId.value
    addForm.author = parsedData.superName || ''
  }
}

// 格式化时间
const formatTime = (time: string | Date) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}



// 分页相关方法
const handleSizeChange = (val: number) => {
  pageSize.value = val
  getData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  getData()
}

// 添加公告
const addNotice = () => {
  addDialogVisible.value = true
  // 重置表单，但保留发布者信息
  addForm.title = ''
  addForm.content = ''
}

// 提交添加表单
const addSubmitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      $api.post('/notice/add', addForm).then(res => {
        if (res.data.code === 200) {
          ElMessage({ message: '添加成功', type: 'success' })
          addDialogVisible.value = false
          getData()
        } else {
          ElMessage({ message: '添加失败', type: 'error' })
        }
      }).catch(() => {
        ElMessage({ message: '请求失败', type: 'error' })
      })
    }
  })
}

// 删除公告
const delNotice = async (noticeId: string) => {
  ElMessageBox.confirm(
    '确定要删除吗？',
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    const res = await $api.delete('/notice/delete', { params: { noticeId } })
    if (res.data.code === 200) {
      ElMessage({ message: '删除成功', type: 'success' })
      getData()
    } else {
      ElMessage({ message: '删除失败', type: 'error' })
    }
  }).catch(() => {
    ElMessage({ message: '取消删除', type: 'info' })
  })
}

// 编辑公告
const editNotice = (row: any) => {
  dialogVisible.value = true
  editForm.noticeId = row.noticeId
  editForm.title = row.title
  editForm.content = row.content
  editForm.author = row.author
  editForm.authorId = row.authorId
}

// 提交编辑表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      $api.put('/notice/update', editForm).then(res => {
        if (res.data.code === 200) {
          ElMessage({ message: '修改成功', type: 'success' })
          dialogVisible.value = false
          getData()
        } else {
          ElMessage({ message: '修改失败', type: 'error' })
        }
      }).catch(() => {
        ElMessage({ message: '请求失败', type: 'error' })
      })
    }
  })
}

// 表格行样式（隔行变色）
const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'table-row-even' : 'table-row-odd';
};

// 页面加载时初始化
onMounted(() => {
  getCurrentSuperId()
  getData()
})

// 存储原始数据（用于过滤）
const originalTableData = ref<any[]>([])

// 搜索表单数据
const searchForm = reactive({
  title: '',        // 标题关键词
  author: '',       // 发布人姓名
  authorId: '',     // 发布人ID
  dateRange: [] as string[]  // 日期范围 [开始日期, 结束日期]
})

// 修改获取数据方法，保存原始数据
const getData = async () => {
  try {
    const res = await $api.get('/notice/page', {
      params: {
        currentPage: currentPage.value,
        size: pageSize.value
      }
    })
    // 格式化时间
    const formattedData = res.data.data.rows.map((item: any) => ({
      ...item,
      createTime: formatTime(item.createTime),
      updateTime: formatTime(item.updateTime)
    }))
    tableData.value = formattedData
    originalTableData.value = [...formattedData]  // 保存原始数据用于搜索
    totalCount.value = res.data.data.total
  } catch (error) {
    ElMessage({ message: '获取公告数据失败', type: 'error' })
  }
}

// 处理搜索逻辑
const handleSearch = () => {
  // 从原始数据中过滤
  const filteredData = originalTableData.value.filter(item => {
    // 标题过滤（模糊匹配）
    const matchTitle = searchForm.title 
      ? item.title.toLowerCase().includes(searchForm.title.toLowerCase()) 
      : true
    
    // 发布人过滤（模糊匹配）
    const matchAuthor = searchForm.author 
      ? item.author.toLowerCase().includes(searchForm.author.toLowerCase()) 
      : true
    
    // 发布人ID过滤（模糊匹配）
    const matchAuthorId = searchForm.authorId 
      ? item.authorId.includes(searchForm.authorId) 
      : true
    
    // 日期范围过滤
    const matchDate = searchForm.dateRange.length 
      ? (
          dayjs(item.createTime).isAfter(dayjs(searchForm.dateRange[0]).subtract(1, 'day')) &&
          dayjs(item.createTime).isBefore(dayjs(searchForm.dateRange[1]).add(1, 'day'))
        )
      : true
    
    // 所有条件都满足才保留
    return matchTitle && matchAuthor && matchAuthorId && matchDate
  })
  
  // 更新表格数据和分页
  tableData.value = filteredData
  totalCount.value = filteredData.length
  currentPage.value = 1  // 重置到第一页
}

// 重置搜索条件
const resetSearch = () => {
  // 清空表单
  searchForm.title = ''
  searchForm.author = ''
  searchForm.authorId = ''
  searchForm.dateRange = []
  
  // 恢复原始数据
  tableData.value = [...originalTableData.value]
  totalCount.value = originalTableData.value.length
  currentPage.value = 1
}
</script>

<style scoped>
/* 页面容器 */
.notice-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面标题 */
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

/* 操作栏：改为列布局，搜索区在上，添加按钮在下 */
.operation-bar {
  display: flex;
  flex-direction: column; /* 上下排列 */
  align-items: center;    /* 水平居中 */
  margin-bottom: 20px;
  padding: 15px 20px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 搜索区域：可换行，保持居中 */
.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px; /* 与下方添加按钮拉开距离 */
  justify-content: center;
  flex-wrap: wrap; /* 屏幕窄时自动换行 */
}

/* 统一输入框、日期选择器宽度 */
.search-input,
.date-picker {
  width: 220px; 
}

/* 查询按钮样式 */
.search-btn {
  transition: all 0.3s ease;
}

/* 重置按钮样式 */
.reset-btn {
  transition: all 0.3s ease;
  margin-left: 10px;
}

/* 添加公告按钮：单独一行，居中显示 */
.add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

/* 表格样式 */
.table-card {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

/* 表格行样式 */
:deep(.el-table) {
  border-radius: 6px 6px 0 0;
}

:deep(.el-table th) {
  background-color: #f9fafb;
  font-weight: 600;
  color: #4e5969;
}

.table-row-even {
  background-color: #f9fafb;
}

.table-row-odd {
  background-color: #fff;
}

/* 表格内容样式 */
.title-cell {
  font-weight: 200;
  color: #333;
}

.content-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* 操作按钮 */
.edit-btn, .del-btn {
  margin-right: 5px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background-color: #36bffa;
}

.del-btn:hover {
  background-color: #f53f3f;
}

/* 分页容器 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

/* 表单容器 */
.form-container {
  padding: 10px 0;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__help) {
  color: #86909c;
  font-size: 12px;
}

/* 弹窗样式增强 */
:deep(.el-dialog__header) {
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e5e7eb;
  padding: 16px 20px;
}

/* 表格行高和字体大小调整 */
:deep(.el-table td),
:deep(.el-table th) {
  padding: 12px 0; 
  font-size: 12px; 
}

:deep(.el-table th) {
  font-size: 16px;
}

.title-cell {
  font-weight: 500;
  color: #333;
  font-size: 14px; 
}

.content-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px; 
  font-size: 14px; 
}
</style>