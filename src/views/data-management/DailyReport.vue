<template>
  <div class="schedule-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">学生课表管理</h1>
      <p class="page-desc">查看和管理学生的课程安排</p>
    </div>

    <!-- 筛选区域 -->
    <el-card shadow="hover" class="filter-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="年级">
            <el-select v-model="selectedGrade" placeholder="请选择年级">
              <el-option label="一年级" value="1" />
              <el-option label="二年级" value="2" />
              <el-option label="三年级" value="3" />
              <el-option label="四年级" value="4" />
              <el-option label="五年级" value="5" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="班级">
            <el-select v-model="selectedClass" placeholder="请选择班级">
              <el-option label="1班" value="1" />
              <el-option label="2班" value="2" />
              <el-option label="3班" value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="学生">
            <el-select v-model="selectedStudent" placeholder="请选择学生">
              <el-option v-for="student in studentList" :key="student.id" :label="student.name" :value="student.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6" class="filter-actions">
          <el-button type="primary" @click="fetchSchedule">查询</el-button>
          <el-button type="default" @click="resetFilter">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 课表主体 -->
    <el-card shadow="hover" class="schedule-card">
      <div class="schedule-header">
        <h2 class="schedule-title">{{ currentStudentName }}的课程表</h2>
        <el-button type="text" @click="toggleWeekView">
          <el-icon><SwitchButton /></el-icon>
          {{ isWeekView ? '切换为日视图' : '切换为周视图' }}
        </el-button>
      </div>

      <!-- 周视图课表 -->
      <div v-if="isWeekView" class="week-schedule">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="time-column">时间/星期</th>
              <th v-for="day in weekDays" :key="day.value" class="day-column">{{ day.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(section, index) in courseSections" :key="index">
              <td class="time-cell">{{ section.time }}</td>
              <td v-for="day in weekDays" :key="day.value" class="course-cell">
                <div 
                  v-for="course in getCourseByTime(section.index, day.value)" 
                  :key="course.id"
                  class="course-item"
                  :style="{ backgroundColor: course.color }"
                >
                  <div class="course-name">{{ course.name }}</div>
                  <div class="course-teacher">{{ course.teacher }}</div>
                  <div class="course-room">{{ course.room }}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 日视图课表 -->
      <div v-else class="day-schedule">
        <el-select v-model="selectedDay" placeholder="请选择日期">
          <el-option v-for="day in weekDays" :key="day.value" :label="day.label" :value="day.value" />
        </el-select>
        
        <div class="day-courses">
          <div 
            v-for="(section, index) in courseSections" 
            :key="index"
            class="day-course-item"
          >
            <div class="day-course-time">{{ section.time }}</div>
            <div class="day-course-content">
              <div 
                v-if="getCourseByTime(section.index, selectedDay).length"
                class="course-item"
                :style="{ backgroundColor: getCourseByTime(section.index, selectedDay)[0].color }"
              >
                <div class="course-name">{{ getCourseByTime(section.index, selectedDay)[0].name }}</div>
                <div class="course-teacher">{{ getCourseByTime(section.index, selectedDay)[0].teacher }}</div>
                <div class="course-room">{{ getCourseByTime(section.index, selectedDay)[0].room }}</div>
              </div>
              <div v-else class="empty-course">无课程安排</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue"
import { SwitchButton } from '@element-plus/icons-vue'
import { ElCard, ElRow, ElCol, ElFormItem, ElSelect, ElOption, ElButton, ElIcon } from 'element-plus'

// 课程数据类型定义
interface Course {
  id: string
  name: string
  teacher: string
  room: string
  day: number // 1-5 代表周一到周五
  section: number // 1-6 代表课程节次
  color: string
}

// 学生数据类型
interface Student {
  id: string
  name: string
  grade: string
  class: string
}

export default defineComponent({
  name: "StudentSchedule",
  components: {
    ElCard,
    ElRow,
    ElCol,
    ElFormItem,
    ElSelect,
    ElOption,
    ElButton,
    ElIcon,
    SwitchButton
  },
  setup() {
    // 筛选条件
    const selectedGrade = ref('')
    const selectedClass = ref('')
    const selectedStudent = ref('')
    const isWeekView = ref(true)
    const selectedDay = ref(1)

    // 星期数据
    const weekDays = [
      { label: '周一', value: 1 },
      { label: '周二', value: 2 },
      { label: '周三', value: 3 },
      { label: '周四', value: 4 },
      { label: '周五', value: 5 }
    ]

    // 课程节次
    const courseSections = [
      { index: 1, time: '08:00-08:45' },
      { index: 2, time: '08:55-09:40' },
      { index: 3, time: '10:00-10:45' },
      { index: 4, time: '10:55-11:40' },
      { index: 5, time: '14:00-14:45' },
      { index: 6, time: '14:55-15:40' }
    ]

    // 模拟学生数据
    const studentList = ref<Student[]>([
      { id: '1', name: '张三', grade: '1', class: '1' },
      { id: '2', name: '李四', grade: '1', class: '1' },
      { id: '3', name: '王五', grade: '1', class: '2' },
      { id: '4', name: '赵六', grade: '2', class: '1' }
    ])

    // 课程数据
    const courseList = ref<Course[]>([])

    // 当前选中学生姓名
    const currentStudentName = computed(() => {
      const student = studentList.value.find(s => s.id === selectedStudent.value)
      return student ? student.name : ''
    })

    // 根据时间获取课程
    const getCourseByTime = (section: number, day: number) => {
      return courseList.value.filter(course => course.section === section && course.day === day)
    }

    // 模拟获取课表数据
    const fetchSchedule = () => {
      // 实际项目中这里应该是API请求
      courseList.value = [
        { id: '1', name: '语文', teacher: '王老师', room: '101', day: 1, section: 1, color: 'rgba(22, 93, 255, 0.2)' },
        { id: '2', name: '数学', teacher: '李老师', room: '101', day: 1, section: 2, color: 'rgba(0, 180, 42, 0.2)' },
        { id: '3', name: '英语', teacher: '张老师', room: '102', day: 1, section: 3, color: 'rgba(255, 125, 0, 0.2)' },
        { id: '4', name: '科学', teacher: '刘老师', room: '103', day: 2, section: 1, color: 'rgba(245, 63, 63, 0.2)' },
        { id: '5', name: '体育', teacher: '赵老师', room: '操场', day: 2, section: 4, color: 'rgba(135, 83, 255, 0.2)' },
        { id: '6', name: '音乐', teacher: '孙老师', room: '音乐室', day: 3, section: 2, color: 'rgba(0, 197, 232, 0.2)' },
        { id: '7', name: '美术', teacher: '周老师', room: '美术室', day: 4, section: 3, color: 'rgba(255, 77, 77, 0.2)' },
        { id: '8', name: '计算机', teacher: '吴老师', room: '电脑室', day: 5, section: 5, color: 'rgba(114, 124, 245, 0.2)' }
      ]
    }

    // 重置筛选条件
    const resetFilter = () => {
      selectedGrade.value = ''
      selectedClass.value = ''
      selectedStudent.value = ''
      courseList.value = []
    }

    // 切换视图
    const toggleWeekView = () => {
      isWeekView.value = !isWeekView.value
    }

    return {
      selectedGrade,
      selectedClass,
      selectedStudent,
      studentList,
      courseList,
      weekDays,
      courseSections,
      isWeekView,
      selectedDay,
      currentStudentName,
      getCourseByTime,
      fetchSchedule,
      resetFilter,
      toggleWeekView
    }
  }
})
</script>

<style scoped lang="scss">
.schedule-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;

  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  .page-desc {
    font-size: 14px;
    color: #666;
  }
}

.filter-card {
  margin-bottom: 20px;
  padding: 15px;

  .filter-actions {
    display: flex;
    gap: 10px;
    padding-top: 25px;
  }
}

.schedule-card {
  padding: 20px;

  .schedule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .schedule-title {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

// 周视图样式
.week-schedule {
  overflow-x: auto;

  .schedule-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;

    .time-column {
      width: 120px;
      background-color: #f5f7fa;
    }

    .day-column {
      width: calc((100% - 120px) / 5);
      text-align: center;
      background-color: #f5f7fa;
    }

    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px;
    }

    .time-cell {
      text-align: center;
      background-color: #f5f7fa;
      font-weight: 500;
    }

    .course-cell {
      min-height: 100px;
      vertical-align: top;
      padding: 5px;
    }
  }
}

// 日视图样式
.day-schedule {
  .day-courses {
    margin-top: 15px;
  }

  .day-course-item {
    display: flex;
    margin-bottom: 10px;

    .day-course-time {
      width: 120px;
      padding: 10px;
      background-color: #f5f7fa;
      border: 1px solid #e5e7eb;
      text-align: center;
    }

    .day-course-content {
      flex: 1;
      min-height: 80px;
      border: 1px solid #e5e7eb;
      border-left: none;
      padding: 5px;
    }
  }
}

// 课程项样式
.course-item {
  padding: 5px;
  border-radius: 4px;
  margin-bottom: 5px;
  color: #333;

  .course-name {
    font-weight: 600;
    font-size: 14px;
  }

  .course-teacher, .course-room {
    font-size: 12px;
  }
}

.empty-course {
  color: #999;
  font-size: 14px;
  text-align: center;
  line-height: 60px;
}
</style>