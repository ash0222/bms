<template>
  <div class="front-container">
    <!-- 顶部导航栏 -->
    <el-header class="front-header">
      <div style="flex: 1; text-align: left; font-size: 20px; font-weight: bold;">图书馆管理系统</div>
      
      <!-- 顶部导航菜单 -->
      <div class="nav-menu">
        <el-button 
          type="text" 
          class="nav-item" 
          :class="{ 'active-nav': isActive('/super') }"
          @click="navigateTo('/super')"
        >
          首页
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          :class="{ 'active-nav': isActive('/super/superadmin') }"
          @click="navigateTo('/super/superadmin')"
        >
          管理员管理
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          :class="{ 'active-nav': isActive('/super/notice') }"
          @click="navigateTo('/super/notice')"
        >
          公告管理
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          :class="{ 'active-nav': isActive('/super/knowledge') }"
          @click="navigateTo('/super/knowledge')"
        >
          知识库管理
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          :class="{ 'active-nav': isActive('/super/datas') }"
          @click="navigateTo('/super/datas')"
        >
          数据总览
        </el-button>
        
      </div>
      
      <!-- 右上角个人信息 -->
      <el-dropdown @command="handleUserCommand" trigger="click" placement="bottom-end">
        <div class="user-avatar-container">
          <div class="user-avatar">
            <div class="avatar-content">
              <div class="avatar-figure">
                <div class="avatar-head"></div>
                <div class="avatar-body"></div>
              </div>
            </div>
          </div>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="custom-dropdown-menu">
            <el-dropdown-item command="profile" class="dropdown-item">
              <span class="item-text">个人信息</span>
            </el-dropdown-item>
            <el-dropdown-item command="face-bind" class="dropdown-item">
              <span class="item-text">人脸绑定</span>
            </el-dropdown-item>
            <el-dropdown-item command="logout" class="dropdown-item">
              <span class="item-text">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-header>
    
    <!-- 主内容区 -->
    <el-main class="front-main">
      <router-view></router-view>
    </el-main>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()

// 用户信息
const userInfo = ref({
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  superName: ''
})

// 计算当前激活的菜单项
const activePath = computed(() => router.currentRoute.value.path)

// 判断是否为激活状态
const isActive = (path: string) => activePath.value === path

// 加载用户信息
const loadUserInfo = () => {
  const superData = sessionStorage.getItem('user')
  if (superData) {
    const parsedData = JSON.parse(superData)
    userInfo.value.superName = parsedData.superName || parsedData.superLoginName || '用户'
  }
}

// 导航跳转
const navigateTo = (path: string) => {
  router.push(path)
}

// 个人中心/退出登录处理
const handleUserCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/super/spersonalcenter')
  } else if (command === 'face-bind') {
    const userData = sessionStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      const userId = user.superId || user.superLoginName || user.userId
      router.push({ path: '/face-bind', query: { userId } })
    } else {
      ElMessage({ type: 'error', message: '用户信息获取失败，请重新登录' })
      router.push('/login')
    }
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('lastLogin')
      ElMessage({ type: 'info', message: '已成功退出登录' })
      setTimeout(() => router.push('/login'), 1000)
    }).catch(() => {})
  }
}

// 页面加载时初始化
onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.front-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.front-header {
  height: 100px;
  background-color: #d1d9e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-right: 20px;
}

.nav-item {
  color: #333;
  font-size: 20px;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 4px;
  font-weight: 550;
  transition: all 0.3s; /* 添加过渡效果 */
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.avatar {
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.front-main {
  flex: 1;
  background-color: #f9fbfd;
  padding: 40px;
  overflow: auto;
}

/* 激活状态样式 */
.active-nav {
  color: #1569bd;
  font-size: 24px;
  font-weight: 600;
  position: relative;
}

/* 自定义头像样式 */
.user-avatar-container {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E8F4FD 0%, #D1E7DD 100%);
  border: 1.5px solid #B8D4EA;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.user-avatar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%);
  border-radius: 50%;
}

.avatar-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-figure {
  width: 20px;
  height: 20px;
  position: relative;
}

.avatar-head {
  width: 12px;
  height: 12px;
  background: #6C9BD1;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid #4A7BA7;
}

.avatar-body {
  width: 16px;
  height: 10px;
  background: #6C9BD1;
  border-radius: 6px 6px 3px 3px;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid #4A7BA7;
}

/* 自定义下拉菜单样式 */
.custom-dropdown-menu {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  border: none !important;
  padding: 8px 0 !important;
  min-width: 140px !important;
}

.custom-dropdown-menu::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid white;
  z-index: 1;
}

.dropdown-item {
  padding: 12px 20px !important;
  margin: 0 !important;
  border-radius: 0 !important;
  transition: all 0.2s ease !important;
}

.dropdown-item:hover {
  background-color: #F5F7FA !important;
}

.dropdown-item:first-child {
  border-radius: 12px 12px 0 0 !important;
}

.dropdown-item:last-child {
  border-radius: 0 0 12px 12px !important;
}

.item-text {
  color: #333 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px !important;
}

/* 头像悬停效果 */
.user-avatar-container:hover .user-avatar {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .user-avatar {
    width: 36px;
    height: 36px;
  }
  
  .avatar-figure {
    width: 20px;
    height: 20px;
  }
  
  .avatar-head {
    width: 14px;
    height: 14px;
  }
  
  .avatar-body {
    width: 18px;
    height: 10px;
  }
}

</style>