<script lang="ts" setup>
import { ref, onMounted, reactive, computed, watch, nextTick } from 'vue'
import { ChatLineSquare, StarFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox, ElEmpty, ElLoading } from 'element-plus'
import $api from '../axios'
import qs from 'qs'
import { useRouter, useRoute } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElRate } from 'element-plus'

/*** 图书详情页*/
interface Book {
  bookId: string;
  bookName: string;
  author: string;
  publisher: string;
  year: string;
  page: number;
  price: string;
  score: number;
  form: string;
  affix: string;
  isbn: string;
  content: string;
  coverUrl: string;
}

const router = useRouter()
const route = useRoute()
// 根据路由参数获取 bookId
const bookId = computed(() => route.params.bookId as string)

const dialogFormVisible = ref(false)

// 状态管理
const book = ref<Book>({} as Book);
const loading = ref(false);
const error = ref('');

// 获取图书详情
const fetchBookDetail = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await $api.get(`/recommendation/detail/${bookId.value}`);
    if (response.data.code === 200 && response.data.data) {
      book.value = response.data.data;
      form.bookName = book.value.bookName // 将书籍名称赋值给表单中的 book_name
      console.log('获取到的书籍数据:', book.value);
    } else {
      error.value = '未找到该图书信息';
      ElMessage.error(error.value);
    }
  } catch (err: any) {
    error.value = '获取图书详情失败，请稍后再试';
    console.error(err);
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

// 监听bookId变化，加载对应图书信息
watch(bookId, () => {
  fetchBookDetail();
});
// 页面加载时初始化
onMounted(() => {
  fetchBookDetail();
  getReviewsList(); // 新增：加载评价列表
});

/**评论功能------------------------------- */
const formRef = ref<FormInstance>()
const getUserInfo = () => {
  try {
    // 从 sessionStorage 中获取用户信息
    const userJson = sessionStorage.getItem('user');
    if (userJson) {
      // 解析 JSON 字符串为对象
      const userInfo = JSON.parse(userJson);
      return userInfo;
    }
    // 如果没有找到用户信息，返回 null
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};
// 当前登录用户ID
const currentReaderId = computed(() => {
  const userInfo = getUserInfo();
  return userInfo?.readerId || '';
});

const form = reactive({
  rating: 0, // 星星评分
  reviewContent: '', // 评语内容
  // 以下字段从已有信息中获取，提交时赋值
  readerId: '', // 需从当前用户登录信息获取，假设你有获取用户信息的方法，比如从 store 等
  readerLoginName: '', 
  bookId: bookId.value, 
  bookName: book.value.bookName
})
const rules = reactive<FormRules>({
  rating: [
    { required: true, message: '请进行星星评分', trigger: 'change' }
  ],
  reviewContent: [
    { required: true, message: '请填写评语内容', trigger: 'blur' }
  ]
})
const submitReview = async () => {
  console.log('提交书评触发') // 调试用
  console.log('表单实例:', formRef.value) // 检查表单实例是否存在
  await nextTick();
  // 获取用户信息
  const userInfo = getUserInfo()
  if (!userInfo) {
    ElMessage.error('请先登录')
    return
  }
  console.log('用户信息:', userInfo);
  // 设置用户信息
  form.readerId = userInfo.readerId
  form.readerLoginName = userInfo.readerLoginName
  
  console.log('表单数据:', form) // 检查表单数据
  try {
    await formRef.value?.validate() // 校验表单
    console.log('表单校验通过') // 校验通过时打印
    // 这里组装请求参数，根据后端接口要求调整
    const requestData = {
      review_id: '', // 若后端需要前端生成唯一标识，可自行实现生成逻辑，比如用 uuid 等；若后端自增，可传空或按后端要求
      bookId: form.bookId,
      bookName: form.bookName,
      readerId: form.readerId,
      readerLoginName: form.readerLoginName,
      rating: form.rating,
      reviewContent: form.reviewContent,
      // publish_time 和 last_modified_time 由数据库自动处理，无需前端传
      is_anonymous: '否' // 按需求，这里固定传 '否'，也可根据实际交互调整
    }
    const response = await $api.post('/review/add', requestData, {
      headers: {
        'Content-Type': 'application/json;charset=utf-8' // 强制 JSON 格式
      }
    }) // 假设后端有对应的提交接口
    if (response.data.code === 200) {
      ElMessage.success('书评提交成功')
      dialogFormVisible.value = false // 关闭弹窗
      form.rating = 0 // 重置评分
      form.reviewContent = '' // 重置评语
      getReviewsList(); 
    } else {
      ElMessage.error('书评提交失败，请稍后再试')
    }
  } catch (error: any) {
    console.error('表单校验或提交失败:', error)
    ElMessage.error('请按要求填写表单内容')
  }
}
// 在组件中添加以下代码
const openReviewDialog = () => {
  const userInfo = getUserInfo();
  if (!userInfo) {
    ElMessage.error('请先登录');
    return;
  }
  
  // 立即将用户信息绑定到表单
  form.readerId = userInfo.readerId;
  form.readerLoginName = userInfo.readerLoginName;
  
  dialogFormVisible.value = true;
};
const handleClose = () => {
  dialogFormVisible.value = false;
  resetForm();
};
// 重置表单数据
const resetForm = () => {
  form.rating = 0; // 清空星星评分
  form.reviewContent = ''; // 清空评价内容
}
/**评论列表------------------------------- */
const reviews = ref<Array<any>>([]); // 存储评价列表数据
const reviewsLoading = ref(false); // 评价列表加载状态
// 获取当前图书的评价列表
const getReviewsList = async () => {
  reviewsLoading.value = true;
  try {
    const response = await $api.get('/review/list', {
      params: { bookId: bookId.value } // 传递当前图书ID
    });
    if (response.data.code === 200) {
      reviews.value = response.data.data; // 存储评价数据
    } else {
      reviews.value = []; // 无评价时置空
    }
  } catch (error) {
    console.error('获取评价列表失败:', error);
    reviews.value = [];
  } finally {
    reviewsLoading.value = false;
  }
};
// 时间格式化工具函数
const formatTime = (timeString: string) => {
  if (!timeString) return '';
  const date = new Date(timeString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 删除评论功能
const handleDeleteReview = async (reviewId: string, index: number) => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      '确定要删除这条评论吗？此操作不可撤销。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 显示加载状态
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '删除中...',
      background: 'rgba(0, 0, 0, 0.1)',
    });
    
    // 获取当前用户ID
    const userInfo = getUserInfo();
    if (!userInfo) {
      ElMessage.error('请先登录');
      loadingInstance.close();
      return;
    }
    console.log('删除请求参数：', {
      reviewId: reviewId, // 检查是否为空或格式错误
      readerId: userInfo?.readerId // 检查是否存在（不为空）
    });
    
    // 调用删除API
    const response = await $api.delete(`/review/deleteMy/${reviewId}`, {
      params: { readerId: userInfo.readerId }
    });
    
    // 关闭加载状态
    loadingInstance.close();
    
    if (response.data.code === 200) {
      // 从本地列表中移除评论
      reviews.value.splice(index, 1);
      ElMessage.success('评论删除成功');
    } else {
      ElMessage.error(response.data.msg || '删除评论失败');
    }
  } catch (error: any) {
    // 取消删除
    if (error.name === 'Cancel') {
      ElMessage.info('已取消删除');
    } else {
      ElMessage.error('删除评论失败，请稍后再试');
      console.error('删除评论错误:', error);
    }
  }
};

// 新增收藏功能
const collectBook = async () => {
  const userInfo = getUserInfo();
  if (!userInfo) {
    ElMessage.error('请先登录');
    return;
  }
  try {
    const requestData = {
      bookId: bookId.value,
      readerId: userInfo.readerId
    };
    console.log('收藏请求参数:', requestData);
    const response = await $api.post('/collect/add', null, { params: requestData });
    if (response.data.code === 200) {
      ElMessage.success('收藏成功');
    } else {
      ElMessage.error('收藏失败，请稍后再试');
    }
  } catch (error) {
    console.error('收藏失败:', error);
    ElMessage.error('收藏失败，请稍后再试');
  }
};

// 返回上一界面方法
const handleBack = () => {
  router.back();
};

</script>

<template>
  <!-- 页头返回区域 -->
  <div class="header-bar">
    <div class="back-area" @click="handleBack">
      <i class="el-icon-arrow-left"></i>
      <span>返回</span>
    </div>
    <div class="title-sep">|</div>
    <div class="main-title">{{ book.bookName }}</div>
  </div>

  <div class="detail">
    <h2 class="title">{{ book.bookName }}</h2>
    <div class="intro">
      <el-container>
        <el-aside width="200px">
          <img :src="book.coverUrl" 
               alt="book cover" 
               class="book-cover"
          >
        </el-aside>
        <el-main class="book_info">
          <p><span class="label">作者:</span> {{ book.author }}</p>
          <p><span class="label">出版社:</span> {{ book.publisher }}</p>
          <p><span class="label">出版年:</span> {{ book.year }}</p>
          <p><span class="label">页数:</span> {{ book.page }}</p>
          <p><span class="label">定价:</span> {{ book.price }}</p>
          <p><span class="label">装帧:</span> {{ book.form }}</p>
          <p><span class="label">丛书:</span> {{ book.affix }}</p>
          <p><span class="label">ISBN:</span> {{ book.isbn }}</p>
        </el-main>
      </el-container>
    </div>
    <div class="content">
      <p style="color: #107722;">内容简介· · · · · ·</p>
      <div class="text" v-html="book.content"></div>
    </div>
    <div class="comment">
      <p style="color: #107722;">读者心得· · · · · ·</p>
      <el-button plain @click="openReviewDialog" class="no-border-btn">
        <el-icon><ChatLineSquare /></el-icon>写书评
      </el-button>
      <!-- 新增收藏按钮 -->
      <el-button plain @click="collectBook" class="no-border-btn">
        <el-icon><StarFilled /></el-icon>收藏
      </el-button>
      <!-- 评价列表展示 -->
      <div class="reviews-list" v-if="!reviewsLoading">
        <!-- 无评价时显示 -->
        <el-empty v-if="reviews.length === 0" description="暂无评价"></el-empty>
        
        <!-- 有评价时循环渲染 -->
        <div class="review-item" v-for="(item, index) in reviews" :key="index">
          <div class="review-header">
            <span class="review-username">{{ item.readerLoginName }}</span>
            <el-rate 
              v-model="item.rating" 
              :max="5" 
              :allow-half="true" 
              disabled 
              class="review-rating"
            ></el-rate>
            <span class="review-time">{{ formatTime(item.publishTime) }}</span>
            <!-- 删除按钮 -->
            <el-button 
              v-if="item.readerId === currentReaderId" 
              type="text" 
              size="small" 
              class="review-delete"
              @click="handleDeleteReview(item.reviewId, index)"
            >删除</el-button>
          </div>
          <div class="review-content">{{ item.reviewContent }}</div>
        </div>
      </div>

      <!-- 加载状态 -->
      <el-loading v-if="reviewsLoading" text="加载评价中..."></el-loading>
      <!-- 书评表单弹窗 -->
      <el-dialog v-model="dialogFormVisible" title="写书评">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="星星评分" prop="rating">
            <el-rate v-model="form.rating" :max="5" :allow-half="true"></el-rate>
          </el-form-item>
          <el-form-item label="评语内容" prop="review_content">
            <el-input type="textarea" v-model="form.reviewContent" @input="console.log('输入内容:', form.reviewContent)"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitReview">提交</el-button>
            <el-button @click="handleClose">取消</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped>
/* 页头样式 */
.header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
}
.back-area {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.3s ease;
}
.back-area:hover {
  color: #409eff;
}
.back-area i {
  margin-right: 6px;
  font-size: 18px;
}
.title-sep {
  margin: 0 10px;
  color: #999;
}
.main-title {
  font-weight: bold;
  font-size: 18px;
}
  /* 外层容器：强化居中与呼吸感 */
.detail {
  max-width: 950px; /* 适度加宽，适配内容 */
  margin: 40px auto; /* 上下间距更舒展 */
  padding: 30px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05); /* 柔和阴影，提升层次 */
  border-radius: 8px; /* 圆角更优雅 */
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif; /* 更适配中文的字体 */
  color: #333;
}

/* 标题：强化视觉焦点 */
.title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 20px 0;
  line-height: 1.4;
  border-left: 6px solid #d43c33; /* 豆瓣风标题标识 */
  padding-left: 10px;
  margin-top: 10px;
}

/* 封面与信息布局：重构弹性排版 */
.intro {
  display: flex;
  gap: 30px; /* 替代 margin，更简洁 */
  align-items: flex-start; /* 避免封面拉伸 */
  margin-bottom: 30px;
}

/* 封面样式：精致化 */
.book-cover {
  width: 180px; 
  height: auto; 
  border: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
  object-fit: contain;
  margin-top: 30px; /* 这里的数值可以根据需要调整，让封面向下移动合适的距离 */
}

/* 书籍信息：排版优化 */
.book_info {
  flex: 1;
  line-height: 2.2;
  color: #666;
}

/* 信息标签：强化区分度 */
.label {
  color: #999;
  display: inline-block;
  width: 60px; /* 固定宽度，对齐更整齐 */
  text-align: left;
  margin-right: 8px;
}

/* 内容简介：段落优化 */
.content {
  margin-bottom: 30px;
  border-top: 1px solid #f5f5f5;
  padding-top: 20px;
}

/* 简介标题：小清新风格 */
.content p:first-child {
  color: #107722;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  position: relative;
  padding-left: 12px;
}

/* 简介标题装饰（可选，更贴近豆瓣） */
.content p:first-child::before {
  content: " ";
  width: 3px;
  height: 14px;
  background: #107722;
  position: absolute;
  left: 0;
  top: 4px;
}

/* 简介文本：排版优化 */
.text {
  color: #555;
  text-indent: 2em;
  line-height: 1.7;
  margin-bottom: 16px;
  white-space: pre-line; /* 保留换行 */
}
/* 隐藏按钮边框 */
.no-border-btn {
  
  border: none !important; /* !important 确保覆盖 Element Plus 默认样式 */

}


/* 评论区：模块区分 */
.comment {
  border-top: 1px solid #f5f5f5;
  padding-top: 20px;
}

/* 评论区标题：与简介标题统一 */
.comment p:first-child {
  color: #107722;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  position: relative;
  padding-left: 12px;
}

/* 评论区标题装饰 */
.comment p:first-child::before {
  content: " ";
  width: 3px;
  height: 14px;
  background: #107722;
  position: absolute;
  left: 0;
  top: 4px;
}

/* 按钮组：间距优化 */
.comment .el-button {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* 评价列表：强化分隔 */
.reviews-list {
  margin-top: 20px;
}

.review-item {
  padding: 20px 0;
  border-bottom: 1px dashed #eee;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  justify-content: space-between; /* 调整布局 */
}

/* 用户名：更突出 */
.review-username {
  font-weight: 600;
  color: #333;
}

/* 评分：颜色强化 */
.review-rating {
  color: #f90;
  margin: 0 10px;
}

/* 时间：弱化处理 */
.review-time {
  color: #bbb;
  font-size: 12px;
}

/* 删除按钮： hover 优化 */
.review-delete {
  color: #f44;
}
.review-delete:hover {
  color: #d43c33;
}

/* 评价内容：排版优化 */
.review-content {
  color: #555;
  line-height: 1.6;
  background: #fafafa;
  padding: 10px 15px;
  border-radius: 4px;
  margin-top: 5px;
}

/* 弹窗表单：样式适配 */
.el-dialog {
  width: 500px;
}
.el-dialog__title {
  font-size: 18px;
  font-weight: 600;
}
.el-form-item {
  margin-bottom: 20px;
}
.el-textarea {
  width: 100%;
}
</style>