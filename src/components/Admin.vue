<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Collection, 
  UserFilled, 
  ChatDotRound, 
  WarningFilled, 
  List,
  Box,
  View,
  Hide,
  ArrowLeft,
  PieChart  // 新增：数据总览图标
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 动态计算激活菜单项
const activeIndex = computed(() => route.path)

// 用户信息（字段名与后端一致）
const userInfo = ref({
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  adminName: '' // 对应后端adminName（管理员姓名）
})

// 侧边栏状态
const isCollapse = ref(false)
const sideWidth = computed(() => isCollapse.value ? '64px' : '200px')

// 主题设置
const themeStatus = ref(parseInt(localStorage.getItem('theme') || '0'))
const themes = ref([
  { 
    name: 'theme1', 
    header: '#f0f2f5',       // 超浅灰蓝（顶部栏）
    aside: '#e6e8eb',        // 淡灰蓝（侧边栏）
    active: '#c9d8e7',       // 亮灰蓝（激活状态）
    hover: '#d6e1f0',        // 浅灰蓝（悬停状态）
    subMenu: '#f5f7fa',      // 子菜单背景
    text: '#406599'          // 文字颜色 - 深蓝色
  },
  { 
    name: 'theme2', 
    header: '#f5f7f0',       // 超浅灰绿（顶部栏）
    aside: '#eef1e6',        // 淡灰绿（侧边栏）
    active: '#d4e1b7',       // 亮灰绿（激活状态）
    hover: '#e3ebcd',        // 浅灰绿（悬停状态）
    subMenu: '#f8faf3',      // 子菜单背景
    text: '#5c7a29'          // 文字颜色 - 深绿色
  },
  { 
    name: 'theme3', 
    header: '#f7f4f0',       // 超浅灰橙（顶部栏）
    aside: '#f1ede8',        // 淡灰橙（侧边栏）
    active: '#e6d3b7',       // 亮灰橙（激活状态）
    hover: '#f0e3cd',        // 浅灰橙（悬停状态）
    subMenu: '#fcf9f3',      // 子菜单背景
    text: '#8a6d3b'          // 文字颜色 - 深棕色
  },
  { 
    name: 'theme4', 
    header: '#f5f0f7',       // 超浅灰紫（顶部栏）
    aside: '#ede6f1',        // 淡灰紫（侧边栏）
    active: '#d8c7e8',       // 亮灰紫（激活状态）
    hover: '#e3d6f0',        // 浅灰紫（悬停状态）
    subMenu: '#faf6fc',      // 子菜单背景
    text: '#6b4c8a'          // 文字颜色 - 深紫色
  },
  { 
    name: 'theme5', 
    header: '#f0f7f7',       // 超浅灰青（顶部栏）
    aside: '#e6f1f1',        // 淡灰青（侧边栏）
    active: '#b7d7d7',       // 亮灰青（激活状态）
    hover: '#cde3e3',        // 浅灰青（悬停状态）
    subMenu: '#f3f9f9',      // 子菜单背景
    text: '#3a7a7a'          // 文字颜色 - 深青色
  },
  { 
    name: 'theme6', 
    header: '#f7f0f0',       // 超浅灰红（顶部栏）
    aside: '#f1e6e6',        // 淡灰红（侧边栏）
    active: '#e8c7c7',       // 亮灰红（激活状态）
    hover: '#f0d6d6',        // 浅灰红（悬停状态）
    subMenu: '#fcf6f6',      // 子菜单背景
    text: '#8a4c4c'          // 文字颜色 - 深红褐色
  }
])
// 当前主题的计算属性
const currentTheme = computed(() => themes.value[themeStatus.value])

// 抽屉状态
const drawer = ref(false)

// 路由路径与页面标题的映射关系（新增数据总览）
const pageTitles = {
  '/admin/datas': '数据总览',  // 新增：数据总览页面标题
  '/admin/graph': '知识图谱',
  '/admin/books/book': '库存管理',
  '/admin/books/borrow': '借阅管理',
  '/admin/books/return': '还书管理',
  '/admin/readers': '读者管理',
  '/admin/reviews': '评价管理',
  '/admin/aviolations': '违规记录处理',
  '/admin/notices': '公告管理',
  '/admin/apersonalcenters': '个人中心',
  '/admin/knowledge': '知识库管理' // 新增：知识库管理
}

// 根据当前路由获取页面标题
const pageTitle = computed(() => {
  return pageTitles[route.path as keyof typeof pageTitles] || '图书管理系统'
})

// 从sessionStorage获取用户信息（适配后端字段）
const loadUserInfo = () => {
  const adminData = sessionStorage.getItem('user')
  if (adminData) {
    const parsedData = JSON.parse(adminData)
    userInfo.value.adminName = parsedData.adminName || parsedData.adminLoginName || '用户'
  }
}

// 页面加载时获取用户信息和应用主题
onMounted(() => {
  loadUserInfo()
  applyTheme()
})

// 应用主题的方法
const applyTheme = () => {
  const theme = themes.value[themeStatus.value]
  if (theme) {
    document.documentElement.style.setProperty('--header-color', theme.header)
    document.documentElement.style.setProperty('--aside-color', theme.aside)
    document.documentElement.style.setProperty('--active-color', theme.active)
    document.documentElement.style.setProperty('--hover-color', theme.hover)
    document.documentElement.style.setProperty('--submenu-color', theme.subMenu)
    document.documentElement.style.setProperty('--sidebar-text-color', theme.text)
  }
}

// 下拉菜单命令处理
const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push({ name: 'Apersonalcenters' })
  } else if (command === 'face-bind') {
    // 获取当前用户ID并跳转到人脸绑定页面
    const userData = sessionStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      const userId = user.adminId || user.adminLoginName
      router.push({
        path: '/face-bind',
        query: { userId: userId }
      })
    } else {
      ElMessage.error('用户信息获取失败，请重新登录')
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
      setTimeout(() => router.push({ name: 'Login' }), 1000)
    }).catch(() => {})
  }
}

// 跳转到Front界面的方法
const goToFront = () => {
  router.push('/adminfront')
}

// 打开主题设置抽屉
const openThemeDrawer = () => {
  drawer.value = true
}

// 切换主题
const changeTheme = (index: number) => {
  localStorage.setItem('theme', index.toString())
  themeStatus.value = index
  applyTheme()
}

// 返回上一页方法
const goBack = () => {
  router.back()
}

// 导航跳转方法
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <div style="display: flex; align-items: center; flex: 1;">
          <img 
            src="/src/assets/images/logo.svg" 
            alt="系统logo" 
            style="width: 40px; height: 40px; margin-right: 15px; cursor: pointer;"
            @click="openThemeDrawer"
          />
          <div 
            style="font-size: 20px; font-weight: bold; cursor: pointer; color: var(--sidebar-text-color)"
            @click="goToFront"
          >
            图书管理系统
          </div>
        </div>
        <el-dropdown @command="handleCommand" trigger="click" placement="bottom-end">
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
      <el-container>
        <el-aside :width="sideWidth" class="custom-aside">
          <el-menu
            :default-active="activeIndex"
            class="el-menu-vertical-demo"
            router
            :collapse="isCollapse"
            :collapse-transition="false"
          >
            <!-- 数据总览子菜单 -->
            <el-sub-menu index="0">
              <template #title>
                <el-icon><PieChart /></el-icon>
                <span>数据总览</span>
              </template>
              <el-menu-item index="/admin/datas">
                <el-icon><PieChart /></el-icon>
                <span>可视化大屏</span>
              </el-menu-item>
              <el-menu-item index="/admin/graph">
                <el-icon><PieChart /></el-icon>
                <span>知识图谱</span>
              </el-menu-item>
            </el-sub-menu>

            <!-- 图书管理子菜单 -->
            <el-sub-menu index="1">
              <template #title>
                <el-icon><Collection /></el-icon>
                <span>图书管理</span>
              </template>
              <el-menu-item index="/admin/books/book">
                <el-icon><Box /></el-icon>
                <span>库存管理</span>
              </el-menu-item>
              <el-menu-item index="/admin/books/borrow">
                <el-icon><View /></el-icon>
                <span>借阅管理</span>
              </el-menu-item>
              <el-menu-item index="/admin/books/return">
                <el-icon><Hide /></el-icon>
                <span>还书管理</span>
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 其他菜单项 -->
            <el-menu-item index="/admin/readers">
              <el-icon><UserFilled /></el-icon>
              <span>读者管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/reviews">
              <el-icon><ChatDotRound /></el-icon>
              <span>评价管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/aviolations">
              <el-icon><WarningFilled /></el-icon>
              <span>违规记录处理</span>
            </el-menu-item>
            <el-menu-item index="/admin/notices">
              <el-icon><List /></el-icon>
              <span>公告管理</span>
            </el-menu-item>
            <!-- 知识库管理入口，放在个人中心上面 -->
            <el-menu-item index="/admin/knowledge">
              <el-icon><List /></el-icon>
              <span>知识库管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/apersonalcenters">
              <el-icon><UserFilled /></el-icon>
              <span>个人中心</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main>
          <!-- 页头组件 -->
          <el-page-header 
            :icon="ArrowLeft" 
            @back="goBack"
            class="page-header"
          >
            <template #content>
              <span class="text-large font-600 mr-3">{{ pageTitle }}</span>
            </template>
          </el-page-header>
          
          <!-- 原有内容区域 -->
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>

    <!-- 主题设置抽屉 -->
    <el-drawer v-model="drawer" title="系统设置" direction="rtl" size="300px">
      <div class="drawer-content">
        <div class="drawer-section">
          <h3>侧边栏设置</h3>
          <div class="drawer-option">
            <span>折叠侧边栏</span>
            <el-switch 
              v-model="isCollapse" 
              active-color="var(--sidebar-text-color)" 
              inactive-color="#dcdfe6" 
            />
          </div>
        </div>

        <el-divider />

        <div class="drawer-section">
          <h3>主题设置</h3>
          <div class="theme-options">
            <div
                v-for="(theme, index) in themes"
                :key="index"
                class="theme-option"
                :class="{ active: themeStatus === index }"
                @click="changeTheme(index)"
                :style="{ backgroundColor: theme.header }"
            >
              <div class="theme-check" v-if="themeStatus === index">✓</div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
/* 样式保持不变，已适配新增菜单 */
.common-layout {
  width: 100%;
  height: 100%;
}

.el-header {
  height: 80px;
  background-color: var(--header-color);
  line-height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  transition: background-color 0.3s ease;
}

.avatar {
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.custom-aside {
  background-color: var(--aside-color);
  height: calc(100vh - 80px);
  text-align: center;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  border-right: 1px solid #ccc;
  padding-top: 10px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.el-menu-vertical-demo {
  background-color: var(--aside-color);
  padding-top: 10px;
  height: 100%;
  border-right: none;
}

.el-menu-item,
.el-sub-menu,
.el-menu-item span,
.el-sub-menu span {
  color: var(--sidebar-text-color) !important;
}

.el-menu-item .el-icon,
.el-sub-menu .el-icon {
  color: var(--sidebar-text-color) !important;
}

.el-menu-item,
.el-sub-menu {
  transition: background-color 0.3s ease;
}

.el-menu-item:hover,
.el-sub-menu:hover {
  background-color: var(--hover-color) !important;
}

.el-menu-item:active,
.el-menu-item.is-active {
  background-color: var(--active-color) !important;
}

.el-sub-menu .el-menu {
  background-color: var(--submenu-color) !important;
}

.el-sub-menu .el-menu-item {
  background-color: var(--submenu-color) !important;
}

.el-sub-menu .el-menu-item:hover {
  background-color: var(--hover-color) !important;
}

.el-main {
  color: var(--el-text-color-primary);
  text-align: center;
  height: calc(100vh - 80px);
  background-color: #f9fbfd;
  padding: 20px;
  overflow: auto;
}

.page-header {
  margin-bottom: 20px;
  text-align: left;
  --el-page-header-text-color: var(--sidebar-text-color);
}

.text-large {
  font-size: 18px;
}

.font-600 {
  font-weight: 600;
}

.drawer-content {
  padding: 20px;
}

.drawer-section {
  margin-bottom: 20px;
}

.drawer-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  color: var(--sidebar-text-color);
}

.drawer-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.drawer-option span {
  font-size: 14px;
  color: var(--sidebar-text-color);
}

.theme-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.theme-option {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.theme-option.active {
  border-color: var(--sidebar-text-color);
  transform: scale(1.05);
}

.theme-check {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--sidebar-text-color);
  font-weight: bold;
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
  background: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 60%);
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
    width: 18px;
    height: 18px;
  }
  
  .avatar-head {
    width: 10px;
    height: 10px;
  }
  
  .avatar-body {
    width: 14px;
    height: 8px;
  }
}
</style>