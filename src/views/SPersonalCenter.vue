<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import $api from '../axios'

const router = useRouter()

// 用户信息（字段名与后端完全一致）
const userInfo = reactive({
  superId: '',         // 后端字段：管理员ID
  loginName: '',  // 后端字段：登录名
  password: '******', // 后端字段：密码（显示为掩码）
  superName: '',       // 后端字段：姓名
  superGender: '',     // 后端字段：性别
  superPhone: '',      // 后端字段：电话
  superEmail: '',      // 后端字段：邮箱
  superDate: '',       // 后端字段：注册日期
  lastLogin: '',       // 前端存储：上次登录时间
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' // 固定头像
})

// 编辑状态
const editMode = ref(false)

// 表单数据（字段名与后端一致）
const formData = reactive({
  loginName: '',
  password: '',
  superName: '',
  superGender: '',
  superPhone: '',
  superEmail: ''
})

// 表单验证规则（字段名与后端一致）
const rules = reactive({
  loginName: [
    { required: true, message: '请输入登录名', trigger: 'blur' }
  ],
  password: [
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  superName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  superGender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  superPhone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  superEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
})

// 计算属性：动态绑定表单与用户信息（完全对应后端字段）
const loginName = computed({
  get: () => (editMode.value ? formData.loginName : userInfo.loginName),
  set: (value) => { if (editMode.value) formData.loginName = value }
})

const password = computed({
  get: () => (editMode.value ? formData.password : userInfo.password),
  set: (value) => { if (editMode.value) formData.password = value }
})

const superName = computed({
  get: () => (editMode.value ? formData.superName : userInfo.superName),
  set: (value) => { if (editMode.value) formData.superName = value }
})

const superGender = computed({
  get: () => (editMode.value ? formData.superGender : userInfo.superGender),
  set: (value) => { if (editMode.value) formData.superGender = value }
})

const superPhone = computed({
  get: () => (editMode.value ? formData.superPhone : userInfo.superPhone),
  set: (value) => { if (editMode.value) formData.superPhone = value }
})

const superEmail = computed({
  get: () => (editMode.value ? formData.superEmail : userInfo.superEmail),
  set: (value) => { if (editMode.value) formData.superEmail = value }
})

// 从sessionStorage加载用户信息（完全映射后端字段）
const loadUserInfo = () => {
  const superData = sessionStorage.getItem('user')
  const lastLogin = sessionStorage.getItem('lastLogin')
  
  if (superData) {
    const parsedData = JSON.parse(superData)
    // 字段与后端返回完全对应admin
    userInfo.superId = parsedData.superId || ''
    userInfo.loginName = parsedData.loginName || ''
    userInfo.superName = parsedData.superName || ''
    userInfo.superGender = parsedData.superGender || ''
    userInfo.superPhone = parsedData.superPhone || ''
    userInfo.superEmail = parsedData.superEmail || ''
    userInfo.superDate = parsedData.superDate ? new Date(parsedData.superDate).toLocaleDateString() : ''
    userInfo.lastLogin = lastLogin || ''
  }
}

// 进入编辑模式
const enterEditMode = () => {
  // 从用户信息复制到表单（字段名一致）
  formData.loginName = userInfo.loginName
  formData.superName = userInfo.superName
  formData.superGender = userInfo.superGender
  formData.superPhone = userInfo.superPhone
  formData.superEmail = userInfo.superEmail
  formData.password = '' // 密码默认空（不修改则不提交）
  editMode.value = true
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
}
const formRef = ref<FormInstance | null>(null);
// 保存修改（提交后端字段格式）
const saveChanges = async () => {
  await formRef.value?.validate(async (valid, fields) => {
    if (valid) {
      ElMessageBox.confirm('确定要保存修改吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        // 构造与后端Administrators类完全匹配的数据
        const updateData = {
          superId: userInfo.superId, // 必须传递adminId用于后端定位
          loginName: formData.loginName,
          superName: formData.superName,
          superGender: formData.superGender,
          superPhone: formData.superPhone,
          superEmail: formData.superEmail,
          // 仅当密码有修改时传递（否则用原密码）
          password: formData.password || userInfo.password.replace('******', '')
          
        }
      console.log('提交的数据:', updateData) // 调试用
        // 调用后端更新接口（参数格式与后端实体类一致）
        const res = await $api.put('/super/update', updateData)
        if (res.data.code === 200) {
          // 更新本地用户信息
          userInfo.loginName = formData.loginName
          userInfo.superName = formData.superName
          userInfo.superGender = formData.superGender
          userInfo.superPhone = formData.superPhone
          userInfo.superEmail = formData.superEmail
          if (formData.password) userInfo.password = '******'

          // 更新sessionStorage（保持与后端字段一致）
          const superData = JSON.parse(sessionStorage.getItem('user') || '{}')
          Object.assign(superData, updateData)
          sessionStorage.setItem('user', JSON.stringify(superData))

          editMode.value = false
          ElMessage({ type: 'success', message: '修改成功' })
        } else {
          ElMessage({ type: 'error', message: '修改失败' })
        }
      }).catch(() => {})
    } else {
      console.log('表单验证失败', fields)
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
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('lastLogin')
    ElMessage({ type: 'info', message: '已成功退出登录' })
    setTimeout(() => router.push({ name: 'Login' }), 1000)
  }).catch(() => {})
}

// 页面加载时加载用户信息
onMounted(() => {
  loadUserInfo()
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
          <el-form-item label="超级管理员ID">
            <el-input v-model="userInfo.superId" disabled /> <!-- 后端字段adminId -->
          </el-form-item>
          
          <el-form-item label="登录名" prop="loginName">
            <el-input v-model="loginName" :disabled="!editMode" /> <!-- 后端字段adminLoginName -->
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="password"
              :disabled="!editMode"
              type="password"
              placeholder="不修改则留空"
            /> <!-- 后端字段adminPassword -->
          </el-form-item>
          
          <el-form-item label="姓名" prop="superName">
            <el-input v-model="superName" :disabled="!editMode" /> <!-- 后端字段adminName -->
          </el-form-item>
          
          <el-form-item label="性别" prop="superGender">
            <el-select
              v-model="superGender"
              :disabled="!editMode"
              placeholder="请选择性别"
            > <!-- 后端字段adminGender -->
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="电话" prop="superPhone">
            <el-input v-model="superPhone" :disabled="!editMode" /> <!-- 后端字段adminPhone -->
          </el-form-item>
          
          <el-form-item label="邮箱" prop="superEmail">
            <el-input v-model="superEmail" :disabled="!editMode" /> <!-- 后端字段adminEmail -->
          </el-form-item>
          
          <el-form-item label="注册时间">
            <el-input v-model="userInfo.superDate" disabled /> <!-- 后端字段adminDate -->
          </el-form-item>
          
          <el-form-item label="上次登录时间">
            <el-input v-model="userInfo.lastLogin" disabled />
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