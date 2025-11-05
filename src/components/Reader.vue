<template>
  <div class="common-layout">
    <!-- 顶部导航栏 -->
    <el-header class="front-header">
      <div style="display: flex; align-items: center; flex: 1;">
        <img 
          src="/src/assets/images/logo.svg"
          alt="系统logo" 
          style="width: 40px; height: 40px; margin-right: 15px; cursor: pointer;"
          @click="navigateTo('/readerfront')"
        />
        <div 
          style="font-size: 20px; font-weight: bold; color: var(--sidebar-text-color); cursor: pointer;"
          @click="navigateTo('/readerfront')"
        >
          图书管理系统
        </div>
      </div>
      
      <!-- 顶部导航菜单 -->
      <div class="nav-menu">
        <el-button 
          type="text" 
          class="nav-item" 
          @click="navigateTo('/reader/bookborrow')"
        >
          借书
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          @click="navigateTo('/reader/bookreturn')"
        >
          还书
        </el-button>
        
        <el-button 
          type="text" 
          class="nav-item" 
          @click="navigateTo('/reader/recording')"
        >
          借阅记录
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          @click="navigateTo('/reader/rviolation')"
        >
          违规记录
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          @click="navigateTo('/reader/topn')"
        >
          图书榜单
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          @click="navigateTo('/reader/donate')"
        >
          捐赠图书
        </el-button>
        <el-button 
          type="text" 
          class="nav-item" 
          @click="navigateTo('/reader/collect')"
        >
          收藏推荐
        </el-button>
      </div>
      
      <!-- 右上角个人信息 -->
      <el-dropdown @command="handleUserCommand">
        <el-avatar :size="40" class="avatar">
          <img :src="userAvatar" alt="用户头像" v-if="userAvatar" />
          <User v-else />
        </el-avatar>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <router-link to="/reader/rpersonalcenter" custom v-slot="{ navigate }">
                <span @click="navigate">个人信息</span>
              </router-link>
            </el-dropdown-item>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
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
import { useRouter } from 'vue-router'
import { User } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ref, onMounted } from 'vue'

const router = useRouter()

// 用户头像URL
const userAvatar = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')

// 主题配置（与front.vue保持一致，确保主题参数统一）
const themes = ref([
  { 
    name: 'theme1', 
    header: '#f0f2f5',       // 超浅灰蓝
    active: '#c9d8e7',
    hover: '#d6e1f0',
    subMenu: '#f5f7fa',
    text: '#406599'
  },
  { 
    name: 'theme2', 
    header: '#f5f7f0',       // 超浅灰绿
    active: '#d4e1b7',
    hover: '#e3ebcd',
    subMenu: '#f8faf3',
    text: '#5c7a29'
  },
  { 
    name: 'theme3', 
    header: '#f7f4f0',       // 超浅灰橙
    active: '#e6d3b7',
    hover: '#f0e3cd',
    subMenu: '#fcf9f3',
    text: '#8a6d3b'
  },
  { 
    name: 'theme4', 
    header: '#f5f0f7',       // 超浅灰紫
    active: '#d8c7e8',
    hover: '#e3d6f0',
    subMenu: '#faf6fc',
    text: '#6b4c8a'
  },
  { 
    name: 'theme5', 
    header: '#f0f7f7',       // 超浅灰青
    active: '#b7d7d7',
    hover: '#cde3e3',
    subMenu: '#f3f9f9',
    text: '#3a7a7a'
  },
  { 
    name: 'theme6', 
    header: '#f7f0f0',       // 超浅灰红（粉红色系）
    active: '#e8c7c7',
    hover: '#f0d6d6',
    subMenu: '#fcf6f6',
    text: '#8a4c4c'
  }
])

// 导航项点击跳转
const navigateTo = (path: string) => {
  router.push(path)
}

// 从本地存储加载用户头像
const loadUserAvatar = () => {
  try {
    const readerInfo = sessionStorage.getItem('user')
    if (readerInfo) {
      const info = JSON.parse(readerInfo)
      if (info.avatar) {
        userAvatar.value = info.avatar
      }
    }
  } catch (error) {
    console.error('加载用户头像失败:', error)
  }
}

// 应用主题样式（核心：将主题变量注入CSS）
const applyTheme = (themeIndex: number) => {
  const theme = themes.value[themeIndex]
  if (theme) {
    document.documentElement.style.setProperty('--header-color', theme.header)
    document.documentElement.style.setProperty('--active-color', theme.active)
    document.documentElement.style.setProperty('--hover-color', theme.hover)
    document.documentElement.style.setProperty('--submenu-color', theme.subMenu)
    document.documentElement.style.setProperty('--sidebar-text-color', theme.text)
  }
}

// 加载读者端最后选择的主题（与管理员隔离）
const loadLastTheme = () => {
  const savedTheme = localStorage.getItem('reader-theme')
  const themeIndex = savedTheme ? parseInt(savedTheme) : 5
  applyTheme(themeIndex)
}

// 个人中心命令处理
const handleUserCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 清理统一及兼容键
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('reader')
      sessionStorage.removeItem('admin')
      sessionStorage.removeItem('super')
      sessionStorage.removeItem('lastLogin')
      userAvatar.value = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
      ElMessage({ type: 'info', message: '已成功退出登录' })
      setTimeout(() => router.push('/login'), 1000)
    }).catch(() => {})
  }
}

// 页面加载时初始化
onMounted(() => {
  loadUserAvatar()
  // 关键：刷新后立即加载主题
  loadLastTheme()
})
</script>

<style scoped>
.common-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航栏样式（依赖主题变量） */
.front-header {
  height: 80px;
  background-color: var(--header-color); /* 使用主题变量 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: background-color 0.3s ease;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-right: 20px;
}

.nav-item {
  color: var(--sidebar-text-color); /* 使用主题变量 */
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-item:hover {
  background-color: var(--hover-color) !important; /* 使用主题变量 */
}

:deep(.el-dropdown-menu) {
  background-color: var(--submenu-color) !important; /* 使用主题变量 */
  border: none;
}

:deep(.el-dropdown-item) {
  color: var(--sidebar-text-color); /* 使用主题变量 */
  transition: background-color 0.3s;
}

:deep(.el-dropdown-item:hover) {
  background-color: var(--hover-color) !important; /* 使用主题变量 */
}

:deep(.el-dropdown-item.active) {
  background-color: var(--active-color) !important; /* 使用主题变量 */
}

.avatar {
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  background-color: var(--active-color); /* 使用主题变量 */
  color: white;
}

/* 主内容区样式 */
.front-main {
  flex: 1;
  background-color: #f9fbfd;
  padding: 40px;
  overflow: auto;
}

/* 去除链接下划线 */
::v-deep a {
  text-decoration: none !important;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .front-main {
    padding: 10px;
  }
  .nav-menu {
    gap: 10px;
  }
  .nav-item {
    font-size: 14px;
    padding: 6px 8px;
  }
}
</style>