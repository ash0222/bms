<template>
  <div class="index-container">
    <!-- 快速导航区域 -->
    <section class="content-section">
      <h2 class="section-title">快速导航</h2>
      <div class="section-divider"></div>
      
      <!-- 快速导航卡片 -->
      <div class="quick-nav-container">
        <div class="quick-nav-card" @click="navigateToKnowledge">
          <div class="nav-icon">
            <el-icon size="40" color="#409eff"><Collection /></el-icon>
          </div>
          <div class="nav-content">
            <h3>知识库管理</h3>
            <p>管理图书知识库，查看知识图谱</p>
          </div>
        </div>
        
        <div class="quick-nav-card" @click="navigateToData">
          <div class="nav-icon">
            <el-icon size="40" color="#67c23a"><PieChart /></el-icon>
          </div>
          <div class="nav-content">
            <h3>数据总览</h3>
            <p>查看系统数据统计和可视化图表</p>
          </div>
        </div>
      </div>
    </section>

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
          interval="4000"
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
      
      <div class="notices-container" v-loading="loading">
        <!-- 两行两列布局 -->
        <div class="notice-row">
          <el-card class="notice-card" v-for="(notice, index) in dbNotices.slice(0, 2)" :key="notice.noticeId">
            <div class="notice-item">
              <div class="notice-left">
                <img 
                  :src="fixedNoticeContents[index % fixedNoticeContents.length].img" 
                  alt="公告图片" 
                  class="notice-image"
                >
              </div>
              <div class="notice-right">
                <div class="notice-header">
                  <div class="notice-title">{{ notice.title }}</div>
                  <div class="notice-date">{{ dayjs(notice.createTime).format('YYYY-MM-DD') }}</div>
                </div>
                <div class="notice-content">
                  {{ notice.content.length > 80 ? notice.content.substring(0, 80) + '...' : notice.content }}
                </div>
                <div class="notice-footer">
                  <el-button 
                    type="text" 
                    @click="showNoticeDetail(notice, fixedNoticeContents[index % fixedNoticeContents.length])"
                  >
                    查看详情 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        
        <div class="notice-row">
          <el-card class="notice-card" v-for="(notice, index) in dbNotices.slice(2, 4)" :key="notice.noticeId">
            <div class="notice-item">
              <div class="notice-left">
                <img 
                  :src="fixedNoticeContents[(index + 2) % fixedNoticeContents.length].img" 
                  alt="公告图片" 
                  class="notice-image"
                >
              </div>
              <div class="notice-right">
                <div class="notice-header">
                  <div class="notice-title">{{ notice.title }}</div>
                  <div class="notice-date">{{ dayjs(notice.createTime).format('YYYY-MM-DD') }}</div>
                </div>
                <div class="notice-content">
                  {{ notice.content.length > 80 ? notice.content.substring(0, 80) + '...' : notice.content }}
                </div>
                <div class="notice-footer">
                  <el-button 
                    type="text" 
                    @click="showNoticeDetail(notice, fixedNoticeContents[(index + 2) % fixedNoticeContents.length])"
                  >
                    查看详情 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        
        <!-- 无公告数据时显示 -->
        <div v-if="!loading && dbNotices.length === 0" class="empty-notices">
          <el-empty description="暂无公告信息" />
          <el-button style="margin-top: 16px;" @click="getDbNotices">刷新</el-button>
        </div>
      </div>
    </section>

    <!-- 公告详情弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="currentNotice.title" 
      width="70%"
      :before-close="handleDialogClose"
    >
      <div class="notice-detail">
        <div class="detail-header">
          <span class="detail-date">发布时间：{{ currentNotice.date }}</span>
        </div>
        <div class="detail-content">
          <p v-for="(item, index) in noticeContentList" :key="index" class="detail-paragraph">
            {{ item }}
          </p>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ArrowRight, Collection, PieChart } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElEmpty, ElDialog, ElButton } from 'element-plus'
import $api from '../axios'
import dayjs from 'dayjs'

// 定义数据库公告类型接口
interface DbNotice {
  noticeId: string
  title: string
  content: string
  author: string
  authorId: string
  createTime: string
  updateTime: string
}

// 定义固定弹窗内容类型
interface FixedNoticeContent {
  id: number
  img: string
  content: string
}

// 图片加载失败处理
const handleImageError = (event: Event, index: number) => {
  (event.target as HTMLImageElement).src = 'https://picsum.photos/800/500?grayscale&blur=2'
  ElMessage.warning(`图片 ${index + 1} 加载失败，已显示默认图片`)
}

// 轮播图片列表
const images = ref([
  { url: 'src/assets/images/dd1.jpg', alt: '图书馆活动图片1', text: '生命的意义本不在向外索取' },
  { url: 'src/assets/images/dd4.jpg', alt: '图书馆活动图片2', text: '当书页洇开草木的呼吸' },
  { url: 'src/assets/images/dd5.jpg', alt: '图书馆活动图片3', text: '海风与文字相遇' },
  { url: 'src/assets/images/dd8.jpg', alt: '图书馆活动图片4', text: '我的阿勒泰：去爱 去感受 去生活' },
  { url: 'src/assets/images/dd2.jpg', alt: '图书馆活动图片5', text: '去有花的地方' }
])

const router = useRouter()

// 用户信息
const userInfo = ref({
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  superName: ''
})

// 导航方法
const navigateToKnowledge = () => {
  router.push('/super/knowledge')
}

const navigateToData = () => {
  router.push('/super/datas')
}

// 公告数据相关
const notices = ref<any[]>([])
const loading = ref(true)
const dbNotices = ref<DbNotice[]>([])

// 固定的弹窗内容
const fixedNoticeContents: FixedNoticeContent[] = [
  {
    id: 1,
    img: 'src/assets/images/aa.webp',
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
    img: 'src/assets/images/bb.webp',
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
    img: 'src/assets/images/cc.png',
    content: `
      <p>第一条 读者要爱护自习区的公共设施。不得在桌椅上写字或涂抹乱画，不得损坏桌椅，不得随意调换桌椅。</p>
      <p>第二条 不得以座位预约系统之外的任何方式抢占座位。做到人走桌净，离开座位30分钟以上不归，工作人员有责任将占座物品清理，以免影响他人入座。</p>
      <p>第三条 贵重物品须随身携带，以免丢失。</p>
      <p>第四条 保持自习区安静、整洁。</p>
    `
  },
  {
    id: 4,
    img: 'src/assets/images/dd.jpeg',
    content: `
      <p>第一条 读者教育与培训是图书馆读者服务工作的重要内容，主要有以下几种形式：</p>
      <p>第二条 新生入馆教育。新生入馆教育于每年秋季新生入学后军训过程中举行，入校新生由保卫处或各教学院统一安排、分期分批接受关于图书馆布局、资源分布、图书借阅规程、图书馆服务、书目信息查询方法及规章制度等各方面的教育培训，其目的在于帮助入校新生尽快了解图书馆，并尽快学会使用图书馆，使图书馆成为他们在校学习的第二课堂。</p>
      <p>第三条 文献检索课教学。文献检索课是指导学生利用文献资源，掌握文献检索方法，培养学生独立获取文献信息能力所不可缺少的一项工作。按照学院统一安排。</p>
      <p>第四条 定期讲座等系列培训。针对馆藏电子资源及读者的信息需求，开展多种方式的培训。</p>
      <p>第五条 个性化培训。针对教师读者和学生读者的特殊需求，不定期地开展个性化的培训。</p>
    `
  }
]

// 公告弹窗相关
const dialogVisible = ref(false)
const currentNotice = ref({
  id: 0,
  title: '',
  date: '',
  summary: '',
  img: '',
  content: ''
})
const noticeContentList = ref<string[]>([])

// 显示公告详情弹窗
const showNoticeDetail = (dbNotice: DbNotice, fixedContent: FixedNoticeContent) => {
  currentNotice.value = {
    id: fixedContent.id,
    title: dbNotice.title,
    date: dayjs(dbNotice.createTime).format('YYYY-MM-DD HH:mm:ss'),
    summary: dbNotice.content.substring(0, 50) + (dbNotice.content.length > 50 ? '...' : ''),
    img: fixedContent.img,
    content: fixedContent.content
  }
  
  // 解析内容为数组（保留序号）
  const tempContent = fixedContent.content.replace(/<\/p><p>/g, '||').replace(/<p>|<\/p>/g, '').trim()
  noticeContentList.value = tempContent ? tempContent.split('||') : []
  dialogVisible.value = true
}

// 关闭弹窗
const handleDialogClose = () => {
  dialogVisible.value = false
}

// 加载用户信息
const loadUserInfo = () => {
  const superData = sessionStorage.getItem('user')
  if (superData) {
    const parsedData = JSON.parse(superData)
    userInfo.value.superName = parsedData.superName || parsedData.superLoginName || '用户'
  }
}

// 获取公告数据
const getNotices = async () => {
  try {
    loading.value = true
    const res = await $api.get('/notice/page', {
      params: { currentPage: 1, size: 3 }
    })
    
    if (res.data.data?.rows) {
      notices.value = res.data.data.rows.map((item: any) => ({
        ...item,
        createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm'),
        updateTime: dayjs(item.updateTime).format('YYYY-MM-DD HH:mm')
      })).sort((a: any, b: any) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    }
  } catch (error) {
    ElMessage.error('获取公告失败')
    console.error('获取公告失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取数据库中的公告数据
const getDbNotices = async () => {
  try {
    loading.value = true
    const res = await $api.get('/notice/page', {
      params: { currentPage: 1, size: 4 }
    })
    
    if (res.data.code === 200 && res.data.data?.rows) {
      dbNotices.value = res.data.data.rows.slice(0, 4).map((item: any) => ({
        ...item,
        createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
        updateTime: dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss')
      })) as DbNotice[]
    }
  } catch (error) {
    ElMessage.error('获取公告数据失败，使用默认数据')
    // 出错时使用默认数据
    dbNotices.value = [
      {
        noticeId: '001',
        title: '入馆须知',
        content: '为规范图书馆管理，保障读者权益，特制定本须知',
        author: '系统管理员',
        authorId: 'super',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      },
      {
        noticeId: '002',
        title: '图书馆违章处理规定',
        content: '规范读者行为，维护图书馆秩序',
        author: '系统管理员',
        authorId: 'super',
        createTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        updateTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
      },
      {
        noticeId: '003',
        title: '自习区使用管理规定',
        content: '维护自习区秩序，营造良好学习环境',
        author: '系统管理员',
        authorId: 'super',
        createTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
        updateTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss')
      },
      {
        noticeId: '004',
        title: '读者教育与培训制度',
        content: '提升读者信息素养，促进资源利用',
        author: '系统管理员',
        authorId: 'super',
        createTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
        updateTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss')
      }
    ]
  } finally {
    loading.value = false
  }
}

// 页面加载时初始化
onMounted(() => {
  loadUserInfo()
  getDbNotices()
  getNotices()
})
</script>

<style scoped>
/* 根容器样式 */
.index-container {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f9fbfd;
}

/* 内容区块样式 */
.content-section {
  max-width: 1200px;
  margin: 0 auto 40px;
}

/* 快速导航样式 */
.quick-nav-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.quick-nav-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 2px solid transparent;
}

.quick-nav-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.nav-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.quick-nav-card:hover .nav-icon {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  transform: scale(1.1);
}

.quick-nav-card:hover .nav-icon .el-icon {
  color: white !important;
}

.nav-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.quick-nav-card:hover .nav-content h3 {
  color: #409eff;
}

.nav-content p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* 区块标题样式 */
.section-title {
  font-size: 28px;
  color: #333;
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
  background-color: #409eff;
  border-radius: 2px;
}

/* 标题下方分隔线 */
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

/* 轮播组件样式调整 */
:deep(.el-carousel__indicator) {
  width: 12px;
  height: 12px;
  margin: 0 6px;
  border-radius: 50%;
}

:deep(.el-carousel__indicator.is-active button) {
  background-color: #409eff;
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
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s;
}

.notice-title:hover {
  color: #409eff;
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

/* 缩放调整 */
.content-section:nth-child(1) {
  transform: scale(0.8);
  transform-origin: top center;
  width: 125%;
  margin-top: -20px;
  margin-bottom: -20px;
}

.content-section:nth-child(2) {
  transform: scale(0.8);
  transform-origin: top center;
  width: 125%;
  margin: 0 auto;
  padding-top: -20px;
}

.content-section:nth-child(3) {
  transform: scale(0.8);
  transform-origin: top center;
  width: 125%;
  margin: 0 auto;
  padding-top: -20px;
}

/* 公告详情弹窗样式 */
.notice-detail {
  padding: 10px 0;
}

.detail-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.detail-date {
  color: #666;
  font-size: 14px;
}

.detail-content {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.detail-paragraph {
  margin-bottom: 16px;
  line-height: 1.8;
  text-align: justify;
  color: #333;
}

/* 响应式布局 */
@media (max-width: 992px) {
  .notice-row {
    grid-template-columns: 1fr;
  }
  
  .quick-nav-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .content-section:nth-child(1),
  .content-section:nth-child(2),
  .content-section:nth-child(3) {
    width: 100%;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .index-container {
    padding: 10px;
  }
  
  .quick-nav-card {
    padding: 20px;
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .nav-icon {
    width: 60px;
    height: 60px;
  }
  
  .nav-content h3 {
    font-size: 18px;
  }
  
  .nav-content p {
    font-size: 13px;
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
  
  .el-dialog {
    width: 90% !important;
  }
}
</style>