<template>
  <div class="donate-container">
    <!-- 待捐赠图书列表 -->
    <div class="book-list">
      <h2>待捐赠图书</h2>
      <!-- 遍历过滤后的图书列表 -->
      <div 
        v-for="(book, index) in filteredBooksToDonate" 
        :key="index" 
        class="book-card"
      >
        <!-- 图书封面区域（模拟参考样式的封面位置） -->
        <div class="book-cover-wrap">
          <!-- 这里可根据实际需求添加封面，若有封面图可解注释下面的 img 标签 -->
           <img 
            class="book-cover" 
            :src="book.coverUrl" 
            alt="book cover" 
          > 
          <!-- 若有“已归还”等标签需求，可在此处添加 -->
          <!-- <div class="status-tag" v-if="book.status">
            {{ book.status }}
          </div> -->
        </div>
        <!-- 图书信息主体 -->
        <div class="book-info-wrap">
          <h3 class="book-title">{{ book.bookName }}</h3>
          <p class="book-author">
            [{{ book.authorNationality }}]{{ book.author }}，{{ book.translator }} 译 · {{ book.publisher }}
          </p>
          <div class="book-meta">
            <p><strong>ISBN编号</strong></p>
            <p>{{ book.isbn }}</p>
          </div>
          <div class="book-meta">
            <p><strong>图书简介</strong></p>
            <p>{{ book.intro }}</p>
          </div>
          <!-- 捐赠按钮 -->
          <div class="donate-btn-wrap">
            <el-button type="primary" @click="openDonateDialog(book)">捐赠</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 捐赠弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      title="填写图书信息" 
      width="600px"
    >
      <el-form 
        ref="donateForm" 
        :model="form" 
        :rules="rules" 
        label-width="120px"
        :show-message="true"
      >
        <el-form-item label="图书ID" prop="bookId">
          <el-input 
            v-model="form.bookId" 
            placeholder="例如：book0020"
          ></el-input>
        </el-form-item>
        <el-form-item label="图书名称" prop="bookName">
          <el-input 
            v-model="form.bookName" 
            placeholder="例如：平凡的世界"
          ></el-input>
        </el-form-item>
        <el-form-item label="ISBN" prop="isbn">
          <el-input 
            v-model="form.isbn" 
            placeholder="例如：9787530219086"
          ></el-input>
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input 
            v-model="form.author" 
            placeholder="例如：路遥"
          ></el-input>
        </el-form-item>
        <el-form-item label="出版社" prop="publisher">
          <el-input 
            v-model="form.publisher" 
            placeholder="例如：十月文艺出版社"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input 
            v-model="form.category" 
            placeholder="例如：文学"
          ></el-input>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number 
            v-model="form.quantity" 
            :min="1" 
            :max="99"
          ></el-input-number>
        </el-form-item>
        
        <!-- 新增：图书描述 -->
        <el-form-item label="图书描述" prop="description">
          <el-input 
            type="textarea" 
            v-model="form.description" 
            placeholder="请简要描述图书内容"
            :rows="4"
          ></el-input>
        </el-form-item>
        
        <!-- 新增：出版日期 -->
        <el-form-item label="出版日期" prop="publicationDate">
          <el-date-picker
            v-model="form.publicationDate"
            type="date"
            placeholder="选择出版日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>
        
        <!-- 新增：入库日期 -->
        <el-form-item label="入库日期" prop="storageDate">
          <el-date-picker
            v-model="form.storageDate"
            type="date"
            placeholder="选择入库日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitDonate">提交捐赠</el-button>
          <el-button @click="dialogVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox, ElCard, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElDatePicker } from 'element-plus';
import $api from '../axios'; // 假设已配置 Axios 实例
import { format } from 'date-fns'; // 用于日期格式化
import kt from '/src/assets/images/kt.jpg'
import ywxx from '/src/assets/images/ywxx.jpg'
import fsyh from '/src/assets/images/fsyh.jpg'
import btydyq from '/src/assets/images/btydyq.jpg'
import zssn from '/src/assets/images/zssn.jpg'
import cydwqd from '/src/assets/images/cydwqd.jpg'
import tcsys from '/src/assets/images/tcsys.jpg'
import zhldswy from '/src/assets/images/zhldswy.jpg'
import gb from '/src/assets/images/gb.jpg'
import bszy from '/src/assets/images/bszy.jpg'
import sq from '/src/assets/images/sq.jpg'
import walt from '/src/assets/images/walt.jpg'
const donateForm = ref<FormInstance | null>(null);

// 原始待捐赠图书列表（模拟数据，实际应从接口获取）
const booksToDonate = ref([
  
  {
    coverUrl: kt,
    bookName: ' 空谈 ',
    isbn: 'T12345678',
    author: ' 林垚 ',
    authorNationality: '中',
    translator: '',
    publisher: ' 上海译文出版社 ',
    status: '',
    intro: ' 青年学者林垚的文章汇集，涵盖道德、政治哲学，美国政治，科学与宗教哲学等话题，逻辑严密、文风犀利，深入讲解公共话题 ',
    inLibrary: false,
  },
  {
    coverUrl: ywxx,
    bookName: ' 欲望行星：人类时代的地球 ',
    isbn: 'Y12345678',
    author: ' 唐纳德·沃斯特 ',
    authorNationality: '美',
    translator: '',
    publisher: ' 汉唐阳光、贵州人民出版社 ',
    status: '',
    intro: ' 摒弃人类中心主义视角，从行星视角审视人类 20 万年的地球故事，探讨人类与地球的物质性关系 ',
    inLibrary: false,
  },
  {
    coverUrl: fsyh,
    bookName: ' 焚身以火 ',
    isbn: 'F12345678',
    author: ' 马蒂・弗里德曼 ',
    authorNationality: ' 以色列 ',
    translator: '',
    publisher: ' 万有引力、广东人民出版社 ',
    status: '',
    intro: ' 以莱昂纳德・科恩在第四次中东战争期间的巡演为主线，呈现战争的别样面貌，穿插战场众生视角 ',
    inLibrary: false,
  },
  {
    coverUrl: btydyq,
    bookName: ' 被讨厌的勇气 ',
    isbn: 'Y12345679',
    author: ' 岸见一郎、古贺史健 ',
    authorNationality: ' 日 ',
    translator: ' 渠海霞 ',
    publisher: ' 机械工业出版社 ',
    status: '',
    intro: ' 以 “青年与哲人的对话” 形式总结阿德勒心理学思想，探讨 “人如何获得幸福” 的哲学问题 ',
    inLibrary: false,
  },
  {
    coverUrl: zssn,
    bookName: ' 置身事内 ',
    isbn: 'Z12345682',
    author: ' 兰小欢 ',
    authorNationality: '中',
    translator: '',
    publisher: ' 上海人民出版社 ',
    status: '',
    intro: ' 将经济学原理与中国经济实践融合，以地方政府投融资为主线，论述中国经济发展，涵盖微观机制与宏观现象 ',
    inLibrary: false,
  },
  {
    coverUrl: cydwqd,
    bookName: ' 从一到无穷大 ',
    isbn: 'C12345686',
    author: ' 乔治・伽莫夫 ',
    authorNationality: ' 俄裔美国 ',
    translator: ' 暴永宁 ',
    publisher: ' 科学出版社 ',
    status: '',
    intro: ' 由俄裔美国核物理学家乔治・伽莫夫所著，介绍了科学领域多方面的知识，包括宇宙、微观世界、生命等 ',
  },
  {
    coverUrl: tcsys,
    bookName: ' 天才闪耀时：改变世界的 20 位科学巨匠 ',
    isbn: 'T12345693',
    author: ' 皮耶尔乔治・奥迪弗雷迪 ',
    authorNationality: ' 意大利 ',
    translator: ' 张密、马迪 ',
    publisher: ' 人民邮电出版社・图灵新知 ',
    status: '',
    intro: ' 精选 20 位科学巨匠，讲述他们凭借洞察力和创新精神推动多领域发展的故事，展现科学智慧 ',
    inLibrary: false,
  },
  {
    coverUrl: zhldswy,
    bookName: ' 最后来的是乌鸦 ',
    isbn: 'U12345694',
    author: ' 卡尔维诺 ',
    authorNationality: ' 意大利 ',
    translator: '',
    publisher: ' 译林出版社 ',
    status: '',
    intro: ' 收录卡尔维诺 1945 - 1949 年的短篇小说，以童年、战争、人性为主题，展现其精神世界，灵感源于二战经历 ',
    inLibrary: false,
  },
  {
    coverUrl: gb,
    bookName: ' 国宝 ',
    isbn: 'G12345683',
    author: ' 祝勇 ',
    authorNationality: '中',
    translator: '',
    publisher: ' 人民文学出版社 ',
    status: '',
    intro: ' 以故宫文物南迁为题材的长篇小说，是作者在创作非虚构作品《故宫文物南迁》后的又一力作，为读者带来更为开阔的文学享受，展现文物南迁背后的故事与情感。',
    inLibrary: false
  },
  {
    coverUrl: bszy,
    bookName: ' 不舍昼夜 ',
    isbn: 'B12345678',
    author: ' 王十月 ',
    authorNationality: '中',
    translator: '',
    publisher: ' 花城出版社 ',
    status: '',
    intro: ' 本书围绕主人公王端午展开，他生于 70 年代小山村，不甘平凡，借改革开放东风辗转多地打工。在这过程中，他历经居无定所的窘迫、成功的喜悦、爱情的酸甜。其人生与时代紧密交织，个人命运在时代浪潮里漂泊浮沉，书中展现了时代的变迁以及人们在其中的挣扎与成长。 ',
    inLibrary: false
  },
  {
    coverUrl: sq,
    bookName: ' 尚青 ',
    isbn: 'S12345678',
    author: ' 董立勃 ',
    authorNationality: '中',
    translator: '',
    publisher: ' 四川人民出版社 ',
    status: '',
    intro: ' 故事以充满历史气息和地域风情的新疆为背景，围绕普通新疆女子尚青展开，描绘了她波澜壮阔的人生。尚青因对爱的执着与勇气，从柔弱女学生成长为乡村教育启蒙者、骑马打枪的侠女等。小说不仅有爱情故事，还深入探讨了人性与历史。 ',
    inLibrary: false
  },
  {
    coverUrl: walt,
    bookName: ' 维奥莱塔 ',
    isbn: 'W12345678',
    author: ' 伊莎贝尔・阿连德（智利）',
    authorNationality: ' 智利 ',
    translator: '',
    publisher: ' 译林出版社 ',
    status: '',
    intro: ' 这是一部女性成长启示录，主角维奥莱塔是独立女性的代表。她在变革的风暴中，拒绝男人的规训，追随自我意志，废婚生子。小说以她的经历为线索，带领读者穿梭拉丁美洲 100 年的历史，历经诸多重大历史时刻，堪称女性版《百年孤独》。 ',
    inLibrary: false
  },
  
]);

// 过滤后的图书列表：只显示 inLibrary 为 false 的图书
const filteredBooksToDonate = computed(() => {
  return booksToDonate.value.filter(book => !book.inLibrary);
});

// 弹窗状态
const dialogVisible = ref(false);

// 表单数据（添加了三个新字段）
const form = reactive({
  bookId: '',
  bookName: '',
  isbn: '',
  author: '',
  publisher: '',
  category: '',
  quantity: 1,
  description: '',           
  publicationDate: '',     
  storageDate: '',         
  bookStatus: '未借出'      
});

// 表单校验规则（添加了三个新字段的校验）
const rules = reactive<FormRules>({
  bookId: [
    { required: true, message: '请填写图书ID', trigger: 'blur' }
  ],
  bookName: [
    { required: true, message: '请填写图书名称', trigger: 'blur' }
  ],
  isbn: [
    { required: true, message: '请填写ISBN', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请填写作者', trigger: 'blur' }
  ],
  publisher: [
    { required: true, message: '请填写出版社', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请填写分类', trigger: 'blur' }
  ],
  description: [
    { required: false }  
  ],
  publicationDate: [
    { required: true, message: '请选择出版日期', trigger: 'change' }
  ],
  storageDate: [
    { required: true, message: '请选择入库日期', trigger: 'change' }
  ]
});

// 打开捐赠弹窗
const openDonateDialog = (book: any) => {
  form.bookName = book.bookName;
  form.isbn = book.isbn;
  form.author = book.author;
  form.publisher = book.publisher;
  
  const today = new Date();
  form.publicationDate = format(today, 'yyyy-MM-dd');
  form.storageDate = format(today, 'yyyy-MM-dd');
  
  dialogVisible.value = true;
};

// 提交捐赠
const submitDonate = async () => {
  try {
    await (donateForm.value as FormInstance).validate(); 
    
    const response = await $api.post('/book/add', form);
    
    if (response.data.code === 200) {
      ElMessage.success('捐赠成功！感谢你的支持～');
      dialogVisible.value = false;
      resetForm();
      // 捐赠成功后，标记该图书为“已在图书库”
      const donatedBook = booksToDonate.value.find(book => book.isbn === form.isbn);
      if (donatedBook) {
        donatedBook.inLibrary = true; // 更新状态
      }
    } else {
      ElMessage.error('捐赠失败，请稍后重试');
    }
  } catch (error: any) {
    console.error('表单校验或提交失败:', error);
    ElMessage.error('请填写完整信息');
  }
};

// 重置表单
const resetForm = () => {
  form.bookId = '';
  form.bookName = '';
  form.isbn = '';
  form.author = '';
  form.publisher = '';
  form.category = '';
  form.quantity = 1;
  form.description = '';
  form.publicationDate = '';
  form.storageDate = '';
};
</script>
<style scoped>
/* 容器基础样式 */
.donate-container {
  padding: 20px;
}

/* 图书列表布局 */
.book-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.book-list h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

/* 单个图书卡片样式（模仿参考样式） */
.book-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.book-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* 封面区域 */
.book-cover-wrap {
  width: 80px;
  height: 120px;
  margin-right: 16px;
  position: relative;
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  display: block !important; /* 强制显示 */
}

/* 状态标签（如“已归还”） */
.status-tag {
  position: absolute;
  top: -6px;
  left: -6px;
  background-color: #d1fae5;
  color: #059669;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 图书信息主体 */
.book-info-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 书名 */
.book-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
}

/* 作者、出版社等信息 */
.book-author {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px;
}

/* 元信息（ISBN、简介等） */
.book-meta {
  margin-bottom: 8px;
}

.book-meta p {
  margin: 2px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
}

.book-meta strong {
  color: #6b7280;
}

/* 捐赠按钮区域 */
.donate-btn-wrap {
  text-align: right;
}

.donate-btn-wrap .el-button--primary {
  background-color: #2563eb;
  border-color: #2563eb;
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 4px;
}

.donate-btn-wrap .el-button--primary:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

/* 弹窗表单基础样式 */
.el-dialog {
  border-radius: 8px;
}

.el-dialog__header {
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
}

.el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.el-dialog__body {
  padding: 24px;
}

/* 表单项目间距 */
.el-form-item {
  margin-bottom: 16px;
}

/* 输入框、选择器统一样式 */
.el-input,
.el-input-number,
.el-date-picker,
.el-textarea {
  width: 100%;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

.el-input:hover,
.el-input-number:hover,
.el-date-picker:hover,
.el-textarea:hover {
  border-color: #9ca3af;
}

.el-input:focus,
.el-input-number:focus,
.el-date-picker:focus,
.el-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* 文本域高度 */
.el-textarea {
  min-height: 80px;
}

/* 按钮组间距 */
.el-form-item__content {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>