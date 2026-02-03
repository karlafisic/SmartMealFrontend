<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const user = ref(null)
const loading = ref(true)
const error = ref('')
const success = ref('')
const menuOpen = ref(false)

// --------------------
// Autentikacija
// --------------------
const token = localStorage.getItem('token')
if (!token) router.push('/login')
api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// --------------------
// Učitaj profil korisnika
// --------------------
onMounted(async () => {
  try {
    const res = await api.get('/me')
    user.value = res.data

    if (Array.isArray(user.value.preferences)) {
      user.value.preferences = user.value.preferences.join(', ')
    }
  } catch (err) {
    console.error(err)
    router.push('/login')
  } finally {
    loading.value = false
  }
})

// --------------------
// Spremi profil
// --------------------
async function saveProfile() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    let prefsArray = []
    if (user.value.preferences) {
      prefsArray = user.value.preferences
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }

    const res = await api.put('/profile', {
      goal: user.value.goal,
      preferences: prefsArray
    })

    success.value = res.data.message || 'Profil je uspješno ažuriran.'
  } catch (err) {
    error.value = 'Greška pri ažuriranju profila'
  } finally {
    loading.value = false
  }
}

// --------------------
// Menu & Navigation
// --------------------
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const navigate = (path) => {
  menuOpen.value = false
  router.push(path)
}

const logout = () => {
  menuOpen.value = false
  localStorage.removeItem('token')
  delete api.defaults.headers.common['Authorization']
  router.push('/login')
}
</script>

<template>
  <div class="profile-bg d-flex align-items-center justify-content-center">
    <div class="profile-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADING OVERLAY -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Učitavanje...</span>
        </div>
      </div>

      <!-- NAVBAR -->
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm custom-navbar">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold brand" href="#">SmartMeal AI</a>

          <div class="ms-auto d-flex gap-2 align-items-center">
            <!-- Hamburger Menu Button -->
            <button 
              class="btn btn-outline-primary hamburger-btn" 
              type="button"
              @click="toggleMenu"
            >
              <span class="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Dropdown Menu -->
      <transition name="slide-fade">
        <div v-if="menuOpen" class="dropdown-menu-custom shadow-lg rounded-4">
          <div class="menu-item" @click="navigate('/analytics')">
            <span class="menu-icon">📊</span>
            <span>Analitika</span>
          </div>
          <div class="menu-item" @click="navigate('/meal-plan')">
            <span class="menu-icon">📅</span>
            <span>Planer obroka</span>
          </div>
          <div class="menu-item" @click="navigate('/meals')">
            <span class="menu-icon">🍽️</span>
            <span>Obroci</span>
          </div>
          <div class="menu-item" @click="navigate('/recipes')">
            <span class="menu-icon">📖</span>
            <span>Recepti</span>
          </div>
          <div class="menu-item" @click="navigate('/recommendations')">
            <span class="menu-icon">⭐</span>
            <span>Preporuke</span>
          </div>
          <div class="menu-item logout-item" @click="logout">
            <span>Odjava</span>
          </div>
        </div>
      </transition>

      <!-- Overlay when menu is open -->
      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>

      <!-- NASLOV -->
      <div class="mb-3">
        <h2 class="fw-bold brand mb-1">Profil korisnika</h2>
        <p class="text-muted mb-0">Ažurirajte svoje ciljeve i preferencije.</p>
      </div>

      <!-- ERROR / SUCCESS -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <div v-if="success" class="alert alert-success py-2">
        {{ success }}
      </div>

      <!-- FORM CARD -->
      <div v-if="!loading && user" class="card rounded-4 shadow-sm p-3 p-md-4 form-card">
        <h5 class="fw-bold mb-3 section-title">Postavke profila</h5>

        <div class="row g-3">
          <div class="col-12">
            <label class="form-label fw-semibold">Cilj</label>
            <input
              type="text"
              class="form-control"
              v-model="user.goal"
              placeholder="Vaš cilj..."
            />
          </div>

          <div class="col-12">
            <label class="form-label fw-semibold">Preferencije (odvojene zarezom)</label>
            <input
              type="text"
              class="form-control"
              v-model="user.preferences"
              placeholder="npr. vegetarijanac, low-carb"
            />
            <div class="form-text">
              Odvojite više preferencija zarezom.
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button
            class="btn btn-primary fw-bold flex-grow-1"
            @click="saveProfile"
            :disabled="loading"
          >
            Spremi profil
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ✅ bež background kao ostale */
.profile-bg {
  min-height: 100vh;
  width: 100%;
  background: #F5EFE6;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-x: hidden;
}

/* panel */
.profile-panel {
  position: relative;
  width: 100%;
  max-width: 900px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

/* ✅ food pozadina */
.profile-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/slika.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  opacity: 0.14;
  z-index: 0;
}

.profile-panel > * {
  position: relative;
  z-index: 1;
}

/* Hamburger Button */
.hamburger-btn {
  padding: 8px 12px;
  border: 2px solid #9C6644;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hamburger-btn:hover {
  background-color: #9C6644;
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 24px;
}

.hamburger-icon span {
  display: block;
  width: 100%;
  height: 3px;
  background-color: #9C6644;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger-btn:hover .hamburger-icon span {
  background-color: #fff;
}

/* Dropdown Menu */
.dropdown-menu-custom {
  position: absolute;
  top: 80px;
  right: 24px;
  background: white;
  border: 1px solid #e0e0e0;
  min-width: 240px;
  z-index: 2500;
  overflow: hidden;
}

.menu-item {
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #3E2723;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #F5EFE6;
  color: #9C6644;
}

/* Logout item with red accent */
.logout-item:hover {
  background-color: #ffe6e6;
  color: #dc3545;
}

.menu-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

/* Menu Overlay */
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 2000;
}

/* Slide Fade Transition */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* loader overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(2px);
}

/* brand + naslovi */
.brand {
  color: #9C6644;
}
.section-title,
.form-label {
  color: #3E2723;
}

/* navbar soft */
.custom-navbar {
  background: rgba(255, 255, 255, 0.92) !important;
  border: 0;
}

/* card */
.form-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

/* ✅ smeđi primary */
.btn-primary {
  background-color: #B08968;
  border-color: #B08968;
}
.btn-primary:hover {
  background-color: #9C6644;
  border-color: #9C6644;
}

/* outline primary */
.btn-outline-primary {
  color: #9C6644;
  border-color: #9C6644;
}
.btn-outline-primary:hover {
  background-color: #9C6644;
  border-color: #9C6644;
  color: #fff;
}
</style>