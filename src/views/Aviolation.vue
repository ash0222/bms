<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessageBox, ElMessage, ElEmpty } from 'element-plus'
import type { FormInstance } from 'element-plus'
import $api from '../axios'
// 引入所需图标
import { Plus, Delete, Edit, Search, RefreshRight, Upload, Warning } from '@element-plus/icons-vue'
// 引入xlsx库用于解析Excel文件
import * as XLSX from 'xlsx'

// 定义图书信息类型（用于关联封面）
interface Book {
  bookId: string
  coverUrl: string
  bookName: string
}

// 定义违规记录类型接口
interface Violation {
  violationId: string
  violationType: string
  reason: string
  borrowId: string
  returnId: string
  readerId: string
  bookId: string
  bookName: string
  coverUrl?: string // 关联图书封面
  readerName: string
  readerPhone: string
}

// 表格数据相关
const tableData = ref<Violation[]>([])
const allData = ref<Violation[]>([]) // 存储全量数据用于前端分页和过滤
const books = ref<Book[]>([]) // 存储图书信息用于关联封面
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
const multipleSelection = ref<Violation[]>([]) // 存储选中的行数据
const checkAll = ref(false) // 全选状态

// 查询表单数据
const queryForm = reactive({
  violationId: '',
  violationType: '',
  reason: '',
  readerId: '',
  readerName: '',
  bookId: '',
  bookName: '',
  readerPhone: '',
  borrowId: ''
})

// 编辑表单数据
const editForm = reactive<Violation>({
  violationId: '',
  violationType: '',
  reason: '',
  borrowId: '',
  returnId: '',
  readerId: '',
  bookId: '',
  bookName: '',
  readerName: '',
  readerPhone: ''
})

// 添加表单数据
const addForm = reactive({
  violationType: '',
  reason: '',
  borrowId: '',
  returnId: '',
  readerId: '',
  bookId: '',
  bookName: '',
  readerName: '',
  readerPhone: ''
})

// 表单验证规则
const baseRules = reactive({
  violationType: [
    { required: true, message: '请选择违规类型', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入违规原因', trigger: 'blur' },
    { min: 2, message: '原因至少2个字符', trigger: 'blur' }
  ],
  readerId: [
    { required: true, message: '请输入读者ID', trigger: 'blur' }
  ],
  bookId: [
    { required: true, message: '请输入书籍ID', trigger: 'blur' }
  ],
  bookName: [
    { required: true, message: '请输入书籍名称', trigger: 'blur' }
  ],
  readerName: [
    { required: true, message: '请输入读者姓名', trigger: 'blur' }
  ],
  readerPhone: [
    { required: true, message: '请输入读者电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入有效的11位手机号', trigger: 'blur' }
  ]
})

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
const handleSelectionChange = (selection: Violation[]) => {
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
    const res = await $api.get('/violation/page', {
      params: {
        currentPage: 1,
        size: 10000 // 获取足够多的全量数据
      }
    })

    if (res.data && res.data.code === 200 && res.data.data) {
      // 关联图书封面信息
      const violations = res.data.data.rows as Violation[]
      return violations.map(violation => {
        const book = books.value.find(b => b.bookId === violation.bookId)
        return {
          ...violation,
          coverUrl: book?.coverUrl
        }
      })
    }
    return []
  } catch (error: any) {
    ElMessage.error(`网络错误: ${error.message}`)
    return []
  } finally {
    queryLoading.value = false
  }
}

// 过滤并分页数据
const filterAndPaginateData = () => {
  // 1. 过滤数据
  let filteredData = [...allData.value]
  
  // 违规ID精确匹配
  if (queryForm.violationId) {
    filteredData = filteredData.filter(violation => 
      violation.violationId === queryForm.violationId
    )
  }
  
  // 违规类型精确匹配
  if (queryForm.violationType) {
    filteredData = filteredData.filter(violation => 
      violation.violationType === queryForm.violationType
    )
  }
  
  // 违规原因模糊匹配（不区分大小写）
  if (queryForm.reason) {
    const keyword = queryForm.reason.toLowerCase()
    filteredData = filteredData.filter(violation => 
      violation.reason.toLowerCase().includes(keyword)
    )
  }
  
  // 读者ID精确匹配
  if (queryForm.readerId) {
    filteredData = filteredData.filter(violation => 
      violation.readerId === queryForm.readerId
    )
  }
  
  // 读者姓名模糊匹配（不区分大小写）
  if (queryForm.readerName) {
    const keyword = queryForm.readerName.toLowerCase()
    filteredData = filteredData.filter(violation => 
      violation.readerName.toLowerCase().includes(keyword)
    )
  }
  
  // 书籍ID精确匹配
  if (queryForm.bookId) {
    filteredData = filteredData.filter(violation => 
      violation.bookId === queryForm.bookId
    )
  }
  
  // 书籍名称模糊匹配（不区分大小写）
  if (queryForm.bookName) {
    const keyword = queryForm.bookName.toLowerCase()
    filteredData = filteredData.filter(violation => 
      violation.bookName.toLowerCase().includes(keyword)
    )
  }
  
  // 读者电话精确匹配
  if (queryForm.readerPhone) {
    filteredData = filteredData.filter(violation => 
      violation.readerPhone === queryForm.readerPhone
    )
  }
  
  // 借阅ID精确匹配
  if (queryForm.borrowId) {
    filteredData = filteredData.filter(violation => 
      violation.borrowId === queryForm.borrowId
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
  const violations = await getAllData()
  allData.value = violations
  filterAndPaginateData()
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

// 添加功能
const addViolation = () => {
  addDialogVisible.value = true
  // 清空表单
  Object.keys(addForm).forEach(key => {
    addForm[key as keyof typeof addForm] = ''
  })
  addFormRef.value?.resetFields()
}

const addSubmitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  try {
    await formEl.validate()
    const res = await $api.post('/violation/add', addForm)
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('添加成功')
      addDialogVisible.value = false
      getData() // 重新获取全量数据
    } else {
      ElMessage.error(`添加失败: ${res.data?.msg || '服务器处理失败'}`)
    }
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      ElMessage.warning('请完善必填项')
    } else {
      ElMessage.error(`添加失败: ${error.message}`)
    }
  }
}

// 批量删除
const batchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage({
      message: '请选择需要删除的违规记录',
      type: 'warning'
    })
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${multipleSelection.value.length} 条违规记录吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    batchDeleteLoading.value = true
    // 循环调用单条删除接口
    const deletePromises = multipleSelection.value.map(violation => 
      $api.delete('/violation/delete', { params: { id: violation.violationId } })
    )
    
    // 等待所有删除请求完成
    const results = await Promise.all(deletePromises)
    
    // 检查是否所有删除都成功
    const allSuccess = results.every(res => res.data && res.data.code === 200)
    
    if (allSuccess) {
      ElMessage.success(`成功删除 ${multipleSelection.value.length} 条记录`)
      // 清除选择状态
      multipleSelection.value = []
      checkAll.value = false
      getData() // 删除成功后重新获取数据
    } else {
      ElMessage.error('部分记录删除失败')
    }
  } catch (error: any) {
    if (error.message !== 'cancel') {
      ElMessage.error(`操作失败: ${error.message}`)
    }
  } finally {
    batchDeleteLoading.value = false
  }
}

// 删除单条记录
const delViolation = async (violationId: string) => {
  try {
    await ElMessageBox.confirm('确定删除该记录？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await $api.delete('/violation/delete', { 
      params: { id: violationId }
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('删除成功')
      // 清除选择状态中的当前项
      multipleSelection.value = multipleSelection.value.filter(item => item.violationId !== violationId)
      checkAll.value = multipleSelection.value.length > 0 && multipleSelection.value.length === tableData.value.length
      getData() // 重新获取全量数据
    } else {
      ElMessage.error(`删除失败: ${res.data?.msg || '删除失败，可能存在关联记录'}`)
    }
  } catch (error: any) {
    if (error.message !== 'cancel') {
      ElMessage.error(`操作失败: ${error.message}`)
    }
  }
}

// 编辑功能
const editViolation = (row: Violation) => {
  dialogVisible.value = true
  // 完整复制数据
  editForm.violationId = row.violationId
  editForm.violationType = row.violationType
  editForm.reason = row.reason
  editForm.borrowId = row.borrowId
  editForm.returnId = row.returnId
  editForm.readerId = row.readerId
  editForm.bookId = row.bookId
  editForm.bookName = row.bookName
  editForm.readerName = row.readerName
  editForm.readerPhone = row.readerPhone
}

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  try {
    await formEl.validate()
    const res = await $api.put('/violation/update', editForm)
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('修改成功')
      dialogVisible.value = false
      getData() // 重新获取全量数据
    } else {
      ElMessage.error(`修改失败: ${res.data?.msg || '服务器处理失败'}`)
    }
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      ElMessage.warning('请完善必填项')
    } else {
      ElMessage.error(`修改失败: ${error.message}`)
    }
  }
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
      
      // 验证表头是否正确
      const requiredHeaders = ['violationType', 'reason', 'readerId', 'bookId', 'bookName', 'readerName', 'readerPhone']
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
      const violationsToAdd: any[] = []
      jsonData.forEach((item, index) => {
        try {
          // 映射Excel列到Violation对象（不区分大小写匹配）
          const violation = {
            violationType: item[headers.find(h => h.toLowerCase() === 'violationtype')!] || '',
            reason: item[headers.find(h => h.toLowerCase() === 'reason')!] || '',
            borrowId: item[headers.find(h => h.toLowerCase() === 'borrowid')!] || '',
            returnId: item[headers.find(h => h.toLowerCase() === 'returnid')!] || '',
            readerId: item[headers.find(h => h.toLowerCase() === 'readerid')!] || '',
            bookId: item[headers.find(h => h.toLowerCase() === 'bookid')!] || '',
            bookName: item[headers.find(h => h.toLowerCase() === 'bookname')!] || '',
            readerName: item[headers.find(h => h.toLowerCase() === 'readername')!] || '',
            readerPhone: item[headers.find(h => h.toLowerCase() === 'readerphone')!] || ''
          }
          
          // 简单验证
          if (!violation.violationType) {
            throw new Error('违规类型不能为空')
          }
          if (!violation.reason || violation.reason.length < 2) {
            throw new Error('违规原因至少2个字符')
          }
          if (!violation.readerId) {
            throw new Error('读者ID不能为空')
          }
          if (!violation.bookId) {
            throw new Error('书籍ID不能为空')
          }
          if (!violation.bookName) {
            throw new Error('书籍名称不能为空')
          }
          if (!violation.readerName) {
            throw new Error('读者姓名不能为空')
          }
          if (!violation.readerPhone || !/^1\d{10}$/.test(violation.readerPhone)) {
            throw new Error('请输入有效的11位手机号')
          }
          
          violationsToAdd.push(violation)
        } catch (error) {
          uploadErrorCount.value++
          uploadErrorDetails.value.push(`第${index + 2}行数据错误: ${(error as Error).message}`)
        }
      })
      
      // 批量添加到数据库
      if (violationsToAdd.length > 0) {
        // 循环调用单条添加接口
        for (const violation of violationsToAdd) {
          try {
            const res = await $api.post('/violation/add', violation)
            if (res.data && res.data.code === 200) {
              uploadSuccessCount.value++
            } else {
              uploadErrorCount.value++
              uploadErrorDetails.value.push(`违规记录: ${violation.readerName} - ${violation.bookName} 添加失败: 服务器返回错误`)
            }
          } catch (error) {
            uploadErrorCount.value++
            uploadErrorDetails.value.push(`违规记录: ${violation.readerName} - ${violation.bookName} 添加失败: 网络请求错误`)
          }
        }
      }
      
      // 显示上传结果
      uploadDialogVisible.value = true
      // 重新加载数据
      await getData()
    } catch (error: any) {
      ElMessage.error(`处理文件时出错: ${error.message}`)
    } finally {
      uploadLoading.value = false
    }
  }
  
  reader.readAsArrayBuffer(file.raw)
}

// 页面加载时获取数据
onMounted(async () => {
  await getBooks() // 先获取图书信息用于关联封面
  await getData()
})
</script>

<template>
  <div class="violation-container">
    <el-button type="primary" @click="addViolation">
      <el-icon><Plus /></el-icon>
      添加违规记录
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
      <el-form-item label="违规ID">
        <el-input v-model="queryForm.violationId" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="违规类型">
        <el-select v-model="queryForm.violationType" placeholder="请选择" clearable style="width: 120px;">
          <el-option label="逾期" value="逾期" />
          <el-option label="损坏" value="损坏" />
          <el-option label="丢失" value="丢失" />
        </el-select>
      </el-form-item>
      <el-form-item label="违规原因">
        <el-input v-model="queryForm.reason" placeholder="请输入" clearable style="width: 160px;" />
      </el-form-item>
      <el-form-item label="读者ID">
        <el-input v-model="queryForm.readerId" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="读者姓名">
        <el-input v-model="queryForm.readerName" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="书籍ID">
        <el-input v-model="queryForm.bookId" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="书籍名称">
        <el-input v-model="queryForm.bookName" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="读者电话">
        <el-input v-model="queryForm.readerPhone" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="借阅ID">
        <el-input v-model="queryForm.borrowId" placeholder="请输入" clearable style="width: 120px;" />
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
      <el-tag v-if="queryForm.violationId" type="info" closable @close="queryForm.violationId = ''; handleQuery()">违规ID: {{ queryForm.violationId }}</el-tag>
      <el-tag v-if="queryForm.violationType" type="info" closable @close="queryForm.violationType = ''; handleQuery()">类型: {{ queryForm.violationType }}</el-tag>
      <el-tag v-if="queryForm.bookName" type="info" closable @close="queryForm.bookName = ''; handleQuery()">书名: {{ queryForm.bookName }}</el-tag>
      <el-tag v-if="queryForm.readerName" type="info" closable @close="queryForm.readerName = ''; handleQuery()">读者: {{ queryForm.readerName }}</el-tag>
      <el-tag v-if="queryForm.borrowId" type="info" closable @close="queryForm.borrowId = ''; handleQuery()">借阅ID: {{ queryForm.borrowId }}</el-tag>
    </div>

    <!-- 表格展示 -->
    <div class="table-container" v-loading="queryLoading || uploadLoading">
      <el-table
        v-if="hasResults"
        :data="tableData"
        border
        style="width: 100%; margin-top: 20px"
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
        
        <el-table-column prop="violationId" label="违规ID" align="center" width="100" />
        <el-table-column prop="violationType" label="违规类型" align="center" />
        <el-table-column 
          prop="reason" 
          label="违规原因" 
          align="center"
          :show-overflow-tooltip="true"  
          width="200"
        />
        <el-table-column prop="readerId" label="读者ID" align="center" width="100" />
        <el-table-column prop="readerName" label="读者姓名" align="center" />
        <el-table-column prop="bookId" label="书籍ID" align="center" width="100" />
        <el-table-column prop="bookName" label="书籍名称" align="center" />
        <el-table-column prop="readerPhone" label="读者电话" align="center" width="120" />
        <el-table-column prop="borrowId" label="借阅ID" align="center" width="100" />
        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button type="primary" size="small" @click="editViolation(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="delViolation(scope.row.violationId)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="没有找到符合条件的违规记录" />
        <el-button style="margin-top: 16px;" @click="resetQuery">清除查询条件</el-button>
      </div>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="totalCount > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalCount"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="margin-top: 10px; justify-content: center; display: flex;"
    />

    <!-- 添加对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加违规记录"
      width="600px"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="baseRules"
        label-width="120px"
        class="form-container"
      >
        <el-form-item label="违规类型" prop="violationType">
          <el-select v-model="addForm.violationType" placeholder="请选择">
            <el-option label="逾期" value="逾期" />
            <el-option label="损坏" value="损坏" />
            <el-option label="丢失" value="丢失" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规原因" prop="reason">
          <el-input v-model="addForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="借阅ID">
          <el-input v-model="addForm.borrowId" placeholder="可选" />
        </el-form-item>
        <el-form-item label="归还ID">
          <el-input v-model="addForm.returnId" placeholder="可选" />
        </el-form-item>
        <el-form-item label="读者ID" prop="readerId">
          <el-input v-model="addForm.readerId" />
        </el-form-item>
        <el-form-item label="书籍ID" prop="bookId">
          <el-input v-model="addForm.bookId" />
        </el-form-item>
        <el-form-item label="书籍名称" prop="bookName">
          <el-input v-model="addForm.bookName" />
        </el-form-item>
        <el-form-item label="读者姓名" prop="readerName">
          <el-input v-model="addForm.readerName" />
        </el-form-item>
        <el-form-item label="读者电话" prop="readerPhone">
          <el-input v-model="addForm.readerPhone" placeholder="请输入11位手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSubmitForm(addFormRef)">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改违规记录"
      width="600px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="baseRules"
        label-width="120px"
        class="form-container"
      >
        <el-form-item label="违规ID">
          <el-input v-model="editForm.violationId" disabled />
        </el-form-item>
        <el-form-item label="违规类型" prop="violationType">
          <el-select v-model="editForm.violationType" placeholder="请选择">
            <el-option label="逾期" value="逾期" />
            <el-option label="损坏" value="损坏" />
            <el-option label="丢失" value="丢失" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规原因" prop="reason">
          <el-input v-model="editForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="借阅ID">
          <el-input v-model="editForm.borrowId" />
        </el-form-item>
        <el-form-item label="归还ID">
          <el-input v-model="editForm.returnId" />
        </el-form-item>
        <el-form-item label="读者ID" prop="readerId">
          <el-input v-model="editForm.readerId" />
        </el-form-item>
        <el-form-item label="书籍ID" prop="bookId">
          <el-input v-model="editForm.bookId" />
        </el-form-item>
        <el-form-item label="书籍名称" prop="bookName">
          <el-input v-model="editForm.bookName" />
        </el-form-item>
        <el-form-item label="读者姓名" prop="readerName">
          <el-input v-model="editForm.readerName" />
        </el-form-item>
        <el-form-item label="读者电话" prop="readerPhone">
          <el-input v-model="editForm.readerPhone" placeholder="请输入11位手机号" />
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
.form-container {
  width: 100%;
  padding: 10px 0;
}

.operation-buttons {
  display: flex;
  gap: 8px; /* 减小间距确保按钮并排显示 */
  justify-content: center;
  width: 100%;
}

/* 确保操作列有足够宽度 */
:deep(.el-table-column:last-child) {
  min-width: 200px !important;
}

.violation-container {
  padding: 20px;
}

.el-table {
  margin-top: 20px;
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