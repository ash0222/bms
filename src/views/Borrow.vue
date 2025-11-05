<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessageBox, ElMessage, ElEmpty } from 'element-plus'
import type { FormInstance } from 'element-plus'
// 引入所需图标
import { Plus, Delete, Edit, Search, RefreshRight, Upload, Warning } from '@element-plus/icons-vue'
// 引入xlsx库用于解析Excel文件
import * as XLSX from 'xlsx'
import $api from '../axios'

// 定义图书信息类型（用于关联显示封面）
interface Book {
  bookId: string
  coverUrl: string
  bookName: string
}

// 定义借阅记录类型接口
interface Borrow {
  borrowId: string
  bookId: string
  bookName: string
  coverUrl?: string // 关联的图书封面
  readerId: string
  readerName: string
  readerPhone: string
  readerGender: string // 男/女
  borrowDate: string
  dueDate: string
}

// 表格数据相关
const tableData = ref<Borrow[]>([])
const allData = ref<Borrow[]>([]) // 存储全量数据用于前端分页和过滤
const books = ref<Book[]>([]) // 存储图书信息用于关联封面
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const queryLoading = ref(false)
const hasResults = ref(true)
const batchDeleteLoading = ref(false) // 批量删除加载状态
const uploadLoading = ref(false) // 批量上传加载状态

// 批量选择相关
const multipleSelection = ref<Borrow[]>([]) // 存储选中的行数据
const checkAll = ref(false) // 全选状态

// 对话框显示状态
const dialogVisible = ref(false) // 编辑对话框
const addDialogVisible = ref(false) // 添加对话框
const uploadDialogVisible = ref(false) // 上传结果对话框

// 上传结果统计
const uploadSuccessCount = ref(0)
const uploadErrorCount = ref(0)
const uploadErrorDetails = ref<string[]>([])

// 查询表单数据
const queryForm = reactive({
  borrowId: '',
  bookId: '',
  bookName: '',
  readerId: '',
  readerName: '',
  readerGender: '',
  readerPhone: '',
  borrowDate: '',
  dueDate: ''
})

// 编辑表单数据
const editForm = reactive<Borrow>({
  borrowId: '',
  bookId: '',
  bookName: '',
  readerId: '',
  readerName: '',
  readerPhone: '',
  readerGender: '',
  borrowDate: '',
  dueDate: ''
})

// 添加表单数据
const addForm = reactive<Borrow>({
  borrowId: '',
  bookId: '',
  bookName: '',
  readerId: '',
  readerName: '',
  readerPhone: '',
  readerGender: '',
  borrowDate: '',
  dueDate: ''
})

// 编辑表单验证规则
const editRules = reactive({
  borrowId: [
    { required: true, message: '请输入借阅记录ID', trigger: 'blur' }
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
    { required: true, message: '请选择归还日期', trigger: 'change' }
  ]
})

const addRules = reactive({ ...editRules })

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
const handleSelectionChange = (selection: Borrow[]) => {
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

// 获取全量借阅记录数据
const getAllBorrowData = async () => {
  try {
    queryLoading.value = true
    const res = await $api.get('/borrow/page', {
      params: {
        currentPage: 1,
        size: 10000 // 获取足够多的数据，确保包含所有记录
      }
    })

    if (res.data.code === 200 && res.data.data) {
      // 关联图书封面
      const borrows = res.data.data.records as Borrow[]
      return borrows.map(borrow => {
        const book = books.value.find(b => b.bookId === borrow.bookId)
        return {
          ...borrow,
          coverUrl: book?.coverUrl
        }
      })
    }
    return []
  } catch (error) {
    ElMessage({
      message: '获取借阅记录失败',
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
  
  // 借阅记录ID精确匹配
  if (queryForm.borrowId) {
    filteredData = filteredData.filter(borrow => 
      borrow.borrowId === queryForm.borrowId
    )
  }
  
  // 图书ID精确匹配
  if (queryForm.bookId) {
    filteredData = filteredData.filter(borrow => 
      borrow.bookId === queryForm.bookId
    )
  }
  
  // 图书名称模糊匹配（不区分大小写）
  if (queryForm.bookName) {
    const keyword = queryForm.bookName.toLowerCase()
    filteredData = filteredData.filter(borrow => 
      borrow.bookName.toLowerCase().includes(keyword)
    )
  }
  
  // 读者ID精确匹配
  if (queryForm.readerId) {
    filteredData = filteredData.filter(borrow => 
      borrow.readerId === queryForm.readerId
    )
  }
  
  // 读者姓名模糊匹配（不区分大小写）
  if (queryForm.readerName) {
    const keyword = queryForm.readerName.toLowerCase()
    filteredData = filteredData.filter(borrow => 
      borrow.readerName.toLowerCase().includes(keyword)
    )
  }
  
  // 读者性别精确匹配
  if (queryForm.readerGender) {
    filteredData = filteredData.filter(borrow => 
      borrow.readerGender === queryForm.readerGender
    )
  }
  
  // 读者电话精确匹配
  if (queryForm.readerPhone) {
    filteredData = filteredData.filter(borrow => 
      borrow.readerPhone === queryForm.readerPhone
    )
  }
  
  // 借阅日期精确匹配
  if (queryForm.borrowDate) {
    filteredData = filteredData.filter(borrow => 
      borrow.borrowDate === queryForm.borrowDate
    )
  }
  
  // 归还日期精确匹配
  if (queryForm.dueDate) {
    filteredData = filteredData.filter(borrow => 
      borrow.dueDate === queryForm.dueDate
    )
  }

  // 2. 更新总数
  totalCount.value = filteredData.length
  hasResults.value = totalCount.value > 0

  // 3. 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  tableData.value = filteredData.slice(startIndex, endIndex)
}

// 核心：获取数据并处理
const getData = async () => {
  const borrows = await getAllBorrowData()
  allData.value = borrows
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
const addBorrow = () => {
  addDialogVisible.value = true
  // 清空表单
  Object.keys(addForm).forEach(key => {
    addForm[key as keyof Borrow] = ''
  })
}

// 提交添加表单
const addSubmitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.post('/borrow/add', addForm)
        if (res.data.code === 200) {
          ElMessage({
            message: '添加成功',
            type: 'success'
          })
          addDialogVisible.value = false
          getData()
        } else {
          ElMessage({
            message: '添加失败',
            type: 'error'
          })
        }
      } catch (error) {
        ElMessage({
          message: '请求出错',
          type: 'error'
        })
      }
    }
  })
}

// 批量删除
const batchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage({
      message: '请选择需要删除的借阅记录',
      type: 'warning'
    })
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 条借阅记录吗？`,
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
      const deletePromises = multipleSelection.value.map(borrow => 
        $api.delete('/borrow/delete', { params: { borrowId: borrow.borrowId } })
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
      ElMessage({
        message: '请求出错',
        type: 'error'
      })
    } finally {
      batchDeleteLoading.value = false
    }
  }).catch(() => {
    ElMessage({
      message: '取消删除',
      type: 'info',
    })
  })
}

// 删除单条借阅记录
const delBorrow = async (borrowId: string) => {
  ElMessageBox.confirm(
    '确定要删除这条借阅记录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await $api.delete('/borrow/delete', {
          params: { borrowId }
        })
        if (res.data.code === 200) {
          ElMessage({
            message: '删除成功',
            type: 'success',
          })
          // 清除选择状态中的当前项
          multipleSelection.value = multipleSelection.value.filter(item => item.borrowId !== borrowId)
          checkAll.value = multipleSelection.value.length > 0 && multipleSelection.value.length === tableData.value.length
          getData()
        } else {
          ElMessage({
            message: '删除失败',
            type: 'error',
          })
        }
      } catch (error) {
        ElMessage({
          message: '请求出错',
          type: 'error'
        })
      }
    })
    .catch(() => {
      ElMessage({
        message: '取消删除',
        type: 'info',
      })
    })
}

// 打开编辑对话框
const editBorrow = (row: Borrow) => {
  dialogVisible.value = true
  // 填充表单数据
  editForm.borrowId = row.borrowId
  editForm.bookId = row.bookId
  editForm.bookName = row.bookName
  editForm.readerId = row.readerId
  editForm.readerName = row.readerName
  editForm.readerPhone = row.readerPhone
  editForm.readerGender = row.readerGender
  editForm.borrowDate = row.borrowDate
  editForm.dueDate = row.dueDate
}

// 提交编辑表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.put('/borrow/update', editForm)
        if (res.data.code === 200) {
          ElMessage({
            message: '修改成功',
            type: 'success'
          })
          dialogVisible.value = false
          getData()
        } else {
          ElMessage({
            message: '修改失败',
            type: 'error'
          })
        }
      } catch (error) {
        ElMessage({
          message: '请求出错',
          type: 'error'
        })
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
      const requiredHeaders = ['borrowId', 'bookId', 'bookName', 'readerId', 'readerName', 'readerGender', 'borrowDate', 'dueDate']
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
      const borrowsToAdd: Borrow[] = []
      jsonData.forEach((item, index) => {
        try {
          // 映射Excel列到Borrow对象（不区分大小写匹配）
          const borrow: Borrow = {
            borrowId: item[headers.find(h => h.toLowerCase() === 'borrowid')!] || '',
            bookId: item[headers.find(h => h.toLowerCase() === 'bookid')!] || '',
            bookName: item[headers.find(h => h.toLowerCase() === 'bookname')!] || '',
            readerId: item[headers.find(h => h.toLowerCase() === 'readerid')!] || '',
            readerName: item[headers.find(h => h.toLowerCase() === 'readername')!] || '',
            readerPhone: item[headers.find(h => h.toLowerCase() === 'readerphone')!] || '',
            readerGender: item[headers.find(h => h.toLowerCase() === 'readergender')!] || '',
            borrowDate: item[headers.find(h => h.toLowerCase() === 'borrowdate')!] || '',
            dueDate: item[headers.find(h => h.toLowerCase() === 'duedate')!] || ''
          }
          
          // 简单验证
          if (!borrow.borrowId) throw new Error('借阅记录ID不能为空')
          if (!borrow.bookId) throw new Error('图书ID不能为空')
          if (!borrow.bookName) throw new Error('图书名称不能为空')
          if (!borrow.readerId) throw new Error('读者ID不能为空')
          if (!borrow.readerName) throw new Error('读者姓名不能为空')
          if (!borrow.readerGender) throw new Error('读者性别不能为空')
          if (!borrow.borrowDate) throw new Error('借阅日期不能为空')
          if (!borrow.dueDate) throw new Error('归还日期不能为空')
          if (!['男', '女'].includes(borrow.readerGender)) throw new Error('读者性别必须是"男"或"女"')
          
          borrowsToAdd.push(borrow)
        } catch (error) {
          uploadErrorCount.value++
          uploadErrorDetails.value.push(`第${index + 2}行数据错误: ${(error as Error).message}`)
        }
      })
      
      // 批量添加到数据库
      if (borrowsToAdd.length > 0) {
        // 循环调用单条添加接口
        for (const borrow of borrowsToAdd) {
          try {
            const res = await $api.post('/borrow/add', borrow)
            if (res.data.code === 200) {
              uploadSuccessCount.value++
            } else {
              uploadErrorCount.value++
              uploadErrorDetails.value.push(`借阅ID: ${borrow.borrowId} 添加失败: 服务器返回错误`)
            }
          } catch (error) {
            uploadErrorCount.value++
            uploadErrorDetails.value.push(`借阅ID: ${borrow.borrowId} 添加失败: 网络请求错误`)
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
  };
  
  reader.readAsArrayBuffer(file.raw)
}

// 页面挂载时获取数据
onMounted(async () => {
  await getBooks() // 先获取图书信息
  await getData()
})
</script>

<template>
  <div>
    <!-- 功能按钮 -->
    <el-button type="primary" @click="addBorrow">
      <el-icon><Plus /></el-icon>
      添加借阅记录
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
      <el-form-item label="借阅记录ID">
        <el-input v-model="queryForm.borrowId" placeholder="请输入" clearable style="width: 140px;" />
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
      <el-form-item label="读者电话">
        <el-input v-model="queryForm.readerPhone" placeholder="请输入" clearable style="width: 140px;" />
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
      <el-form-item label="归还日期">
        <el-date-picker
          v-model="queryForm.dueDate"
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

    <!-- 当前查询条件提示 -->
    <div v-if="Object.values(queryForm).some(v => v)" class="query-tips">
      <span>当前查询条件: </span>
      <el-tag v-if="queryForm.borrowId" type="info" closable @close="queryForm.borrowId = ''; handleQuery()">借阅ID: {{ queryForm.borrowId }}</el-tag>
      <el-tag v-if="queryForm.bookName" type="info" closable @close="queryForm.bookName = ''; handleQuery()">书名: {{ queryForm.bookName }}</el-tag>
      <el-tag v-if="queryForm.readerName" type="info" closable @close="queryForm.readerName = ''; handleQuery()">读者: {{ queryForm.readerName }}</el-tag>
      <el-tag v-if="queryForm.borrowDate" type="info" closable @close="queryForm.borrowDate = ''; handleQuery()">借阅日: {{ queryForm.borrowDate }}</el-tag>
      <el-tag v-if="queryForm.dueDate" type="info" closable @close="queryForm.dueDate = ''; handleQuery()">归还日: {{ queryForm.dueDate }}</el-tag>
      <el-tag v-if="queryForm.readerGender" type="info" closable @close="queryForm.readerGender = ''; handleQuery()">性别: {{ queryForm.readerGender }}</el-tag>
    </div>

    <!-- 借阅记录表格 -->
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
        
        <el-table-column prop="borrowId" label="借阅记录ID" align="center" />
        <el-table-column prop="bookId" label="图书ID" align="center" />
        <el-table-column prop="bookName" label="图书名称" align="center" />
        <el-table-column prop="readerId" label="读者ID" align="center" />
        <el-table-column prop="readerName" label="读者姓名" align="center" />
        <el-table-column prop="readerGender" label="读者性别" align="center" />
        <el-table-column prop="readerPhone" label="读者电话" align="center" />
        <el-table-column prop="borrowDate" label="借阅日期" align="center" />
        <el-table-column prop="dueDate" label="归还日期" align="center" />
        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button type="primary" size="small" @click="editBorrow(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="delBorrow(scope.row.borrowId)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="没有找到符合条件的借阅记录" />
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
      title="增加借阅记录"
      width="500"
    >
      <el-form
        ref="addFormRef"
        style="max-width: 600px"
        :model="addForm"
        :rules="addRules"
        label-width="auto"
      >
        <el-form-item label="借阅记录ID" prop="borrowId">
          <el-input v-model="addForm.borrowId" />
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
        <el-form-item label="归还日期" prop="dueDate">
          <el-date-picker
            v-model="addForm.dueDate"
            type="date"
            placeholder="选择归还日期"
            value-format="YYYY-MM-DD"
          />
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
      title="修改借阅记录"
      width="500"
    >
      <el-form
        ref="editFormRef"
        style="max-width: 600px"
        :model="editForm"
        :rules="editRules"
        label-width="auto"
      >
        <el-form-item label="借阅记录ID" prop="borrowId">
          <el-input v-model="editForm.borrowId" disabled />
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
        <el-form-item label="归还日期" prop="dueDate">
          <el-date-picker
            v-model="editForm.dueDate"
            type="date"
            placeholder="选择归还日期"
            value-format="YYYY-MM-DD"
          />
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
  gap: 8px;
  justify-content: center;
  width: 100%;
}

/* 确保操作列有足够宽度 */
:deep(.el-table-column:last-child) {
  min-width: 200px !important;
}

.el-table th,
.el-table td {
  padding: 10px 15px;
}

/* 查询表单样式 */
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

/* 按钮样式调整 */
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

:deep(.el-icon) {
  margin-right: 5px;
}

/* 图片预览样式优化 */
:deep(.el-image-viewer__wrapper) {
  z-index: 9999;
}
</style>