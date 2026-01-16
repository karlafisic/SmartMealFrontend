<template>
  <div class="login-page d-flex align-items-center justify-content-center">
    <div class="card shadow p-5 rounded-4">
      <div class="text-center mb-4">
        <h2 class="fw-bold brand">SmartMeal AI</h2>
        <p class="text-muted">Plan your meals smartly and effortlessly</p>
      </div>

      <form @submit.prevent="login">
        <div class="mb-3">
          <label class="form-label fw-semibold">Email</label>
          <input
            type="email"
            v-model="email"
            class="form-control"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Password</label>
          <input
            type="password"
            v-model="password"
            class="form-control"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="error" class="alert alert-danger py-2">
          {{ error }}
        </div>

        <div v-if="success" class="alert alert-success py-2">
          {{ success }}
        </div>

        <button
          type="submit"
          class="btn btn-success w-100 fw-bold mt-2"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          Sign In
        </button>
      </form>

      <div class="text-center mt-3">
        <small class="text-muted">
          Don’t have an account?
          <span class="fw-semibold register-link" @click="goRegister">
            Sign Up
          </span>
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

async function login() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const res = await api.post('/login', {
      email: email.value,
      password: password.value
    })

    localStorage.setItem('token', res.data.token)
    success.value = 'Login successful! Redirecting...'
    setTimeout(() => router.push('/recipes'), 1000)

  } catch (err) {
    error.value =
      err.response?.status === 401
        ? 'Invalid credentials. Please check your email and password.'
        : 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function goRegister() {
  router.push('/register')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100vw;
  background: #198754;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  position: relative; /* važno zbog ::before */
  width: 460px;
  max-width: 100%;
  overflow: hidden;
  background: #ffffff;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* FADED LOGO BACKGROUND */
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/logosmartmeal.jpeg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  opacity: 0.25;
  z-index: 0;
}

.card > * {
  position: relative;
  z-index: 1;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.15);
}

.brand {
  color: #198754;
}

/* BUTTON GREEN */
.btn-success {
  background-color: #198754;
  border-color: #198754;
}

.btn-success:hover {
  background-color: #157347;
  border-color: #157347;
}

/* REGISTER LINK – GREEN */
.register-link {
  color: #198754;
  cursor: pointer;
}

.register-link:hover {
  text-decoration: underline;
}
</style>
