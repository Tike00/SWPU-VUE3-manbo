<template>
    <div class="page-container">
        <div class="login-box">
            <!-- 左侧：品牌展示区 -->
            <div class="welcome-section">
                <div class="brand-content">
                    <div class="logo-circle">
                        <i class="fas fa-gift"></i>
                    </div>
                    <h1>曼波手办</h1>
                    <p class="subtitle">Mambo Figure Management</p>
                    <div class="description">
                        <p>欢迎回到销售管理平台</p>
                        <p>这里是连接二次元与现实的桥梁</p>
                    </div>
                </div>
                <!-- 装饰性背景圆圈 -->
                <div class="circle circle-1"></div>
                <div class="circle circle-2"></div>
            </div>

            <!-- 右侧：登录表单区 -->
            <div class="login-section">
                <div class="login-header">
                    <h2>管理员登录</h2>
                    <p>请输入您的工号或管理员账号</p>
                </div>

                <form class="login-form" @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label for="username">账号</label>
                        <div class="input-wrapper">
                            <i class="fas fa-user input-icon"></i>
                            <input
                                type="text"
                                id="username"
                                v-model="loginForm.username"
                                placeholder="请输入管理员账号"
                                required
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">密码</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input
                                :type="showPassword ? 'text' : 'password'"
                                id="password"
                                v-model="loginForm.password"
                                placeholder="请输入密码"
                                required
                            >
                            <span class="password-toggle" @click="togglePassword">
                                <i class="fas" :class="showPassword ? 'fa-eye' : 'fa-eye-slash'"></i>
                            </span>
                        </div>
                    </div>

                    <div class="form-options">
                        <div class="remember-me">
                            <input type="checkbox" id="remember" v-model="loginForm.remember">
                            <label for="remember">记住我</label>
                        </div>
                        <a href="#" class="forgot-password">忘记密码？</a>
                    </div>

                    <button type="submit" class="login-btn">
                        登录系统
                    </button>

                    <div class="signup-link">
                        还没有员工账号？ <a href="#">联系店长</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 表单数据
const loginForm = reactive({
    username: '',
    password: '',
    remember: false
});

// 密码显示状态
const showPassword = ref(false);

// 切换密码显示
const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

// 登录处理
const handleLogin = () => {
    // 这里可以添加真实的登录验证逻辑
    console.log('Logging in with:', loginForm);

    // 模拟登录成功跳转
    // 注意：原本代码中的 router-link 在 button 里是不规范的写法
    // 这里改为编程式导航
    router.push('/main/home');
};
</script>

<style scoped>
/* 全局容器：居中 & 背景 */
.page-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    padding: 20px;
}

/* 登录卡片主体 */
.login-box {
    display: flex;
    width: 900px;
    height: 550px;
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    position: relative;
}

/* --- 左侧欢迎区 (曼波风格) --- */
.welcome-section {
    flex: 1;
    background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    position: relative;
    overflow: hidden;
}

.brand-content {
    position: relative;
    z-index: 2;
}

.logo-circle {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto 20px;
    font-size: 36px;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.welcome-section h1 {
    font-size: 32px;
    margin-bottom: 5px;
    letter-spacing: 2px;
    font-weight: 700;
}

.welcome-section .subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 30px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.welcome-section .description p {
    font-size: 14px;
    line-height: 1.6;
    opacity: 0.8;
    margin: 5px 0;
}

/* 装饰圆圈 */
.circle {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
}

.circle-1 { width: 200px; height: 200px; top: -50px; left: -50px; }
.circle-2 { width: 150px; height: 150px; bottom: 30px; right: -30px; }

/* --- 右侧表单区 --- */
.login-section {
    flex: 1.2;
    padding: 50px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: #fff;
}

.login-header {
    margin-bottom: 40px;
}

.login-header h2 {
    color: #333;
    font-size: 28px;
    margin-bottom: 10px;
}

.login-header p {
    color: #999;
    font-size: 14px;
}

/* 表单控件 */
.form-group {
    margin-bottom: 25px;
}

.form-group label {
    display: block;
    color: #666;
    font-size: 13px;
    margin-bottom: 8px;
    font-weight: 500;
}

.input-wrapper {
    position: relative;
}

.input-wrapper input {
    width: 100%;
    padding: 12px 15px 12px 45px;
    border: 2px solid #eee;
    border-radius: 12px;
    font-size: 14px;
    transition: all 0.3s ease;
    outline: none;
    color: #333;
    box-sizing: border-box; /* 确保padding不撑大宽度 */
}

.input-wrapper input:focus {
    border-color: #fbc2eb;
    box-shadow: 0 0 0 4px rgba(251, 194, 235, 0.15);
}

.input-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #aaa;
    transition: color 0.3s;
}

.input-wrapper input:focus + .input-icon {
    color: #d45d79;
}

/* 密码切换按钮 */
.password-toggle {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #aaa;
    font-size: 14px;
}

.password-toggle:hover {
    color: #666;
}

/* 底部选项 */
.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    font-size: 13px;
}

.remember-me {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #666;
    cursor: pointer;
}

.remember-me input {
    accent-color: #d45d79;
}

.forgot-password {
    color: #d45d79;
    text-decoration: none;
    font-weight: 600;
}

/* 登录按钮 */
.login-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(to right, #a18cd1, #fbc2eb);
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 5px 15px rgba(212, 93, 121, 0.2);
}

.login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(212, 93, 121, 0.3);
}

.login-btn:active {
    transform: translateY(0);
}

/* 注册/底部链接 */
.signup-link {
    text-align: center;
    margin-top: 25px;
    font-size: 13px;
    color: #888;
}

.signup-link a {
    color: #333;
    text-decoration: none;
    font-weight: 600;
    margin-left: 5px;
}

.signup-link a:hover {
    color: #d45d79;
    text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .login-box {
        flex-direction: column;
        height: auto;
        width: 100%;
    }

    .welcome-section {
        padding: 30px;
        min-height: 200px;
    }

    .login-section {
        padding: 30px 20px;
    }
}
</style>
