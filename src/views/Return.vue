<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessageBox, ElMessage, ElEmpty } from 'element-plus'
import type { FormInstance } from 'element-plus'
// 引入所需图标
import { Plus, Delete, Edit, Search, RefreshRight, Upload, Warning } from '@element-plus/icons-vue'
import $api from '../axios'
// 引入xlsx库用于解析Excel文件
import * as XLSX from 'xlsx'

// 定义图书信息类型（用于关联封面）
interface Book {
  bookId: string
  coverUrl: string
  bookName: string
}

// 定义归还记录类型接口
interface ReturnRecord {
  returnId: string
  bookId: string
  bookName: string
  coverUrl?: string // 关联图书封面
  readerId: string
  readerName: string
  readerPhone: string
  readerGender: string // 男/女
  borrowDate: string
  dueDate: string
  returnDate: string
  returnStatus: string // 归还/未归还
}

// 表格数据相关
const tableData = ref<ReturnRecord[]>([])
const allData = ref<ReturnRecord[]>([]) // 存储全量数据用于前端分页和过滤
const books = ref<Book[]>([]) // 存储图书信息用于关联封面
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const dialogVisible = ref(false) // 编辑对话框
const addDialogVisible = ref(false) // 添加对话框
const queryLoading = ref(false)
const hasResults = ref(true)
const batchDeleteLoading = ref(false) // 批量删除加载状态

// 批量上传相关变量
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const uploadSuccessCount = ref(0)
const uploadErrorCount = ref(0)
const uploadErrorDetails = ref<string[]>([])

// 批量选择相关
const multipleSelection = ref<ReturnRecord[]>([]) // 存储选中的行数据
const checkAll = ref(false) // 全选状态

// 查询表单数据
const queryForm = reactive({
  returnId: '',
  bookId: '',
  bookName: '',
  readerId: '',
  readerName: '',
  readerPhone: '',
  readerGender: '',
  borrowDate: '',
  dueDate: '',
  returnDate: '',
  returnStatus: ''
})

// 编辑表单数据
const editForm = reactive<ReturnRecord>({
  returnId: '',
  bookId: '',
  bookName: '',
  readerId: '',
  readerName: '',
  readerPhone: '',
  readerGender: '',
  borrowDate: '',
  dueDate: '',
  returnDate: '',
  returnStatus: ''
})

// 添加表单数据
const addForm = reactive<ReturnRecord>({
  returnId: '',
  bookId: '',
  bookName: '',
  readerId: '',
  readerName: '',
  readerPhone: '',
  readerGender: '',
  borrowDate: '',
  dueDate: '',
  returnDate: '',
  returnStatus: ''
})

// 编辑表单验证规则
const editRules = reactive({
  returnId: [
    { required: true, message: '请输入归还记录ID', trigger: 'blur' }
  ],
  bookId: [
    { required: true, message: '请输入图书ID', trigger: 'blur' }
  ],
  bookName: [
    { required: true, message: '请输入图书名称', trigger: 'blur' }
  ],
  readerId: [
    { required: true, message: '请输入读者ID', trigger: 'blur' }
  ],
  readerName: [
    { required: true, message: '请输入读者姓名', trigger: 'blur' }
  ],
  readerGender: [
    { required: true, message: '请选择读者性别', trigger: 'change' }
  ],
  borrowDate: [
    { required: true, message: '请选择借阅日期', trigger: 'change' }
  ],
  dueDate: [
    { required: true, message: '请选择到期日期', trigger: 'change' }
  ],
  returnStatus: [
    { required: true, message: '请选择归还状态', trigger: 'change' }
  ]
})

const addRules = reactive({ ...editRules })

// 获取图书信息（用于关联封面）
const getBooks = async () => {
  try {
    const res = await $api.get('/book/list')
    if (res.data.code === 200 && res.data.data) {
      books.value = res.data.data as Book[]
    }
  } catch (error) {
    console.log('获取图书信息失败', error)
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
  filterAndPaginateData() // 重新过滤和分页
  // 清除选择状态
  multipleSelection.value = []
  checkAll.value = false
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  filterAndPaginateData() // 重新分页
  // 清除选择状态
  multipleSelection.value = []
  checkAll.value = false
}

// 处理多选框选择
const handleSelectionChange = (selection: ReturnRecord[]) => {
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

const editFormRef = ref<FormInstance>()
const addFormRef = ref<FormInstance>()

// 获取全量数据
const getAllData = async () => {
  try {
    queryLoading.value = true
    const res = await $api.get('/return/page', {
      params: {
        currentPage: 1,
        size: 10000 // 获取足够多的全量数据
      }
    })

    if (res.data.code === 200 && res.data.data) {
      // 关联图书封面信息
      const records = res.data.data.rows as ReturnRecord[]
      return records.map(record => {
        const book = books.value.find(b => b.bookId === record.bookId)
        return {
          ...record,
          coverUrl: book?.coverUrl
        }
      })
    }
    return []
  } catch (error) {
    ElMessage({
      message: '获取数据失败',
      type: 'error'
    })
    return []
  } finally {
    queryLoading.value = false
  }
}

// 过滤并分页数据
const filterAndPaginateData = () => {
  // 1. 过滤数据
  let filteredData = [...allData.value]
  
  // 归还记录ID精确匹配
  if (queryForm.returnId) {
    filteredData = filteredData.filter(record => 
      record.returnId === queryForm.returnId
    )
  }
  
  // 图书ID精确匹配
  if (queryForm.bookId) {
    filteredData = filteredData.filter(record => 
      record.bookId === queryForm.bookId
    )
  }
  
  // 图书名称模糊匹配（不区分大小写）
  if (queryForm.bookName) {
    const keyword = queryForm.bookName.toLowerCase()
    filteredData = filteredData.filter(record => 
      record.bookName.toLowerCase().includes(keyword)
    )
  }
  
  // 读者ID精确匹配
  if (queryForm.readerId) {
    filteredData = filteredData.filter(record => 
      record.readerId === queryForm.readerId
    )
  }
  
  // 读者姓名模糊匹配（不区分大小写）
  if (queryForm.readerName) {
    const keyword = queryForm.readerName.toLowerCase()
    filteredData = filteredData.filter(record => 
      record.readerName.toLowerCase().includes(keyword)
    )
  }
  
  // 读者性别精确匹配
  if (queryForm.readerGender) {
    filteredData = filteredData.filter(record => 
      record.readerGender === queryForm.readerGender
    )
  }
  
  // 借阅日期精确匹配
  if (queryForm.borrowDate) {
    filteredData = filteredData.filter(record => 
      record.borrowDate === queryForm.borrowDate
    )
  }
  
  // 到期日期精确匹配
  if (queryForm.dueDate) {
    filteredData = filteredData.filter(record => 
      record.dueDate === queryForm.dueDate
    )
  }
  
  // 归还日期精确匹配
  if (queryForm.returnDate) {
    filteredData = filteredData.filter(record => 
      record.returnDate === queryForm.returnDate
    )
  }
  
  // 归还状态精确匹配
  if (queryForm.returnStatus) {
    filteredData = filteredData.filter(record => 
      record.returnStatus === queryForm.returnStatus
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
  const records = await getAllData()
  allData.value = records
  filterAndPaginateData()
}

// 处理查询
const handleQuery = () => {
  currentPage.value = 1 // 重置到第一页
  // 清除选择状态
  multipleSelection.value = []
  checkAll.value = false
  getData() // 重新获取全量数据并过滤分页
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

// 打开添加对话框
const addReturn = () => {
  addDialogVisible.value = true
  // 清空表单
  Object.keys(addForm).forEach(key => {
    addForm[key as keyof ReturnRecord] = ''
  })
}

// 提交添加表单
const addSubmitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.post('/return/add', addForm)
        if (res.data.code === 200) {
          ElMessage({ message: '添加成功', type: 'success' })
          addDialogVisible.value = false
          getData() // 重新获取全量数据
        } else {
          ElMessage({ message: '添加失败', type: 'error' })
        }
      } catch (error) {
        ElMessage({ message: '请求出错', type: 'error' })
      }
    }
  })
}

// 批量删除
const batchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage({
      message: '请选择需要删除的归还记录',
      type: 'warning'
    })
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 条归还记录吗？`,
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
      const deletePromises = multipleSelection.value.map(record => 
        $api.delete('/return/delete', { params: { id: record.returnId } })
      )
      
      // 等待所有删除请求完成
      const results = await Promise.all(deletePromises)
      
      // 检查是否所有删除都成功
      const allSuccess = results.every(res => res.data.code === 200)
      
      if (allSuccess) {
        ElMessage({
          message: `成功删除 ${multipleSelection.value.length} 条记录`,
          type: 'success',
        })
        // 清除选择状态
        multipleSelection.value = []
        checkAll.value = false
        getData() // 删除成功后重新获取数据
      } else {
        ElMessage({
          message: '部分记录删除失败',
          type: 'error'
        })
      }
    } catch (error) {
      ElMessage({ message: '请求出错', type: 'error' })
    } finally {
      batchDeleteLoading.value = false
    }
  }).catch(() => {
    ElMessage({ message: '取消删除', type: 'info' })
  })
}

// 删除单条归还记录
const delReturn = async (returnId: string) => {
  ElMessageBox.confirm(
    '确定要删除这条归还记录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await $api.delete('/return/delete', {
        params: { id: returnId }
      })
      if (res.data.code === 200) {
        ElMessage({ message: '删除成功', type: 'success' })
        // 清除选择状态中的当前项
        multipleSelection.value = multipleSelection.value.filter(item => item.returnId !== returnId)
        checkAll.value = multipleSelection.value.length > 0 && multipleSelection.value.length === tableData.value.length
        getData() // 重新获取全量数据
      } else {
        ElMessage({ message: '删除失败', type: 'error' })
      }
    } catch (error) {
      ElMessage({ message: '请求出错', type: 'error' })
    }
  }).catch(() => {
    ElMessage({ message: '取消删除', type: 'info' })
  })
}

// 打开编辑对话框
const editReturn = (row: ReturnRecord) => {
  dialogVisible.value = true
  // 填充表单数据
  editForm.returnId = row.returnId
  editForm.bookId = row.bookId
  editForm.bookName = row.bookName
  editForm.readerId = row.readerId
  editForm.readerName = row.readerName
  editForm.readerPhone = row.readerPhone
  editForm.readerGender = row.readerGender
  editForm.borrowDate = row.borrowDate
  editForm.dueDate = row.dueDate
  editForm.returnDate = row.returnDate
  editForm.returnStatus = row.returnStatus
}

// 提交编辑表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.put('/return/update', editForm)
        if (res.data.code === 200) {
          ElMessage({ message: '修改成功', type: 'success' })
          dialogVisible.value = false
          getData() // 重新获取全量数据
        } else {
          ElMessage({ message: '修改失败', type: 'error' })
        }
      } catch (error) {
        ElMessage({ message: '请求出错', type: 'error' })
      }
    }
  })
}

// 批量上传相关方法
// 检查文件类型和大小
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

// 处理文件上传
const handleFileChange = async (file: any) => {
  // 解析Excel文件
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      uploadLoading.value = true
      // 重置上传统计
      uploadSuccessCount.value = 0
      uploadErrorCount.value = 0
      uploadErrorDetails.value = []
      
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      
      // 获取第一个工作表
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // 转换为JSON
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
      
      if (jsonData.length === 0) {
        ElMessage.warning('Excel文件中没有数据')
        uploadLoading.value = false
        return
      }
      
      // 验证表头是否正确
      const requiredHeaders = ['returnId', 'bookId', 'bookName', 'readerId', 'readerName', 'readerGender', 'borrowDate', 'dueDate', 'returnStatus']
      const headers = Object.keys(jsonData[0])
      
      // 检查是否缺少必要的表头
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase() === header.toLowerCase())
      )
      
      if (missingHeaders.length > 0) {
        ElMessage.error(`Excel文件缺少必要的列: ${missingHeaders.join(', ')}`)
        uploadLoading.value = false
        return
      }
      
      // 处理每一行数据
      const recordsToAdd: ReturnRecord[] = []
      jsonData.forEach((item, index) => {
        try {
          // 映射Excel列到ReturnRecord对象（不区分大小写匹配）
          const record: ReturnRecord = {
            returnId: item[headers.find(h => h.toLowerCase() === 'returnid')!] || '',
            bookId: item[headers.find(h => h.toLowerCase() === 'bookid')!] || '',
            bookName: item[headers.find(h => h.toLowerCase() === 'bookname')!] || '',
            readerId: item[headers.find(h => h.toLowerCase() === 'readerid')!] || '',
            readerName: item[headers.find(h => h.toLowerCase() === 'readername')!] || '',
            readerPhone: item[headers.find(h => h.toLowerCase() === 'readerphone')!] || '',
            readerGender: item[headers.find(h => h.toLowerCase() === 'readergender')!] || '',
            borrowDate: item[headers.find(h => h.toLowerCase() === 'borrowdate')!] || '',
            dueDate: item[headers.find(h => h.toLowerCase() === 'duedate')!] || '',
            returnDate: item[headers.find(h => h.toLowerCase() === 'returndate')!] || '',
            returnStatus: item[headers.find(h => h.toLowerCase() === 'returnstatus')!] || ''
          }
          
          // 简单验证
          if (!record.returnId || !record.bookId || !record.bookName || !record.readerId || !record.readerName) {
            throw new Error(`缺少必要信息（带*的字段为必填项）`)
          }
          
          recordsToAdd.push(record)
        } catch (error) {
          uploadErrorCount.value++
          uploadErrorDetails.value.push(`第${index + 2}行数据错误: ${(error as Error).message}`)
        }
      })
      
      // 批量添加到数据库
      if (recordsToAdd.length > 0) {
        // 循环调用单条添加接口
        for (const record of recordsToAdd) {
          try {
            const res = await $api.post('/return/add', record)
            if (res.data.code === 200) {
              uploadSuccessCount.value++
            } else {
              uploadErrorCount.value++
              uploadErrorDetails.value.push(`归还记录ID: ${record.returnId} 添加失败: 服务器返回错误`)
            }
          } catch (error) {
            uploadErrorCount.value++
            uploadErrorDetails.value.push(`归还记录ID: ${record.returnId} 添加失败: 网络请求错误`)
          }
        }
      }
      
      // 显示上传结果
      uploadDialogVisible.value = true
      // 重新加载数据
      await getData()
    } catch (error) {
      ElMessage.error(`处理文件时出错: ${(error as Error).message}`)
    } finally {
      uploadLoading.value = false
    }
  }
  
  reader.readAsArrayBuffer(file.raw)
}

// 页面挂载时获取数据
onMounted(async () => {
  await getBooks() // 先获取图书信息用于关联封面
  await getData()
})
</script>

<template>
  <div>
    <!-- 添加按钮、批量上传和批量删除按钮 -->
    <el-button type="primary" @click="addReturn">
      <el-icon><Plus /></el-icon>
      添加归还记录
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
    
    <!-- 上传提示对话框 -->
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
      <el-form-item label="归还记录ID">
        <el-input v-model="queryForm.returnId" placeholder="请输入" clearable style="width: 140px;" />
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
      <el-form-item label="读者姓名">
        <el-input v-model="queryForm.readerName" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="读者性别">
        <el-select v-model="queryForm.readerGender" placeholder="请选择" clearable style="width: 100px;">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
        </el-select>
      </el-form-item>
      <el-form-item label="借阅日期">
        <el-date-picker
          v-model="queryForm.borrowDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 140px;"
        />
      </el-form-item>
      <el-form-item label="到期日期">
        <el-date-picker
          v-model="queryForm.dueDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 140px;"
        />
      </el-form-item>
      <el-form-item label="归还日期">
        <el-date-picker
          v-model="queryForm.returnDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 140px;"
        />
      </el-form-item>
      <el-form-item label="归还状态">
        <el-select v-model="queryForm.returnStatus" placeholder="请选择" clearable style="width: 120px;">
          <el-option label="归还" value="归还" />
          <el-option label="未归还" value="未归还" />
        </el-select>
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
      <el-tag v-if="queryForm.returnId" type="info" closable @close="queryForm.returnId = ''; handleQuery()">归还ID: {{ queryForm.returnId }}</el-tag>
      <el-tag v-if="queryForm.bookName" type="info" closable @close="queryForm.bookName = ''; handleQuery()">书名: {{ queryForm.bookName }}</el-tag>
      <el-tag v-if="queryForm.readerName" type="info" closable @close="queryForm.readerName = ''; handleQuery()">读者: {{ queryForm.readerName }}</el-tag>
      <el-tag v-if="queryForm.returnStatus" type="info" closable @close="queryForm.returnStatus = ''; handleQuery()">状态: {{ queryForm.returnStatus }}</el-tag>
      <el-tag v-if="queryForm.borrowDate" type="info" closable @close="queryForm.borrowDate = ''; handleQuery()">借阅日: {{ queryForm.borrowDate }}</el-tag>
    </div>

    <!-- 归还记录表格 -->
    <div class="table-container" v-loading="queryLoading || uploadLoading">
      <el-table 
        v-if="hasResults" 
        :data="tableData" 
        style="width: 100%; margin-top: 10px"
        border
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
        
        <!-- 图书封面列 -->
        <el-table-column label="图书封面" align="center" width="100">
          <template #default="scope">
            <el-image
              :src="scope.row.coverUrl"
              alt="图书封面"
              style="width: 60px; height: 80px; object-fit: cover;"
              :preview-src-list="[scope.row.coverUrl || '']"
            >
              <template #error>
                <div class="image-placeholder">无封面</div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        
        <el-table-column prop="returnId" label="归还记录ID" align="center" />
        <el-table-column prop="bookId" label="图书ID" align="center" />
        <el-table-column prop="bookName" label="图书名称" align="center" />
        <el-table-column prop="readerId" label="读者ID" align="center" />
        <el-table-column prop="readerName" label="读者姓名" align="center" />
        <el-table-column prop="readerGender" label="读者性别" align="center" />
        <el-table-column prop="borrowDate" label="借阅日期" align="center" />
        <el-table-column prop="dueDate" label="到期日期" align="center" />
        <el-table-column prop="returnDate" label="归还日期" align="center" />
        <el-table-column prop="returnStatus" label="归还状态" align="center" />
        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button type="primary" size="small" @click="editReturn(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="delReturn(scope.row.returnId)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="没有找到符合条件的归还记录" />
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

    <!-- 添加对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加归还记录"
      width="500"
    >
      <el-form
        ref="addFormRef"
        style="max-width: 600px"
        :model="addForm"
        :rules="addRules"
        label-width="auto"
      >
        <el-form-item label="归还记录ID" prop="returnId">
          <el-input v-model="addForm.returnId" />
        </el-form-item>
        <el-form-item label="图书ID" prop="bookId">
          <el-input v-model="addForm.bookId" />
        </el-form-item>
        <el-form-item label="图书名称" prop="bookName">
          <el-input v-model="addForm.bookName" />
        </el-form-item>
        <el-form-item label="读者ID" prop="readerId">
          <el-input v-model="addForm.readerId" />
        </el-form-item>
        <el-form-item label="读者姓名" prop="readerName">
          <el-input v-model="addForm.readerName" />
        </el-form-item>
        <el-form-item label="读者电话" prop="readerPhone">
          <el-input v-model="addForm.readerPhone" />
        </el-form-item>
        <el-form-item label="读者性别" prop="readerGender">
          <el-select v-model="addForm.readerGender" placeholder="请选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="借阅日期" prop="borrowDate">
          <el-date-picker
            v-model="addForm.borrowDate"
            type="date"
            placeholder="选择借阅日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="到期日期" prop="dueDate">
          <el-date-picker
            v-model="addForm.dueDate"
            type="date"
            placeholder="选择到期日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="归还日期" prop="returnDate">
          <el-date-picker
            v-model="addForm.returnDate"
            type="date"
            placeholder="选择归还日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="归还状态" prop="returnStatus">
          <el-select v-model="addForm.returnStatus" placeholder="请选择状态">
            <el-option label="归还" value="归还" />
            <el-option label="未归还" value="未归还" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addSubmitForm(addFormRef)">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改归还记录"
      width="500"
    >
      <el-form
        ref="editFormRef"
        style="max-width: 600px"
        :model="editForm"
        :rules="editRules"
        label-width="auto"
      >
        <el-form-item label="归还记录ID" prop="returnId">
          <el-input v-model="editForm.returnId" disabled />
        </el-form-item>
        <el-form-item label="图书ID" prop="bookId">
          <el-input v-model="editForm.bookId" />
        </el-form-item>
        <el-form-item label="图书名称" prop="bookName">
          <el-input v-model="editForm.bookName" />
        </el-form-item>
        <el-form-item label="读者ID" prop="readerId">
          <el-input v-model="editForm.readerId" />
        </el-form-item>
        <el-form-item label="读者姓名" prop="readerName">
          <el-input v-model="editForm.readerName" />
        </el-form-item>
        <el-form-item label="读者电话" prop="readerPhone">
          <el-input v-model="editForm.readerPhone" />
        </el-form-item>
        <el-form-item label="读者性别" prop="readerGender">
          <el-select v-model="editForm.readerGender" placeholder="请选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="借阅日期" prop="borrowDate">
          <el-date-picker
            v-model="editForm.borrowDate"
            type="date"
            placeholder="选择借阅日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="到期日期" prop="dueDate">
          <el-date-picker
            v-model="editForm.dueDate"
            type="date"
            placeholder="选择到期日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="归还日期" prop="returnDate">
          <el-date-picker
            v-model="editForm.returnDate"
            type="date"
            placeholder="选择归还日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="归还状态" prop="returnStatus">
          <el-select v-model="editForm.returnStatus" placeholder="请选择状态">
            <el-option label="归还" value="归还" />
            <el-option label="未归还" value="未归还" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm(editFormRef)">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.operation-buttons {
  display: flex;
  gap: 8px; /* 减小间距确保按钮并排显示 */
  justify-content: center;
  width: 100%; /* 确保有足够宽度容纳两个按钮 */
}

/* 确保操作列有足够宽度 */
:deep(.el-table-column:last-child) {
  min-width: 200px !important;
}

.el-table th,
.el-table td {
  padding: 10px 15px; /* 适当减小内边距 */
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

/* 封面图片样式 */
.image-placeholder {
  width: 60px;
  height: 80px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
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

/* 图片预览样式优化 */
:deep(.el-image-viewer__wrapper) {
  z-index: 9999;
}
</style>