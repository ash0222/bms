<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import kgApi from '../axios/kg'
import { ElMessage } from 'element-plus'

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
const uploadLoading = ref(false)
const nodeCount = ref(0)
const relationshipCount = ref(0)

// 知识图谱构建相关
const kgStats = ref<any>({})

// 搜索关键字
const keyword = ref('')
const searching = ref(false)

const onSearch = async () => {
  const k = (keyword.value || '').trim()
  if (!k) { ElMessage.warning('请输入节点名称'); return }
  searching.value = true
  try {
    const res = await fetch(`http://localhost:5000/api/knowledge/search?keyword=${encodeURIComponent(k)}`)
    const data = await res.json()
    if (data.status !== 'success') throw new Error(data.message || '搜索失败')

    // 仅显示关键字命中的所有中心节点（可能重名）及其直接邻居（1跳）
    const rawNodes: any[] = data.nodes || []
    const rawLinks: any[] = data.relationships || []

    // 命中一组中心（可能多个重名），优先精确等于，再包含
    const exactCenters = rawNodes.filter(n => (n.name || '').trim() === k)
    const includeCenters = rawNodes.filter(n => String(n.name || '').includes(k))
    const centerIds = new Set<string>([...exactCenters, ...includeCenters].map(n => String(n.id)))
    if (centerIds.size === 0 && rawNodes.length) centerIds.add(String(rawNodes[0].id))

    // 保留与任一中心相连的一跳边
    const filteredLinks = rawLinks.filter(e => centerIds.has(String(e.source)) || centerIds.has(String(e.target)))

    // 保留所有中心以及它们的一跳邻居节点
    const neighborIds = new Set<string>()
    filteredLinks.forEach(e => { neighborIds.add(String(e.source)); neighborIds.add(String(e.target)) })
    const filteredNodes = rawNodes.filter(n => neighborIds.has(String(n.id)))

    // 构造可视化数据
    const labelSet = new Set<string>()
    const nodes: GraphNode[] = filteredNodes.map((n: any) => {
      const label = n.label || (Array.isArray(n.labels) ? n.labels[0] : 'Entity')
      labelSet.add(label)
      const value: number = Number((n.properties && (n.properties.weight || n.properties.count)) || 1)
      return {
        id: String(n.id ?? n.name),
        name: n.name ?? String(n.id),
        category: label,
        value,
        symbolSize: Math.min(90, Math.max(14, value * 6)) * (centerIds.has(String(n.id)) ? 1.2 : 1),
        properties: n.properties || {}
      }
    })
    const labelArray = Array.from(labelSet)
    const categories = labelArray.map(l => ({ name: l }))
    const categoryIndex = (label: string) => Math.max(0, labelArray.indexOf(label))
    nodes.forEach((n: GraphNode) => { n.category = categoryIndex(String(n.category)) })

    const links = filteredLinks.map((e: any) => ({
      source: String(e.source),
      target: String(e.target),
      value: e.type || '',
      properties: e.properties || {},
      type: e.type || ''
    }))

    nodeCount.value = nodes.length
    relationshipCount.value = links.length
    renderGraph({ nodes, links, categories, labelArray })
  } catch (e: any) {
    ElMessage.error('搜索失败：' + (e?.message || '未知错误'))
  } finally {
    searching.value = false
  }
}

// 上传文件（CSV/JSON/TXT）
const uploading = ref(false)
const onUploadFile = async (file: any) => {
  if (!file) return false
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file.raw || file)
    form.append('clear', 'false')
    const resp = await kgApi.post('/api/upload/graph', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (resp.data?.status === 'success') {
      ElMessage.success('上传成功，已更新图谱')
      await fetchGraph()
    } else {
      throw new Error(resp.data?.message || '上传失败')
    }
  } catch (e: any) {
    ElMessage.error('上传失败：' + (e?.message || '未知错误'))
  } finally {
    uploading.value = false
  }
  return false
}

type GraphNode = {
  id: string
  name: string
  category: string | number
  value: number
  symbolSize: number
  properties: Record<string, any>
}

// 拉取知识图谱数据（保持原有逻辑，新增properties存储）
const fetchGraph = async () => {
  try {
    const resp = await kgApi.get('/api/neo4j/graph', { params: { limit: 500 } })
    const data = resp?.data
    if (!data) return

    // 去重节点并构建集合
    const nodeMap = new Map<string, any>()
    ;(data.nodes || []).forEach((n: any) => {
      const id = String(n.id ?? n.name)
      if (!nodeMap.has(id)) nodeMap.set(id, n)
    })
    const uniqueNodes = Array.from(nodeMap.values())

    // 过滤只保留端点都存在的边
    const nodeIdSet = new Set(Array.from(nodeMap.keys()))
    const filteredLinksRaw = (data.relationships || []).filter((e: any) => nodeIdSet.has(String(e.source)) && nodeIdSet.has(String(e.target)))

    nodeCount.value = uniqueNodes.length
    relationshipCount.value = filteredLinksRaw.length

    const labelSet = new Set<string>()
    const nodes: GraphNode[] = uniqueNodes.map((n: any) => {
      const label = n.label || (Array.isArray(n.labels) ? n.labels[0] : 'Entity')
      labelSet.add(label)
      const value: number = Number((n.properties && (n.properties.weight || n.properties.count)) || 1)
      return {
        id: String(n.id ?? n.name),
        name: n.name ?? String(n.id),
        category: label,
        value,
        symbolSize: Math.min(80, Math.max(10, value * 6)),
        properties: n.properties || {}
      }
    })
    const labelArray = Array.from(labelSet)
    const categories = labelArray.map(l => ({ name: l }))
    const categoryIndex = (label: string) => Math.max(0, labelArray.indexOf(label))
    nodes.forEach((n: GraphNode) => { n.category = categoryIndex(String(n.category)) })

    // 处理关系：新增原始属性存储（用于tooltip显示）
    const links = filteredLinksRaw.map((e: any) => ({
      source: String(e.source),
      target: String(e.target),
      value: e.type || '',
      properties: e.properties || {},
      type: e.type || ''
    }))

    renderGraph({ nodes, links, categories, labelArray })
  } catch (e: any) {
    ElMessage.error('知识图谱加载失败：' + (e?.message || '未知错误'))
  }
}

// 渲染图表：新增tooltip配置，显示详细信息
const renderGraph = (graphData: { 
  nodes: GraphNode[]; 
  links: any[]; 
  categories: any[];
  labelArray: string[]
}) => {
  nextTick(() => {
    if (!chart && chartRef.value) {
      chart = echarts.init(chartRef.value)
      window.addEventListener('resize', () => chart && chart.resize())
    }
    if (!chart) return

    // 强制清空并重绘，避免残留导致重复ID错误
    chart.clear()

    chart.setOption({
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#eee',
        borderWidth: 1,
        borderRadius: 6,
        textStyle: { color: '#333', fontSize: 14 },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const node = params.data as GraphNode
            const nodeType = graphData.labelArray[params.data.category]
            let html = `
              <div style="font-weight:600;margin-bottom:8px;color:#2c3e50;">${node.name}</div>
              <div style="margin-bottom:4px;"><span style=\"color:#666;\">类型：</span>${nodeType}</div>
              <div style="margin-bottom:4px;"><span style=\"color:#666;\">ID：</span>${node.id}</div>
            `
            Object.entries(node.properties).forEach(([k, v]) => {
              if (k !== 'name' && v) {
                html += `<div style=\"margin-bottom:4px;\"><span style=\"color:#666;\">${k}：</span>${v}</div>`
              }
            })
            return html
          } else if (params.dataType === 'edge') {
            const link = params.data
            const sourceNode = graphData.nodes.find(n => n.id === link.source)?.name || link.source
            const targetNode = graphData.nodes.find(n => n.id === link.target)?.name || link.target
            let html = `
              <div style="font-weight:600;margin-bottom:8px;color:#2c3e50;">${link.type || '关联关系'}</div>
              <div style="margin-bottom:4px;"><span style=\"color:#666;\">关联：</span>${sourceNode} → ${targetNode}</div>
            `
            Object.entries(link.properties).forEach(([k, v]) => {
              if (v) html += `<div style=\"margin-bottom:4px;\"><span style=\"color:#666;\">${k}：</span>${v}</div>`
            })
            return html
          }
          return ''
        }
      },
      legend: [{ data: graphData.categories.map(c => c.name) }],
      series: [{
        type: 'graph',
        layout: 'force',
        data: graphData.nodes,
        links: graphData.links,
        categories: graphData.categories,
        roam: true,
        label: { show: true, position: 'right' },
        force: { repulsion: 200, edgeLength: [50, 150] },
        lineStyle: { color: '#aaa', width: 1 },
        emphasis: { focus: 'adjacency' },
        edgeLabel: { show: false }
      }]
    }, true, false)
  })
}

// 文件上传逻辑（保持不变）
// 简化：移除上传入口

// 简化后不再包含构建/清空/上传/从MySQL全量同步按钮

const fetchStats = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/neo4j/stats')
    const result = await response.json()
    if (result.status === 'success') {
      kgStats.value = result
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 清空图谱功能已移除

// 全量MySQL同步功能已移除

const syncBorrowFromMySQL = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/sync/borrow/from_mysql', { method: 'POST' })
    const data = await res.json()
    if (data.status === 'success') {
      ElMessage.success('借阅同步完成')
      await fetchGraph()
    } else {
      throw new Error(data.message || '同步失败')
    }
  } catch (e: any) {
    ElMessage.error('同步失败：' + (e?.message || '未知错误'))
  }
}

onMounted(async () => {
  await fetchGraph()
  await fetchStats()
})
</script>

<template>
  <div style="padding: 16px; text-align: left;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px;">
      <h2 style="margin: 0;">知识图谱</h2>
      <div style="display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end;">
        <el-input v-model="keyword" placeholder="搜索节点，如：周芳" style="max-width: 260px;" @keyup.enter="onSearch"/>
        <el-button type="primary" :loading="searching" @click="onSearch">搜索</el-button>
        <el-upload :auto-upload="false" :show-file-list="false" accept=".csv,.json,.txt" :on-change="onUploadFile">
          <el-button :loading="uploading">上传文件更新图谱</el-button>
        </el-upload>
        <el-button type="success" :loading="uploadLoading" @click="fetchGraph">刷新图谱</el-button>
        <el-button type="warning" @click="syncBorrowFromMySQL">同步借阅</el-button>
        <div style="font-size: 14px; color: #666;">{{ nodeCount }} 节点 / {{ relationshipCount }} 关系</div>
      </div>
    </div>

    <div ref="chartRef" style="width: 100%; height: calc(100vh - 120px);"></div>
  </div>
</template>

<style scoped>
</style>


