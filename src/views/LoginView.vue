<template>
  <div class="login-page d-flex align-items-center justify-content-center">
    <div class="card shadow rounded-4">
      <div class="text-center mb-5">
        <h2 class="fw-bold brand">SmartMeal AI</h2>
        <p class="text-muted">Plan your meals smartly and effortlessly</p>
      </div>

      <form @submit.prevent="login">
        <div class="mb-4">
          <label class="form-label fw-semibold">Korisničko ime</label>
          <input
            type="email"
            v-model="email"
            class="form-control"
            placeholder="Upišite Vašu email adresu"
            required
          />
        </div>

        <div class="mb-4">
          <label class="form-label fw-semibold">Lozinka</label>
          <input
            type="password"
            v-model="password"
            class="form-control"
            placeholder="Upišite Vašu lozinku"
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
          class="btn btn-primary w-100 fw-bold mt-4"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          Prijavite se
        </button>
      </form>

      <div class="text-center mt-5">
        <small class="text-muted">
          Nemate račun?
          <span class="fw-semibold register-link" @click="goRegister">
            Registrirajte se.
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
    success.value = 'Uspješna prijava! Preusmjeravanje...'
    setTimeout(() => router.push('/dashboard'), 1000)

  } catch (err) {
    error.value =
      err.response?.status === 401
        ? 'Netočni podaci. Molimo provjerite Vašu email adresu i lozinku.'
        : 'Neuspješna prijava. Pokušajte ponovno.'
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
  background: #F5EFE6;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ⬆️ IZDUŽENA KARTICA */
.card {
  position: relative;
  width: 720px;
  max-width: 96%;
  min-height: 640px;         
  padding: 4.9rem 4rem;       
  overflow: hidden;
  background: #ffffff;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* FOOD SLIKA – sad se više vidi */
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/slika.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  opacity: 0.28;             
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
  color: #9C6644;
  font-size: 2.2rem;
}

.btn-primary {
  background-color: #B08968;
  border-color: #B08968;
  padding: 0.85rem;
}

.btn-primary:hover {
  background-color: #9C6644;
  border-color: #9C6644;
}

.register-link {
  color: #9C6644;
  cursor: pointer;
}

.register-link:hover {
  text-decoration: underline;
}

.form-label {
  color: #3E2723;
}

/* 📱 MOBILE */
@media (max-width: 576px) {
  .card {
    min-height: auto;
    padding: 2.5rem 2rem;
  }
}
</style>
