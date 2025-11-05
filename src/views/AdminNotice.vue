<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessageBox, ElMessage, ElEmpty, ElDialog, ElUpload, ElScrollbar } from 'element-plus'
import type { FormInstance } from 'element-plus'
import $api from '../axios'
import dayjs from 'dayjs'
// 引入所需图标
import { Plus, Delete, Edit, Search, RefreshRight, Upload, Warning} from '@element-plus/icons-vue'
// 引入xlsx库用于解析Excel文件
import * as XLSX from 'xlsx'

// 定义公告类型接口
interface Notice {
  noticeId: string
  title: string
  content: string
  author: string
  authorId: string
  createTime: string
  updateTime: string
}

// 表格数据相关
const tableData = ref<Notice[]>([])
const allData = ref<Notice[]>([]) // 存储全量数据用于前端分页和过滤
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const dialogVisible = ref(false)
const addDialogVisible = ref(false)
const queryLoading = ref(false)
const hasResults = ref(true)
const currentAdminId = ref('')
const currentAdminName = ref('') // 存储当前登录用户名
const batchDeleteLoading = ref(false) // 批量删除加载状态

// 批量上传相关变量
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const uploadSuccessCount = ref(0)
const uploadErrorCount = ref(0)
const uploadErrorDetails = ref<string[]>([])

// 批量选择相关
const multipleSelection = ref<Notice[]>([]) // 存储选中的行数据
const checkAll = ref(false) // 全选状态

// 查询表单数据
const queryForm = reactive({
  noticeId: '',
  title: '',
  content: '',
  author: '',
  authorId: '',
  createTime: '',
  updateTime: ''
})

// 编辑表单
const editForm = reactive({
  noticeId: '',
  title: '',
  content: '',
  author: '', // 仅用于展示，不允许修改
  authorId: '' // 仅用于展示，不允许修改
})

// 添加表单
const addForm = reactive({
  title: '',
  content: '',
  author: '', // 将自动填充且不可修改
  authorId: '' // 将自动填充且不可修改
})

// 表单验证规则
const editRules = reactive({
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在2-50个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 5, max: 500, message: '内容长度在5-500个字符之间', trigger: 'blur' }
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
  ]
})

const editFormRef = ref<FormInstance>()
const addFormRef = ref<FormInstance>()

// 获取当前登录管理员信息
const getCurrentAdminInfo = () => {
  const adminData = sessionStorage.getItem('user')
  if (adminData) {
    const parsedData = JSON.parse(adminData)
    currentAdminId.value = parsedData.adminId || ''
    currentAdminName.value = parsedData.adminName || '' // 获取用户名
    
    // 初始化添加表单的发布者信息
    addForm.authorId = currentAdminId.value
    addForm.author = currentAdminName.value
  }
}

// 格式化时间
const formatTime = (time: string | Date) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 获取全量数据
const getAllData = async () => {
  try {
    queryLoading.value = true
    const res = await $api.get('/notice/page', {
      params: {
        currentPage: 1,
        size: 10000 // 获取足够多的全量数据
      }
    })

    if (res.data.code === 200 && res.data.data) {
      // 格式化时间后存储
      allData.value = res.data.data.rows.map((item: any) => ({
        ...item,
        createTime: formatTime(item.createTime),
        updateTime: formatTime(item.updateTime)
      })) as Notice[]
      return true
    }
    return false
  } catch (error) {
    ElMessage({ message: '获取公告数据失败', type: 'error' })
    return false
  } finally {
    queryLoading.value = false
  }
}

// 过滤并分页数据
const filterAndPaginateData = () => {
  // 1. 过滤数据
  let filteredData = [...allData.value]
  
  // 公告ID精确匹配
  if (queryForm.noticeId) {
    filteredData = filteredData.filter(notice => 
      notice.noticeId === queryForm.noticeId
    )
  }
  
  // 公告标题模糊匹配（不区分大小写）
  if (queryForm.title) {
    const keyword = queryForm.title.toLowerCase()
    filteredData = filteredData.filter(notice => 
      notice.title.toLowerCase().includes(keyword)
    )
  }
  
  // 公告内容模糊匹配（不区分大小写）
  if (queryForm.content) {
    const keyword = queryForm.content.toLowerCase()
    filteredData = filteredData.filter(notice => 
      notice.content.toLowerCase().includes(keyword)
    )
  }
  
  // 发布者模糊匹配（不区分大小写）
  if (queryForm.author) {
    const keyword = queryForm.author.toLowerCase()
    filteredData = filteredData.filter(notice => 
      notice.author.toLowerCase().includes(keyword)
    )
  }
  
  // 发布者ID精确匹配
  if (queryForm.authorId) {
    filteredData = filteredData.filter(notice => 
      notice.authorId === queryForm.authorId
    )
  }
  
  // 创建时间匹配（仅日期部分）
  if (queryForm.createTime) {
    filteredData = filteredData.filter(notice => 
      notice.createTime.startsWith(queryForm.createTime)
    )
  }
  
  // 更新时间匹配（仅日期部分）
  if (queryForm.updateTime) {
    filteredData = filteredData.filter(notice => 
      notice.updateTime.startsWith(queryForm.updateTime)
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
  Object.keys(queryForm).forEach(key => {
    queryForm[key as keyof typeof queryForm] = ''
  })
  currentPage.value = 1
  // 清除选择状态
  multipleSelection.value = []
  checkAll.value = false
  getData()
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
const handleSelectionChange = (selection: Notice[]) => {
  // 过滤掉没有权限删除的项（非本人发布的公告）
  const authorizedSelection = selection.filter(item => item.authorId === currentAdminId.value)
  multipleSelection.value = authorizedSelection
  checkAll.value = authorizedSelection.length > 0 && authorizedSelection.length === tableData.value.filter(item => item.authorId === currentAdminId.value).length
}

// 处理全选
const handleCheckAllChange = (checked: boolean) => {
  checkAll.value = checked
  if (checked) {
    // 只选择当前页中本人发布的公告
    multipleSelection.value = tableData.value.filter(item => item.authorId === currentAdminId.value)
  } else {
    multipleSelection.value = []
  }
}

// 添加公告
const addNotice = () => {
  addDialogVisible.value = true
  // 重置表单，自动填充发布者信息（从当前登录用户获取）
  addForm.title = ''
  addForm.content = ''
  addForm.authorId = currentAdminId.value
  addForm.author = currentAdminName.value
}

// 提交添加表单
const addSubmitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        // 确保提交时使用当前登录用户的信息
        const submitData = {
          ...addForm,
          authorId: currentAdminId.value,
          author: currentAdminName.value
        }
        
        const res = await $api.post('/notice/add', submitData)
        if (res.data.code === 200) {
          ElMessage({ message: '添加成功', type: 'success' })
          addDialogVisible.value = false
          getData() // 重新获取全量数据
        } else {
          ElMessage({ message: '添加失败', type: 'error' })
        }
      } catch (error) {
        ElMessage({ message: '请求失败', type: 'error' })
      }
    }
  })
}

// 批量删除
const batchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage({
      message: '请选择需要删除的公告（仅可选择本人发布的公告）',
      type: 'warning'
    })
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 条公告吗？`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      batchDeleteLoading.value = true
      // 循环调用单条删除接口（适配后端接口）
      const deletePromises = multipleSelection.value.map(notice => 
        $api.delete('/notice/delete', { params: { noticeId: notice.noticeId } })
      )
      
      // 等待所有删除请求完成
      const results = await Promise.all(deletePromises)
      
      // 检查是否所有删除都成功
      const allSuccess = results.every(res => res.data.code === 200)
      
      if (allSuccess) {
        ElMessage({ 
          message: `成功删除 ${multipleSelection.value.length} 条公告`, 
          type: 'success' 
        })
        // 清除选择状态
        multipleSelection.value = []
        checkAll.value = false
        getData() // 删除成功后重新获取数据
      } else {
        ElMessage({ message: '部分公告删除失败', type: 'error' })
      }
    } catch (error) {
      ElMessage({ message: '请求失败', type: 'error' })
    } finally {
      batchDeleteLoading.value = false
    }
  }).catch(() => {
    ElMessage({ message: '取消删除', type: 'info' })
  })
}

// 删除单条公告
const delNotice = async (noticeId: string) => {
  ElMessageBox.confirm(
    '确定要删除吗？',
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await $api.delete('/notice/delete', { params: { noticeId } })
      if (res.data.code === 200) {
        ElMessage({ message: '删除成功', type: 'success' })
        // 清除选择状态中的当前项
        multipleSelection.value = multipleSelection.value.filter(item => item.noticeId !== noticeId)
        checkAll.value = multipleSelection.value.length > 0 && multipleSelection.value.length === tableData.value.filter(item => item.authorId === currentAdminId.value).length
        getData() // 重新获取全量数据
      } else {
        ElMessage({ message: '删除失败', type: 'error' })
      }
    } catch (error) {
      ElMessage({ message: '请求失败', type: 'error' })
    }
  }).catch(() => {
    ElMessage({ message: '取消删除', type: 'info' })
  })
}

// 编辑公告
const editNotice = (row: Notice) => {
  dialogVisible.value = true
  // 填充表单数据，包括不可修改的发布者信息
  editForm.noticeId = row.noticeId
  editForm.title = row.title
  editForm.content = row.content
  editForm.author = row.author // 不可修改
  editForm.authorId = row.authorId // 不可修改
}

// 提交编辑表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        // 提交时保留原始的发布者信息（不允许修改）
        const submitData = {
          ...editForm
        }
        
        const res = await $api.put('/notice/update', submitData)
        if (res.data.code === 200) {
          ElMessage({ message: '修改成功', type: 'success' })
          dialogVisible.value = false
          getData() // 重新获取全量数据
        } else {
          ElMessage({ message: '修改失败', type: 'error' })
        }
      } catch (error) {
        ElMessage({ message: '请求失败', type: 'error' })
      }
    }
  })
}

// 批量上传相关方法
const beforeUpload = (file: File) => {
  const isXLSX = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.name.endsWith('.xlsx')
  if (!isXLSX) {
    ElMessage.error('请上传.xlsx格式的文件')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  
  return true
}

const handleFileChange = async (file: any) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      uploadLoading.value = true
      uploadSuccessCount.value = 0
      uploadErrorCount.value = 0
      uploadErrorDetails.value = []
      
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
      
      if (jsonData.length === 0) {
        ElMessage.warning('Excel文件中没有数据')
        uploadLoading.value = false
        return
      }
      
      // 验证表头 - 只需要title, content, author, authorId
      const requiredHeaders = ['title', 'content', 'author', 'authorId']
      const headers = Object.keys(jsonData[0])
      
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase() === header.toLowerCase())
      )
      
      if (missingHeaders.length > 0) {
        ElMessage.error(`Excel文件缺少必要的列: ${missingHeaders.join(', ')}`)
        uploadLoading.value = false
        return
      }
      
      // 处理数据 - 不包含noticeId, createTime和updateTime，这些由数据库自动生成
      const noticesToAdd: any[] = []
      jsonData.forEach((item, index) => {
        try {
          const notice: any = {
            title: item[headers.find(h => h.toLowerCase() === 'title')!] || '',
            content: item[headers.find(h => h.toLowerCase() === 'content')!] || '',
            author: item[headers.find(h => h.toLowerCase() === 'author')!] || '',
            authorId: item[headers.find(h => h.toLowerCase() === 'authorid')!] || ''
          }
          
          // 验证必填项
          if (!notice.title || !notice.content) {
            throw new Error('缺少必要信息（title、content为必填项）')
          }
          
          // 验证长度限制
          if (notice.title.length < 2 || notice.title.length > 50) {
            throw new Error('标题长度必须在2-50个字符之间')
          }
          
          if (notice.content.length < 5 || notice.content.length > 500) {
            throw new Error('内容长度必须在5-500个字符之间')
          }
          
          noticesToAdd.push(notice)
        } catch (error) {
          uploadErrorCount.value++
          uploadErrorDetails.value.push(`第${index + 2}行数据错误: ${(error as Error).message}`)
        }
      })
      
      // 批量添加
      if (noticesToAdd.length > 0) {
        for (const notice of noticesToAdd) {
          try {
            // 使用当前登录用户信息覆盖Excel中的作者信息，确保权限正确
            const submitData = {
              ...notice,
              authorId: currentAdminId.value,
              author: currentAdminName.value
            }
            
            const res = await $api.post('/notice/add', submitData)
            if (res.data.code === 200) {
              uploadSuccessCount.value++
            } else {
              uploadErrorCount.value++
              uploadErrorDetails.value.push(`标题: ${notice.title} 添加失败: ${res.data.msg || '服务器返回错误'}`)
            }
          } catch (error) {
            uploadErrorCount.value++
            uploadErrorDetails.value.push(`标题: ${notice.title} 添加失败: 网络请求错误`)
          }
        }
      }
      
      uploadDialogVisible.value = true
      await getData()
    } catch (error) {
      ElMessage.error(`处理文件时出错: ${(error as Error).message}`)
    } finally {
      uploadLoading.value = false
    }
  }
  
  reader.readAsArrayBuffer(file.raw)
}

// 页面加载时初始化
onMounted(() => {
  getCurrentAdminInfo() // 获取当前登录用户的ID和用户名
  getData()
})
</script>

<template>
  <div class="notice-container">
    <el-button type="primary" @click="addNotice">
      <el-icon><Plus /></el-icon>
      添加公告
    </el-button>
    <el-upload
      class="upload-btn"
      action="#"
      :show-file-list="false"
      :on-change="handleFileChange"
      :before-upload="beforeUpload"
      :auto-upload="false"
    >
      <el-button type="success">
        <el-icon><Upload /></el-icon>
        批量上传
      </el-button>
    </el-upload>
    <el-button 
      type="danger" 
      @click="batchDelete" 
      :loading="batchDeleteLoading"
      :disabled="multipleSelection.length === 0"
    >
      <el-icon><Delete /></el-icon>
      批量删除
    </el-button>
    
    <!-- 上传结果对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="批量上传结果"
      width="500px"
    >
      <div v-if="uploadSuccessCount > 0" class="success-message">
        <el-icon color="green"><CheckCircle /></el-icon>
        成功上传 {{ uploadSuccessCount }} 条数据
      </div>
      <div v-if="uploadErrorCount > 0" class="error-message">
        <el-icon color="red"><Warning /></el-icon>
        上传失败 {{ uploadErrorCount }} 条数据
      </div>
      <div v-if="uploadErrorDetails.length > 0" class="error-details">
        <p>失败详情:</p>
        <el-scrollbar height="200px">
          <div v-for="(error, index) in uploadErrorDetails" :key="index" class="error-item">
            {{ index + 1 }}. {{ error }}
          </div>
        </el-scrollbar>
      </div>
      <template #footer>
        <el-button type="primary" @click="uploadDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 查询表单 -->
    <el-form 
      :model="queryForm" 
      inline 
      style="margin: 10px 0;"
      @keyup.enter.native="handleQuery"
    >
      <el-form-item label="公告ID">
        <el-input v-model="queryForm.noticeId" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="公告标题">
        <el-input v-model="queryForm.title" placeholder="请输入" clearable style="width: 160px;" />
      </el-form-item>
      <el-form-item label="公告内容">
        <el-input v-model="queryForm.content" placeholder="请输入" clearable style="width: 160px;" />
      </el-form-item>
      <el-form-item label="发布者">
        <el-input v-model="queryForm.author" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="发布者ID">
        <el-input v-model="queryForm.authorId" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="queryForm.createTime"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 140px;"
        />
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker
          v-model="queryForm.updateTime"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 140px;"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery" :loading="queryLoading || uploadLoading">
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
      <el-tag v-if="queryForm.noticeId" type="info" closable @close="queryForm.noticeId = ''; handleQuery()">公告ID: {{ queryForm.noticeId }}</el-tag>
      <el-tag v-if="queryForm.title" type="info" closable @close="queryForm.title = ''; handleQuery()">标题: {{ queryForm.title }}</el-tag>
      <el-tag v-if="queryForm.author" type="info" closable @close="queryForm.author = ''; handleQuery()">发布者: {{ queryForm.author }}</el-tag>
      <el-tag v-if="queryForm.createTime" type="info" closable @close="queryForm.createTime = ''; handleQuery()">创建日: {{ queryForm.createTime }}</el-tag>
    </div>

    <!-- 公告表格 -->
    <div class="table-container" v-loading="queryLoading || uploadLoading">
      <el-table 
        v-if="hasResults" 
        :data="tableData" 
        style="width: 100%; margin-top: 15px"
        border
        @selection-change="handleSelectionChange"
      >
        <!-- 多选框列 -->
        <el-table-column 
          type="selection" 
          width="55"
          :reserve-selection="false"
          :selectable="(row: Notice) => row.authorId === currentAdminId && !queryLoading"
        >
          <template #header>
            <el-checkbox 
              v-model="checkAll" 
              @change="handleCheckAllChange"
              size="large"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="noticeId" label="公告ID" align="center" />
        <el-table-column prop="title" label="公告标题" align="center" />
        <el-table-column prop="content" label="公告内容" align="center">
          <template #default="scope">
            <el-tooltip :content="scope.row.content" placement="top">
              <div class="content-cell">{{ scope.row.content.length > 20 ? scope.row.content.slice(0, 20) + '...' : scope.row.content }}</div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="发布者" align="center" />
        <el-table-column prop="authorId" label="发布者ID" align="center" />
        <el-table-column prop="createTime" label="创建时间" align="center" />
        <el-table-column prop="updateTime" label="更新时间" align="center" />
        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <!-- 只有发布者本人可操作 -->
            <div class="operation-buttons">
              <el-button 
                v-if="scope.row.authorId === currentAdminId" 
                type="primary" 
                size="small" 
                @click="editNotice(scope.row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                v-if="scope.row.authorId === currentAdminId" 
                type="danger" 
                size="small" 
                @click="delNotice(scope.row.noticeId)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="没有找到符合条件的公告" />
        <el-button style="margin-top: 16px;" @click="resetQuery">清除查询条件</el-button>
      </div>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="totalCount > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 25]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalCount"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination-center"
    />

    <!-- 添加公告对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加公告" width="500px">
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="auto"
        style="max-width: 600px"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input v-model="addForm.content" type="textarea" rows="4" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="发布者" prop="author">
          <el-input v-model="addForm.author" disabled />
          <div class="form-hint">当前登录用户：自动填充，不可修改</div>
        </el-form-item>
        <el-form-item label="发布者ID" prop="authorId">
          <el-input v-model="addForm.authorId" disabled />
          <div class="form-hint">当前用户ID：自动填充，不可修改</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSubmitForm(addFormRef)">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑公告对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑公告" width="500px">
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="auto"
        style="max-width: 600px"
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
          <el-input v-model="editForm.author" disabled />
          <div class="form-hint">发布者信息不可修改</div>
        </el-form-item>
        <el-form-item label="发布者ID" prop="authorId">
          <el-input v-model="editForm.authorId" disabled />
          <div class="form-hint">发布者ID不可修改</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm(editFormRef)">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.notice-container {
  padding: 20px;
}

.content-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
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

.pagination-center {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

/* 操作按钮容器样式 */
.operation-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  width: 100%;
}

/* 按钮间距调整 */
:deep(.el-button) {
  margin-right: 8px;
  margin-bottom: 8px;
}

/* 图标与文字间距优化 */
:deep(.el-button .el-icon) {
  margin-right: 5px;
}

/* 确保操作列有足够宽度 */
:deep(.el-table-column:last-child) {
  min-width: 200px !important;
}

/* 表单提示文字样式 */
.form-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
  font-style: italic;
}

/* 上传按钮样式 */
.upload-btn {
  display: inline-block;
  margin-left: 8px;
}

/* 上传结果样式 */
.success-message {
  color: green;
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.error-message {
  color: red;
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.error-details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.error-item {
  color: #666;
  margin-bottom: 5px;
  padding: 3px 0;
}
</style>