<template>
  <div class="face-bind-page">
    <div class="face-card">
      <div class="card-header">
        <img src="/src/assets/images/logo.svg" alt="logo" class="logo" />
        <h2>人脸绑定管理</h2>
        <p class="subtitle">请对准摄像头，保持光线充足与正面角度</p>
      </div>

      <!-- 用户ID输入 -->
      <div class="input-section">
        <input 
          v-model="userId" 
          placeholder="请输入要绑定的用户ID" 
          class="user-input"
        />
      </div>

      <div class="video-wrap">
        <video ref="videoRef" autoplay playsinline></video>
        <canvas ref="canvasRef" class="hidden"></canvas>
        
        <!-- 摄像头未启动时的占位符 -->
        <div v-if="!streaming" class="camera-placeholder">
          <div class="placeholder-icon">📷</div>
        </div>
      </div>

      <div class="actions">
        <button class="btn primary" @click="startCamera" :disabled="streaming">开启摄像头</button>
        <button class="btn" @click="captureAndBind" :disabled="!streaming || loading || !userId">拍照并绑定</button>
        <label class="btn ghost" for="face-file">选择文件</label>
        <input id="face-file" class="file-input" type="file" accept="image/*" @change="onFileBind" />
      </div>

      <!-- Face ID 输入 -->
      <div class="input-section">
        <div class="current-user-info">
          <span class="label">当前用户：</span>
          <span class="user-id">{{ currentUserId || '未登录' }}</span>
          <span v-if="currentUserRole" class="user-role">({{ currentUserRole }})</span>
        </div>
      </div>

      <!-- 管理操作按钮 -->
      <div class="manage-actions">
        <button class="btn" @click="captureAndUpdate" :disabled="!streaming || loading || !currentUserId">拍照并更新</button>
        <button class="btn" @click="deleteFace" :disabled="!currentUserId || loading">删除绑定</button>
      </div>

      <div class="tips">
        支持摄像头拍照或本地图片上传进行人脸绑定，确保安全性和准确性
      </div>

      <div v-if="loading" class="loading">{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '../axios/index'

const route = useRoute()

const userId = ref('')
const currentUserId = ref('')
const currentUserRole = ref('')
const faceId = ref<number | null>(null)  // 重新添加faceId变量用于绑定
const streaming = ref(false)
const loading = ref(false)
const currentAction = ref('')
const loadingText = ref('处理中...')
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let mediaStream: MediaStream | null = null

const startCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play()
      streaming.value = true
      ElMessage.success('摄像头已启动')
    }
  } catch (e) {
    ElMessage.error('无法访问摄像头：' + (e as Error).message)
  }
}
const stopCamera = () => {
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
  streaming.value = false
}
onBeforeUnmount(stopCamera)

// 获取当前登录用户信息
const getCurrentUser = () => {
  try {
    // 尝试从sessionStorage获取用户信息
    const userStr = sessionStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      currentUserId.value = user.readerId || user.adminId || user.superId || ''
      currentUserRole.value = user.role || ''
      return
    }
    
    // 尝试从其他可能的存储位置获取
    const readerStr = sessionStorage.getItem('reader')
    if (readerStr) {
      const reader = JSON.parse(readerStr)
      currentUserId.value = reader.readerId || ''
      currentUserRole.value = 'reader'
      return
    }
    
    const adminStr = sessionStorage.getItem('admin')
    if (adminStr) {
      const admin = JSON.parse(adminStr)
      currentUserId.value = admin.adminId || ''
      currentUserRole.value = 'admin'
      return
    }
    
    const superStr = sessionStorage.getItem('super')
    if (superStr) {
      const superAdmin = JSON.parse(superStr)
      currentUserId.value = superAdmin.superId || ''
      currentUserRole.value = 'super'
      return
    }
    
    console.log('未找到当前用户信息')
  } catch (e) {
    console.error('获取用户信息失败:', e)
  }
}

// 页面加载时检查URL参数
onMounted(() => {
  // 获取当前登录用户信息
  getCurrentUser()
  
  // 从URL参数中获取用户ID（用于绑定其他用户）
  const urlUserId = route.query.userId as string
  if (urlUserId) {
    userId.value = urlUserId
  }
})

const captureBlob = async (): Promise<Blob> => {
  const video = videoRef.value!
  const canvas = canvasRef.value!
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video, 0, 0)
  return await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.9))
}

const captureAndBind = async () => {
  if (!userId.value) return
  loading.value = true
  currentAction.value = 'bind'
  loadingText.value = '正在绑定人脸...'
  try {
    const blob = await captureBlob()
    const form = new FormData()
    form.append('image', blob, 'face.jpg')
    const { data } = await axios.post(`/face/register?userId=${encodeURIComponent(userId.value)}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (data?.code === 200) {
      const fid = Number(data?.data?.faceId)
      if (!Number.isNaN(fid)) faceId.value = fid
      ElMessage.success(`绑定成功！Face ID: ${fid}`)
    } else {
      ElMessage.error(data?.msg || '绑定失败')
    }
  } catch (e: any) {
    ElMessage.error('请求失败：' + (e?.message || '未知错误'))
  } finally { 
    loading.value = false
    currentAction.value = ''
  }
}


const onFileBind = async (ev: Event) => {
  const input = ev.target as HTMLInputElement
  if (!userId.value) {
    ElMessage.warning('请先输入用户ID')
    return
  }
  if (!input.files || !input.files[0]) return
  loading.value = true
  currentAction.value = 'bind'
  loadingText.value = '正在上传并绑定人脸...'
  try {
    const form = new FormData()
    form.append('image', input.files[0])
    const { data } = await axios.post(`/face/register?userId=${encodeURIComponent(userId.value)}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (data?.code === 200) {
      const fid = Number(data?.data?.faceId)
      if (!Number.isNaN(fid)) faceId.value = fid
      ElMessage.success(`绑定成功！Face ID: ${fid}`)
    } else { 
      ElMessage.error(data?.msg || '绑定失败') 
    }
  } catch (e: any) { 
    ElMessage.error('请求失败：' + (e?.message || '未知错误')) 
  }
  finally { 
    loading.value = false
    currentAction.value = ''
    input.value = ''
  }
}


const captureAndUpdate = async () => {
  if (!currentUserId.value) {
    ElMessage.warning('请先登录')
    return
  }
  loading.value = true
  currentAction.value = 'update'
  loadingText.value = '正在更新人脸...'
  try {
    const blob = await captureBlob()
    const form = new FormData()
    form.append('image', blob, 'face.jpg')
    const { data } = await axios.post(`/face/updateByUser?userId=${encodeURIComponent(currentUserId.value)}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (data?.code === 200) {
      ElMessage.success('更新成功')
    } else { 
      ElMessage.error(data?.msg || '更新失败') 
    }
  } catch (e: any) { 
    ElMessage.error('请求失败：' + (e?.message || '未知错误')) 
  }
  finally { 
    loading.value = false
    currentAction.value = ''
  }
}

const deleteFace = async () => {
  if (!currentUserId.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${currentUserId.value} 的人脸绑定吗？`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    loading.value = true
    currentAction.value = 'delete'
    loadingText.value = '正在删除人脸绑定...'
    
    const { data } = await axios.post(`/face/deleteByUser?userId=${encodeURIComponent(currentUserId.value)}`)
    if (data?.code === 200) { 
      ElMessage.success('删除成功')
    }
    else { 
      ElMessage.error(data?.msg || '删除失败') 
    }
  } catch (e: any) { 
    if (e !== 'cancel') {
      ElMessage.error('请求失败：' + (e?.message || '未知错误')) 
    }
  }
  finally { 
    loading.value = false
    currentAction.value = ''
  }
}
</script>

<style scoped>
.face-bind-page { 
  min-height: 100vh; 
  background: linear-gradient(200deg, #ffffff, #dbecff);
  display: flex; 
  align-items: center; 
  justify-content: center;
  padding: 24px;
}

.face-card {
  width: 900px;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  padding: 24px 28px;
}

.card-header { 
  text-align: center;
  margin-bottom: 12px;
}

.logo { width: 44px; height: 44px; margin-bottom: 6px; }

.card-header h2 { 
  margin: 4px 0 6px; 
  color: #406599; 
  letter-spacing: 2px;
}

.subtitle { color: #7e9bbf; font-size: 13px; }

.input-section {
  margin-bottom: 16px;
}

.user-input,
.face-id-input {
  width: 100%;
  background-color: transparent;
  color: #406599;
  border: none;
  border-bottom: 1px solid rgba(64, 101, 153, 0.4);
  padding: 10px 0;
  text-indent: 10px;
  margin: 8px 0;
  font-size: 14px;
  letter-spacing: 2px;
}

.user-input::placeholder,
.face-id-input::placeholder {
  color: #40659980;
}

.user-input:focus,
.face-id-input:focus {
  color: #406599;
  outline: none;
  border-bottom: 1px solid #40659980;
  transition: 0.5s;
}

.current-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin: 8px 0;
}

.current-user-info .label {
  color: #7e9bbf;
  font-size: 14px;
  font-weight: 500;
}

.current-user-info .user-id {
  color: #406599;
  font-size: 16px;
  font-weight: 600;
}

.current-user-info .user-role {
  color: #9aaecb;
  font-size: 12px;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.video-wrap { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background: #f5f7fa; 
  border: 1px solid #e5e7eb; 
  border-radius: 10px; 
  padding: 16px; 
  min-height: 320px;
  position: relative;
}

video { 
  width: 640px; 
  max-width: 100%; 
  border-radius: 8px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.camera-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #9aaecb;
  font-size: 48px;
}

.actions { 
  margin-top: 16px; 
  display: flex; 
  gap: 12px; 
  align-items: center; 
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #c9d8e7;
  background: #f5f7fa;
  color: #406599;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s ease;
  font-size: 14px;
}

.btn:hover { background: #d6e1f0; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.primary { background: #c9d8e7; border-color: #c9d8e7; }
.primary:hover { background: #b9ccde; }
.ghost { background: transparent; }

.file-input { display: none; }

.manage-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.tips { 
  margin-top: 8px; 
  text-align: center; 
  color: #9aaecb; 
  font-size: 12px; 
}

.hidden { display: none; }

.loading { 
  margin-top: 10px; 
  text-align: center; 
  color: #406599; 
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .face-bind-page {
    padding: 16px;
  }
  
  .face-card {
    padding: 20px;
  }
  
  .actions,
  .manage-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
    margin-bottom: 8px;
  }
  
  video {
    width: 100%;
    max-width: 400px;
  }
  
  .video-wrap {
    min-height: 250px;
  }
}

@media (max-width: 480px) {
  .face-card {
    padding: 16px;
  }
  
  .video-wrap {
    min-height: 200px;
  }
  
  .card-header h2 {
    font-size: 18px;
  }
}
</style>


