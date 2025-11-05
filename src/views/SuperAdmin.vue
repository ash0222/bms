<template>
  <div class="admin-container">
    <!-- 页面标题 -->
    <div class="page-title">管理员管理</div>
    
    <!-- 搜索和操作区 -->
    <div class="operation-bar">
      <div class="search-group">
        <el-input 
          v-model="searchAdminId" 
          placeholder="请输入管理员ID(如admin0001)" 
          class="search-input"
          clearable
          @keyup.enter="searchAdminById"
        />
        <el-input 
      v-model="searchAdminName" 
      placeholder="请输入管理员姓名" 
      class="search-input"
      clearable
      @keyup.enter="searchAdmin"
    />
        <el-button 
          type="primary" 
          @click="searchAdmin"
          class="search-btn"
        >
          <el-icon><Search /></el-icon> 查询
        </el-button>
      </div>
      
      <el-button 
        type="primary" 
        @click="addAdmin"
        class="add-btn"
      >
        <el-icon><Plus /></el-icon> 添加管理员
      </el-button>
    </div>
    
    <!-- 管理员表格 -->
    <el-card class="table-card">
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        border
        stripe
        highlight-current-row
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="adminId" label="ID" align="center" width="100" />
        <el-table-column prop="adminName" label="姓名" align="center" width="100" />
        <el-table-column prop="adminGender" label="性别" align="center" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.adminGender === '男' ? 'success' : 'info'">
              {{ scope.row.adminGender }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="adminLoginName" label="登录名" align="center" width="150" />
        <el-table-column prop="adminPassword" label="密码" align="center" width="120">
          <template #default="scope">
            <span>******</span> <!-- 密码掩码显示 -->
          </template>
        </el-table-column>
        <el-table-column prop="adminPhone" label="电话" align="center" width="130" />
        <el-table-column prop="adminEmail" label="邮箱" align="center" min-width="180" />
        <el-table-column prop="adminDate" label="注册日期" align="center" width="160" />
        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="editAdmin(scope.row)"
              class="edit-btn"
            >
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="delAdmin(scope.row.adminId)"
              class="del-btn"
            >
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"  
        v-model:page-size="pageSize"    
        :page-sizes="[5, 10, 15, 20]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      title="修改管理员信息" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
        class="form-container"
      >
        <el-form-item label="管理员ID" prop="adminId">
          <el-input v-model="editForm.adminId" disabled />
        </el-form-item>
        <el-form-item label="姓名" prop="adminName">
          <el-input v-model="editForm.adminName" />
        </el-form-item>
        <el-form-item label="性别" prop="adminGender">
          <el-select v-model="editForm.adminGender" placeholder="请选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="登录名" prop="adminLoginName">
          <el-input v-model="editForm.adminLoginName" />
        </el-form-item>
        <el-form-item label="密码" prop="adminPassword">
          <el-input v-model="editForm.adminPassword" type="password" />
          <template #help>不修改请保持为空</template>
        </el-form-item>
        <el-form-item label="电话" prop="adminPhone">
          <el-input v-model="editForm.adminPhone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="adminEmail">
          <el-input v-model="editForm.adminEmail" />
        </el-form-item>
        <el-form-item label="注册日期" prop="adminDate">
          <el-input v-model="editForm.adminDate" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm(editFormRef)">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增弹窗 -->
    <el-dialog 
      v-model="addDialogVisible" 
      title="新增管理员" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="120px"
        class="form-container"
      >
        <el-form-item label="姓名" prop="adminName">
          <el-input v-model="addForm.adminName" />
        </el-form-item>
        <el-form-item label="性别" prop="adminGender">
          <el-radio-group v-model="addForm.adminGender">
            <el-radio label="男" />
            <el-radio label="女" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="登录名" prop="adminLoginName">
          <el-input 
            v-model="addForm.adminLoginName" 
            placeholder="4-16位字母、数字或下划线" 
          />
        </el-form-item>
        <el-form-item label="密码" prop="adminPassword">
          <el-input v-model="addForm.adminPassword" type="password" />
          <template #help>6位数字，不能为相同数字或简单序列（如111111、123456）</template>
        </el-form-item>
        <el-form-item label="电话" prop="adminPhone">
          <el-input 
            v-model="addForm.adminPhone" 
            placeholder="11位手机号（如138xxxx1234）" 
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="adminEmail">
          <el-input v-model="addForm.adminEmail" placeholder="如xxx@xx.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSubmitForm(addFormRef)">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>

import { ref, onMounted, reactive } from 'vue'
import $api from '../axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
// 引入Element图标
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'

// 表格数据 & 分页参数
const tableData = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)

// 编辑弹窗相关
const dialogVisible = ref(false)
const editForm = reactive({
  adminId: '',
  adminName: '',
  adminGender: '',
  adminLoginName: '',
  adminPassword: '',
  adminPhone: '',
  adminEmail: '',
  adminDate: '',
})
const editRules = reactive({
  adminId: [
    { required: true, message: '请输入管理员ID', trigger: 'blur' },
  ],
  adminName: [
    { required: true, message: '请输入管理员姓名', trigger: 'blur' },
  ],
  adminGender: [
    { required: true, message: '请选择管理员性别', trigger: 'blur' },
  ],
  adminLoginName: [
    { required: true, message: '请输入登录名', trigger: 'blur' },
    { min: 4, max: 20, message: '登录名长度为4-20位', trigger: 'blur' }
  ],
  adminPassword: [
    { min: 6, message: '密码长度为6位数字', trigger: 'blur' },
  ],
  adminPhone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  adminEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  adminDate: [
    { required: true, message: '请输入创建日期', trigger: 'blur' },
  ],
})
const editFormRef = ref<FormInstance>()

// 新增弹窗相关
const addDialogVisible = ref(false)
const addForm = reactive({
  adminId: '',
  adminName: '',
  adminGender: '',
  adminLoginName: '',
  adminPassword: '',
  adminPhone: '',
  adminEmail: '',
})
const addRules = reactive({
  adminId: [
    { required: true, message: '请输入管理员ID', trigger: 'blur' },
    { pattern: /^admin\d{4}$/, message: 'ID格式为admin+4位数字（如admin0001）', trigger: 'blur' }
  ],
  adminName: [
    { required: true, message: '请输入管理员姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度为2-10个字符', trigger: 'blur' }
  ],
  adminGender: [
    { required: true, message: '请选择管理员性别', trigger: 'blur' },
  ],
  adminLoginName: [
    { required: true, message: '请输入登录名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{4,16}$/, message: '登录名由4-16位字母、数字或下划线组成', trigger: 'blur' }
  ],
  adminPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '密码必须是6位数字', trigger: 'blur' },
    { validator: (rule: any, value: string, callback: (error?: Error) => void) => {
      if (/^(\d)\1{5}$/.test(value)) {
        callback(new Error('密码不能为6位相同数字'))
      } else if (/^123456|654321|112233|332211$/.test(value)) {
        callback(new Error('密码不能为简单序列'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  adminPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  adminEmail: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
})
const addFormRef = ref<FormInstance>()

// 分页事件
const handleSizeChange = (val: number) => {
  pageSize.value = val
  getData()
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  getData()
}



// 删除管理员
const delAdmin = (adminId: string | number) => {
  ElMessageBox.confirm(
    '确定要删除该管理员信息吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await $api.delete('/admin/delete', {
        params: { id: adminId },
      })
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        getData()
      } else {
        ElMessage.error('删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败（网络错误）')
      console.error(error)
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 编辑管理员
const editAdmin = (row: any) => {
  dialogVisible.value = true
  editForm.adminId = row.adminId
  editForm.adminName = row.adminName
  editForm.adminGender = row.adminGender
  editForm.adminLoginName = row.adminLoginName
  editForm.adminPassword = row.adminPassword
  editForm.adminPhone = row.adminPhone
  editForm.adminEmail = row.adminEmail
  editForm.adminDate = row.adminDate
}

// 提交编辑
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.put('/admin/update', editForm)
        if (res.data.code === 200) {
          ElMessage.success('修改成功')
          dialogVisible.value = false
          getData()
        } else {
          ElMessage.error('修改失败')
        }
      } catch (error) {
        ElMessage.error('修改失败（网络错误）')
        console.error(error)
      }
    }
  })
}

// 打开新增弹窗
const addAdmin = () => {
  addDialogVisible.value = true
  addForm.adminId = ''
  addForm.adminName = ''
  addForm.adminGender = ''
  addForm.adminLoginName = ''
  addForm.adminPassword = ''
  addForm.adminPhone = ''
  addForm.adminEmail = ''
}

// 提交新增
const addSubmitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await $api.post('/admin/add', addForm)
        if (res.data.code === 200) {
          ElMessage.success('新增成功')
          addDialogVisible.value = false
          getData()
        } else {
          ElMessage.error('新增失败')
        }
      } catch (error) {
        ElMessage.error('新增失败（网络错误）')
        console.error(error)
      }
    }
  })
}


// 表格行样式（隔行变色增强）
const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'table-row-even' : 'table-row-odd';
};

// 页面加载时初始化数据
onMounted(() => {
  getData()
})


// 添加搜索姓名的响应式数据
const searchAdminName = ref('');

const searchAdminId = ref('');
// 存储原始数据的变量
const originalTableData = ref<any[]>([]);

// 修改搜索方法，合并ID和姓名搜索
const searchAdmin = () => {
  const id = searchAdminId.value.trim();
  const name = searchAdminName.value.trim();
  
  // 如果两个搜索条件都为空，加载全部数据
  if (!id && !name) {
    tableData.value = [...originalTableData.value];
    return;
  }
  
  // 过滤数据
  const filteredData = originalTableData.value.filter(item => {
    const matchId = id ? item.adminId.includes(id) : true;
    const matchName = name ? item.adminName.includes(name) : true;
    return matchId && matchName;
  });
  
  tableData.value = filteredData;
  totalCount.value = filteredData.length;
  currentPage.value = 1; // 重置到第一页
};

// 修改获取数据的方法，保存原始数据
const getData = async () => {
  try {
    const res = await $api.get('/admin/page', {
      params: { currentPage: currentPage.value, size: pageSize.value },
    });
    tableData.value = res.data.data.rows;
    originalTableData.value = [...tableData.value]; // 保存原始数据
    totalCount.value = res.data.data.total;
  } catch (error) {
    ElMessage.error('获取管理员列表失败');
    console.error(error);
  }
};

// 修改按ID查询方法，改为调用合并的搜索方法
const searchAdminById = () => {
  searchAdmin();
};
</script>

<style scoped>
/* 页面容器 */
.admin-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面标题 */
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

/* 操作栏 */
.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 300px;
}

.search-btn, .add-btn {
  transition: all 0.3s ease;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 表格样式 */
.table-card {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

/* 表格行样式 */
:deep(.el-table) {
  border-radius: 6px 6px 0 0;
}

:deep(.el-table th) {
  background-color: #f9fafb;
  font-weight: 600;
  color: #4e5969;
}

.table-row-even {
  background-color: #f9fafb;
}

.table-row-odd {
  background-color: #fff;
}

/* 操作按钮 */
.edit-btn, .del-btn {
  margin-right: 5px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background-color: #8ecbe5;
}

.del-btn:hover {
  background-color: #eac3de;
}

/* 分页容器 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

/* 表单容器 */
.form-container {
  padding: 10px 0;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__help) {
  color: #86909c;
  font-size: 12px;
}

/* 弹窗样式增强 */
:deep(.el-dialog__header) {
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e5e7eb;
  padding: 16px 20px;
}

/* 表格行高和字体大小调整 */
:deep(.el-table td),
:deep(.el-table th) {
  padding: 8px 0; /* 增大行高（默认约8px，改为16px） */
  font-size: 14px; /* 增大字体（默认约14px） */
}





</style>