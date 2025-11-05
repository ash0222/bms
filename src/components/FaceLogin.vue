<template>
  <div class="face-login-page">
    <div class="face-card">
      <div class="card-header">
        <img src="/src/assets/images/logo.svg" alt="logo" class="logo" />
        <h2>人脸登录</h2>
        <p class="subtitle">请对准摄像头，保持光线充足与正面角度</p>
      </div>

      <div class="video-wrap">
        <video ref="videoRef" autoplay playsinline></video>
        <canvas ref="canvasRef" class="hidden"></canvas>
      </div>

      <div class="actions">
        <button class="btn primary" @click="startCamera" :disabled="streaming">开启摄像头</button>
        <button class="btn" @click="captureAndLogin" :disabled="!streaming || loading">拍照并登录</button>
      </div>

      <div class="tips">
        请使用摄像头拍照进行人脸识别登录，确保安全性和准确性
      </div>

      <div v-if="loading" class="loading">正在识别中...</div>
      <div v-if="result" class="result">
        <div>候选用户ID：{{ result.candidateUserId || '未匹配' }}</div>
        <div>相似度：{{ result.score.toFixed(4) }}</div>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import axios from '../axios/index'
import router from '../router'

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const streaming = ref(false)
const loading = ref(false)
const result = ref<{ candidateUserId: string | null; score: number } | null>(null)
let mediaStream: MediaStream | null = null

const startCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play()
      streaming.value = true
    }
  } catch (e) {
    alert('无法访问摄像头：' + (e as Error).message)
  }
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
  streaming.value = false
}

onBeforeUnmount(stopCamera)

const captureBlob = async (): Promise<Blob> => {
  const video = videoRef.value!
  const canvas = canvasRef.value!
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video, 0, 0)
  return await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.9))
}

const captureAndLogin = async () => {
  if (!streaming.value) return
  loading.value = true
  result.value = null
  try {
    const blob = await captureBlob()
    const form = new FormData()
    form.append('image', blob, 'face.jpg')
    const { data } = await axios.post('/face/login', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    console.log('完整响应数据:', data)
    if (data && data.code === 200) {
      // 新后端返回结构：{ role, user, score }
      const role = data.data?.role
      const user = data.data?.user
      const score = Number(data.data?.score ?? 0)
      result.value = { candidateUserId: user?.readerId || user?.adminId || user?.superId || null, score }
      console.log('识别结果:', { role, user, score, rawData: data.data })
      if (user && score >= 0.8) {
        sessionStorage.setItem('user', JSON.stringify(user))
        // 兼容旧代码读取的不同键
        if (role === 'reader') sessionStorage.setItem('reader', JSON.stringify(user))
        if (role === 'admin') sessionStorage.setItem('admin', JSON.stringify(user))
        if (role === 'super') sessionStorage.setItem('super', JSON.stringify(user))
        // 记录上次登录时间（供个人中心读取）
        sessionStorage.setItem('lastLogin', new Date().toLocaleString('zh-CN', { hour12: false }))
        if (role === 'admin') {
          window.location.href = '/adminfront'
        } else if (role === 'reader') {
          window.location.href = '/readerfront'
        } else if (role === 'super') {
          window.location.href = '/super'
        } else {
          window.location.href = '/readerfront'
        }
      }
    } else {
      alert(data?.msg || '识别失败')
    }
  } catch (e: any) {
    alert('请求失败：' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.face-login-page { 
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

.video-wrap { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background: #f5f7fa; 
  border: 1px solid #e5e7eb; 
  border-radius: 10px; 
  padding: 16px; 
  min-height: 320px;
}
video { 
  width: 640px; 
  max-width: 100%; 
  border-radius: 8px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.actions { 
  margin-top: 16px; 
  display: flex; 
  gap: 12px; 
  align-items: center; 
  justify-content: center;
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
}
.btn:hover { background: #d6e1f0; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.primary { background: #c9d8e7; border-color: #c9d8e7; }
.primary:hover { background: #b9ccde; }
.ghost { background: transparent; }

.file-input { display: none; }

.tips { 
  margin-top: 8px; 
  text-align: center; 
  color: #9aaecb; 
  font-size: 12px; 
}

.hidden { display: none; }
.loading { margin-top: 10px; text-align: center; color: #406599; }
.result { 
  margin-top: 12px; 
  font-size: 14px; 
  color: #406599; 
  background: #f5f7fa; 
  border: 1px solid #e5e7eb; 
  border-radius: 8px; 
  padding: 10px 12px;
}
</style>


