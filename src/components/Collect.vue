<template>
  <div class="collect-container">
    <!-- 页面标题区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">我的收藏</h1>
        <p class="hero-subtitle">珍藏您喜爱的图书</p>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-card">
        <div class="search-content">
          <div class="search-wrapper">
            <el-input
              v-model="name"
              placeholder="搜索收藏的图书..."
              class="search-input"
              :prefix-icon="Search"
              clearable
              @keyup.enter="load"
            />
          </div>
          <div class="search-buttons">
            <el-button type="primary" @click="load" class="search-btn">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="reset" class="reset-btn">重置</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧收藏区域 -->
      <div class="content-left">
        <div class="books-section">
          <div class="books-grid">
            <div
              v-for="(item, index) in items"
              :key="item.id || index"
              class="book-card"
            >
              <div class="book-image-wrapper">
                <img
                  :src="item.coverUrl || 'https://picsum.photos/300/400'"
                  :alt="item.bookName || '图书封面'"
                  class="book-image"
                />
                <div class="book-overlay">
                  <el-icon class="overlay-icon">
                    <Search />
                  </el-icon>
                </div>
              </div>

              <div class="book-content">
                <h3 class="book-title">{{ item.bookName || '未知书名' }}</h3>
                <p class="book-author">{{ item.author || '未知作者' }}</p>

                <div class="book-actions">
                  <el-popconfirm
                    title="确定要取消收藏这本书吗？"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="cancel(item.bookId)"
                    width="200"
                  >
                    <template #reference>
                      <el-button type="danger" class="uncollect-btn">
                        <el-icon><Back /></el-icon>
                        取消收藏
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </div>
          </div>

          <div v-if="items.length === 0" class="empty-state">
            <el-empty v-if="items.length === 0" description="暂无收藏的图书"></el-empty>
          </div>

          <div v-if="items.length > 0" class="pagination-section">
            <el-pagination
              v-model:current-page="pageNum"
              v-model:page-size="pageSize"
              :page-sizes="[8, 16, 24, 32]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              class="modern-pagination"
            />
          </div>
        </div>
      </div>

      <!-- 右侧推荐区域 -->
      <div class="content-right">
        <div class="recommend-section" :class="{ 'empty-recommend': recommendations.length === 0 }">
          <div class="section-header">
            <h2 class="section-title">为您推荐</h2>
            <p class="section-subtitle">根据收藏精选</p>
          </div>

          <!-- 纵向轮播组件 -->
          <el-carousel
            :interval="5000"
            direction="vertical"
            :height="recommendations.length === 0 ? 'auto' : '500px'"
            class="recommend-carousel"
          >
            <el-carousel-item v-for="(item, index) in recommendations" :key="item.id || index">
              <div class="carousel-item-inner">
                <div class="book-card" >
                  <div class="book-image-wrapper">
                    <img
                      :src="item.coverUrl || 'https://picsum.photos/300/400?random=' + index"
                      :alt="item.bookName || '推荐图书封面'"
                      class="book-image"
                    />
                    <div class="book-overlay">
                      <el-icon class="overlay-icon"><Search /></el-icon>
                    </div>
                  </div>

                  <div class="book-content">
                    <h3 class="book-title">{{ item.bookName || '未知书名' }}</h3>
                    <p class="book-author">{{ item.author || '未知作者' }}</p>

                    <div class="book-actions">
                      <el-button 
                        :type="item.isCollected ? 'danger' : 'primary'" 
                        :class="{'uncollect-btn': item.isCollected, 'collect-btn': !item.isCollected}"
                        @click.stop="item.isCollected ? cancel(item.bookId) : collect(item.bookId)"
                      >
                        <el-icon><component :is="item.isCollected ? Back : Star" /></el-icon>
                        {{ item.isCollected ? '取消收藏' : '收藏' }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-carousel-item>
          
          <!-- 轮播空状态 -->
          <div v-if="recommendations.length === 0" class="empty-state recommend-empty">
            <el-empty description="暂无推荐图书"></el-empty>
          </div>
          </el-carousel>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Back, Star } from '@element-plus/icons-vue'
import $api from '../axios'
import { useRouter } from 'vue-router'

const router = useRouter()
// 在script中添加辅助函数
const checkCollected = (bookId: string) => {
  return items.value.some(item => item.bookId === bookId);
};

// 获取用户信息
const getUserInfo = () => {
  try {
    const userJson = sessionStorage.getItem('user')
    return userJson ? JSON.parse(userJson) : null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

// 当前用户ID
const currentReaderId = computed(() => {
  const userInfo = getUserInfo()
  return userInfo?.readerId || ''
})

// 收藏列表数据
const items = ref<any[]>([])
const name = ref('')
const pageNum = ref(1)
const pageSize = ref(8)
const total = ref(0)
const loading = ref(false)

// 推荐列表数据
const recommendations = ref<any[]>([])

// 修改 load 函数（加载收藏列表）
const load = async () => {
  const userInfo = getUserInfo();
  if (!userInfo) {
    ElMessage.error('请先登录');
    return;
  }
  
  loading.value = true;
  try {
    const response = await $api.get("/collect/list", {
      params: {
        readerId: userInfo.readerId,
        name: name.value,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      }
    });
    
    if (response.data.code === 200) {
      let originData = response.data.data || [];
      if (name.value) {
        originData = originData.filter((item: any) => 
          item.bookName?.includes(name.value)
        );
      }
      items.value = originData;
      total.value = originData.length;
    } else {
      ElMessage.error(response.data.msg || '获取收藏列表失败');
    }
  } catch (error) {
    console.error('加载收藏数据失败:', error);
    ElMessage.error('加载收藏数据失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 加载推荐列表
const loadRecommendations = async () => {
  const userInfo = getUserInfo();
  if (!userInfo) return;
  
  try {
    const response = await $api.get("/collect/gain", {
      params: { readerId: userInfo.readerId }
    });
    
    if (response.data.code === 200) {
      recommendations.value = (response.data.data || []).map((book: any) => ({
        ...book,
        isCollected: checkCollected(book.bookId)
      }));
    } else {
      console.error("推荐接口错误:", response.data.msg);
      ElMessage.warning('获取推荐图书失败');
    }
  } catch (error) {
    console.error('加载推荐图书失败:', error);
    ElMessage.warning('获取推荐图书失败');
  }
};

// 分页处理
const handleSizeChange = (size: number) => {
  pageNum.value = 1
  pageSize.value = size
  load()
}

const handleCurrentChange = (current: number) => {
  pageNum.value = current
  load()
}

// 取消收藏
const cancel = async (id: string) => {
  try {
    const response = await $api.delete(`/collect/delete`,{
      params:{ readerId: currentReaderId.value, bookId: id }
    })
    if (response.data.code === 200) {
      ElMessage.success('取消收藏成功')
      recommendations.value = recommendations.value.map(item => {
        if (item.bookId === id) {
          return { ...item, isCollected: false };
        }
        return item;
      });
      load()
    } else {
      ElMessage.error('取消收藏失败，请稍后重试')
    }
  } catch (error) {
    console.error('取消收藏失败:', error)
    ElMessage.error('取消收藏失败，请稍后重试')
  }
}

// 收藏功能
const collect = async (id: string) => {
  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.readerId) {
    ElMessage.error('请先登录');
    return;
  }
  try {
    const response = await $api.post(
      `/collect/add?readerId=${userInfo.readerId}&bookId=${id}`
    );
    if (response.data.code === 200) {
      ElMessage.success('收藏成功');
      recommendations.value = recommendations.value.map(item => {
        if (item.bookId === id) {
          return { ...item, isCollected: true };
        }
        return item;
      });
      load();
    } else {
      ElMessage.error(response.data.msg || '收藏失败，请稍后重试');
    }
  } catch (error) {
    console.error('收藏失败:', error);
    ElMessage.error('收藏失败，请稍后重试');
  }
};

// 重置搜索
const reset = () => {
  name.value = ''
  pageNum.value = 1
  load()
}

// 生命周期钩子
onMounted(() => {
  load();
  loadRecommendations();
})
</script>

<style scoped>
/* 整体样式缩小调整 */
.collect-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 15px;
  min-height: 100vh;
  background: #f8f9fa;
}

.hero-section {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 40px 30px;
  margin: 15px 0 25px 0;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 10px 0;
}

.hero-subtitle {
  font-size: 1rem;
  color: black;
  margin: 0;
  opacity: 0.9;
}

.search-section {
  margin-bottom: 25px;
}

.search-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.search-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-wrapper {
  flex: 1;
  max-width: 350px;
}

.search-input {
  border-radius: 12px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #e2e8f0;
  transition: all 0.3s ease;
}

.search-buttons {
  display: flex;
  gap: 10px;
}

.search-btn {
  background: #3498db;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.reset-btn {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.main-content {
  display: flex;
  gap: 25px;
  margin-bottom: 30px;
}

.content-left {
  flex: 1;
}

.content-right {
  width: 300px;
}

.books-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.book-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: fadeInUp 0.6s ease-out both;
  height: 380px;
  display: flex;
  flex-direction: column;
}

.book-image-wrapper {
  position: relative;
  height: 220px;
  overflow: hidden;
  cursor: pointer;
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.book-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(44, 62, 80, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.overlay-icon {
  font-size: 2rem;
  color: white;
}

.book-content {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 6px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  color: #718096;
  font-size: 0.85rem;
  margin: 0 0 15px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-actions {
  margin-top: auto;
}

.uncollect-btn {
  width: 100%;
  height: 36px;
  border-radius: 8px;
  font-weight: 600;
  background: #e74c3c;
  border: none;
  transition: all 0.3s ease;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 15px;
  text-align: center;
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding-top: 15px;
  border-top: 2px solid #f7fafc;
}

/* 右侧推荐区域样式调整 */
.recommend-section {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  width: 100%;
  transition: min-height 0.3s ease;
}

/* 推荐区域为空时的样式 */
.empty-recommend {
  min-height: auto;
  max-height: 500px;
}

.recommend-empty {
  
  padding: 30px 10px;
}

.section-header {
  text-align: center;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f7fafc;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 3px 0;
}

.section-subtitle {
  font-size: 0.85rem;
  color: #718096;
  margin: 0;
}

/* 轮播样式 */
.recommend-carousel {
  width: 100%;
  margin: 0 auto;
  
}

:deep(.el-carousel__container) {
  height: 390px !important;
}

:deep(.el-carousel__arrow) {
  background: rgba(255, 255, 255, 0.8);
  color: #3498db;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  opacity: 0.7;
}

.carousel-item-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 8px;
}

/* 推荐区域收藏按钮 */
.collect-btn {
  width: 100%;
  height: 36px;
  border-radius: 8px;
  font-weight: 600;
  background: #3498db;
  border: none;
  transition: all 0.3s ease;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>