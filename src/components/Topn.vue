<script lang="ts" setup>
import { StarFilled } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const goToDetail = (bookId: String) => {
    // 跳转到动态路由，传递bookId
    router.push(`/books/${bookId}`)
}
// 返回上一界面方法
const handleBack = () => {
  router.back();
};
const value0 = ref(5.0)
const value1 = ref(4.9)
const value2 = ref(4.8)
const value3 = ref(4.7)
const value4 = ref(4.6)

</script>

<template>
    <el-card class="recording-container">
    <!-- 页头返回区域 -->
    <div class="header-bar">
      <div class="back-area" @click="handleBack">
        <i class="el-icon-arrow-left"></i>
        <span>返回</span>
      </div>
      <div class="title-sep">|</div>
      <div class="main-title">图书榜单</div>
    </div>



    <div class="page-container">
    <div class="book-item" @click="goToDetail('book0018')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank1">
                <strong>Top 1</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/hlm.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">红楼梦
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value0"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">都云作者痴，谁解其中味？</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    
  <el-divider>
      <el-icon><star-filled /></el-icon>
  </el-divider>
    <div class="book-item" @click="goToDetail('book0004')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank1">
                <strong>Top 2</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/st.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">三体
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value0"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">地球往事三部曲</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider>
      <el-icon><star-filled /></el-icon>
  </el-divider>
    <div class="book-item" @click="goToDetail('book0002')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank1">
                <strong>Top 3</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/hz.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">活着
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value0"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">生的苦难与伟大</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider>
      <el-icon><star-filled /></el-icon>
  </el-divider>
    <div class="book-item" @click="goToDetail('book0009')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 4</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/xwz.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">小王子
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value1"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">献给长成了大人的孩子们</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0032')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 5</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/wydt.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">我与地坛
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value1"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">这是你的罪孽与福祉</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0049')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 6</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/cnjs.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">城南旧事
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value1"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">长亭外，古道边，芳草碧连天</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0047')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 7</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/ssyzzgn.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">杀死一只知更鸟
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value1"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">有一种东西不能遵循从众原则，那就是——人的良心</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0041')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 8</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/dxpsd.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">邓小平时代
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value1"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">个人命运背后的历史变局</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0001')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 9</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/bngd.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">百年孤独
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value1"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">魔幻现实主义文学代表作</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0046')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 10</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/xmzdgs.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">新名字的故事
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value2"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">探索青年时代的激情、困惑、挣扎、背叛和失去</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0013')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 11</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/byx.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">白夜行
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value2"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">一宗离奇命案牵出跨度近20年步步惊心的故事</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0036')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 12</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/1984.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">1984
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value2"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">栗树荫下，我出卖你，你出卖我</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0034')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 13</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/yc.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">野草
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value2"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">我以这一丛野草，在明与暗，生与死，过去与未来之际，献于友与仇，人与兽，爱者与不爱者之前作证。</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0039')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 14</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/fsqdclly.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">房思琪的初恋乐园
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value2"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">向死而生的文学绝唱</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0033')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 15</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/hlbt.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">哈利·波特
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value2"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">从9¾站台开始的旅程</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0042')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 16</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/atsthgsj.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">安徒生童话故事集
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value3"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">为了争取未来的一代</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0050')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 17</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/bly.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">白鹿原
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value3"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">一轴关于我们民族灵魂的现实主义画卷</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0044')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 18</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/shldgs.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">撒哈拉的故事
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value3"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">游荡的自由灵魂</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0037')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 19</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/p.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">飘
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value3"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">革命时期的爱情，随风而逝</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0019')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 20</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/sgyy.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">三国演义
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value3"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">是非成败转头空</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0043')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 21</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/tlbb.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">天龙八部
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value3"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">有情皆孽，无人不冤</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0038')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 22</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/dwnc.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">动物农场
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value3"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">太阳底下并无新事</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0048')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 23</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/mcnxse.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">明朝那些事儿
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value4"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">不拘一格的历史书写</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0045')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 24</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/szdhz.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">失踪的孩子
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value4"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">我的整个生命，只是一场为了提升社会地位的低俗斗争。</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    <el-divider />
    <div class="book-item" @click="goToDetail('book0040')">
        <div class="common-layout">
            <el-container  class="aside">
            <el-aside width="100px" class="rank">
                <strong>Top 25</strong>
            </el-aside>
            <el-aside width="200px">
                <img src="/src/assets/images/fems.jpg" alt="HLM" class="hlm">
            </el-aside>
            <el-container>
                <el-header class="book-info">
                    <h2 class="book-title">福尔摩斯探案集
                    <span class="read-tag">点击查看详情</span>
                    </h2>
                </el-header>
                <el-main>
                    <el-rate class="rate"
                        v-model="value4"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                    />
                    <div class="text">名侦探的代名词</div>
                </el-main>
            </el-container>
            </el-container>
        </div>
    </div>
    </div>
    </el-card>
</template>

<style scoped>
    a{ /*设置超链接标签样式 对应于router-link*/
      text-decoration: none;
    }
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
    .page-container{
        transform: scale(0.75);  
        transform-origin: top center; /* 缩放原点，避免页面偏移 */
        /* 限制最大高度，超出部分滚动 */
        max-height: calc(110vh - 0px); /* 根据页面实际布局调整数值 */
        overflow-y: auto; /* 内容超出时显示滚动条 */
        padding-bottom: 0px; /* 底部预留少量空间，避免最后一条内容被截断 */
        /* 隐藏滚动条但保留功能 */
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE/Edge */

    }
    .hlm {
        width: 200px; /* 缩小宽度，高度自动按比例调整 */
        height: auto; /* 保持原始宽高比 */
        object-fit: contain; /* 确保图片完整显示在容器内 */
    }
    /* 统计卡片容器 */
    .stats-card {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px; 
        gap: 20px;
    }

    .stat-item {
        text-align: center;
        width: 100px; 
        height: 100px; 
        padding: 20px;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        transition: box-shadow 0.3s ease; 
    }

    .stat-item:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    .aside{
        margin-left:250px
    }
    .rank1{
        color: black;
        font-size: 35px;
        display: flex;
        align-items: center; /* 垂直居中 */
        margin-right: 30px;
        
    }
    .rank{
        color: black;
        font-size: 30px;
        display: flex;
        align-items: center; /* 垂直居中 */
        margin-right: 30px;
    }
    .rate{
        margin-bottom: 50px;
    }
    .text{
        color: rgb(145, 145, 145);
    }
    .book-info {
        display: flex;
        align-items: center;
    }
    .book-title {
        color: black;
        font-size: 30px;
        margin: 0 0 8px;
        line-height: 1; /* 设置行高为1，使标题垂直居中 */
    }
    
    .read-tag {
        background-color: white;
        color: orange;
        font-size: 9px;
        padding: 1px 4px;
        border-radius: 3px;
        margin-left: 6px;
        vertical-align: top;
        position: relative;
        top: 7px;
        border: 1px solid orange;
        height: 24px;
    }
    
</style>