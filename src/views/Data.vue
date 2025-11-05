<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { 
  RefreshRight, Download, ArrowUp, ArrowDown, 
  UserFilled, Message, Star, WarningFilled,
  RefreshLeft,Document
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import $api from '../axios'
import dayjs from 'dayjs'

// 定义类型接口
interface Reader {
  readerId: string
  readerName: string
  readerGender: '男' | '女'  // 仅保留男女两种性别
  readerDate: string
  [key: string]: any
}

interface Book {
  bookId: string
  bookName: string
  category: string
  storageDate: string
  quantity: number  // 新增库存数量字段
  [key: string]: any
}

interface Borrow {
  borrowId: string
  bookId: string
  bookName: string
  readerId: string
  readerName: string
  borrowDate: string
  dueDate: string
  [key: string]: any
}

interface Violation {
  violationId: string
  violationType: string
  [key: string]: any
}

// 原始数据存储
const bookData = ref<Book[]>([])
const readerData = ref<Reader[]>([])
const borrowData = ref<Borrow[]>([])
const returnData = ref<any[]>([])
const violationData = ref<Violation[]>([])
const noticeData = ref<any[]>([])
const reviewData = ref<any[]>([])

// 统计数据
const totalReaders = ref('0')
const totalBooks = ref('0')  // 现在表示库存总量
const totalNotices = ref('0')
const totalReviews = ref('0')
const totalViolations = ref('0')
const currentBorrows = ref('0')

// 趋势数据
const readersChange = ref(0)
const booksChange = ref(0)
const noticesChange = ref(0)
const reviewsChange = ref(0)
const violationsChange = ref(0)
const borrowsChange = ref(0)

// 趋势样式
const readersChangeClass = ref('increase')
const readersChangeIcon = ref(ArrowUp)
const booksChangeClass = ref('increase')
const booksChangeIcon = ref(ArrowUp)
const noticesChangeClass = ref('increase')
const noticesChangeIcon = ref(ArrowUp)
const reviewsChangeClass = ref('increase')
const reviewsChangeIcon = ref(ArrowUp)
const violationsChangeClass = ref('increase')
const violationsChangeIcon = ref(ArrowUp)
const borrowsChangeClass = ref('increase')
const borrowsChangeIcon = ref(ArrowUp)

// 图表实例
const bookCategoryChart = ref<HTMLElement | null>(null)
const readerGenderChart = ref<HTMLElement | null>(null)
const borrowingTrendChart = ref<HTMLElement | null>(null)
const popularBooksChart = ref<HTMLElement | null>(null)
const violationTypeChart = ref<HTMLElement | null>(null)

// 最近借阅记录
const recentBorrows = ref<Array<{
  bookId: string
  bookName: string
  category: string
  readerId: string
  readerName: string
  borrowDate: string
  dueDate: string
}>>([])

// 从各模块API获取数据
const fetchAllData = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: '正在加载数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 并行请求所有模块数据
    const [
      booksRes, 
      readersRes, 
      borrowsRes, 
      returnsRes,
      violationsRes,
      noticesRes,
      reviewsRes
    ] = await Promise.all([
      $api.get('/book/page', { params: { currentPage: 1, size: 10000 } }),
      $api.get('/reader/page', { params: { currentPage: 1, size: 10000 } }),
      $api.get('/borrow/page', { params: { currentPage: 1, size: 10000 } }),
      $api.get('/return/page', { params: { currentPage: 1, size: 10000 } }),
      $api.get('/violation/page', { params: { currentPage: 1, size: 10000 } }),
      $api.get('/notice/page', { params: { currentPage: 1, size: 10000 } }),
      $api.get('/review/page', { params: { currentPage: 1, size: 10000 } })
    ])

    // 存储原始数据
    bookData.value = booksRes.data.data?.rows as Book[]
    readerData.value = readersRes.data.data?.records as Reader[]
    borrowData.value = borrowsRes.data.data?.records as Borrow[]
    returnData.value = returnsRes.data.data?.rows || []
    violationData.value = violationsRes.data.data?.rows as Violation[]
    noticeData.value = noticesRes.data.data?.rows || []
    reviewData.value = reviewsRes.data.data?.rows || []

    // 处理统计数据
    processStatistics()
    
    // 处理图表数据
    initCharts()
    
    // 处理最近借阅记录
    processRecentBorrows()
    
    // 计算趋势变化
    calculateTrends()
    
    // 设置趋势样式
    setTrendStyles()

  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败，请稍后重试')
  } finally {
    loading.close()
  }
}

// 处理统计数据
const processStatistics = () => {
  // 读者总数
  totalReaders.value = readerData.value.length.toLocaleString()
  
  // 图书总数 - 修改为计算所有图书的库存总和
  const totalQuantity = bookData.value.reduce((sum, book) => {
    return sum + (book.quantity || 0)
  }, 0)
  totalBooks.value = totalQuantity.toLocaleString()
  
  // 公告总数
  totalNotices.value = noticeData.value.length.toLocaleString()
  
  // 评价总数
  totalReviews.value = reviewData.value.length.toLocaleString()
  
  // 违规记录总数
  totalViolations.value = violationData.value.length.toLocaleString()
  
  // 当前借阅数
  const returnedIds = returnData.value.map(item => item.borrowId)
  const currentBorrowCount = borrowData.value.filter(
    item => !returnedIds.includes(item.borrowId)
  ).length
  currentBorrows.value = currentBorrowCount.toLocaleString()
}

// 处理最近借阅记录
const processRecentBorrows = () => {
  // 关联图书分类信息
  const bookMap = bookData.value.reduce((map, book) => {
    map.set(book.bookId, book)
    return map
  }, new Map<string, Book>())
  
  // 按借阅日期排序，取最近5条
  recentBorrows.value = [...borrowData.value]
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
    .slice(0, 5)
    .map(borrow => ({
      ...borrow,
      category: bookMap.get(borrow.bookId)?.category || '未知'
    }))
}

// 计算趋势变化
const calculateTrends = () => {
  // 计算本月与上月数据的变化率
  const currentMonth = dayjs().month()
  const lastMonth = (currentMonth - 1 + 12) % 12
  
  // 读者变化率
  const currentMonthReaders = readerData.value.filter(item => 
    dayjs(item.readerDate).month() === currentMonth
  ).length
  const lastMonthReaders = readerData.value.filter(item => 
    dayjs(item.readerDate).month() === lastMonth
  ).length
  readersChange.value = calculatePercentageChange(lastMonthReaders, currentMonthReaders)
  
  // 图书变化率 - 改为按库存总量变化计算
  const currentMonthBooksQuantity = bookData.value
    .filter(item => dayjs(item.storageDate).month() === currentMonth)
    .reduce((sum, book) => sum + (book.quantity || 0), 0)
    
  const lastMonthBooksQuantity = bookData.value
    .filter(item => dayjs(item.storageDate).month() === lastMonth)
    .reduce((sum, book) => sum + (book.quantity || 0), 0)
    
  booksChange.value = calculatePercentageChange(lastMonthBooksQuantity, currentMonthBooksQuantity)
}

// 计算百分比变化
const calculatePercentageChange = (previous: number, current: number) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// 设置趋势样式
const setTrendStyles = () => {
  setTrend(readersChange, readersChangeClass, readersChangeIcon)
  setTrend(booksChange, booksChangeClass, booksChangeIcon)
  setTrend(noticesChange, noticesChangeClass, noticesChangeIcon)
  setTrend(reviewsChange, reviewsChangeClass, reviewsChangeIcon)
  setTrend(violationsChange, violationsChangeClass, violationsChangeIcon)
  setTrend(borrowsChange, borrowsChangeClass, borrowsChangeIcon)
}

// 趋势设置辅助函数
const setTrend = (value: any, classRef: any, iconRef: any) => {
  if (value.value >= 0) {
    classRef.value = 'increase'
    iconRef.value = ArrowUp
  } else {
    classRef.value = 'decrease'
    iconRef.value = ArrowDown
  }
}

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    // 图书种类占比饼图
    initBookCategoryChart()
    
    // 读者性别分布饼图
    initReaderGenderChart()
    
    // 借阅趋势分析
    initBorrowingTrendChart()
    
    // 热门图书TOP5
    initPopularBooksChart()
    
    // 违规类型分布
    initViolationTypeChart()
  })
}

// 图书种类占比图表 - 修改为按库存数量统计
const initBookCategoryChart = () => {
  // 从图书数据统计分类的库存总量占比
  const categoryMap: Record<string, number> = {}
  bookData.value.forEach(book => {
    const category = book.category || '其他'
    // 累加每个分类的库存数量
    categoryMap[category] = (categoryMap[category] || 0) + (book.quantity || 0)
  })
  
  const chartData = Object.entries(categoryMap).map(([name, value]) => ({
    name, value
  }))
  
  const instance = echarts.init(bookCategoryChart.value as HTMLElement)
  instance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: chartData.map(item => item.name)
    },
    series: [{
      name: '图书种类',
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      data: chartData
    }]
  })
}

// 读者性别分布图表 - 仅保留男女两种
const initReaderGenderChart = () => {
  // 性别映射仅包含男女
  const genderMap: { '男': number; '女': number } = { 
    '男': 0, 
    '女': 0 
  }
  
  readerData.value.forEach(reader => {
    // 确保性别只能是男或女，默认归类为女
    const gender = reader.readerGender === '男' ? '男' : '女'
    genderMap[gender]++
  })
  
  const chartData = [
    { name: '男', value: genderMap['男'] },
    { name: '女', value: genderMap['女'] }
  ]
  
  const instance = echarts.init(readerGenderChart.value as HTMLElement)
  instance.setOption({
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [{
      name: '性别分布',
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      data: chartData
    }]
  })
}

// 借阅趋势分析图表
const initBorrowingTrendChart = () => {
  // 按月份统计借阅量
  const months = Array.from({ length: 12 }, (_, i) => {
    return dayjs().month(i).format('MM月')
  })
  
  const borrowCounts = Array(12).fill(0)
  
  // 统计各月借阅量
  borrowData.value.forEach(borrow => {
    const month = dayjs(borrow.borrowDate).month()
    borrowCounts[month]++
  })
  
  const instance = echarts.init(borrowingTrendChart.value as HTMLElement)
  instance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['借阅量'], top: 0 },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: { type: 'value' },
    series: [{
      name: '借阅量',
      type: 'line',
      data: borrowCounts,
      smooth: true,
      lineStyle: { width: 3 }
    }]
  })
}

// 热门图书TOP5图表 - 优化配置确保书名显示完整
const initPopularBooksChart = () => {
  // 统计图书借阅次数
  const bookBorrowMap = new Map<string, {name: string, count: number}>()
  
  borrowData.value.forEach(borrow => {
    if (!bookBorrowMap.has(borrow.bookId)) {
      bookBorrowMap.set(borrow.bookId, { 
        name: borrow.bookName || `未知图书(${borrow.bookId})`, 
        count: 0 
      })
    }
    const bookData = bookBorrowMap.get(borrow.bookId)
    if (bookData) {
      bookData.count++
    }
  })
  
  // 获取TOP5热门图书
  const topBooks = Array.from(bookBorrowMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  const instance = echarts.init(popularBooksChart.value as HTMLElement)
  instance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: topBooks.map(book => book.name),
      inverse: true,
      axisLabel: {
        interval: 0,
        formatter: function(value: string) {
          // 自动换行处理长书名，增加每行显示字数
          const maxLength = 10;
          if (value.length > maxLength) {
            let result = '';
            for (let i = 0; i < value.length; i += maxLength) {
              result += value.slice(i, i + maxLength) + '\n';
            }
            return result;
          }
          return value;
        },
        // 增加字体大小以提高可读性
        fontSize: 12
      },
      // 增加Y轴间距
      axisLine: {
        lineStyle: {
          width: 0
        }
      },
      axisTick: {
        show: false
      }
    },
    series: [{
      name: '借阅次数',
      type: 'bar',
      data: topBooks.map(book => book.count),
      itemStyle: { borderRadius: [0, 4, 4, 0] }
    }],
    // 增加图表内边距
    grid: {
      left: '15%',
      right: '5%',
      top: '5%',
      bottom: '5%',
      containLabel: true
    }
  })
}

// 违规类型分布图表
const initViolationTypeChart = () => {
  // 统计违规类型
  const violationTypeMap = new Map<string, number>()
  
  violationData.value.forEach(violation => {
    const type = violation.violationType || '其他'
    violationTypeMap.set(type, (violationTypeMap.get(type) || 0) + 1)
  })
  
  const chartData = Array.from(violationTypeMap.entries()).map(([name, value]) => ({
    name, value
  }))
  
  const instance = echarts.init(violationTypeChart.value as HTMLElement)
  instance.setOption({
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [{
      name: '违规类型',
      type: 'pie',
      radius: ['40%', '70%'],
      data: chartData
    }]
  })
}

// 刷新数据
const refreshData = () => {
  fetchAllData()
}

// 导出报告
const exportReport = () => {
  ElMessage.success('报告导出成功')
  // 实际项目中实现导出功能
}

// 页面加载时初始化
onMounted(() => {
  fetchAllData()
})
</script>

<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>图书馆数据总览</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><RefreshRight /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>
    
    <!-- 核心统计卡片区域 -->
    <div class="stats-card-container">
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon bg-blue">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">读者总数</div>
            <div class="stat-value">{{ totalReaders }}</div>
            <div class="stat-change" :class="readersChangeClass">
              <el-icon :is="readersChangeIcon"></el-icon>
              {{ readersChange.toFixed(1) }}% 较上月
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon bg-green">
            <el-icon><Document/></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">图书总库存</div> <!-- 修改标签为图书总库存 -->
            <div class="stat-value">{{ totalBooks }}</div>
            <div class="stat-change" :class="booksChangeClass">
              <el-icon :is="booksChangeIcon"></el-icon>
              {{ booksChange.toFixed(1) }}% 较上月
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon bg-purple">
            <el-icon><Message /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">公告总数</div>
            <div class="stat-value">{{ totalNotices }}</div>
            <div class="stat-change" :class="noticesChangeClass">
              <el-icon :is="noticesChangeIcon"></el-icon>
              {{ noticesChange.toFixed(1) }}% 较上月
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon bg-orange">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">评价总数</div>
            <div class="stat-value">{{ totalReviews }}</div>
            <div class="stat-change" :class="reviewsChangeClass">
              <el-icon :is="reviewsChangeIcon"></el-icon>
              {{ reviewsChange.toFixed(1) }}% 较上月
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon bg-red">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">违规记录</div>
            <div class="stat-value">{{ totalViolations }}</div>
            <div class="stat-change" :class="violationsChangeClass">
              <el-icon :is="violationsChangeIcon"></el-icon>
              {{ violationsChange.toFixed(1) }}% 较上月
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon bg-teal">
            <el-icon><RefreshLeft /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">当前借阅</div>
            <div class="stat-value">{{ currentBorrows }}</div>
            <div class="stat-change" :class="borrowsChangeClass">
              <el-icon :is="borrowsChangeIcon"></el-icon>
              {{ borrowsChange.toFixed(1) }}% 较上月
            </div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域第一行 - 图书种类和读者性别各占50% -->
    <div class="charts-row first-row">
      <el-card class="chart-card category-chart">
        <div slot="header">图书种类库存占比</div> <!-- 修改标题为图书种类库存占比 -->
        <div class="chart-container">
          <div ref="bookCategoryChart" class="chart" />
        </div>
      </el-card>
      
      <el-card class="chart-card gender-chart">
        <div slot="header">读者性别分布</div>
        <div class="chart-container">
          <div ref="readerGenderChart" class="chart" />
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域第二行 -->
    <div class="charts-row second-row">
      <el-card class="chart-card trend-chart">
        <div slot="header">借阅趋势分析</div>
        <div class="chart-container">
          <div ref="borrowingTrendChart" class="chart" />
        </div>
      </el-card>
      
      <el-card class="chart-card top5-chart">
        <div slot="header">热门图书TOP5</div>
        <div class="chart-container">
          <div ref="popularBooksChart" class="chart" />
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域第三行 -->
    <div class="charts-row">
      <el-card class="chart-card">
        <div slot="header">违规类型分布</div>
        <div class="chart-container">
          <div ref="violationTypeChart" class="chart" />
        </div>
      </el-card>
      
      <el-card class="chart-card wide-card">
        <div slot="header">最近借阅记录</div>
        <div class="chart-container">
          <el-table :data="recentBorrows" border size="small">
            <el-table-column prop="bookId" label="图书ID" width="100" />
            <el-table-column prop="bookName" label="图书名称" width="200" />
            <el-table-column prop="category" label="类别" width="100" />
            <el-table-column prop="readerId" label="读者ID" width="100" />
            <el-table-column prop="readerName" label="读者姓名" width="120" />
            <el-table-column prop="borrowDate" label="借阅日期" width="140" />
            <el-table-column prop="dueDate" label="应还日期" width="140" />
          </el-table>
        </div>
      </el-card>
    </div>

  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f9fbfd;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #1f2329;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-card-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.stat-item {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.bg-blue { background-color: #4096ff; }
.bg-green { background-color: #52c41a; }
.bg-purple { background-color: #722ed1; }
.bg-orange { background-color: #fa8c16; }
.bg-red { background-color: #f5222d; }
.bg-teal { background-color: #13c2c2; }

.stat-info {
  flex: 1;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 5px;
}

.stat-change {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.increase { color: #52c41a; }
.decrease { color: #f5222d; }

.charts-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

/* 第一行图表设置为两个占满整行宽度 */
.first-row {
  grid-template-columns: 1fr 1fr;
  width: 100%;
  margin: 0 auto 20px;
}

.category-chart, .gender-chart {
  width: 100%;
  margin: 0;
}

/* 第二行图表调整 - 借阅趋势分析变窄，热门图书TOP5变宽 */
.second-row {
  grid-template-columns: 1.2fr 1fr;
}

.trend-chart {
  margin-right: 10px;
}

.trend-chart .chart {
  min-height: 280px;
}

/* 热门图书TOP5图表调整，确保书名显示完整 */
.top5-chart {
  margin-left: 10px;
}

.top5-chart .chart {
  min-height: 280px;
}

.chart-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.chart-container {
  flex: 1;
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.wide-card {
  grid-column: span 2;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .charts-row { grid-template-columns: repeat(2, 1fr); }
  .first-row { grid-template-columns: 1fr 1fr; }
  .second-row { grid-template-columns: 1.2fr 1fr; }
  .wide-card { grid-column: span 2; }
}

@media (max-width: 900px) {
  .stats-card-container { grid-template-columns: repeat(2, 1fr); }
  .charts-row, .first-row, .second-row { grid-template-columns: 1fr; }
  .wide-card { grid-column: span 1; }
  .trend-chart, .top5-chart {
    margin: 0;
  }
}

@media (max-width: 600px) {
  .stats-card-container { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 15px; }
  .header-actions { width: 100%; justify-content: space-between; }
}
</style>