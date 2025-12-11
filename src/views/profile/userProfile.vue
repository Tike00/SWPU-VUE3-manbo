<template>
  <div class="page">
    <!-- 个人信息总卡片 -->
    <el-card class="main-card" shadow="hover">
      <!-- 顶部：头像 + 昵称 + 标签 -->
      <div class="top-section">
        <div class="avatar-block">
          <!-- 头像 -->
          <el-avatar
            :size="96"
            :src="avatarUrl"
            class="avatar-img"
          >
            曼
          </el-avatar>
        </div>

        <div class="info-block">
          <div class="name-row">
            <span class="username">无敌曼波大王</span>
            <el-tag type="success" effect="dark" class="tag-item">
              哈基米文化核心粉丝
            </el-tag>
            <el-tag type="warning" effect="plain" class="tag-item">
              曼波手办重度玩家
            </el-tag>
          </div>

          <div class="signature">
            签名：
            <span>{{ signature }}</span>
          </div>

          <div class="meta-row">
            <span>UID：{{ profile.uid }}</span>
            <span>加入时间：{{ profile.joinDate }}</span>
            <span>最近登录：{{ profile.lastLogin }}</span>
          </div>
        </div>
      </div>

      <el-divider />

      <!-- 中部：左右布局 -->
      <div class="middle-section">
        <!-- 左侧：基础信息 -->
        <div class="left-panel">
          <h3 class="block-title">基础信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="昵称">
              无敌曼波大王
            </el-descriptions-item>
            <el-descriptions-item label="偏好 IP">
              <el-tag
                v-for="ip in profile.favoriteIps"
                :key="ip"
                size="small"
                class="mr-4"
              >
                {{ ip }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="偏好品类">
              <el-tag
                v-for="cate in profile.favoriteCategories"
                :key="cate"
                type="info"
                size="small"
                class="mr-4"
              >
                {{ cate }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="常用地址">
              哈基米文化线上工作室 · 曼波收藏室
            </el-descriptions-item>
          </el-descriptions>

          <h3 class="block-title second">年度指标（Mock）</h3>
          <div class="metrics">
            <div class="metric-item">
              <div class="metric-label">今年已入手手办</div>
              <div class="metric-value">{{ profile.yearFigures }} 款</div>
              <el-progress :percentage="Math.min(profile.yearFigures * 5, 100)" />
            </div>
            <div class="metric-item">
              <div class="metric-label">年度预算使用</div>
              <div class="metric-value">
                {{ profile.budgetUsed }} / {{ profile.budgetTotal }} 元
              </div>
              <el-progress :percentage="budgetPercent" />
            </div>
          </div>
        </div>

        <!-- 右侧：偏好 & 活动 -->
        <div class="right-panel">
          <h3 class="block-title">IP 偏好占比（Mock）</h3>
          <div class="ip-stats">
            <div
              v-for="item in ipStats"
              :key="item.name"
              class="ip-stat-row"
            >
              <div class="ip-stat-header">
                <span>{{ item.name }}</span>
                <span class="ip-stat-percent">{{ item.percent }}%</span>
              </div>
              <el-progress :percentage="item.percent" />
            </div>
          </div>

          <h3 class="block-title second">最近活动（Mock）</h3>
          <el-timeline>
            <el-timeline-item
              v-for="act in activities"
              :key="act.time"
              :timestamp="act.time"
              placement="top"
            >
              <div class="activity-title">{{ act.title }}</div>
              <div class="activity-desc">{{ act.desc }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import avatarSrc from '@/assets/avatar/manbo.jpg'

// 如果你要满足多单词组件名的 ESLint 规则，可以加这一行：
// defineOptions({ name: 'UserProfile' })

// 头像绑定本地图片
const avatarUrl = ref<string>(avatarSrc)

// 个性签名
const signature = ref<string>('无名小基，还是哈气天下！')

// 个人基础信息（Mock）
const profile = ref({
  uid: 'MAMBO-0001',
  joinDate: '2025-01-01',
  lastLogin: '2025-12-11 20:20',
  favoriteIps: ['曼波', '耄耋', '哈基米文化'],
  favoriteCategories: ['PVC景品', 'GK树脂', '桌面摆件'],
  yearFigures: 12,
  budgetUsed: 8888,
  budgetTotal: 15000,
})

// 年度预算使用百分比
const budgetPercent = computed(() =>
  Math.min(
    Math.round((profile.value.budgetUsed / profile.value.budgetTotal) * 100),
    100,
  ),
)

// IP 偏好占比（Mock 数据）
interface IpStat {
  name: string
  percent: number
}

const ipStats = ref<IpStat[]>([
  { name: '曼波', percent: 45 },
  { name: '哈基米文化', percent: 35 },
  { name: '耄耋', percent: 20 },
])

// 最近活动（Mock）
interface Activity {
  time: string
  title: string
  desc: string
}

const activities = ref<Activity[]>([
  {
    time: '2025-12-10',
    title: '预定《曼波 × 哈基米 联动款桌面宠物》',
    desc: '完成全款预定，预计下季度发货。',
  },
  {
    time: '2025-12-05',
    title: '确认《耄耋·南北绿豆 联名场景手办》收货',
    desc: '已加入收藏柜，状态：摆拍中。',
  },
  {
    time: '2025-11-28',
    title: '更新手办清单',
    desc: '清点本年度入手记录，准备生成年度报告。',
  },
])
</script>

<style scoped>
.page {
  padding: 20px;
}

.main-card {
  width: 100%;
  box-sizing: border-box;
}

.top-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-block {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  border: 3px solid #ffd04b;
}

.info-block {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.username {
  font-size: 22px;
  font-weight: 700;
}

.tag-item {
  margin-left: 4px;
}

.signature {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

/* 中部布局：左右两列 */
.middle-section {
  display: flex;
  margin-top: 16px;
  gap: 16px;
  align-items: flex-start;
}

.left-panel {
  flex: 3;
}

.right-panel {
  flex: 2;
}

.block-title {
  font-size: 14px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #606266;
}

.block-title.second {
  margin-top: 24px;
}

/* 指标区 */
.metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-item {
  padding: 8px 0;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

/* IP 统计 */
.ip-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ip-stat-row {
  padding: 4px 0;
}

.ip-stat-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.ip-stat-percent {
  color: #909399;
}

/* 活动时间线 */
.activity-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 12px;
  color: #606266;
}

/* 工具类 */
.mr-4 {
  margin-right: 4px;
}
</style>
