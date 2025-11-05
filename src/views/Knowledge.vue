<template>
  <div style="padding:16px">
    <h2>知识库管理</h2>

    <el-card style="margin:12px 0;">
      <template #header>
        <div class="card-header">上传文件（PDF/DOCX/TXT）</div>
      </template>
      <input type="file" multiple @change="onSelect" />
      <el-button type="primary" @click="onUpload" :loading="uploading" style="margin-left:8px;">上传</el-button>
      <div v-if="uploadMsg" style="margin-top:8px; color:#666">{{ uploadMsg }}</div>
    </el-card>

    <el-card style="margin:12px 0;">
      <template #header>
        <div class="card-header">构建索引</div>
      </template>
      <div class="form-row">
        <span>分块方式：</span>
        <el-select v-model="strategy" style="width:180px;">
          <el-option label="固定大小分块" value="fixed" />
          <el-option label="语义分块（离线将退化为TF-IDF）" value="semantic" />
        </el-select>
        <span class="ml">max_len</span>
        <el-input-number v-model="maxLen" :min="50" :max="3000" />
        <span class="ml">overlap</span>
        <el-input-number v-model="overlap" :min="0" :max="1000" />
        <span class="ml">threshold</span>
        <el-input-number v-model="threshold" :step="0.05" :min="0" :max="1" />
      </div>
      <div class="btn-row">
        <el-button type="primary" @click="onBuild" :loading="building">构建索引</el-button>
        <el-button @click="onStats">查看统计</el-button>
        <el-button type="danger" plain @click="onClear">清空索引</el-button>
        <el-button type="warning" plain @click="onCancel" :disabled="progress.status!=='running'">取消构建</el-button>
      </div>
      <div v-if="buildMsg" style="margin-top:8px; color:#666">{{ buildMsg }}</div>
      <div v-if="statsMsg" style="margin-top:8px; color:#666">{{ statsMsg }}</div>
      <div v-if="progress.status==='running'" style="margin-top:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span>阶段：{{ progress.stage }}</span>
          <el-progress :percentage="progress.percent" style="width:260px;" />
        </div>
      </div>
      <div v-if="timingsText" style="margin-top:8px; color:#666">{{ timingsText }}</div>
    </el-card>

    <el-card style="margin:12px 0;">
      <template #header>
        <div class="card-header">检索与显示设置</div>
      </template>
      <div class="form-row">
        <el-input v-model="query" placeholder="输入你的问题（支持多关键词）" style="max-width:380px;" />
        <span class="ml">top_k</span>
        <el-input-number v-model="topK" :min="1" :max="50" />
        <el-button type="primary" @click="onSearch" :loading="searching" class="ml">检索</el-button>
        <span class="ml">预览分页长度</span>
        <el-input-number v-model="previewChunkChars" :min="200" :max="1200" />
      </div>
      <!-- 历史搜索记录 -->
      <div class="history-row" v-if="searchHistory.length">
        <span class="history-title">历史搜索：</span>
        <div class="history-tags">
          <el-tag
            v-for="(h, idx) in searchHistory"
            :key="h + '_' + idx"
            size="small"
            effect="plain"
            class="history-tag"
            @click="useHistory(h)"
            closable
            @close="removeHistory(idx)"
          >{{ h }}</el-tag>
        </div>
        <el-button link type="danger" @click="clearHistory">清空历史</el-button>
      </div>
      <div class="form-row" style="margin-top:6px;">
        <span>高亮颜色</span>
        <el-color-picker v-model="highlightColor" @change="saveConfig" />
        <el-button @click="exportCsv" :disabled="!results.length" class="ml">导出CSV(当前页)</el-button>
        <el-button @click="exportMarkdown" :disabled="!results.length" class="ml">复制Markdown(当前页)</el-button>
      </div>

      <div v-if="results.length" style="margin-top:12px;">
        <el-card v-for="(r,i) in pagedResults" :key="i" class="res-card">
          <div class="res-meta">
            <span>{{ r.score?.toFixed ? r.score.toFixed(2) : r.score }} | {{ displaySource(r.source) }}</span>
            <div style="float:right; display:inline-flex; gap:8px;">
              <el-button link type="primary" @click="copyText(r.text)">复制</el-button>
              <el-button link type="primary" @click="previewSource(r.source)" :disabled="!displaySource(r.source)">预览</el-button>
              <el-button link type="primary" @click="downloadSource(r.source)" :disabled="!displaySource(r.source)">下载</el-button>
            </div>
          </div>
          <div v-html="highlight(snippet(r.text, query), query)"></div>
        </el-card>
        <div class="pager">
          <el-pagination
            background
            layout="prev, pager, next, sizes, total"
            :current-page.sync="page"
            :page-sizes="[5,10,20]"
            :page-size.sync="pageSize"
            :total="results.length"
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="previewVisible" title="来源预览" width="720px">
      <div style="white-space:pre-wrap; word-break:break-word; max-height:60vh; overflow:auto;">
        <div v-html="highlight(previewPageText, query)"></div>
      </div>
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:8px;">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page.sync="previewPage"
          :page-size="1"
          :total="previewPages.length"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewVisible=false">关 闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import axios from '../axios/kb'

function roleHeaders(){
  try{
    const userRaw = sessionStorage.getItem('user')
    if(!userRaw) return {}
    const u = JSON.parse(userRaw)
    // 简单推断：有 adminName/ adminLoginName 认为 admin；有 superId/superName 认为 super
    const isAdmin = !!(u.adminName || u.adminLoginName)
    const isSuper = !!(u.superId || u.superName)
    if(isSuper) return { 'X-Role': 'super' }
    if(isAdmin) return { 'X-Role': 'admin' }
    return {}
  }catch{ return {} }
}

const files = ref<FileList | null>(null)
const uploading = ref(false)
const uploadMsg = ref('')

const strategy = ref('fixed')
const maxLen = ref(200)  // 减小分块大小，提高检索精度
const overlap = ref(50)   // 减小重叠，避免冗余
const threshold = ref(0.6)
const building = ref(false)
const buildMsg = ref('')
const statsMsg = ref('')

const highlightColor = ref('#ffe58f')
const progress = ref<{status:string; stage:string; percent:number}>({status:'idle', stage:'idle', percent:0})
const timings = ref<any>({})
const timingsText = computed(()=>{
  const t = timings.value
  if(!t || !t.total_s) return ''
  const parts = [] as string[]
  if(t.extract_s) parts.push(`抽取 ${t.extract_s}s`)
  if(t.chunk_s) parts.push(`分块 ${t.chunk_s}s`)
  if(t.embed_s) parts.push(`向量化 ${t.embed_s}s`)
  if(t.index_s) parts.push(`索引 ${t.index_s}s`)
  parts.push(`总计 ${t.total_s}s`)
  return parts.join(' | ')
})
let pollTimer: any = null

const query = ref('如何预约图书')
const topK = ref(5)
const searching = ref(false)
const results = ref<any[]>([])
const searchHistory = ref<string[]>([])

const page = ref(1)
const pageSize = ref(5)
const totalPages = computed(() => Math.max(1, Math.ceil(results.value.length / pageSize.value)))
const pagedResults = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return results.value.slice(start, start + pageSize.value)
})

const previewVisible = ref(false)
const previewText = ref('')
const previewPage = ref(1)
const previewChunkChars = ref(400)
const previewPages = computed(()=>{
  if(!previewText.value) return [] as string[]
  const t = previewText.value
  const pages: string[] = []
  for(let i=0;i<t.length;i+=previewChunkChars.value){
    pages.push(t.slice(i, Math.min(t.length, i+previewChunkChars.value)))
  }
  return pages
})
const previewPageText = computed(()=>{
  const idx = Math.max(1, Math.min(previewPage.value, previewPages.value.length)) - 1
  return previewPages.value[idx] || ''
})

function onPageChange(p:number){ page.value = p }
function onSizeChange(s:number){ pageSize.value = s; page.value = 1 }

function displaySource(s: string){
  if(!s) return ''
  const parts = s.split('\\\\').pop() as string
  return (parts || s).split('/').pop() as string
}

function onSelect(e: Event) {
  const input = e.target as HTMLInputElement
  files.value = input.files
}

async function onUpload() {
  if (!files.value || files.value.length === 0) return
  uploading.value = true
  uploadMsg.value = ''
  try {
    const form = new FormData()
    Array.from(files.value).forEach(f => form.append('files', f))
    const res = await axios.post('/kb/upload', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 })
    uploadMsg.value = JSON.stringify(res.data)
  } catch (e: any) {
    uploadMsg.value = e?.response?.data ? JSON.stringify(e.response.data) : String(e)
  } finally {
    uploading.value = false
  }
}

function startPoll(){
  stopPoll()
  pollTimer = setInterval(async ()=>{
    try{
      const res = await axios.get('/kb/progress')
      progress.value = res.data
    }catch{}
  }, 800)
}
function stopPoll(){ if(pollTimer) { clearInterval(pollTimer); pollTimer = null } }

async function onBuild() {
  building.value = true
  buildMsg.value = ''
  timings.value = {}
  startPoll()
  try {
    const params = new URLSearchParams()
    params.set('strategy', strategy.value)
    params.set('max_len', String(maxLen.value))
    params.set('overlap', String(overlap.value))
    params.set('threshold', String(threshold.value))
    const res = await axios.post('/kb/build-index', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...roleHeaders() }, timeout: 300000 })
    buildMsg.value = JSON.stringify(res.data)
    timings.value = res.data?.timings || {}
  } catch (e: any) {
    buildMsg.value = e?.response?.data ? JSON.stringify(e.response.data) : String(e)
  } finally {
    building.value = false
    stopPoll()
    progress.value = {status:'idle', stage:'idle', percent:0}
  }
}

async function onCancel(){
  try { await axios.post('/kb/cancel', null, { headers: { ...roleHeaders() } }) } catch {}
}

async function onStats(){
  try{
    const res = await axios.get('/kb/stats')
    const dim = res.data?.dim || '-'
    const size = res.data?.index_bytes ? `${(res.data.index_bytes/1024).toFixed(1)} KB` : '-'
    statsMsg.value = `文件数: ${res.data?.files || 0}, 分块数: ${res.data?.chunks || 0}, 维度: ${dim}, 索引大小: ${size}`
    ElMessage.success(statsMsg.value)
  }catch(e:any){
    statsMsg.value = e?.response?.data ? JSON.stringify(e.response.data) : String(e)
    ElMessage.error('获取统计失败')
  }
}

async function onClear(){
  try{
    await axios.post('/kb/clear', null, { headers: { ...roleHeaders() }, timeout: 120000 })
    buildMsg.value = '已清空索引'
    statsMsg.value = ''
    results.value = []
    page.value = 1
    ElMessage.success('已清空索引')
  }catch(e:any){
    buildMsg.value = e?.response?.data ? JSON.stringify(e.response.data) : String(e)
    ElMessage.error('清空索引失败：' + (e?.response?.status || ''))
  }
}

async function onSearch() {
  searching.value = true
  results.value = []
  page.value = 1
  try {
    const params = new URLSearchParams()
    params.set('query', query.value)
    params.set('top_k', String(topK.value))
    const res = await axios.post('/kb/search', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    results.value = res.data?.results || []
    if ((query.value || '').trim()) {
      pushHistory((query.value || '').trim())
    }
  } catch (e: any) {
    results.value = []
  } finally {
    searching.value = false
  }
}

function pushHistory(q: string){
  const arr = searchHistory.value.filter(x=> x !== q)
  arr.unshift(q)
  searchHistory.value = arr.slice(0, 10)
  localStorage.setItem('kb_search_history', JSON.stringify(searchHistory.value))
}

function removeHistory(i:number){
  searchHistory.value.splice(i,1)
  localStorage.setItem('kb_search_history', JSON.stringify(searchHistory.value))
}

function clearHistory(){
  searchHistory.value = []
  localStorage.removeItem('kb_search_history')
}

function useHistory(h: string){
  query.value = h
  onSearch()
}

function escapeHtml(s:string){
  return s.replace(/[&<>"']/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c] as string))
}

function tokenize(q: string): string[] {
  return (q || '').split(/\s+|[，。！？、；：‘’“”《》<>()（）\[\]]+/).filter(Boolean)
}

function highlight(text:string, q:string){
  if(!q) return escapeHtml(text)
  const esc = escapeHtml(text)
  const tokens = tokenize(q)
  if(tokens.length === 0) return esc
  const pattern = tokens.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const re = new RegExp(`(${pattern})`, 'gi')
  return esc.replace(re, (m)=>`<span style=\"background:${highlightColor.value};\">${m}</span>`) 
}

function snippet(text:string, q:string, win:number=120){
  if(!text) return ''
  const tokens = tokenize(q)
  const idx = tokens
    .map(t=> text.toLowerCase().indexOf(t.toLowerCase()))
    .filter(i=> i>=0)
    .sort((a,b)=>a-b)[0]
  if(idx === undefined) {
    return text.length>win*2 ? `…${escapeHtml(text.slice(0, win*2))}…` : escapeHtml(text)
  }
  const start = Math.max(0, idx - win)
  const end = Math.min(text.length, idx + win)
  const pre = start>0 ? '…' : ''
  const suf = end<text.length ? '…' : ''
  return `${pre}${escapeHtml(text.slice(start, end))}${suf}`
}

async function copyText(t:string){
  try { await navigator.clipboard.writeText(t) } catch {}
}

function csvEscape(s:string){ return '"' + (s||'').replace(/"/g,'""') + '"' }
function exportCsv(){
  const rows = [['score','source','text']].concat(pagedResults.value.map(r=>[
    String(r.score), displaySource(r.source), (r.text||'').replace(/\n/g,' ')
  ]))
  const csv = rows.map(r=>r.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'results.csv'; a.click(); URL.revokeObjectURL(url)
}

function exportMarkdown(){
  const lines = ['| 分数 | 来源 | 片段 |','|---:|---|---|']
  pagedResults.value.forEach(r=>{
    lines.push(`| ${r.score} | ${displaySource(r.source)} | ${(snippet(r.text, query.value)||'').replace(/\n/g,' ')} |`)
  })
  const md = lines.join('\n')
  navigator.clipboard.writeText(md).catch(()=>{})
}

async function downloadSource(source:string){
  const name = displaySource(source)
  if(!name) return
  const url = `/kb/download?name=${encodeURIComponent(name)}`
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
}

async function previewSource(source:string){
  const name = displaySource(source)
  if(!name) return
  try{
    const res = await axios.get('/kb/preview', { params: { name, max_chars: Math.max(200, Math.min(2000, previewChunkChars.value*3)) }})
    previewText.value = res.data?.text || ''
    previewPage.value = 1
    previewVisible.value = true
  }catch{}
}

async function saveConfig(){
  try{
    const form = new URLSearchParams()
    form.set('highlight_color', highlightColor.value)
    form.set('preview_chunk_chars', String(previewChunkChars.value))
    await axios.post('/kb/config', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...roleHeaders() } })
  }catch{}
}

onMounted(async ()=>{
  try{
    const res = await axios.get('/kb/config')
    if(res.data){
      if(res.data.highlight_color) highlightColor.value = res.data.highlight_color
      if(typeof res.data.preview_chunk_chars === 'number') previewChunkChars.value = res.data.preview_chunk_chars
    }
  }catch{}
  try{
    const raw = localStorage.getItem('kb_search_history')
    if(raw){
      const arr = JSON.parse(raw)
      if(Array.isArray(arr)) searchHistory.value = arr.slice(0,10)
    }
  }catch{}
})
onBeforeUnmount(()=> stopPoll())
</script>

<style scoped>
.card-header{ font-weight:600; }
.form-row{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ml{ margin-left:8px; }
.res-card{ margin-bottom:8px; }
.res-meta{ color:#999; font-size:12px; margin-bottom:4px; }
.pager{ display:flex; justify-content:flex-end; margin-top:8px; }
.btn-row{ width:100%; display:flex; justify-content:center; gap:12px; margin-top:8px; flex-wrap:wrap; }

/* 历史搜索 */
.history-row{ display:flex; align-items:center; gap:8px; margin-top:8px; flex-wrap:wrap; }
.history-title{ color:#666; }
.history-tags{ display:flex; gap:6px; flex-wrap:wrap; }
.history-tag{ cursor:pointer; }
</style>


