<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import $api from '../axios'

const router = useRouter()

// 用户信息
const userInfo = reactive({
  adminId: '',
  adminLoginName: '',
  adminPassword: '******',
  adminName: '',
  adminGender: '',
  adminPhone: '',
  adminEmail: '',
  adminDate: '', // 注册时间（固定不变）
  lastLogin: '', // 上次登录时间（真实记录）
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
})

// 人脸绑定状态
const faceBindStatus = reactive({
  hasFace: false,
  faceId: null
})

// 编辑状态
const editMode = ref(false)

// 表单数据
const formData = reactive({
  adminLoginName: '',
  adminPassword: '', // 6位数字
  confirmPassword: '',
  adminName: '',
  adminGender: '',
  adminPhone: '',
  adminEmail: ''
})

// 表单验证规则
const rules = reactive({
  adminLoginName: [
    { required: true, message: '请输入登录名', trigger: 'blur' }
  ],
  adminPassword: [
    { required: false, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 6, message: '密码必须为6位', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '密码必须是6位数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: false, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (value !== formData.adminPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  adminName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  adminGender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  adminPhone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  adminEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
})

// 计算属性（保持不变）
const adminLoginName = computed({
  get: () => (editMode.value ? formData.adminLoginName : userInfo.adminLoginName),
  set: (value) => { if (editMode.value) formData.adminLoginName = value }
})

const adminPassword = computed({
  get: () => (editMode.value ? formData.adminPassword : userInfo.adminPassword),
  set: (value) => { if (editMode.value) formData.adminPassword = value }
})

const confirmPassword = computed({
  get: () => formData.confirmPassword,
  set: (value) => { if (editMode.value) formData.confirmPassword = value }
})

const adminName = computed({
  get: () => (editMode.value ? formData.adminName : userInfo.adminName),
  set: (value) => { if (editMode.value) formData.adminName = value }
})

const adminGender = computed({
  get: () => (editMode.value ? formData.adminGender : userInfo.adminGender),
  set: (value) => { if (editMode.value) formData.adminGender = value }
})

const adminPhone = computed({
  get: () => (editMode.value ? formData.adminPhone : userInfo.adminPhone),
  set: (value) => { if (editMode.value) formData.adminPhone = value }
})

const adminEmail = computed({
  get: () => (editMode.value ? formData.adminEmail : userInfo.adminEmail),
  set: (value) => { if (editMode.value) formData.adminEmail = value }
})

// 从sessionStorage加载用户信息（重点：正确读取上次登录时间）
const loadUserInfo = () => {
  const adminData = sessionStorage.getItem('user')
  const lastLogin = sessionStorage.getItem('lastLogin') // 读取真实的上次登录时间
  
  if (adminData && lastLogin) {
    const parsedData = JSON.parse(adminData)
    userInfo.adminId = parsedData.adminId || ''
    userInfo.adminLoginName = parsedData.adminLoginName || ''
    userInfo.adminName = parsedData.adminName || ''
    userInfo.adminGender = parsedData.adminGender || ''
    userInfo.adminPhone = parsedData.adminPhone || ''
    userInfo.adminEmail = parsedData.adminEmail || ''
    userInfo.adminDate = parsedData.adminDate ? new Date(parsedData.adminDate).toLocaleString() : '' // 注册时间格式化
    userInfo.lastLogin = lastLogin // 直接使用存储的上次登录时间（已格式化）
    console.log('加载的用户ID:', userInfo.adminId)
    console.log('加载的上次登录时间:', userInfo.lastLogin)
  } else {
    ElMessage.warning('未检测到登录信息，请重新登录')
    router.push('/login')
  }
}

// 进入编辑模式
const enterEditMode = () => {
  formData.adminLoginName = userInfo.adminLoginName
  formData.adminName = userInfo.adminName
  formData.adminGender = userInfo.adminGender
  formData.adminPhone = userInfo.adminPhone
  formData.adminEmail = userInfo.adminEmail
  formData.adminPassword = ''
  formData.confirmPassword = ''
  editMode.value = true
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
}

const formRef = ref<FormInstance | null>(null);

// 保存修改
const saveChanges = async () => {
  if (!userInfo.adminId) {
    ElMessage.error('用户信息不完整，无法保存')
    return
  }

  await formRef.value?.validate(async (valid, fields) => {
    if (valid) {
      if (formData.adminPassword && formData.adminPassword !== formData.confirmPassword) {
        ElMessage.error('两次输入的密码不一致')
        return
      }
      
      ElMessageBox.confirm('确定要保存修改吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const updateData: any = {
          adminId: userInfo.adminId,
          adminLoginName: formData.adminLoginName,
          adminName: formData.adminName,
          adminGender: formData.adminGender,
          adminPhone: formData.adminPhone,
          adminEmail: formData.adminEmail
        }

        if (formData.adminPassword.trim()) {
          updateData.adminPassword = formData.adminPassword
        }

        try {
          console.log('提交的更新数据:', updateData)
          const res = await $api.put('/admin/update', updateData)
          console.log('后端响应:', res)

          if (res.data.code === 200) {
            // 更新本地缓存。界面显示的用户信息
            userInfo.adminLoginName = formData.adminLoginName
            userInfo.adminName = formData.adminName
            userInfo.adminGender = formData.adminGender
            userInfo.adminPhone = formData.adminPhone
            userInfo.adminEmail = formData.adminEmail
            if (formData.adminPassword) {
              userInfo.adminPassword = '******'
            }

            // 更新sessionStorage中的用户基本信息（不包含登录时间）
            const adminData = JSON.parse(sessionStorage.getItem('user') || '{}')
            Object.assign(adminData, updateData)
            sessionStorage.setItem('user', JSON.stringify(adminData))

            editMode.value = false
            ElMessage.success(res.data.msg || '修改成功')
          } else {
            ElMessage.error(`保存失败: ${res.data.msg || '未知错误'}`)
          }
        } catch (error: any) {
          console.error('请求异常:', error)
          if (error.message.includes('Constraint violation')) {
            ElMessage.error('保存失败：数据不符合规则（如手机号已存在、密码格式错误等）')
          } else {
            ElMessage.error(`网络错误: ${error.message || '请检查后端服务'}`)
          }
        }
      }).catch(() => {
        ElMessage.info('已取消保存')
      })
    } else {
      console.log('表单验证失败:', fields)
      ElMessage.warning('请完善表单信息后再提交（密码需为6位数字）')
    }
  })
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清除用户信息（下次登录时重新记录登录时间）
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('lastLogin')
    
    ElMessage({
      type: 'info',
      message: '已成功退出登录'
    })
    
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  }).catch(() => {})
}

// 跳转到人脸绑定页面
const goToFaceBind = () => {
  // 将当前用户ID传递给人脸绑定页面
  router.push({
    path: '/face-bind',
    query: { userId: userInfo.adminId }
  })
}

// 检查人脸绑定状态
const checkFaceBindStatus = async () => {
  if (!userInfo.adminId) return
  
  try {
    const res = await $api.get('/face/status', {
      params: { userId: userInfo.adminId }
    })
    
    if (res.data.code === 200) {
      faceBindStatus.hasFace = res.data.data.bound || false
      faceBindStatus.faceId = res.data.data.faceId || null
    }
  } catch (error) {
    console.log('检查人脸绑定状态失败:', error)
    faceBindStatus.hasFace = false
    faceBindStatus.faceId = null
  }
}

onMounted(() => {
  loadUserInfo()
  // 延迟检查人脸绑定状态，确保用户信息已加载
  setTimeout(checkFaceBindStatus, 500)
})
</script>

<template>
  <div class="personal-center-container">
    <el-card class="box-card">
      <template #header>
        <div class="clearfix">
          <span>个人信息</span>
          <el-button
            v-if="!editMode"
            type="primary"
            size="small"
            style="float: right; margin-left: 10px"
            @click="logout"
          >
            退出登录
          </el-button>
          <el-button
            v-if="!editMode"
            type="primary"
            size="small"
            style="float: right; padding: 3px 10px"
            @click="enterEditMode"
          >
            编辑
          </el-button>
        </div>
      </template>
      
      <div class="user-info">
        <div class="avatar-container">
          <el-avatar :size="120" :src="userInfo.avatar" />
        </div>
        
        <el-form
          ref="formRef"
          :model="editMode ? formData : userInfo"
          :rules="rules"
          label-width="120px"
          class="info-form"
        >
          <el-form-item label="管理员ID">
            <el-input v-model="userInfo.adminId" disabled />
          </el-form-item>
          
          <el-form-item label="登录名" prop="adminLoginName">
            <el-input v-model="adminLoginName" :disabled="!editMode" />
          </el-form-item>
          
          <el-form-item label="密码" prop="adminPassword">
            <el-input
              v-model="adminPassword"
              :disabled="!editMode"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item v-if="editMode" label="确认密码" prop="confirmPassword">
            <el-input
              v-model="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="姓名" prop="adminName">
            <el-input v-model="adminName" :disabled="!editMode" />
          </el-form-item>
          
          <el-form-item label="性别" prop="adminGender">
            <el-select
              v-model="adminGender"
              :disabled="!editMode"
              placeholder="请选择性别"
            >
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="电话" prop="adminPhone">
            <el-input v-model="adminPhone" :disabled="!editMode" />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="adminEmail">
            <el-input v-model="adminEmail" :disabled="!editMode" />
          </el-form-item>
          
          <el-form-item label="注册时间">
            <el-input v-model="userInfo.adminDate" disabled />
          </el-form-item>
          
          <el-form-item label="上次登录时间">
            <el-input v-model="userInfo.lastLogin" disabled />
          </el-form-item>
          
          <!-- 人脸绑定状态 -->
          <el-form-item label="人脸绑定状态">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-tag :type="faceBindStatus.hasFace ? 'success' : 'warning'">
                {{ faceBindStatus.hasFace ? '已绑定' : '未绑定' }}
              </el-tag>
              <el-button 
                v-if="!faceBindStatus.hasFace"
                type="primary" 
                size="small"
                @click="goToFaceBind"
              >
                立即绑定
              </el-button>
              <el-button 
                v-else
                type="info" 
                size="small"
                @click="goToFaceBind"
              >
                重新绑定
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item v-if="editMode">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" @click="saveChanges">保存</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
/* 样式不变 */
.personal-center-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
.box-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}
.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
.avatar-container {
  margin-bottom: 20px;
}
.info-form {
  width: 100%;
  max-width: 600px;
}
</style>