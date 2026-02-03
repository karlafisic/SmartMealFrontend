<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

// --------------------
// Autentikacija
// --------------------
const token = localStorage.getItem('token')
if (!token) router.push('/login')
api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// --------------------
// Stanje
// --------------------
const loading = ref(false)
const error = ref('')
const recommendations = ref([])
const menuOpen = ref(false)

// --------------------
// Forma
// --------------------
const form = ref({
  goal: '' // ✅ automatski iz profila
})

// ✅ učitaj goal iz profila
onMounted(async () => {
  try {
    const res = await api.get('/profile')
    form.value.goal = res.data.goal || ''
  } catch (err) {
    console.error(err)
  }
})

// --------------------
// Poziv API-ja
// --------------------
const fetchRecommendations = async () => {
  loading.value = true
  error.value = ''
  recommendations.value = []

  try {
    // šaljemo goal (može biti i prazno, backend onda uzme iz profila)
    const res = await api.post('/recommendations', { goal: form.value.goal })
    recommendations.value = res.data.recommendations
  } catch (err) {
    error.value = 'Neuspjelo učitavanje preporuka'
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
  <div class="recommend-bg d-flex align-items-center justify-content-center">
    <div class="recommend-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADING OVERLAY -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Učitavanje...</span>
        </div>
      </div>

      <!-- HEADER -->
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm custom-navbar">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold brand" href="#">SmartMeal AI</a>

          <div class="ms-auto d-flex gap-2 align-items-center">
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
          <div class="menu-item" @click="navigate('/recipes')">
            <span class="menu-icon">📖</span>
            <span>Recepti</span>
          </div>
          <div class="menu-item" @click="navigate('/profile')">
            <span class="menu-icon">👤</span>
            <span>Profil</span>
          </div>
          <div class="menu-item logout-item" @click="logout">
            <span class="menu-icon">🚪</span>
            <span>Odjava</span>
          </div>
        </div>
      </transition>

      <!-- Overlay when menu is open -->
      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>

      <!-- NASLOV -->
      <div class="mb-3">
        <h2 class="fw-bold brand mb-1">Preporuke recepata</h2>
        <p class="text-muted mb-0">
          Dobij prijedloge recepata prema tvom cilju.
        </p>
      </div>

      <!-- FORMA -->
      <div class="card rounded-4 shadow-sm p-3 p-md-4 filter-card mb-4">
        <h5 class="fw-bold mb-3 section-title">Odaberi cilj</h5>

        <div class="row g-3 align-items-end">
          <div class="col-md-9">
            <label class="form-label fw-semibold">Cilj</label>
            <select v-model="form.goal" class="form-select">
              <option value="">Bez specifičnog cilja</option>
              <option value="weight_loss">Gubitak težine</option>
              <option value="maintenance">Održavanje</option>
              <option value="muscle_gain">Povećanje mišićne mase</option>
            </select>
          </div>

          <div class="col-md-3">
            <button
              class="btn btn-primary fw-bold w-100"
              @click="fetchRecommendations"
              :disabled="loading"
            >
              {{ loading ? 'Učitavanje…' : 'Dohvati preporuke' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger py-2 mt-3">
          {{ error }}
        </div>
      </div>

      <!-- REZULTATI -->
      <div v-if="recommendations.length" class="card rounded-4 shadow-sm p-3 p-md-4 result-card">
        <h5 class="fw-bold mb-3 section-title">Preporučeni recepti</h5>

        <div class="row row-cols-1 row-cols-md-2 g-3">
          <div v-for="recipe in recommendations" :key="recipe.id" class="col">
            <div
              class="recipe-card p-3 rounded-3 shadow-sm h-100"
              @click="router.push(`/recipes/${recipe.id}`)"
            >
              <strong class="recipe-title">{{ recipe.name }}</strong>
              <div class="recipe-meta">
                {{ recipe.calories }} kcal • {{ recipe.protein }}g proteina
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!loading && recommendations.length === 0 && !error" class="text-muted text-center">
        Još nema preporuka.
      </p>

    </div>
  </div>
</template>

<style scoped>
/* ✅ bež background */
.recommend-bg {
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
.recommend-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

/* ✅ food pozadina */
.recommend-panel::before {
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

.recommend-panel > * {
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

/* Logout item */
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

/* loader */
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

/* navbar soft */
.custom-navbar {
  background: rgba(255, 255, 255, 0.92) !important;
  border: 0;
}

/* brand + naslovi */
.brand {
  color: #9C6644;
}
.section-title,
.form-label {
  color: #3E2723;
}

/* cards */
.filter-card,
.result-card {
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

/* recipe cards */
.recipe-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.25);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.recipe-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
}

.recipe-title {
  display: block;
  font-size: 1rem;
  color: #9C6644;
}
.recipe-meta {
  font-size: 0.85rem;
  color: #555;
  margin-top: 0.2rem;
}
</style>
