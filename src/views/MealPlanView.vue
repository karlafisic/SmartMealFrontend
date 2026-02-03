<script setup>
import { ref } from 'vue'
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
// State
// --------------------
const loading = ref(false)
const error = ref('')
const result = ref(null)
const menuOpen = ref(false)

// --------------------
// Forma
// --------------------
const form = ref({
  date: '',
  goal: '',
  preferences: []
})

const preferenceInput = ref('')

// --------------------
// Pomoćne funkcije za preference
// --------------------
const addPreference = () => {
  const value = preferenceInput.value.trim()
  if (!value) return
  if (form.value.preferences.includes(value)) return

  form.value.preferences.push(value)
  preferenceInput.value = ''
}

const removePreference = (pref) => {
  form.value.preferences = form.value.preferences.filter(p => p !== pref)
}

// --------------------
// API poziv
// --------------------
const generatePlan = async () => {
  error.value = ''
  result.value = null

  if (!form.value.date) {
    error.value = 'Odaberite datum.'
    return
  }

  loading.value = true

  try {
    const res = await api.post('/meal-plan', form.value)
    result.value = res.data
  } catch (err) {
    error.value = 'Greška pri generiranju plana obroka.'
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

const goMeals = () => router.push('/meals')

const clearAll = () => {
  form.value.date = ''
  form.value.goal = ''
  form.value.preferences = []
  preferenceInput.value = ''
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="planner-bg d-flex align-items-center justify-content-center">
    <div class="planner-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADER -->
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
            <button class="btn btn-outline-primary fw-semibold" @click="goMeals">
              Obroci
            </button>

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
          <div class="menu-item" @click="navigate('/recipes')">
            <span class="menu-icon">📖</span>
            <span>Recepti</span>
          </div>
          <div class="menu-item" @click="navigate('/analytics')">
            <span class="menu-icon">📊</span>
            <span>Analitika</span>
          </div>
          <div class="menu-item" @click="navigate('/ingredients')">
            <span class="menu-icon">🥕</span>
            <span>Sastojci</span>
          </div>
          <div class="menu-item" @click="navigate('/recommendations')">
            <span class="menu-icon">⭐</span>
            <span>Preporuke</span>
          </div>
          <div class="menu-item" @click="navigate('/profile')">
            <span class="menu-icon">👤</span>
            <span>Profil</span>
          </div>
        </div>
      </transition>

      <!-- Overlay when menu is open -->
      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>

      <!-- NASLOV -->
      <div class="mb-3">
        <h2 class="fw-bold brand mb-1">Generator plana obroka</h2>
        <p class="text-muted mb-0">Generirajte plan prema vašem cilju i preferencijama.</p>
      </div>

      <!-- GREŠKA -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <!-- FORM CARD -->
      <div class="card rounded-4 shadow-sm p-3 p-md-4 form-card">
        <h5 class="fw-bold mb-3 section-title">Generiraj plan</h5>

        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label fw-semibold">Datum</label>
            <input type="date" class="form-control" v-model="form.date" />
          </div>

          <div class="col-md-8">
            <label class="form-label fw-semibold">Cilj (opcionalno)</label>
            <select class="form-select" v-model="form.goal">
              <option value="">Odaberite cilj...</option>
              <option value="weight_loss">Gubitak težine</option>
              <option value="maintenance">Održavanje</option>
              <option value="muscle_gain">Povećanje mišićne mase</option>
            </select>
          </div>

          <!-- Preferencije -->
          <div class="col-12">
            <label class="form-label fw-semibold">Preferencije</label>

            <div class="d-flex gap-2 flex-wrap">
              <input
                type="text"
                class="form-control flex-grow-1"
                v-model="preferenceInput"
                placeholder="Dodajte preferenciju (npr. vegetarijanski, low carb)"
                @keyup.enter="addPreference"
              />
              <button type="button" class="btn btn-primary fw-bold" @click="addPreference">
                Dodaj
              </button>
            </div>

            <!-- Tagovi -->
            <div class="mt-3" v-if="form.preferences.length">
              <div class="d-flex flex-wrap gap-2">
                <span
                  v-for="pref in form.preferences"
                  :key="pref"
                  class="badge rounded-pill pref-badge"
                >
                  {{ pref }}
                  <button class="btn-close ms-2" aria-label="Ukloni" @click="removePreference(pref)"></button>
                </span>
              </div>
            </div>

            <div v-else class="text-muted mt-2">
              Nema dodanih preferencija.
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4 flex-wrap">
          <button class="btn btn-primary fw-bold flex-grow-1" @click="generatePlan" :disabled="loading">
            Generiraj plan obroka
          </button>

          <button class="btn btn-outline-secondary fw-bold" @click="clearAll" :disabled="loading">
            Očisti
          </button>
        </div>
      </div>

      <!-- RESULT CARD -->
      <div v-if="result" class="card rounded-4 shadow-sm p-3 p-md-4 mt-4 result-card">
        <h5 class="fw-bold mb-3 section-title">Plan obroka za {{ result.date }}</h5>

        <div class="row g-3">
          <div v-for="meal in result.meals" :key="meal.id" class="col-md-6">
            <div class="meal-box p-3 rounded-3 shadow-sm">
              <div class="fw-bold text-capitalize mb-1 meal-title">{{ meal.meal_type }}</div>
              <div class="text-muted small">ID recepta: {{ meal.recipe_id }}</div>
            </div>
          </div>
        </div>

        <p class="text-muted mt-3 mb-0">
          Obroci su automatski spremljeni u <strong>Moji obroci</strong>.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ✅ bež background */
.planner-bg {
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
.planner-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

/* ✅ food slika */
.planner-panel::before {
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

.planner-panel > * {
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

/* brand */
.brand {
  color: #9C6644;
}

/* navbar soft */
.custom-navbar {
  background: rgba(255, 255, 255, 0.92) !important;
  border: 0;
}

/* cards */
.form-card,
.result-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

.section-title,
.form-label {
  color: #3E2723;
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

/* preference badges */
.pref-badge {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.45);
  color: #9C6644;
  padding: 0.55rem 0.75rem;
}

/* meal boxes */
.meal-box {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.25);
}
.meal-title {
  color: #9C6644;
}
</style>