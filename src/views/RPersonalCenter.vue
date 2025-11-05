<template>
  <div class="personal-center-container">
    <!-- 使用 Element Plus 卡片组件包裹整个内容 -->
    <el-card class="box-card">
      <!-- 卡片头部：标题 + 操作按钮 -->
      <template #header>
        <div class="clearfix">
          <span>个人信息</span>
          <!-- 非编辑状态显示编辑和退出按钮 -->
          <el-button
            v-if="!editMode"
            type="danger"
            size="small"
            style="float: right; margin-left: 10px"
            @click="handleLogout"
            :loading="logoutLoading"
          >
            <!-- 移除 Logout 图标，仅保留文字和加载状态图标 -->
            <el-icon v-if="logoutLoading"><Loading /></el-icon>
            退出登录
          </el-button>
          <el-button
            v-if="!editMode"
            type="primary"
            size="small"
            style="float: right"
            @click="enterEditMode"
          >
            编辑
          </el-button>
        </div>
      </template>
      
      <!-- 头像展示区域 -->
      <div class="user-info">
        <div class="avatar-container">
          <el-avatar :size="120" :src="userAvatar" />
        </div>
        
        <!-- 表单区域 -->
        <el-form 
          ref="formRef"
          :model="form" 
          :rules="rules" 
          label-width="120px" 
          class="info-form"
        >
          <!-- 读者ID（不可编辑） -->
          <el-form-item label="读者ID">
            <el-input v-model="form.readerId" disabled />
          </el-form-item>

          <!-- 登录名（根据编辑状态控制可编辑） -->
          <el-form-item label="登录名" prop="readerLoginName">
            <el-input 
              v-model="form.readerLoginName" 
              placeholder="请输入登录名"
              :disabled="!editMode"
            />
          </el-form-item>

          <!-- 密码字段（编辑状态才显示输入框） -->
          <el-form-item label="密码" prop="readerPassword" v-if="editMode">
            <el-input 
              v-model="form.readerPassword" 
              type="password"  
              placeholder="不修改请留空"
              show-password  
            />
          </el-form-item>
          <!-- 非编辑状态显示掩码 -->
          <el-form-item label="密码" v-if="!editMode">
            <el-input v-model="passwordMask" disabled />
          </el-form-item>

          <!-- 姓名（根据编辑状态控制可编辑） -->
          <el-form-item label="姓名" prop="readerName">
            <el-input 
              v-model="form.readerName" 
              placeholder="请输入姓名"
              :disabled="!editMode"
            />
          </el-form-item>

          <!-- 性别（根据编辑状态控制可编辑） -->
          <el-form-item label="性别" prop="readerGender">
            <el-radio-group 
              v-model="form.readerGender"
              :disabled="!editMode"
            >
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 电话（根据编辑状态控制可编辑） -->
          <el-form-item label="电话" prop="readerPhone">
            <el-input 
              v-model="form.readerPhone" 
              placeholder="请输入电话号码"
              :disabled="!editMode"
            />
          </el-form-item>

          <!-- 邮箱（根据编辑状态控制可编辑） -->
          <el-form-item label="邮箱" prop="readerEmail">
            <el-input 
              v-model="form.readerEmail" 
              placeholder="请输入邮箱地址"
              :disabled="!editMode"
            />
          </el-form-item>

          <!-- 注册日期（不可编辑） -->
          <el-form-item label="注册日期">
            <el-input v-model="formattedReaderDate" disabled />
          </el-form-item>

          <!-- 状态（不可编辑） -->
          <el-form-item label="状态">
            <el-tag :type="statusType">{{ formattedReaderStatus }}</el-tag>
          </el-form-item>

          <!-- 编辑状态显示保存/取消按钮 -->
          <el-form-item v-if="editMode">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" @click="saveInfo">保存修改</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted, ref, computed, toRaw } from 'vue';
import { ElMessage, ElForm, ElMessageBox, ElAvatar, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue'; // 仅保留需要的图标
import $api from '../axios'; 
import { useRouter } from 'vue-router';

// 定义读者信息类型接口
interface ReaderForm {
  readerId: string;
  readerLoginName: string;
  readerPassword: string;
  readerName: string;
  readerGender: string;
  readerPhone: string;
  readerEmail: string;
  readerDate: string;
  readerStatus: string;
}

// 路由实例
const router = useRouter();

// 表单引用（用于验证）
const formRef = ref<InstanceType<typeof ElForm>>();

// 编辑状态控制
const editMode = ref(false);
// 退出登录加载状态
const logoutLoading = ref(false);
// 密码掩码显示
const passwordMask = ref('******');
// 头像地址
const userAvatar = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png');

// 表单数据（直接编辑）
const form = reactive<ReaderForm>({
  readerId: '',
  readerLoginName: '',
  readerPassword: '',
  readerName: '',
  readerGender: '',
  readerPhone: '',
  readerEmail: '',
  readerDate: '',
  readerStatus: ''
});

// 存储原始数据用于重置
const originalForm = ref<ReaderForm>({
  readerId: '',
  readerLoginName: '',
  readerPassword: '',
  readerName: '',
  readerGender: '',
  readerPhone: '',
  readerEmail: '',
  readerDate: '',
  readerStatus: ''
});

// 表单验证规则
const rules = reactive({
  readerLoginName: [
    { required: true, message: '登录名不能为空', trigger: 'blur' }
  ],
  readerName: [
    { required: true, message: '姓名不能为空', trigger: 'blur' }
  ],
  readerGender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  readerPhone: [
    { required: true, message: '电话不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  readerEmail: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { pattern: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  readerPassword: [
    { min: 6, message: '密码长度至少6位', trigger: 'blur' } // 非必填（不修改可留空）
  ]
});

// 格式化日期显示
const formattedReaderDate = computed(() => {
  if (!form.readerDate) return '';
  const date = new Date(form.readerDate);
  return !isNaN(date.getTime()) 
    ? date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
    : form.readerDate;
});

// 格式化状态显示
const formattedReaderStatus = computed(() => {
  const statusMap: Record<string, string> = { '1': '正常', '0': '禁用' };
  return statusMap[form.readerStatus] || form.readerStatus || '未知';
});

// 状态标签样式
const statusType = computed(() => {
  switch (formattedReaderStatus.value) {
    case '正常': return 'success';
    case '禁用': return 'danger';
    default: return 'info';
  }
});

// 进入编辑模式
const enterEditMode = () => {
  // 保存原始数据
  Object.assign(originalForm.value, toRaw(form));
  editMode.value = true;
};

// 取消编辑
const cancelEdit = () => {
  ElMessageBox.confirm('确定要取消修改吗？未保存的内容将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    Object.assign(form, originalForm.value);
    formRef.value?.clearValidate();
    editMode.value = false;
  }).catch(() => {});
};

// 加载用户信息
onMounted(() => {
  const loadUserInfo = async () => {
    try {
      // 从本地存储加载
      // 兼容多种存储键
      const raw = sessionStorage.getItem('user')
        || sessionStorage.getItem('reader')
        || sessionStorage.getItem('admin')
        || sessionStorage.getItem('super');
      if (!raw) {
        ElMessage.warning('未找到登录信息，请重新登录');
        return;
      }

      const info = JSON.parse(raw);
      Object.assign(form, info);
      Object.assign(originalForm.value, info);

      // 从服务器同步最新数据
      if (form.readerId) {
        try {
          const res = await $api.get(`/reader/info/${form.readerId}`);
          if (res.data?.code === 200 && res.data.data) {
            const serverData = res.data.data;
            Object.assign(form, serverData);
            Object.assign(originalForm.value, serverData);
            sessionStorage.setItem('user', JSON.stringify(form));
          }
        } catch (error) {
          console.log('服务器数据同步失败（不影响使用）：', error);
        }
      }
    } catch (error) {
      ElMessage.error('加载用户信息失败，请重新登录');
      console.error('本地数据加载失败：', error);
    }
  };

  loadUserInfo();
});

// 保存修改
const saveInfo = async () => {
  try {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid: boolean) => {
      if (valid) {
        ElMessageBox.confirm('确定要保存修改吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async () => {
          // 处理密码（未修改则不传递）
          const updateData: Partial<ReaderForm> = toRaw(form);
          if (!updateData.readerPassword) {
            delete updateData.readerPassword;
          }

          const res = await $api.put('/reader/update', updateData);

          if ([200, 201].includes(res.data?.code || res.status)) {
            Object.assign(originalForm.value, form);
            sessionStorage.setItem('user', JSON.stringify(form));
            ElMessage.success('信息修改成功');
            editMode.value = false; // 保存成功后退出编辑模式
          } else {
            ElMessage.error(`修改失败：${res.data?.msg || '后端未返回原因'}`);
          }
        }).catch(() => {});
      }
    });
  } catch (error: any) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`提交失败：${error.message || '网络异常'}`);
      console.error('保存接口错误：', error);
    }
  }
};

// 退出登录
const handleLogout = () => {
  // 判断是否有未保存的修改
  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(originalForm.value);
  
  // 构建确认消息
  const confirmMessage = hasUnsavedChanges 
    ? '您有未保存的修改，确定要退出登录吗？未保存的内容将丢失'
    : '确定要退出登录吗？';

  ElMessageBox.confirm(confirmMessage, '退出确认', {
    confirmButtonText: '确定退出',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    logoutLoading.value = true;
    try {
      // 1. 调用后端退出接口
      try {
        await $api.post('/reader/logout');
      } catch (error) {
        console.warn('后端退出接口调用失败，继续执行本地退出', error);
      }
      
      // 2. 清除所有本地存储
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('reader');
      sessionStorage.removeItem('admin');
      sessionStorage.removeItem('super');
      sessionStorage.removeItem('token');
      
      // 3. 显示成功提示并跳转
      ElMessage.success('退出登录成功');
      setTimeout(() => {
        router.replace('/login');
      }, 800);
      
    } catch (error) {
      console.error('退出登录失败', error);
      ElMessage.error('退出登录失败，请重试');
      logoutLoading.value = false;
    }
  }).catch(() => {});
};
</script>

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

/* 清除浮动样式 */
.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

/* 用户信息区域 */
.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

/* 头像容器 */
.avatar-container {
  margin-bottom: 20px;
}

/* 表单样式 */
.info-form {
  width: 100%;
  max-width: 600px;
}

/* 表单项间距 */
::v-deep .el-form-item {
  margin-bottom: 15px;
}

/* 状态标签样式 */
::v-deep .el-tag {
  margin-top: 5px;
  padding: 8px 15px;
  font-size: 14px;
}

/* 错误提示样式 */
::v-deep .el-form-item__error {
  margin-top: 5px;
}
</style>