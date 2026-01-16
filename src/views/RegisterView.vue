<template>
  <div class="login-page d-flex align-items-center justify-content-center">
    <div class="card shadow p-5 rounded-4">
      <div class="text-center mb-4">
        <h2 class="fw-bold brand">SmartMeal AI</h2>
        <p class="text-muted">Plan your meals smartly and effortlessly</p>
      </div>

      <form @submit.prevent="register">
        <div class="mb-3">
          <label class="form-label fw-semibold">Name</label>
          <input
            type="text"
            v-model="name"
            class="form-control"
            placeholder="Enter your name"
            required
          />
        </div>

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

        <div class="mb-3">
          <label class="form-label fw-semibold">Confirm Password</label>
          <input
            type="password"
            v-model="password_confirmation"
            class="form-control"
            placeholder="Confirm your password"
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
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          Sign Up
        </button>
      </form>

      <div class="text-center mt-3">
        <small class="text-muted">
          Already have an account?
          <span class="fw-semibold register-link" @click="goLogin">
            Sign In
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
const name = ref('')
const email = ref('')
const password = ref('')
const password_confirmation = ref('')

const error = ref('')
const success = ref('')
const loading = ref(false)

async function register() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await api.post('/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: password_confirmation.value
    })

    success.value = 'Registration successful! You can now log in.'
  } catch (err) {
    console.error(err)
    error.value = 'Registration failed. Email may already be in use.'
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push('/login')
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

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/logosmartmeal.jpeg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover; /* umjesto fiksnog 650px */
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

.btn-success {
  background-color: #198754;
  border-color: #198754;
}

.btn-success:hover {
  background-color: #157347;
  border-color: #157347;
}

.register-link {
  color: #198754;
  cursor: pointer;
}

.register-link:hover {
  text-decoration: underline;
}
</style>
