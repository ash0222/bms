<template>
  <div class="chat-root">
    <!-- 左侧会话历史 -->
    <aside class="chat-sessions">
      <div class="sessions-header">
        <span>历史对话</span>
        <button class="new-btn" @click="newChat">新对话</button>
      </div>
      <div class="sessions-list">
        <div 
          v-for="s in sessions" 
          :key="s.id" 
          :class="['session-item', s.id===sessionId ? 'active' : '']"
          @click="switchSession(s.id)"
        >
          <div class="session-title">{{ s.title || '新对话' }}</div>
          <div class="session-time">{{ formatTime(s.createdAt) }}</div>
          <button class="del-btn" @click.stop="removeSession(s.id)">×</button>
        </div>
      </div>
    </aside>

    <div class="chat-container">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <h3>智能图书助手</h3>
        <div class="header-actions">
          <div class="mode-toggle" title="选择检索模式">
            <span class="mode-label">模式</span>
            <button class="mode-pill" :class="{active: mode==='rag'}" @click="setMode('rag')">RAG</button>
            <button class="mode-pill" :class="{active: mode==='graphrag'}" @click="setMode('graphrag')">GraphRAG</button>
          </div>
          <select v-model="selectedModel" @change="switchModel" class="model-select">
            <option value="deepseek-r1:7b">DeepSeek-R1 7B</option>
            <option value="deepseek-coder:6.7b">DeepSeek-Coder 6.7B</option>
            <option value="deepseek-coder:1.3b">DeepSeek-Coder 1.3B</option>
          </select>
          <button @click="clearHistory" class="clear-btn">清空对话</button>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" 
           :class="['message', message.role]">
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(message.content)"></div>
          <div v-if="message.sources && message.sources.length > 0" class="sources">
            <details>
              <summary>参考文档 ({{ message.sources.length }})</summary>
              <div v-for="(source, idx) in message.sources" :key="idx" class="source-item">
                <div class="source-score">相似度: {{ source.score }}</div>
                <div class="source-text">{{ source.text.substring(0, 200) }}...</div>
                <div class="source-file">来源: {{ source.source }}</div>
              </div>
            </details>
          </div>
        </div>
        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="message assistant">
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
      <div class="input-container">
        <textarea 
          v-model="inputMessage" 
          @keydown.enter.prevent="handleEnter"
          placeholder="请输入您的问题..."
          :disabled="isLoading"
          rows="3"
          class="message-input"
        ></textarea>
        <button 
          @click="sendMessage" 
          :disabled="!inputMessage.trim() || isLoading"
          class="send-btn"
        >
          <i class="icon-send">发送</i>
        </button>
      </div>
      <div class="input-tips">
        <span>按 Enter 发送，Shift + Enter 换行</span>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'

// 响应式数据
const messages = ref<Array<{
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sources?: Array<{
    score: number
    text: string
    source: string
  }>
}>>([])

const inputMessage = ref('')
const isLoading = ref(false)
const selectedModel = ref('deepseek-r1:7b')
const mode = ref<'rag'|'graphrag'>('rag')
const messagesContainer = ref<HTMLElement>()
const sessionId = ref<string>('')
type Session = { id: string; title: string; createdAt: number }
const sessions = ref<Session[]>([])

// API配置
const RAG_API_BASE = 'http://localhost:8020'
// 新建对话
const newChat = () => {
  sessionId.value = `session_${Date.now()}`
  messages.value = []
  const s: Session = { id: sessionId.value, title: '新对话', createdAt: Date.now() }
  sessions.value.unshift(s)
  persistSessions()
}

// 切换会话
const switchSession = async (id: string) => {
  if (sessionId.value === id) return
  sessionId.value = id
  messages.value = []
  try {
    const res = await axios.get(`${RAG_API_BASE}/chat/history/${id}`)
    const hist = (res.data?.history || []).map((m:any)=>({
      role: m.role,
      content: m.content,
      timestamp: Date.now()
    }))
    messages.value = hist
  } catch {}
}

// 删除会话
const removeSession = async (id: string) => {
  try { await axios.delete(`${RAG_API_BASE}/chat/history/${id}`) } catch {}
  sessions.value = sessions.value.filter(s=> s.id!==id)
  persistSessions()
  if (sessionId.value === id) newChat()
}

function persistSessions(){
  localStorage.setItem('chat_sessions', JSON.stringify(sessions.value.slice(0,50)))
}

function restoreSessions(){
  try{
    const raw = localStorage.getItem('chat_sessions')
    if(raw){
      const arr = JSON.parse(raw)
      if(Array.isArray(arr)) sessions.value = arr
    }
  }catch{}
  if(!sessions.value.length) newChat()
  else sessionId.value = sessions.value[0].id
  // 默认模型：优先使用本地记忆；若无则 deepseek-r1:7b
  try{
    const m = localStorage.getItem('chat_model')
    if(m) selectedModel.value = m
  }catch{}
}


// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage,
    timestamp: Date.now()
  })

  isLoading.value = true
  scrollToBottom()

  try {
    const response = await axios.post(`${RAG_API_BASE}/chat`, {
      message: userMessage,
      session_id: sessionId.value,
      stream: false,
      mode: mode.value
    })

    // 添加助手回复
    messages.value.push({
      role: 'assistant',
      content: response.data.response,
      timestamp: response.data.timestamp,
      sources: response.data.sources
    })

  } catch (error) {
    console.error('发送消息失败:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，我遇到了一些问题，请稍后再试。',
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

// 处理回车键
const handleEnter = (event: KeyboardEvent) => {
  if (event.shiftKey) {
    // Shift + Enter 换行
    return
  } else {
    // Enter 发送
    event.preventDefault()
    sendMessage()
  }
}

// 切换模型
const switchModel = async () => {
  try {
    await axios.post(`${RAG_API_BASE}/models/switch`, 
      new URLSearchParams({ model_name: selectedModel.value }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    console.log(`已切换到模型: ${selectedModel.value}`)
    try{ localStorage.setItem('chat_model', selectedModel.value) }catch{}
  } catch (error) {
    console.error('切换模型失败:', error)
  }
}

// 清空对话历史
const clearHistory = async () => {
  try {
    await axios.delete(`${RAG_API_BASE}/chat/history/${sessionId.value}`)
    messages.value = []
    sessionId.value = `session_${Date.now()}`
  } catch (error) {
    console.error('清空历史失败:', error)
  }
}

// 格式化消息内容
const formatMessage = (content: string) => {
  // 简单的Markdown渲染
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// 组件挂载时检查服务状态
onMounted(async () => {
  restoreSessions()
  try{
    const raw = localStorage.getItem('chat_mode')
    if(raw === 'graphrag' || raw === 'rag') mode.value = raw
  }catch{}
  try {
    const response = await axios.get(`${RAG_API_BASE}/health`)
    if (response.data.status !== 'ok') {
      console.warn('RAG服务状态异常:', response.data)
    }
  } catch (error) {
    console.error('无法连接到RAG服务:', error)
  }
})

function persistMode(){
  try{ localStorage.setItem('chat_mode', mode.value) }catch{}
}

function setMode(m: 'rag'|'graphrag'){
  mode.value = m
  persistMode()
}
</script>

<style scoped>
.chat-root{ display:flex; gap:12px; height:600px; }
.chat-sessions{ width:260px; border:1px solid #e0e0e0; border-radius:8px; background:#fff; display:flex; flex-direction:column; }
.sessions-header{ display:flex; align-items:center; justify-content:space-between; padding:12px; border-bottom:1px solid #eee; background:#f8f9fa; border-radius:8px 8px 0 0; }
.new-btn{ padding:6px 10px; background:#10a37f; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:12px; }
.sessions-list{ flex:1; overflow:auto; padding:8px; display:flex; flex-direction:column; gap:8px; }
.session-item{ position:relative; padding:10px 28px 10px 10px; border:1px solid #eee; border-radius:6px; cursor:pointer; }
.session-item.active{ border-color:#10a37f; background:#f0fffa; }
.session-title{ font-size:14px; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.session-time{ font-size:12px; color:#999; }
.del-btn{ position:absolute; right:6px; top:6px; border:none; background:transparent; color:#999; cursor:pointer; }
.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.chat-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mode-toggle{ display:flex; align-items:center; gap:8px; background:#f0f9f6; border:1px solid #cce9df; padding:6px 10px; border-radius:999px; }
.mode-label{ color:#0b7; font-size:12px; font-weight:600; }
.mode-pill{ border:none; background:#e8f6f1; color:#0a6; padding:6px 10px; border-radius:999px; cursor:pointer; font-size:12px; }
.mode-pill.active{ background:#10a37f; color:#fff; box-shadow:0 0 0 2px rgba(16,163,127,.15) inset; }
.mode-pill:hover{ filter:brightness(.98); }

.model-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.clear-btn {
  padding: 6px 12px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #ff3742;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message.user .message-content {
  background: #007bff;
  color: white;
}

.message.assistant .message-content {
  background: #f1f3f4;
  color: #333;
}

.message-text {
  line-height: 1.5;
}

.message-time {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  text-align: right;
}

.message.assistant .message-time {
  text-align: left;
}

.sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}

.sources summary {
  cursor: pointer;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.source-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
}

.source-score {
  font-weight: bold;
  color: #007bff;
  margin-bottom: 4px;
}

.source-text {
  color: #666;
  margin-bottom: 4px;
}

.source-file {
  font-size: 12px;
  color: #999;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  min-height: 60px;
  max-height: 120px;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.send-btn {
  padding: 12px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  min-width: 80px;
}

.send-btn:hover:not(:disabled) {
  background: #0056b3;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.input-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>






