<template>
  <div class="front-container">
    <!-- 顶部导航栏 -->
    <el-header class="front-header">
      <div style="display: flex; align-items: center; flex: 1;">
        <img 
          src="/src/assets/images/logo.svg"
          alt="系统logo" 
          style="width: 40px; height: 40px; margin-right: 15px; cursor: pointer;"
          @click="openThemeDrawer"
        />
        <div style="font-size: 20px; font-weight: bold; color: var(--sidebar-text-color);">
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
        <el-button 
          type="text" 
          class="nav-item" 
          @click="navigateTo('/reader/chat')"
        >
          智能助手
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
      <!-- 活动区域 -->
      <section class="content-section">
        <h2 class="section-title">欢迎</h2>
        <div class="section-divider"></div>
        
        <!-- 图片轮播组件 -->
        <div class="carousel-container">
          <el-carousel 
            height="400px" 
            type="card"
            autoplay
            :interval="4000"
            arrow="always"
          >
            <el-carousel-item v-for="(img, index) in images" :key="index">
              <div class="carousel-item">
                <div class="carousel-overlay">
                  <div class="carousel-title">
                    <h3>{{ img.text }}</h3>
                  </div>
                </div>
                <img 
                  :src="img.url" 
                  :alt="img.alt" 
                  class="carousel-image"
                  @error="handleImageError($event, index)"
                >
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>
      </section>
      
      <!-- 公告区域 -->
      <section class="content-section">
        <h2 class="section-title">公告</h2>
        <div class="section-divider"></div>
        
        <div class="notices-container">
          <!-- 调整为两行两列布局 - 第一行 -->
          <div class="notice-row">
            <el-card class="notice-card" v-for="(notice, index) in fixedNotices.slice(0, 2)" :key="index">
              <div class="notice-item">
                <div class="notice-left">
                  <img :src="notice.img" alt="公告图片" class="notice-image">
                </div>
                <div class="notice-right">
                  <!-- 【修改点】将标题移至notice-header内部，与第二行结构一致 -->
                  <div class="notice-header">
                    <div class="notice-title">{{ notice.title }}</div>
                    <div class="notice-date">{{ notice.date }}</div>
                  </div>
                  <div class="notice-content">{{ notice.summary }}</div>
                  <div class="notice-footer">
                    <el-button type="text" @click="showNoticeDetail(notice)">
                      查看详情 <el-icon><ArrowRight /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
          
          <!-- 第二行 -->
          <div class="notice-row">
            <el-card class="notice-card" v-for="(notice, index) in fixedNotices.slice(2, 4)" :key="index + 2">
              <div class="notice-item">
                <div class="notice-left">
                  <img :src="notice.img" alt="公告图片" class="notice-image">
                </div>
                <div class="notice-right">
                  <div class="notice-header">
                    <div class="notice-title">{{ notice.title }}</div>
                    <div class="notice-date">{{ notice.date }}</div>
                  </div>
                  <div class="notice-content">{{ notice.summary }}</div>
                  <div class="notice-footer">
                    <el-button type="text" @click="showNoticeDetail(notice)">
                      查看详情 <el-icon><ArrowRight /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </section>
    </el-main>

    <!-- 主题设置抽屉 -->
    <el-drawer v-model="drawer" title="系统设置" direction="rtl" size="300px">
      <div class="drawer-content">
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

    <!-- 公告详情弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="currentNotice.title" 
      width="60%"
      :before-close="handleDialogClose"
    >
      <div class="notice-detail-content">
        <p v-for="(item, index) in noticeContentList" :key="index" class="notice-detail-item">
          {{ item }}
        </p>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowRight,
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()

// 定义公告类型
interface Notice {
  id: number
  title: string
  date: string
  summary: string
  img: string
  content: string
}

// 用户信息
const userInfo = ref({
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  readerName: ''
})

// 轮播图片列表
// 轮播图片列表
const images = ref([
  { url: '/src/assets/images/dd1.jpg', alt: '图书馆活动图片1', text: '生命的意义本不在向外索取' },
  { url: '/src/assets/images/dd4.jpg', alt: '图书馆活动图片2', text: '当书页洇开草木的呼吸' },
  { url: '/src/assets/images/dd5.jpg', alt: '图书馆活动图片3', text: '海风与文字相遇' },
  { url: '/src/assets/images/dd8.jpg', alt: '图书馆活动图片4', text: '我的阿勒泰：去爱 去感受 去生活' }
])


// 固定公告数据
const fixedNotices = ref<Notice[]>([
  {
    id: 1,
    title: '入馆须知',
    date: '2025-07-20',
    summary: '为提高图书馆的整体服务质量，创造良好的学习氛围，特此制定入馆须知十条。',
    img: '/src/assets/images/aa.webp',
    content: `
      <p>第一条 校内读者刷脸或扫码（一卡通虚拟二维码）入馆，校外读者凭介绍信或本人有效证件入馆。</p>
      <p>第二条 进入图书馆应举止文明，穿着整齐，着无袖背心、穿拖鞋入馆者不允许入馆。</p>
      <p>第三条 图书馆是重点防火单位，严禁在图书馆内吸烟、动火；严禁携带易燃、易爆物品入馆。违者按《吉林化工学院学生违规处理规定》第十八条进行处分。</p>
      <p>第四条 注意保持室内卫生，不随地吐痰、乱扔杂物等；禁止带有异味食品入馆；禁止将食品、饮料带入阅览室食用。</p>
      <p>第五条 注意保持公共秩序，不大声喧哗、朗读或嬉笑打闹；入馆阅览时，应将手机调至震动档，不准在阅览室内接打手机。</p>
      <p>第六条 爱护书刊资料及一切公共财物，请勿涂抹、撕毁、私藏书刊，不准在墙壁、阅览桌椅、书架等上乱写、乱画、乱刻。</p>
      <p>第七条 读者请自觉使用手机或者机器在座位系统上预约座位，不得以任何方式抢占阅览室座位；不随意挪动阅览室桌椅；离馆时请将个人物品一并带离，不许物品留滞在阅览室；按规定合理使用存包柜。</p>
      <p>第八条 经各出口通道时，配合值班人员核查，不应有不文明礼貌的言行；如遇监测器报警，主动接受工作人员疏散指令。</p>
      <p>第九条 未经许可禁止在馆内张贴或散发广告及其他宣传品。</p>
      <p>第十条 为提高图书馆的整体服务质量，创造良好的学习氛围，希望广大师生能够支持和配合我们的工作；并对我们的工作进行监督，提出批评和建议。</p>
    `
  },
  {
    id: 2,
    title: '图书馆违章处理规定',
    date: '2025-07-20',
    summary: '为了加强图书为了加强图书馆管理，指导读者正确地利用图书馆资源和切实履行义务，规范工作人员在处理违章事务中的行为，特制定本规定',
    img: '/src/assets/images/bb.webp',
    content: `
      <p>第一条 为了加强图书馆管理，指导读者正确地利用图书馆资源和切实履行义务，规范工作人员在处理违章事务中的行为，特制定本规定。</p>
      <p>第二条 图书馆是重点防火单位，严禁在图书馆内吸烟、动火；严禁携带易燃、易爆物品入馆。违者按第十八条进行处分。</p>
      <p>第三条 凡未办理借阅手续，私自携带书刊离开图书馆者（以检测设备报警并经查实为准），均视为严重违章。具体处理办法如下：当事人须作书面检查；暂停借书权限三个月。情节严重的，将注销当事人的借书权限，通报其所在单位、保卫处和学生工作部，直至通过法律途径解决。</p>
      <p>第四条 书刊遗失，需积极寻找，如无法找到，则赔偿与丢失图书相同版本新书一册，或赔偿其它新书一种三册（赔偿其它新书，单本图书价格不低于所遗失图书、内容得到图书馆认）。</p>
      <p>第五条 遗失成套多卷本图书中的1册或数册，则赔偿与丢失图书相同版本的图书一套或赔偿不同版本，价格不低于原版本的图书一套，赔偿后当事人不得索取其它卷册。</p>
      <p>第六条 书刊出现折角、卷曲或勾画、圈点、批注、涂抹、撕裂但可清除、覆盖、粘和且不影响字体和图像原状的，需进行说服教育，恢复书刊原貌，并积极协助管理员老师整理书刊20分钟。如影响字体和图像，按遗失书刊进行赔偿。</p>
      <p>第七条 书刊出现散页、书脊掰裂、精装封面断裂、被液体浸染、对割页、裁割图书按遗失书刊进行赔偿。</p>
      <p>第八条 使用他人借书证（卡）或将借书证（卡）借给他人使用者，一经发现，对出借及借用的双方均冻结借阅权限30天，并通报其所在院、系给予严肃批评。</p>
      <p>第九条 对以下违章且不服从管理者，将冻结其借阅权限15天，并记录违章一次；再犯者，将冻结其借阅权限30天，并通报其所在单位及其院系：</p>
      <p>（1）通过公共查询检索用机上校园外网或造成检索用机不能正常使用者;</p>
      <p>（2）非规范占阅览室座位，不听劝告者；</p>
      <p>（3）在馆内随地吐痰、乱扔杂物者；</p>
      <p>（4）乱扔图书，不按规定取书和肆意弄乱书架者；</p>
      <p>第十条 读者遗失借书证（卡）后，应及时到图书馆一楼总还书处办理挂失手续并补办新证。挂失前被借出的图书其责任由遗失者承担。</p>
    `
  },
  {
    id: 3,
    title: '自习区使用管理规定',
    date: '2025-07-20',
    summary: '自习区使用管理规定',
    img: '/src/assets/images/cc.png',
    content: `
      <p>第一条 读者要爱护自习区的公共设施。不得在桌椅上写字或涂抹乱画，不得损坏桌椅，不得随意调换桌椅。</p>
      <p>第二条 不得以座位预约系统之外的任何方式抢占座位。做到人走桌净，离开座位30分钟以上不归，工作人员有责任将占座物品清理，以免影响他人入座。</p>
      <p>第三条 贵重物品须随身携带，以免丢失。</p>
      <p>第四条 保持自习区安静、整洁。</p>
    `
  },
  {
    id: 4,
    title: '读者教育与培训制度',
    date: '2025-07-20',
    summary: '读者教育与培训是图书馆读者服务工作的重要内容',
    img: '/src/assets/images/dd.jpeg',
    content: `
      <p>第一条 读者教育与培训是图书馆读者服务工作的重要内容，主要有以下几种形式：</p>
      <p>第二条 新生入馆教育。新生入馆教育于每年秋季新生入学后军训过程中举行，入校新生由保卫处或各教学院统一安排、分期分批接受关于图书馆布局、资源分布、图书借阅规程、图书馆服务、书目信息查询方法及规章制度等各方面的教育培训，其目的在于帮助入校新生尽快了解图书馆，并尽快学会使用图书馆，使图书馆成为他们在校学习的第二课堂。</p>
      <p>第三条 文献检索课教学。文献检索课是指导学生利用文献资源，掌握文献检索方法，培养学生独立获取文献信息能力所不可缺少的一项工作。按照学院统一安排。</p>
      <p>第四条 定期讲座等系列培训。针对馆藏电子资源及读者的信息需求，开展多种方式的培训。</p>
      <p>第五条 个性化培训。针对教师读者和学生读者的特殊需求，不定期地开展个性化的培训。</p>
    `
  }
])

// 公告弹窗相关
const dialogVisible = ref(false)
const currentNotice = ref<Notice>({
  id: 0,
  title: '',
  date: '',
  summary: '',
  img: '',
  content: ''
})
const noticeContentList = ref<string[]>([])

// 显示公告详情弹窗
const showNoticeDetail = (notice: Notice) => {
  currentNotice.value = notice
  // 解析内容为数组，按条显示
  noticeContentList.value = []
  const tempContent = notice.content.replace(/<\/p><p>/g, '||').replace(/<p>|<\/p>/g, '').trim()
  if (tempContent) {
    noticeContentList.value = tempContent.split('||')
  }
  dialogVisible.value = true
}

// 关闭弹窗
const handleDialogClose = () => {
  dialogVisible.value = false
}

// 主题设置（读者端使用独立键，保持读者原有风格）
const themeStatus = ref(parseInt(localStorage.getItem('reader-theme') || '5'))
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

// 抽屉状态
const drawer = ref(false)

// 加载用户信息
const loadUserInfo = () => {
  const adminData = sessionStorage.getItem('user')
  if (adminData) {
    const parsedData = JSON.parse(adminData)
    userInfo.value.readerName = parsedData.adminName || parsedData.adminLoginName || '用户'
  }
}

// 图片加载失败处理
const handleImageError = (event: Event, index: number) => {
  (event.target as HTMLImageElement).src = 'https://picsum.photos/800/500?grayscale&blur=2'
  ElMessage.warning(`图片 ${index + 1} 加载失败，已显示默认图片`)
}

// （移除未使用的导航菜单命令处理函数）

// 导航项点击跳转
const navigateTo = (path: string) => {
  router.push(path)
}

// 个人中心命令处理
const handleUserCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/reader/rpersonalcenter')
  } else if (command === 'face-bind') {
    // 获取当前读者ID并跳转到人脸绑定页面
    const userData = sessionStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      const userId = user.readerId || user.readerLoginName || user.userId
      router.push({ path: '/face-bind', query: { userId } })
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
      sessionStorage.removeItem('reader')
      sessionStorage.removeItem('admin')
      sessionStorage.removeItem('super')
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
}

// 应用主题的方法
const applyTheme = () => {
  const theme = themes.value[themeStatus.value]
  if (theme) {
    document.documentElement.style.setProperty('--header-color', theme.header)
    document.documentElement.style.setProperty('--active-color', theme.active)
    document.documentElement.style.setProperty('--hover-color', theme.hover)
    document.documentElement.style.setProperty('--submenu-color', theme.subMenu)
    document.documentElement.style.setProperty('--sidebar-text-color', theme.text)
  }
}

// 切换主题
const changeTheme = (index: number) => {
  localStorage.setItem('reader-theme', index.toString())
  themeStatus.value = index
  applyTheme()
}

// 打开主题抽屉
const openThemeDrawer = () => {
  drawer.value = true
}

// 页面加载时获取数据和应用主题
onMounted(() => {
  loadUserInfo()
  applyTheme()
})
</script>

<style scoped>
/* 样式部分与之前保持一致 */
.front-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏样式 */
.front-header {
  height: 80px;
  background-color: var(--header-color);
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
  color: var(--sidebar-text-color);
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: inline-flex;
  align-items: center;
}

.nav-item:hover {
  background-color: var(--hover-color) !important;
}

:deep(.el-dropdown-menu) {
  background-color: var(--submenu-color) !important;
  border: none;
}

:deep(.el-dropdown-item) {
  color: var(--sidebar-text-color);
  transition: background-color 0.3s;
}

:deep(.el-dropdown-item:hover) {
  background-color: var(--hover-color) !important;
}

:deep(.el-dropdown-item.active) {
  background-color: var(--active-color) !important;
}

.icon-arrow {
  margin-left: 5px;
  font-size: 14px;
  color: var(--sidebar-text-color);
}

.avatar {
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

/* 主内容区样式 */
.front-main {
  flex: 1;
  background-color: #f9fbfd;
  padding: 40px;
  overflow: auto;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto 60px;
}

.section-title {
  font-size: 28px;
  color: var(--sidebar-text-color);
  margin-bottom: 15px;
  font-weight: 600;
  position: relative;
  padding-left: 10px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 70%;
  background-color: var(--sidebar-text-color);
  border-radius: 2px;
}

.section-divider {
  height: 2px;
  background-color: #e5e7eb;
  margin-bottom: 30px;
  width: 100%;
}

/* 轮播图样式 */
.carousel-container {
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

/* 轮播图文字覆盖层样式 */
.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 2rem 1.5rem 1.5rem;
}

.carousel-title h3 {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.carousel-item {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  position: relative;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.carousel-image:hover {
  transform: scale(1.02);
}

/* 轮播组件样式调整 */
:deep(.el-carousel__indicator) {
  width: 12px;
  height: 12px;
  margin: 0 6px;
  border-radius: 50%;
}

:deep(.el-carousel__indicator.is-active button) {
  background-color: var(--sidebar-text-color);
  width: 12px;
  height: 12px;
}

:deep(.el-carousel__arrow) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  opacity: 0.8;
}

:deep(.el-carousel__arrow:hover) {
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 1;
}

/* 公告区域样式 */
.notices-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
  width: 100%;
}

.notice-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
}

.notice-card {
  transition: all 0.3s ease;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
}

.notice-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.notice-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  height: 100%;
}

.notice-left {
  flex: 0 0 120px;
  height: 120px;
  overflow: hidden;
  border-radius: 4px;
}

.notice-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.notice-card:hover .notice-image {
  transform: scale(1.05);
}

.notice-right {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notice-title {
  font-size: 18px;
  color: var(--sidebar-text-color);
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s;
}

.notice-title:hover {
  color: var(--sidebar-text-color);
  text-decoration: underline;
}

.notice-date {
  font-size: 14px;
  color: #999;
}

.notice-content {
  color: #666;
  line-height: 1.6;
  font-size: 15px;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-clamp: 3; /* 标准属性，提升兼容性 */
  overflow: hidden;
  flex: 1;
}

.notice-footer {
  text-align: right;
}

.empty-notices {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

/* 主题设置抽屉样式 */
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

/* 公告详情弹窗样式 */
.notice-detail-content {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.notice-detail-item {
  margin-bottom: 20px;
  line-height: 1.8;
  text-align: justify;
}

:deep(.el-dialog__body) {
  padding: 20px 30px;
}

/* 响应式布局 */
@media (max-width: 992px) {
  .notice-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .front-main {
    padding: 20px;
  }
  
  .notice-item {
    flex-direction: column;
  }
  
  .notice-left {
    flex: 0 0 150px;
    width: 100%;
    height: 150px;
    margin-bottom: 15px;
  }
}

/* 活动区域（轮播图）整体缩小至80% */
.content-section:nth-child(1) {
  transform: scale(0.8);
  transform-origin: top;
  margin-bottom: -45px; 
}

/* 活动区域标题和间距调整 */
.content-section:nth-child(1) .section-title {
  font-size: 28px; /* 原28px的80% */
  margin-bottom: 10px; /* 原15px的80% */
}

.content-section:nth-child(1) .section-divider {
  margin-bottom: 30px; /* 原30px的80% */
}

/* 轮播图高度调整 */
.content-section:nth-child(1) .carousel-container .el-carousel {
  height: 400px; /* 原400px的80% */
}

/* 公告区域整体缩小至80% */
.content-section:nth-child(2) {
  transform: scale(0.8);
  transform-origin: top;
  margin-bottom: calc(60px * 0.8);
  margin-top: -20px; /* 若原存在顶部间距，调整为更小的值 */
}

/* 公告区域标题和间距调整 */
.content-section:nth-child(2) .section-title {
  font-size: 28px; /* 原28px的80% */
  margin-bottom: 10px;
}

.content-section:nth-child(2) .section-divider {
  margin-bottom: 24px; /* 原30px的80% */
}

/* 公告卡片尺寸调整 */
.content-section:nth-child(2) .notices-container {
  gap: 22px; /* 原25px的80% */
}

.content-section:nth-child(2) .notice-row {
  gap: 22px; /* 原25px的80% */
}

.content-section:nth-child(2) .notice-item {
  padding: 12px; /* 原15px的80% */
  gap: 12px; /* 原15px的80% */
}

.content-section:nth-child(2) .notice-left {
  flex: 0 0 96px; /* 原120px的80% */
  height: 96px; /* 原120px的80% */
}

.content-section:nth-child(2) .notice-title {
  font-size: 14.4px; /* 原18px的80% */
}

.content-section:nth-child(2) .notice-content {
  font-size: 12px; /* 原15px的80% */
  margin-bottom: 12px; /* 原15px的80% */
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