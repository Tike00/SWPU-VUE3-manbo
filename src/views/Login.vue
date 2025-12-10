<template>
    <div class="container">
        <div class="welcome-section">
            <h1>欢迎回来</h1>
            <p>登录您的账户以访问个性化内容、管理您的个人资料，并享受我们提供的所有服务。</p>
            <p style="margin-top: 20px;">如果您还没有账户，可以立即注册，只需要几分钟时间即可完成。</p>
        </div>
        
        <div class="login-section">
            <div class="login-header">
                <h2>用户登录</h2>
                <p>请输入您的凭据以继续</p>
            </div>
            
            <form class="login-form" id="loginForm">
                <div class="form-group">
                    <label for="username">用户名或邮箱</label>
                    <i class="fas fa-user"></i>
                    <input type="text" id="username" placeholder="请输入用户名或邮箱" required>
                    <div class="error-text">请输入有效的用户名或邮箱</div>
                </div>
                
                <div class="form-group">
                    <label for="password">密码</label>
                    <i class="fas fa-lock"></i>
                    <input type="password" id="password" placeholder="请输入密码" required>
                    <span class="password-toggle" id="passwordToggle">
                        <i class="fas fa-eye"></i>
                    </span>
                    <div class="error-text">密码必须至少6个字符</div>
                </div>
                
                <div class="form-options">
                    <div class="remember-me">
                        <input type="checkbox" id="remember">
                        <label for="remember">记住我</label>
                    </div>
                    <a href="#" class="forgot-password">忘记密码？</a>
                </div>
                
                <button type="submit" class="login-btn">
                    <router-link to="/main/home" class="btn-text">登录</router-link>
                </button>
                
                <div class="signup-link">
                    还没有账户？ <a href="#">立即注册</a>
                </div>
            </form>
            <router-view />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
</script>
<style scoped>
@import "../assets/login.css";
</style>