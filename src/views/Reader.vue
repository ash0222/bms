<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage, ElEmpty, ElAvatar } from 'element-plus'
import type { FormInstance } from 'element-plus'
// 引入所需图标
import { Plus, Delete, Edit, Search, RefreshRight, Upload, Warning } from '@element-plus/icons-vue'
import $api from '../axios'
// 引入xlsx库用于解析Excel文件
import * as XLSX from 'xlsx'

// 定义读者类型接口
interface Reader {
  readerId: string
  readerLoginName: string
  readerPassword: string
  readerName: string
  readerGender: string
  readerPhone: string
  readerEmail: string
  readerDate: string
  readerStatus: string
}

// 头像图片列表
const avatarList = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 
  'm', 'n', 'o', '14', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '11', '12', '13'
]
const totalAvatars = computed(() => avatarList.length)
const defaultAvatar = 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9b8af5705089545ecd1jpeg.jpeg'

// 表格数据相关
const tableData = ref<Reader[]>([])
const allData = ref<Reader[]>([])
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const dialogVisible = ref(false)
const addDialogVisible = ref(false)
const queryLoading = ref(false)
const hasResults = ref(true)
const batchDeleteLoading = ref(false)

// 批量上传相关变量
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const uploadSuccessCount = ref(0)
const uploadErrorCount = ref(0)
const uploadErrorDetails = ref<string[]>([])

// 批量选择相关
const multipleSelection = ref<Reader[]>([])
const checkAll = ref(false)

// 头像相关方法
const getAvatarIndex = (readerId: string) => {
  let hash = 0
  for (let i = 0; i < readerId.length; i++) {
    const char = readerId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) % totalAvatars.value
}

const getAvatarUrl = (readerId: string) => {
  const globalIndex = allData.value.findIndex(item => item.readerId === readerId)
  const avatarIndex = allData.value.length <= totalAvatars.value 
    ? globalIndex 
    : getAvatarIndex(readerId)
  const safeIndex = Math.abs(avatarIndex) % totalAvatars.value
  return `/src/assets/images/${avatarList[safeIndex]}.jpg`
}

const handleAvatarError = (event: Event) => {
  (event.target as HTMLImageElement).src = defaultAvatar
}

// 查询表单数据
const queryForm = reactive({
  readerId: '',
  readerLoginName: '',
  readerName: '',
  readerGender: '',
  readerPhone: '',
  readerEmail: '',
  readerDate: '',
  readerStatus: ''
})

// 编辑表单数据
const editForm = reactive<Reader>({
  readerId: '',
  readerLoginName: '',
  readerPassword: '',
  readerName: '',
  readerGender: '',
  readerPhone: '',
  readerEmail: '',
  readerDate: '',
  readerStatus: ''
})

// 添加表单数据
const addForm = reactive<Reader>({
  readerId: '',
  readerLoginName: '',
  readerPassword: '111111',
  readerName: '',
  readerGender: '',
  readerPhone: '',
  readerEmail: '',
  readerDate: '',
  readerStatus: ''
})

// 表单验证规则
const editRules = reactive({
  readerLoginName: [
    { required: true, message: '请输入登录名', trigger: 'blur' },
  ],
  readerPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
  readerName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  readerGender: [
    { required: true, message: '请选择性别', trigger: 'change' },
  ],
  readerPhone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  readerEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  readerDate: [
    { required: true, message: '请选择注册日期', trigger: 'change' },
  ],
  readerStatus: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ]
})

const addRules = reactive({
  readerId: [
    { required: true, message: '请输入读者ID', trigger: 'blur' },
  ],
  readerLoginName: [
    { required: true, message: '请输入登录名', trigger: 'blur' },
  ],
  readerName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  readerGender: [
    { required: true, message: '请选择性别', trigger: 'change' },
  ],
  readerPhone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  readerEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  readerDate: [
    { required: true, message: '请选择注册日期', trigger: 'change' },
  ],
  readerStatus: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ]
})

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  filterAndPaginateData()
  multipleSelection.value = []
  checkAll.value = false
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  filterAndPaginateData()
  multipleSelection.value = []
  checkAll.value = false
}

// 多选处理
const handleSelectionChange = (selection: Reader[]) => {
  multipleSelection.value = selection
  checkAll.value = selection.length > 0 && selection.length === tableData.value.length
}

const handleCheckAllChange = (checked: boolean) => {
  checkAll.value = checked
  multipleSelection.value = checked ? [...tableData.value] : []
}

const editFormRef = ref<FormInstance>()
const addFormRef = ref<FormInstance>()

// 获取数据
const getAllData = async () => {
  try {
    queryLoading.value = true
    const res = await $api.get('/reader/page', {
      params: {
        currentPage: 1,
        size: 10000
      }
    })

    if (res.data.code === 200 && res.data.data) {
      allData.value = res.data.data.records as Reader[]
      return true
    }
    return false
  } catch (error) {
    ElMessage({
      message: '获取读者数据失败',
      type: 'error'
    })
    return false
  } finally {
    queryLoading.value = false
  }
}

const filterAndPaginateData = () => {
  let filteredData = [...allData.value]
  
  if (queryForm.readerId) {
    filteredData = filteredData.filter(reader => 
      reader.readerId === queryForm.readerId
    )
  }
  
  if (queryForm.readerLoginName) {
    const keyword = queryForm.readerLoginName.toLowerCase()
    filteredData = filteredData.filter(reader => 
      reader.readerLoginName.toLowerCase().includes(keyword)
    )
  }
  
  if (queryForm.readerName) {
    const keyword = queryForm.readerName.toLowerCase()
    filteredData = filteredData.filter(reader => 
      reader.readerName.toLowerCase().includes(keyword)
    )
  }
  
  if (queryForm.readerGender) {
    filteredData = filteredData.filter(reader => 
      reader.readerGender === queryForm.readerGender
    )
  }
  
  if (queryForm.readerPhone) {
    filteredData = filteredData.filter(reader => 
      reader.readerPhone === queryForm.readerPhone
    )
  }
  
  if (queryForm.readerEmail) {
    const keyword = queryForm.readerEmail.toLowerCase()
    filteredData = filteredData.filter(reader => 
      reader.readerEmail.toLowerCase().includes(keyword)
    )
  }
  
  if (queryForm.readerDate) {
    filteredData = filteredData.filter(reader => 
      reader.readerDate === queryForm.readerDate
    )
  }
  
  if (queryForm.readerStatus) {
    filteredData = filteredData.filter(reader => 
      reader.readerStatus === queryForm.readerStatus
    )
  }

  totalCount.value = filteredData.length
  hasResults.value = totalCount.value > 0

  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  tableData.value = filteredData.slice(startIndex, endIndex)
}

const getData = async () => {
  const success = await getAllData()
  if (success) {
    filterAndPaginateData()
  }
}

// 查询和重置
const handleQuery = () => {
  currentPage.value = 1
  multipleSelection.value = []
  checkAll.value = false
  getData()
}

const resetQuery = () => {
  Object.keys(queryForm).forEach(key => {
    queryForm[key as keyof typeof queryForm] = ''
  })
  currentPage.value = 1
  multipleSelection.value = []
  checkAll.value = false
  getData()
}

// 添加读者
const addReader = () => {
  addDialogVisible.value = true
  addForm.readerId = ''
  addForm.readerLoginName = ''
  addForm.readerName = ''
  addForm.readerGender = ''
  addForm.readerPhone = ''
  addForm.readerEmail = ''
  addForm.readerDate = ''
  addForm.readerStatus = ''
  addForm.readerPassword = '111111'
}

const addSubmitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.post('/reader/add', addForm)
        if (res.data.code === 200) {
          ElMessage({
            message: '增加成功',
            type: 'success'
          })
          addDialogVisible.value = false
          getData()
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
      message: '请选择需要删除的读者',
      type: 'warning'
    })
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 位读者吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      batchDeleteLoading.value = true
      const deletePromises = multipleSelection.value.map(reader => 
        $api.delete('/reader/delete', { params: { readerId: reader.readerId } })
      )
      
      const results = await Promise.all(deletePromises)
      const allSuccess = results.every(res => res.data.code === 200)
      
      if (allSuccess) {
        ElMessage({
          message: `成功删除 ${multipleSelection.value.length} 位读者`,
          type: 'success',
        })
        multipleSelection.value = []
        checkAll.value = false
        getData()
      } else {
        ElMessage({
          message: '部分读者删除失败',
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
const delReader = async (readerId: string) => {
  ElMessageBox.confirm(
    '确定要删除吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await $api.delete('/reader/delete', {
          params: { readerId }
        })
        if (res.data.code === 200) {
          ElMessage({
            message: '删除成功',
            type: 'success',
          })
          multipleSelection.value = multipleSelection.value.filter(item => item.readerId !== readerId)
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
          message: '请求失败',
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

// 编辑读者
const editReader = (row: Reader) => {
  dialogVisible.value = true
  editForm.readerId = row.readerId
  editForm.readerLoginName = row.readerLoginName
  editForm.readerPassword = row.readerPassword
  editForm.readerName = row.readerName
  editForm.readerGender = row.readerGender
  editForm.readerPhone = row.readerPhone
  editForm.readerEmail = row.readerEmail
  editForm.readerDate = row.readerDate
  editForm.readerStatus = row.readerStatus
}

const resetPassword = () => {
  editForm.readerPassword = '111111'
  ElMessage({
    message: '密码已重置为111111',
    type: 'info'
  })
}

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.put('/reader/update', editForm)
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
          message: '请求失败',
          type: 'error'
        })
      }
    }
  })
}

// 状态变更
const handleStatusChange = async (row: Reader) => {
  const originalStatus = row.readerStatus === '正常' ? '禁言' : '正常'
  
  try {
    const res = await $api.put('/reader/update', {
      ...row,
      readerStatus: row.readerStatus
    })
    
    if (res.data.code !== 200) {
      row.readerStatus = originalStatus
      ElMessage({
        message: '状态更新失败',
        type: 'error'
      })
    } else {
      ElMessage({
        message: `已${row.readerStatus === '禁言' ? '禁言' : '恢复正常'}该读者`,
        type: 'success'
      })
    }
  } catch (error) {
    row.readerStatus = originalStatus
    ElMessage({
      message: '状态更新失败',
      type: 'error'
    })
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
      
      // 验证表头
      const requiredHeaders = ['readerId', 'readerLoginName', 'readerName', 'readerGender', 'readerPhone', 'readerEmail', 'readerDate', 'readerStatus']
      const headers = Object.keys(jsonData[0])
      
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase() === header.toLowerCase())
      )
      
      if (missingHeaders.length > 0) {
        ElMessage.error(`Excel文件缺少必要的列: ${missingHeaders.join(', ')}`)
        uploadLoading.value = false
        return
      }
      
      // 处理数据
      const readersToAdd: Reader[] = []
      jsonData.forEach((item, index) => {
        try {
          const reader: Reader = {
            readerId: item[headers.find(h => h.toLowerCase() === 'readerid')!] || '',
            readerLoginName: item[headers.find(h => h.toLowerCase() === 'readerloginname')!] || '',
            readerPassword: '111111', // 固定初始密码
            readerName: item[headers.find(h => h.toLowerCase() === 'readername')!] || '',
            readerGender: item[headers.find(h => h.toLowerCase() === 'readergender')!] || '',
            readerPhone: item[headers.find(h => h.toLowerCase() === 'readerphone')!] || '',
            readerEmail: item[headers.find(h => h.toLowerCase() === 'readeremail')!] || '',
            readerDate: item[headers.find(h => h.toLowerCase() === 'readerdate')!] || '',
            readerStatus: item[headers.find(h => h.toLowerCase() === 'readerstatus')!] || ''
          }
          
          // 验证必填项
          if (!reader.readerId || !reader.readerLoginName || !reader.readerName || !reader.readerPhone || !reader.readerEmail) {
            throw new Error('缺少必要信息（readerId、readerLoginName、readerName、readerPhone、readerEmail为必填项）')
          }
          
          // 验证手机号格式
          const phoneReg = /^1[3-9]\d{9}$/
          if (!phoneReg.test(reader.readerPhone)) {
            throw new Error('手机号格式不正确')
          }
          
          // 验证邮箱格式
          const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
          if (!emailReg.test(reader.readerEmail)) {
            throw new Error('邮箱格式不正确')
          }
          
          readersToAdd.push(reader)
        } catch (error) {
          uploadErrorCount.value++
          uploadErrorDetails.value.push(`第${index + 2}行数据错误: ${(error as Error).message}`)
        }
      })
      
      // 批量添加
      if (readersToAdd.length > 0) {
        for (const reader of readersToAdd) {
          try {
            const res = await $api.post('/reader/add', reader)
            if (res.data.code === 200) {
              uploadSuccessCount.value++
            } else {
              uploadErrorCount.value++
              uploadErrorDetails.value.push(`读者ID: ${reader.readerId} 添加失败: 服务器返回错误`)
            }
          } catch (error) {
            uploadErrorCount.value++
            uploadErrorDetails.value.push(`读者ID: ${reader.readerId} 添加失败: 网络请求错误`)
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

onMounted(() => {
  getData()
})
</script>

<template>
  <div>
    <el-button type="primary" @click="addReader">
      <el-icon><Plus /></el-icon>
      添加读者
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
      <el-form-item label="读者ID">
        <el-input v-model="queryForm.readerId" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="登录名">
        <el-input v-model="queryForm.readerLoginName" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="queryForm.readerName" placeholder="请输入" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="queryForm.readerGender" placeholder="请选择" clearable style="width: 100px;">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
        </el-select>
      </el-form-item>
      <el-form-item label="电话">
        <el-input v-model="queryForm.readerPhone" placeholder="请输入" clearable style="width: 140px;" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="queryForm.readerEmail" placeholder="请输入" clearable style="width: 180px;" />
      </el-form-item>
      <el-form-item label="注册日期">
        <el-date-picker
          v-model="queryForm.readerDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 140px;"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryForm.readerStatus" placeholder="请选择" clearable style="width: 100px;">
          <el-option label="正常" value="正常" />
          <el-option label="禁言" value="禁言" />
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
      <el-tag v-if="queryForm.readerId" type="info" closable @close="queryForm.readerId = ''; handleQuery()">读者ID: {{ queryForm.readerId }}</el-tag>
      <el-tag v-if="queryForm.readerName" type="info" closable @close="queryForm.readerName = ''; handleQuery()">姓名: {{ queryForm.readerName }}</el-tag>
      <el-tag v-if="queryForm.readerLoginName" type="info" closable @close="queryForm.readerLoginName = ''; handleQuery()">登录名: {{ queryForm.readerLoginName }}</el-tag>
      <el-tag v-if="queryForm.readerStatus" type="info" closable @close="queryForm.readerStatus = ''; handleQuery()">状态: {{ queryForm.readerStatus }}</el-tag>
      <el-tag v-if="queryForm.readerDate" type="info" closable @close="queryForm.readerDate = ''; handleQuery()">注册日: {{ queryForm.readerDate }}</el-tag>
      <el-tag v-if="queryForm.readerGender" type="info" closable @close="queryForm.readerGender = ''; handleQuery()">性别: {{ queryForm.readerGender }}</el-tag>
      <el-tag v-if="queryForm.readerPhone" type="info" closable @close="queryForm.readerPhone = ''; handleQuery()">电话: {{ queryForm.readerPhone }}</el-tag>
      <el-tag v-if="queryForm.readerEmail" type="info" closable @close="queryForm.readerEmail = ''; handleQuery()">邮箱: {{ queryForm.readerEmail }}</el-tag>
    </div>

    <!-- 读者表格 -->
    <div class="table-container" v-loading="queryLoading || uploadLoading">
      <el-table 
        v-if="hasResults" 
        :data="tableData" 
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
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
        
        <el-table-column label="头像" align="center" width="100">
          <template #default="scope">
            <el-avatar :size="40" class="reader-avatar">
              <img 
                :src="getAvatarUrl(scope.row.readerId)" 
                :alt="scope.row.readerName"
                @error="handleAvatarError($event)"
              >
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="readerId" label="读者ID" align="center"/>
        <el-table-column prop="readerLoginName" label="登录名" align="center"/>
        <el-table-column prop="readerName" label="姓名" align="center"/>
        <el-table-column prop="readerGender" label="性别" align="center" />
        <el-table-column prop="readerPhone" label="电话" align="center"  />
        <el-table-column prop="readerEmail" label="邮箱" align="center"  />
        <el-table-column prop="readerDate" label="注册日期" align="center"/>
        <el-table-column label="状态" align="center" width="120">
          <template #default="scope">
            <el-tooltip
              effect="dark"
              :content="scope.row.readerStatus === '禁言' ? '禁言' : '正常'"
              placement="top"
            >
              <el-switch
                v-model="scope.row.readerStatus"
                size="small"
                :active-value="'禁言'"
                :inactive-value="'正常'"
                @change="handleStatusChange(scope.row)"
                class="status-switch"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button type="primary" size="small" @click="editReader(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="delReader(scope.row.readerId)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-else class="empty-state">
        <ElEmpty description="没有找到符合条件的读者" />
        <el-button style="margin-top: 16px;" @click="resetQuery">清除查询条件</el-button>
      </div>
    </div>
    
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

    <!-- 增加读者对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="增加读者"
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
          <el-form-item label="读者ID" prop="readerId">
            <el-input v-model="addForm.readerId" />
          </el-form-item>
          <el-form-item label="登录名" prop="readerLoginName">
            <el-input v-model="addForm.readerLoginName" />
          </el-form-item>
          <el-form-item label="密码" prop="readerPassword">
            <el-input 
              v-model="addForm.readerPassword" 
              type="password" 
              disabled 
              placeholder="初始密码为111111"
            />
            <div class="el-form-item__help">初始密码固定为111111</div>
          </el-form-item>
          <el-form-item label="姓名" prop="readerName">
            <el-input v-model="addForm.readerName" />
          </el-form-item>
          <el-form-item label="性别" prop="readerGender">
            <el-select v-model="addForm.readerGender" placeholder="请选择性别">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
          <el-form-item label="电话" prop="readerPhone">
            <el-input v-model="addForm.readerPhone" />
          </el-form-item>
          <el-form-item label="邮箱" prop="readerEmail">
            <el-input v-model="addForm.readerEmail" />
          </el-form-item>
          <el-form-item label="注册日期" prop="readerDate">
            <el-date-picker
              v-model="addForm.readerDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="状态" prop="readerStatus">
            <el-select v-model="addForm.readerStatus" placeholder="请选择状态">
              <el-option label="正常" value="正常" />
              <el-option label="禁言" value="禁言" />
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
      title="修改读者信息"
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
          <el-form-item label="读者ID" prop="readerId">
            <el-input v-model="editForm.readerId" disabled />
          </el-form-item>
          <el-form-item label="登录名" prop="readerLoginName">
            <el-input v-model="editForm.readerLoginName" />
          </el-form-item>
          <el-form-item label="密码" prop="readerPassword">
            <div class="password-container" style="display: flex; gap: 10px; align-items: center;">
              <el-input 
                v-model="editForm.readerPassword" 
                type="password" 
                style="flex: 1;"
              />
              <el-button 
                type="warning" 
                size="small" 
                @click="resetPassword"
              >
                重置密码
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="姓名" prop="readerName">
            <el-input v-model="editForm.readerName" />
          </el-form-item>
          <el-form-item label="性别" prop="readerGender">
            <el-select v-model="editForm.readerGender" placeholder="请选择性别">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
          <el-form-item label="电话" prop="readerPhone">
            <el-input v-model="editForm.readerPhone" />
          </el-form-item>
          <el-form-item label="邮箱" prop="readerEmail">
            <el-input v-model="editForm.readerEmail" />
          </el-form-item>
          <el-form-item label="注册日期" prop="readerDate">
            <el-date-picker
              v-model="editForm.readerDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="状态" prop="readerStatus">
            <el-select v-model="editForm.readerStatus" placeholder="请选择状态">
              <el-option label="正常" value="正常" />
              <el-option label="禁言" value="禁言" />
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
  gap: 8px;
  justify-content: center;
  width: 100%;
}

.reader-avatar {
  border: 2px solid #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-table-column:last-child) {
  min-width: 180px !important;
}

.el-table th,
.el-table td {
  padding: 10px 5px;
}

.el-form-item__help {
  color: #606266;
  font-size: 12px;
  margin-top: 5px;
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

:deep(.el-button) {
  margin-right: 8px;
  margin-bottom: 8px;
}

:deep(.el-button .el-icon) {
  margin-right: 5px;
}

:deep(.status-switch) {
  --el-switch-on-color: var(--el-color-danger);
  --el-switch-off-color: var(--el-color-success);
}

:deep(.el-tooltip__popper) {
  padding: 5px 10px;
  font-size: 12px;
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