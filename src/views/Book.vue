<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessageBox, ElMessage, ElEmpty } from 'element-plus'
import type { FormInstance } from 'element-plus'
// 引入需要的图标
import { Plus, Delete, Edit, Search, RefreshRight, Upload, Warning } from '@element-plus/icons-vue'
// 引入xlsx库用于解析Excel文件
import * as XLSX from 'xlsx'

import $api from '../axios'

// 定义书籍类型接口（与后端实体对应，新增coverUrl字段）
interface Book {
  bookId: string
  coverUrl: string  // 新增封面URL字段
  bookName: string
  isbn: string
  description: string
  publicationDate: string
  author: string
  publisher: string
  category: string
  quantity: number
  storageDate: string
  bookStatus: string
}

// 表格数据
const tableData = ref<Book[]>([])
const allData = ref<Book[]>([]) // 存储全量数据用于前端分页和过滤
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const dialogVisible = ref(false)
const addDialogVisible = ref(false)
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
const multipleSelection = ref<Book[]>([]) // 存储选中的行数据
const checkAll = ref(false) // 全选状态

// 查询表单数据
const queryForm = reactive({
  bookId: '',
  bookName: '',
  isbn: '',
  author: '',
  publisher: '',
  category: '',
  storageDate: '',
  bookStatus: ''
})

// 编辑表单数据（不包含coverUrl，避免编辑）
const editForm = reactive<{
  bookId: string
  bookName: string
  isbn: string
  description: string
  publicationDate: string
  author: string
  publisher: string
  category: string
  quantity: number
  storageDate: string
  bookStatus: string
}>({
  bookId: '',
  bookName: '',
  isbn: '',
  description: '',
  publicationDate: '',
  author: '',
  publisher: '',
  category: '',
  quantity: 0,
  storageDate: '',
  bookStatus: ''
})

// 添加表单数据（不包含coverUrl，避免编辑）
const addForm = reactive<{
  bookId: string
  bookName: string
  isbn: string
  description: string
  publicationDate: string
  author: string
  publisher: string
  category: string
  quantity: number
  storageDate: string
  bookStatus: string
}>({
  bookId: '',
  bookName: '',
  isbn: '',
  description: '',
  publicationDate: '',
  author: '',
  publisher: '',
  category: '',
  quantity: 0,
  storageDate: '',
  bookStatus: ''
})

// 表单验证规则
const editRules = reactive({
  bookId: [
    { required: true, message: '请输入书籍ID', trigger: 'blur' },
  ],
  bookName: [
    { required: true, message: '请输入书籍名称', trigger: 'blur' },
  ],
  isbn: [
    { required: true, message: '请输入ISBN', trigger: 'blur' },
  ],
  author: [
    { required: true, message: '请输入作者', trigger: 'blur' },
  ],
  publisher: [
    { required: true, message: '请输入出版社', trigger: 'blur' },
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' },
  ],
  quantity: [
    { required: true, message: '请输入数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '数量不能为负数', trigger: 'blur' }
  ],
  storageDate: [
    { required: true, message: '请选择存储日期', trigger: 'change' },
  ],
  bookStatus: [
    { required: true, message: '请选择书籍状态', trigger: 'change' },
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
const handleSelectionChange = (selection: Book[]) => {
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
    const res = await $api.get('/book/page', {
      params: {
        currentPage: 1,
        size: 10000 // 获取足够多的数据，确保包含所有记录
      }
    })

    if (res.data.code === 200 && res.data.data) {
      allData.value = res.data.data.rows as Book[]
      return true
    }
    return false
  } catch (error) {
    ElMessage({
      message: '获取书籍数据失败',
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
  
  if (queryForm.bookName) {
    filteredData = filteredData.filter(book => 
      book.bookName.toLowerCase().includes(queryForm.bookName.toLowerCase())
    )
  }
  if (queryForm.bookId) {
    filteredData = filteredData.filter(book => book.bookId === queryForm.bookId)
  }
  if (queryForm.isbn) {
    filteredData = filteredData.filter(book => book.isbn === queryForm.isbn)
  }
  if (queryForm.author) {
    filteredData = filteredData.filter(book => book.author === queryForm.author)
  }
  if (queryForm.publisher) {
    filteredData = filteredData.filter(book => book.publisher === queryForm.publisher)
  }
  if (queryForm.category) {
    filteredData = filteredData.filter(book => book.category === queryForm.category)
  }
  if (queryForm.storageDate) {
    filteredData = filteredData.filter(book => book.storageDate === queryForm.storageDate)
  }
  if (queryForm.bookStatus) {
    filteredData = filteredData.filter(book => book.bookStatus === queryForm.bookStatus)
  }

  // 2. 更新总数
  totalCount.value = filteredData.length
  hasResults.value = totalCount.value > 0

  // 3. 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  tableData.value = filteredData.slice(startIndex, endIndex)
}

// 获取数据并处理
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

// 添加书籍
const addBook = () => {
  addDialogVisible.value = true
  // 清空表单
  addForm.bookId = ''
  addForm.bookName = ''
  addForm.isbn = ''
  addForm.description = ''
  addForm.publicationDate = ''
  addForm.author = ''
  addForm.publisher = ''
  addForm.category = ''
  addForm.quantity = 0
  addForm.storageDate = ''
  addForm.bookStatus = ''
}

// 提交添加表单
const addSubmitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.post('/book/add', addForm)
        if (res.data.code === 200) {
          ElMessage({
            message: '增加成功',
            type: 'success'
          })
          addDialogVisible.value = false
          getData() // 添加成功后重新获取数据
        } else {
          ElMessage({
            message: '增加失败',
            type: 'error'
          })
        }
      } catch (error) {
        ElMessage({
          message: '请求失败',
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
      message: '请选择需要删除的书籍',
      type: 'warning'
    })
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 条书籍数据吗？`,
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
      const deletePromises = multipleSelection.value.map(book => 
        $api.delete('/book/delete', { params: { bookId: book.bookId } })
      )
      
      // 等待所有删除请求完成
      const results = await Promise.all(deletePromises)
      
      // 检查是否所有删除都成功
      const allSuccess = results.every(res => res.data.code === 200)
      
      if (allSuccess) {
        ElMessage({
          message: `成功删除 ${multipleSelection.value.length} 条数据`,
          type: 'success',
        })
        // 清除选择状态
        multipleSelection.value = []
        checkAll.value = false
        getData() // 删除成功后重新获取数据
      } else {
        ElMessage({
          message: '部分数据删除失败',
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
      message: '取消删除',
      type: 'info',
    })
  })
}

// 单条删除
const delBook = async (bookId: string) => {
  ElMessageBox.confirm(
    '确定要删除吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await $api.delete('/book/delete', {
        params: { bookId }
      })
      if (res.data.code === 200) {
        ElMessage({
          message: '删除成功',
          type: 'success',
        })
        // 清除选择状态中的当前项
        multipleSelection.value = multipleSelection.value.filter(item => item.bookId !== bookId)
        checkAll.value = multipleSelection.value.length > 0 && multipleSelection.value.length === tableData.value.length
        getData() // 删除成功后重新获取数据
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
  }).catch(() => {
    ElMessage({
      message: '取消删除',
      type: 'info',
    })
  })
}

// 编辑书籍
const editBook = (row: Book) => {
  dialogVisible.value = true
  // 填充表单数据（不包含coverUrl）
  editForm.bookId = row.bookId
  editForm.bookName = row.bookName
  editForm.isbn = row.isbn
  editForm.description = row.description
  editForm.publicationDate = row.publicationDate
  editForm.author = row.author
  editForm.publisher = row.publisher
  editForm.category = row.category
  editForm.quantity = row.quantity
  editForm.storageDate = row.storageDate
  editForm.bookStatus = row.bookStatus
}

// 提交编辑表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.put('/book/update', editForm)
        if (res.data.code === 200) {
          ElMessage({
            message: '修改成功',
            type: 'success'
          })
          dialogVisible.value = false
          getData() // 修改成功后重新获取数据
        } else {
          ElMessage({
            message: '修改失败',
            type: 'error'
          })
        }
      } catch (error) {
        ElMessage({
          message: '请求失败',
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
      const requiredHeaders = ['bookId', 'bookName', 'isbn', 'author', 'publisher', 'category', 'quantity', 'storageDate', 'bookStatus','coverUrl']
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
      const booksToAdd: any[] = []
      jsonData.forEach((item, index) => {
        try {
          const coverUrlHeader = headers.find(h => h.toLowerCase() === 'coverurl');
          if (!coverUrlHeader) {
            throw new Error('缺少封面图片列');
          }
          // 读取Excel中的封面路径
          const excelCoverUrl = String(item[coverUrlHeader] || '').trim();
            if (!excelCoverUrl) {
              throw new Error('封面路径不能为空');
            }
          // 映射Excel列到Book对象（不区分大小写匹配）
          const book: any = {
            bookId: item[headers.find(h => h.toLowerCase() === 'bookid')!] || '',
            bookName: item[headers.find(h => h.toLowerCase() === 'bookname')!] || '',
            isbn: item[headers.find(h => h.toLowerCase() === 'isbn')!] || '',
            description: item[headers.find(h => h.toLowerCase() === 'description')!] || '',
            publicationDate: item[headers.find(h => h.toLowerCase() === 'publicationdate')!] || '',
            author: item[headers.find(h => h.toLowerCase() === 'author')!] || '',
            publisher: item[headers.find(h => h.toLowerCase() === 'publisher')!] || '',
            category: item[headers.find(h => h.toLowerCase() === 'category')!] || '',
            quantity: Number(item[headers.find(h => h.toLowerCase() === 'quantity')!]) || 0,
            storageDate: item[headers.find(h => h.toLowerCase() === 'storagedate')!] || '',
            bookStatus: item[headers.find(h => h.toLowerCase() === 'bookstatus')!] || '',
            coverUrl: excelCoverUrl,
            
          }
          // 简单验证
          if (!book.bookId || !book.bookName || !book.isbn) {
            throw new Error(`缺少必要信息（bookId, bookName, isbn必须填写）`)
          }
          
          booksToAdd.push(book)
        } catch (error) {
          uploadErrorCount.value++
          uploadErrorDetails.value.push(`第${index + 2}行数据错误: ${(error as Error).message}`)
        }
      })
      
      // 批量添加到数据库
      if (booksToAdd.length > 0) {
        // 循环调用单条添加接口
        for (const book of booksToAdd) {
          try {
            const res = await $api.post('/book/addWithCoverUrl', book)
            if (res.data.code === 200) {
              uploadSuccessCount.value++
            } else {
              uploadErrorCount.value++
              uploadErrorDetails.value.push(`书籍ID: ${book.bookId} 添加失败: 服务器返回错误`)
            }
          } catch (error) {
            uploadErrorCount.value++
            uploadErrorDetails.value.push(`书籍ID: ${book.bookId} 添加失败: 网络请求错误`)
          }
        }
        await getData(); // 重新获取全量数据
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

// 初始化加载数据
onMounted(() => {
  getData()
})
</script>


<template>
  <div>
    <el-button type="primary" @click="addBook">
      <el-icon><Plus /></el-icon>
      添加书籍
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
      <el-form-item label="书籍ID">
        <el-input v-model="queryForm.bookId" placeholder="请输入书籍ID" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="书籍名称">
        <el-input v-model="queryForm.bookName" placeholder="请输入书籍名称" clearable style="width: 160px;" />
      </el-form-item>
      <el-form-item label="ISBN">
        <el-input v-model="queryForm.isbn" placeholder="请输入ISBN" clearable style="width: 160px;" />
      </el-form-item>
      <el-form-item label="作者">
        <el-input v-model="queryForm.author" placeholder="请输入作者" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="出版社">
        <el-input v-model="queryForm.publisher" placeholder="请输入出版社" clearable style="width: 160px;" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="queryForm.category" placeholder="请选择分类" clearable style="width: 120px;">
          <el-option label="文学" value="文学" />
          <el-option label="科幻" value="科幻" />
          <el-option label="小说" value="小说" />
          <el-option label="历史" value="历史" />
          <el-option label="童话" value="童话" />
          <el-option label="悬疑" value="悬疑" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="存储日期">
        <el-date-picker
          v-model="queryForm.storageDate"
          type="date"
          placeholder="选择存储日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 160px;"
        />
      </el-form-item>
      <el-form-item label="书籍状态">
        <el-select v-model="queryForm.bookStatus" placeholder="请选择状态" clearable style="width: 120px;">
          <el-option label="借出" value="借出" />
          <el-option label="未借出" value="未借出" />
        </el-select>
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
      <el-tag v-if="queryForm.bookName" type="info">书名: {{ queryForm.bookName }}</el-tag>
      <el-tag v-if="queryForm.author" type="info">作者: {{ queryForm.author }}</el-tag>
      <el-tag v-if="queryForm.category" type="info">分类: {{ queryForm.category }}</el-tag>
      <el-tag v-if="queryForm.bookId" type="info">ID: {{ queryForm.bookId }}</el-tag>
      <el-tag v-if="queryForm.isbn" type="info">ISBN: {{ queryForm.isbn }}</el-tag>
      <el-tag v-if="queryForm.storageDate" type="info">存储日期: {{ queryForm.storageDate }}</el-tag>
      <el-tag v-if="queryForm.bookStatus" type="info">状态: {{ queryForm.bookStatus }}</el-tag>
    </div>

    <!-- 书籍表格 -->
    <div class="table-container" v-loading="queryLoading || uploadLoading">
      <el-table 
        v-if="hasResults" 
        :data="tableData" 
        style="width: 100%"
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
        
        <!-- 新增图书封面列 -->
        <el-table-column label="图书封面" align="center" width="120">
          <template #default="scope">
            <el-image
              :src="scope.row.coverUrl"
              alt="图书封面"
              style="width: 80px; height: 100px; object-fit: cover;"
              :preview-src-list="[scope.row.coverUrl]"
            >
              <template #error>
                <div class="image-placeholder">
                  {{ scope.row.coverUrl ? '路径无效' : '无封面'  }}
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        
        <el-table-column prop="bookId" label="书籍ID" align="center" width="120" />
        <el-table-column prop="bookName" label="书籍名称" align="center" width="180" />
        <el-table-column prop="isbn" label="ISBN" align="center" width="180" />
        <el-table-column prop="author" label="作者" align="center" width="120" />
        <el-table-column prop="publisher" label="出版社" align="center" width="150" />
        <el-table-column prop="category" label="分类" align="center" width="100" />
        <el-table-column prop="quantity" label="数量" align="center" width="80" />
        <el-table-column prop="storageDate" label="存储日期" align="center" width="120" />
        <el-table-column prop="bookStatus" label="书籍状态" align="center" width="100" />
        <el-table-column label="操作" align="center" width="180">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button type="primary" size="small" @click="editBook(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="delBook(scope.row.bookId)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="没有找到符合条件的书籍" />
        <el-button style="margin-top: 16px;" @click="resetQuery">清除查询条件</el-button>
      </div>
    </div>
    
    <!-- 分页 -->
    <el-pagination
      v-if="totalCount > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 25, 30]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalCount"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="margin-top: 20px;"
    />

    <!-- 添加书籍对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="增加书籍"
      width="500"
    >
      <div>
        <el-form
          ref="addFormRef"
          style="max-width: 600px"
          :model="addForm"
          :rules="addRules"
          label-width="auto"
        >
          <el-form-item label="书籍ID" prop="bookId">
            <el-input v-model="addForm.bookId" />
          </el-form-item>
          <el-form-item label="书籍名称" prop="bookName">
            <el-input v-model="addForm.bookName" />
          </el-form-item>
          <el-form-item label="ISBN" prop="isbn">
            <el-input v-model="addForm.isbn" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input v-model="addForm.description" type="textarea" />
          </el-form-item>
          <el-form-item label="出版日期" prop="publicationDate">
            <el-date-picker
              v-model="addForm.publicationDate"
              type="date"
              placeholder="选择出版日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="作者" prop="author">
            <el-input v-model="addForm.author" />
          </el-form-item>
          <el-form-item label="出版社" prop="publisher">
            <el-input v-model="addForm.publisher" />
          </el-form-item>
          <el-form-item label="分类" prop="category">
            <el-select v-model="addForm.category" placeholder="请选择分类" style="width: 100%">
              <el-option label="文学" value="文学" />
              <el-option label="科幻" value="科幻" />
              <el-option label="小说" value="小说" />
              <el-option label="历史" value="历史" />
              <el-option label="童话" value="童话" />
              <el-option label="悬疑" value="悬疑" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="数量" prop="quantity">
            <el-input-number
              v-model="addForm.quantity"
              :min="0"
              :step="1"
              controls-position="right"
              placeholder="调整数量"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="存储日期" prop="storageDate">
            <el-date-picker
              v-model="addForm.storageDate"
              type="date"
              placeholder="选择存储日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="书籍状态" prop="bookStatus">
            <el-select v-model="addForm.bookStatus" placeholder="请选择状态" style="width: 100%">
              <el-option label="借出" value="借出" />
              <el-option label="未借出" value="未借出" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
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
      title="修改书籍信息"
      width="500"
    >
      <div>
        <el-form
          ref="editFormRef"
          style="max-width: 600px"
          :model="editForm"
          :rules="editRules"
          label-width="auto"
        >
          <el-form-item label="书籍ID" prop="bookId">
            <el-input v-model="editForm.bookId" disabled />
          </el-form-item>
          <el-form-item label="书籍名称" prop="bookName">
            <el-input v-model="editForm.bookName" />
          </el-form-item>
          <el-form-item label="ISBN" prop="isbn">
            <el-input v-model="editForm.isbn" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input v-model="editForm.description" type="textarea" />
          </el-form-item>
          <el-form-item label="出版日期" prop="publicationDate">
            <el-date-picker
              v-model="editForm.publicationDate"
              type="date"
              placeholder="选择出版日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="作者" prop="author">
            <el-input v-model="editForm.author" />
          </el-form-item>
          <el-form-item label="出版社" prop="publisher">
            <el-input v-model="editForm.publisher" />
          </el-form-item>
          <el-form-item label="分类" prop="category">
            <el-select v-model="editForm.category" placeholder="请选择分类" style="width: 100%">
              <el-option label="文学" value="文学" />
              <el-option label="科幻" value="科幻" />
              <el-option label="小说" value="小说" />
              <el-option label="历史" value="历史" />
              <el-option label="童话" value="童话" />
              <el-option label="悬疑" value="悬疑" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="数量" prop="quantity">
            <el-input-number
              v-model="editForm.quantity"
              :min="0"
              :step="1"
              controls-position="right"
              placeholder="调整数量"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="存储日期" prop="storageDate">
            <el-date-picker
              v-model="editForm.storageDate"
              type="date"
              placeholder="选择存储日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="书籍状态" prop="bookStatus">
            <el-select v-model="editForm.bookStatus" placeholder="请选择状态" style="width: 100%">
              <el-option label="借出" value="借出" />
              <el-option label="未借出" value="未借出" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
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
.el-pagination {
  margin-top: 10px;
  align-items: center;
  justify-content: center;
  display: flex;
}

.operation-buttons {
  display: flex;
  gap: 12px;
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
}

.table-container {
  min-height: 300px;
}

.empty-state {
  text-align: center;
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

/* 图书封面样式 */
.image-placeholder {
  width: 80px;
  height: 100px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

/* 图片预览样式优化 */
:deep(.el-image-viewer__wrapper) {
  z-index: 9999;
}
</style>