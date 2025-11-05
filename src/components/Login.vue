<template>
  <div class="login">
    <div class="container">
      <div class="form-box" :style="{ transform: formTransform }">
        <!-- 注册 -->
        <div class="register-box" :class="{ hidden: !showRegister }">
          <h1 class="zc">注册</h1>
          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            label-width="0"
            class="register-el-form"
          >
            <!-- 身份选择 -->
            <el-form-item prop="identity" class="r-input">
              <div class="select-box-r">
                <select v-model="registerForm.identity" class="identity-select">
                  <option value="" disabled selected>请选择身份</option>
                  <option value="admin">管理员</option>
                  <option value="reader">读者</option>
                  <option value="super">超级管理员</option>
                </select>
              </div>
            <!-- </el-form-item>
            
            <el-form-item prop="id" class="r-input">
              <input 
                type="text" 
                placeholder="ID" 
                v-model="registerForm.id"
              /> -->
            </el-form-item> 
            <!-- 姓名输入 -->
            <el-form-item prop="name" class="r-input">
              <input 
                type="text" 
                placeholder="姓名" 
                v-model="registerForm.name"
              />
            </el-form-item>
            <!-- 性别选择 -->
            <el-form-item prop="gender" class="r-input">
              <div class="select-box-r">
                <select v-model="registerForm.gender" class="identity-select">
                  <option value="" disabled selected>请选择性别</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
            </el-form-item>
            <!-- 登录名输入 -->
            <el-form-item prop="loginName" class="r-input">
              <input 
                type="text" 
                placeholder="登录名" 
                v-model="registerForm.loginName"
              />
            </el-form-item>
            <!-- 密码输入 -->
            <el-form-item prop="password" class="r-input">
              <input 
                type="password" 
                placeholder="密码" 
                v-model="registerForm.password"
              />
            </el-form-item>
            <!-- 电话输入 -->
            <el-form-item prop="phone" class="r-input">
              <input 
                type="text" 
                placeholder="电话" 
                v-model="registerForm.phone"
              />
            </el-form-item>
            <!-- 邮箱输入 -->
            <el-form-item prop="email" class="r-input">
              <input 
                type="email" 
                placeholder="邮箱" 
                v-model="registerForm.email"
              />
            </el-form-item>
            <!-- 注册日期输入 -->
            <el-form-item prop="date" class="r-input">
              <input 
                type="date" 
                v-model="registerForm.date"
              />
            </el-form-item>
            <div  class="register">
            <button @click="RsubmitForm(registerFormRef)">注册</button>
            </div>
          </el-form>
        </div>
        <!-- 登录 -->
        <div class="login-box" :class="{ hidden: showRegister }">
          <h1>登录</h1>
          
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-width="0" 
            class="login-el-form"
          >
    <!-- 身份选择 -->
    <el-form-item prop="identity">  <!-- 绑定验证规则的prop -->
      <div class="select-box">
        <select v-model="loginForm.identity" class="identity-select">
          <option value="" disabled selected>请选择身份</option>
          <option value="admin">管理员</option>
          <option value="reader">读者</option>
          <option value="super">超级管理员</option>
        </select>
      </div>
    </el-form-item>

    <!-- 用户名输入（补全v-model） -->
    <el-form-item prop="loginName" class="login-input">
      <input 
        type="text" 
        placeholder="用户名" 
        v-model="loginForm.loginName"  
      />
    </el-form-item>

    <!-- 密码输入（补全v-model） -->
    <el-form-item prop="password" class="login-input">
      <input 
        type="password" 
        placeholder="密码" 
        v-model="loginForm.password" 
      />
    </el-form-item>

    <el-form-item class="button-group">
      <div class="vertical-buttons">
        <el-button type="primary" @click="submitForm(loginFormRef)">登录</el-button>
        <el-button type="primary" @click="resetForm(loginFormRef)" class="reset-button">重置</el-button>
        <el-button type="primary" @click="toFaceLogin" class="reset-button">人脸登录</el-button>
      </div>
    </el-form-item>
  </el-form>
        </div>
      </div>
      <div class="con-box left">
        <h2 class="title"><span>图书管理系统</span></h2>
        <p>与圣贤对话从此<span>知识</span>在心里发芽</p>
        <img src="/src/assets/images/book1.jpg" alt="书1" class="smaller" />
        <p>已有账号</p>
        <button @click="toLogin">去登录</button>
      </div>
      <div class="con-box right">
        <h2 class="title"><span>图书管理系统</span></h2>
        <p>如果脚步无法抵达那就从<span>图书</span>出发</p>
        <img src="/src/assets/images/book2.jpg" alt="书2" class="smaller" />
        <p>没有账号？</p>
        <button @click="toRegister">去注册</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineComponent, ref ,reactive } from 'vue';
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import $api from '../axios'
import qs from 'qs'
import { useRouter } from 'vue-router'
const router = useRouter()
const loginForm = reactive({
    identity: '',
    loginName: '',
    password: ''
})
const loginRules = reactive({
    identity: [
        { required: true, message: '请选择身份', trigger: 'change' }
    ],
    loginName: [
        { required: true, message: '请输入登录名', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
    ]
})

const loginFormRef = ref<FormInstance>()
const submitForm = async (formEl: FormInstance | undefined) => {
    if (!formEl) return
    await formEl.validate((valid, fields) => {
        if (valid) { // 表单验证通过后，向服务器发送登录请求
            $api.post('/user/login', loginForm).then(res => {
                console.log('登录响应数据：', res.data);
                if (res.data.code === 200) { // 登录成功
                    console.log('身份信息：', loginForm.identity);
                    const userData = res.data.data; // 后端返回的用户信息

                    // 1. 获取当前登录时间（作为"本次登录时间"）
                    const currentLoginTime = new Date().toLocaleString(); // 格式化：2024/7/18 15:30:20
                    
                    // 2. 读取"上次登录时间"（关键修正：从localStorage获取上次的登录时间，而非sessionStorage）
                    // 首次登录时localStorage无记录，使用注册时间作为初始"上次登录时间"
                    const lastLogin = localStorage.getItem('nextLastLogin') || 
                                     (userData.userDate ? new Date(userData.userDate).toLocaleString() : currentLoginTime);
                    
                    // 3. 保存信息
                    // - 保存用户信息到sessionStorage
                    sessionStorage.setItem('user', JSON.stringify(userData));
                    // - 保存本次登录的"上次登录时间"到sessionStorage（供个人主页读取）
                    sessionStorage.setItem('lastLogin', lastLogin);
                    // - 保存本次登录时间到localStorage（作为下次登录的"上次登录时间"）
                    localStorage.setItem('nextLastLogin', currentLoginTime);

                    // 4. 根据身份跳转对应页面
                    if(loginForm.identity === 'admin'){
                        console.log('准备跳转到 /adminfront');
                        window.location.href = '/adminfront';
                    }else if(loginForm.identity === 'reader'){
                        window.location.href = '/readerfront';
                    }else if(loginForm.identity === 'super'){
                        window.location.href = '/super';
                    }
                    
                }else{
                    ElMessage({
                        message: '账号或密码错误',
                        type: 'error'
                    });
                    loginForm.loginName = '';
                    loginForm.password = '';
                }
            });
        } else {
            console.log('error submit!', fields);
        }
    });
};

const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return
    formEl.resetFields()
}
  // 控制显示状态
  const showRegister = ref(false);
  // 控制表单位置
  const formTransform = ref('translateX(0%)');

  // 切换到注册
  const toRegister = () => {
    formTransform.value = 'translateX(80%)';
    showRegister.value = true;
  };

  // 跳转人脸登录
  const toFaceLogin = () => {
    router.push('/face-login')
  }

  // 切换到登录
  const toLogin = () => {
    formTransform.value = 'translateX(0%)';
    showRegister.value = false;
  };

const registerFormRef = ref<FormInstance>()
const registerForm = reactive({
  identity:'',
  id:'',
  name:'',
  gender:'',
  loginName:'',
  password:'' ,
  phone:'',
  email:'',
  date:'',

})
const registerRules = reactive({
    identity:[
        {required:true,message:'请输入身份',trigger:'blur'}
    ],
    id:[
        {required:true,message:'请输入id',trigger:'blur'}
    ],
    name:[
        {required:true,message:'请输入姓名',trigger:'blur'}
    ],
    gender:[
        {required:true,message:'请选择性别',trigger:'blur'}
    ],
    loginName:[
        {required:true,message:'请输入登录名',trigger:'blur'}
    ],
    password:[
        {required:true,message:'请输入密码',trigger:'blur'}
    ],
    phone:[
        {required:true,message:'请输入电话',trigger:'blur'}
    ],
    email:[
        {required:true,message:'请输入邮箱',trigger:'blur'}
    ],
    date:[
        {required:true,message:'请选择注册日期',trigger:'blur'}
    ]

})
const RsubmitForm =  async (formEl: FormInstance | undefined) => {
    if(!formEl) return
    await formEl.validate((valid,fields) => {
        if(valid){
            $api.post('/user/register',registerForm).then(res => {
                if(res.data.code == 200){
                    ElMessage({
                        message: '注册成功，请登录',
                        type: 'success',
                        duration: 2000
                    })
                    //sessionStorage.setItem('admin', JSON.stringify(res.data.data))
                    setTimeout(() =>{
                        window.location.href = '/login'
                    },1500)
                }else{
                    ElMessage({
                        message: '注册失败，请重试',
                        type: 'error'
                    })
                    registerForm.loginName = ''
                    registerForm.password = ''
                }
            })

        }else{
            console.log('表单验证失败', fields)
        }
    })
}






</script>

<style scoped>
/* 初始化 */
* {
  margin: 0;
  padding: 0;
} 
/* 按钮容器样式：确保与输入框宽度一致，垂直排列 */
.button-group {
  width: 100%; /* 继承父容器宽度 */
  display: flex;
  justify-content: center; /* 水平居中 */
  margin-top: 15px;
}
.zc{
  margin-top: 10px;
}

.vertical-buttons {
  display: flex;
  flex-direction: column; /* 垂直排列 */
  gap: 10px; /* 按钮间距 */
  width: 100%; /* 与输入框、选择框宽度一致（70%） */
}

/* 强制按钮宽度与输入框对齐，样式统一 */
.vertical-buttons .el-button {
  width: 90%; /* 占满容器宽度，与输入框对齐 */
  padding: 10px 0; /* 统一内边距 */
  letter-spacing: 2px; /* 字间距匹配整体风格 */
  border-radius: 8px; /* 与注册按钮圆角一致 */
  background-color: #c9d8e7 !important;
  border-color: #c9d8e7 !important;
  color: #406599 !important;
}
.reset-button {
  margin-left: 0px;
}
.register{
  margin-left: -30px;
  margin-right: 33px;
}
input:focus::placeholder {
  opacity: 0;
  transition: 0.3s;
}
.login-el-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.register-el-form {
  width: 200%;
  display: flex;
  flex-direction: column;
  align-items: left;
}
.r-input{
  width: 100%;
  margin: -20px 0;
  margin-left: -50px;
}
.register-el-form .el-form-item{
  width:120%;
}
.el-form-item {
  width: 70%; /* 与输入框宽度一致 */
  margin-bottom: 8px; /* 保持输入框间距 */
}
.select-box {
  width: 90%;
  margin: 8px 0;
}
.select-box-r{
  width: 70%;
}
.login-input {
  width: 90%;
  margin: 8px 0;
  margin-left: 62px;
}
.login-box {
  /* 弹性布局 垂直排列 */
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.hidden {
  display: none;
  /* 动画过渡 */
  transition: 0.5s;
}

input:focus::placeholder {
  opacity: 0;
}

.con-box {
  width: 50%;
  /* 弹性布局 垂直排列 居中 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* 绝对定位 居中 */
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.con-box.left {
  left: -2%;
}

.con-box.right {
  right: -2%;
}
.con-box img {
  width: 150px;
  height: 150px;
  opacity: 0.9;
  margin: 40px 0;
}



.identity-select {
  width: 100%;
  padding: 10px;
  background-color: transparent;
  border: none;
  border-bottom: 1px solid rgba(64, 101, 153, 0.4);
  color: #406599;
  letter-spacing: 2px;
  font-size: 14px;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.identity-select option {
  background-color: #f5f7fa;
  color: #406599;
}

.identity-select:focus {
  outline: none;
  border-bottom: 1px solid #40659980;
  transition: 0.5s;
}
.login{
    min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 若有背景色/渐变，也可放这里 */
  background: linear-gradient(200deg, #ffffff, #dbecff); 
  /* background-image: url('/src/assets/images/bg5(1).jpg'); */
  /*background-size: cover; /* 图片覆盖整个容器 */
  /*background-position: center; /* 图片居中 */
  /*background-repeat: no-repeat; /* 图片不重复 */
  /*position: relative; /* 为伪元素提供定位参考 */
  /*overflow: hidden; /* 确保遮罩层不超出容器 */
}
/* 添加半透明遮罩层 */
.login::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(234, 248, 254, 0.4); /* 白色半透明遮罩，透明度0.4 */
  /* 若需深色遮罩，可使用 rgba(0, 0, 0, 0.3) */
  z-index: 1; /* 确保遮罩在背景图上方，但在内容下方 */
}

/* 确保登录内容显示在遮罩层上方 */
.container {
  position: relative;
  z-index: 2; /* 内容层高于遮罩层 */
}
body {
  /* 100%窗口高度 */
  height: 100vh;
  /* 弹性布局 水平+垂直居中 */
  display: flex;
  justify-content: center;
  align-items: center;
  /* 渐变背景 */
  background: linear-gradient(200deg, #f0f2f5, #e6e8eb);
}

.container {
  background-color: #fff;
  width: 650px;
  height: 415px;
  /* 相对定位 */
  position: relative;
  border-radius: 5px;
  /* 阴影 */
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.1);
}

.form-box {
  /* 绝对定位 */
  position: absolute;
  top: -10%;
  left: 5%;
  background-color: #c7ccd7;
  width: 320px;
  height: 500px;
  border-radius: 5px;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  /* 动画过渡 加速后减速 */
  transition: 0.5s ease-in-out;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

h1 {
  text-align: center;
  margin-bottom: 25px;
  /* 转大写 */
  text-transform: uppercase;
  color: #406599;
  /* 字间距 */
  letter-spacing: 5px;
}

input {
  background-color: transparent;
  width: 70%;
  color: #406599;
  border: none;
  /* 下边框样式 */
  border-bottom: 1px solid rgba(64, 101, 153, 0.4);
  padding: 10px 0;
  text-indent: 10px;
  margin: 8px 0;
  font-size: 14px;
  letter-spacing: 2px;
}
input::placeholder {
  color: #40659980;
}

input:focus {
  color: #406599;
  outline: none;
  border-bottom: 1px solid #40659980;
  transition: 0.5s;
}

.form-box button {
  width: 70%;
  margin-top: 0px;
  margin-left: 0px;
  margin-bottom: 10px;
  background-color: #f5f7fa;
  outline: none;
  border-radius: 8px;
  padding: 10px;
  color: #406599;
  letter-spacing: 2px;
  border: none;
  cursor: pointer;
}

.form-box button:hover {
  background-color: #c9d8e7;
  color: #406599;
  transition: background-color 0.5s ease;
}
/* 重置按钮hover效果与登录按钮一致（灰蓝色背景） */
.vertical-buttons .el-button:hover {
  background-color: #c9d8e7 !important;
  color: #406599 !important;
  transition: background-color 0.5s ease;
}
.con-box h2 {
  color: #406599;
  font-size: 25px;
  font-weight: bold;
  letter-spacing: 3px;
  text-align: center;
  margin-bottom: 4px;
}

.con-box p {
  font-size: 12px;
  letter-spacing: 2px;
  color: #7e9bbf;
  text-align: center;
}

.con-box span {
  color: #406599;
}

.con-box button {
  margin-top: 3%;
  background-color: #f0f2f5;
  color: #406599;
  border: 1px solid #c9d8e7;
  padding: 6px 10px;
  border-radius: 5px;
  letter-spacing: 1px;
  outline: none;
  cursor: pointer;
}

.con-box button:hover {
  background-color: #d6e1f0;
  color: #406599;
}
</style>

