<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

// --------------------
// Router & Autentikacija
// --------------------
const router = useRouter()
const token = localStorage.getItem('token')
if (!token) router.push('/login')
api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// --------------------
// State
// --------------------
const loading = ref(false)
const error = ref('')
const mode = ref('daily') // dnevno | tjedno | mjesečno | sve
const menuOpen = ref(false)

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedWeekStart = ref(new Date().toISOString().slice(0, 10))
const selectedMonth = ref(new Date().toISOString().slice(0, 7))

const result = ref(null)

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

// --------------------
// Pomoćne funkcije
// --------------------
function formatDate(date) {
  return new Date(date).toLocaleDateString('hr-HR')
}
const statLabelsHR = {
  calories: 'Kalorije',
  protein: 'Proteini',
  fat: 'Masti',
  carbs: 'Ugljikohidrati'
}

// funkcija koja vraća hrvatski label
function getLabel(key) {
  return statLabelsHR[key] || key
}

// --------------------
// API pozivi
// --------------------
const fetchAnalytics = async () => {
  loading.value = true
  error.value = ''
  result.value = null

  try {
    let res

    if (mode.value === 'daily') {
      res = await api.get('/analytics/daily', {
        params: { date: selectedDate.value }
      })
    }

    if (mode.value === 'weekly') {
      res = await api.get('/analytics/weekly', {
        params: { start_date: selectedWeekStart.value }
      })
    }

    if (mode.value === 'monthly') {
      res = await api.get('/analytics/monthly', {
        params: { month: selectedMonth.value }
      })
    }

    if (mode.value === 'all') {
      res = await api.get('/analytics/all-time')
    }

    result.value = res.data
  } catch (err) {
    error.value = 'Neuspjelo učitavanje statistike'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAnalytics)
</script>

<template>
  <div class="analytics-bg d-flex align-items-center justify-content-center">
    <div class="analytics-panel shadow-lg rounded-4 p-4 p-md-5">

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
          <div class="menu-item" @click="navigate('/meal-plan')">
            <span class="menu-icon">📅</span>
            <span>Planer obroka</span>
          </div>
          <div class="menu-item" @click="navigate('/meals')">
            <span class="menu-icon">🍽️</span>
            <span>Obroci</span>
          </div>
          <div class="menu-item" @click="navigate('/recommendations')">
            <span class="menu-icon">⭐</span>
            <span>Preporuke</span>
          </div>
          <div class="menu-item" @click="navigate('/recipes')">
            <span class="menu-icon">📖</span>
            <span>Recepti</span>
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
        <h2 class="fw-bold brand mb-1">Analitika prehrane</h2>
        <p class="text-muted mb-0">
          Pratite kalorije, makronutrijente i obroke kroz vrijeme.
        </p>
      </div>

      <!-- ODABIR PERIODA -->
      <div class="card rounded-4 shadow-sm p-3 p-md-4 filter-card mb-4">
        <h5 class="fw-bold mb-3 section-title">Odaberite period</h5>

        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label fw-semibold">Način</label>
            <select v-model="mode" class="form-select">
              <option value="daily">Dnevno</option>
              <option value="weekly">Tjedno</option>
              <option value="monthly">Mjesečno</option>
              <option value="all">Sve vrijeme</option>
            </select>
          </div>

          <!-- ODABIR DATUMA -->
          <div class="col-md-3" v-if="mode === 'daily'">
            <label class="form-label fw-semibold">Datum</label>
            <input type="date" v-model="selectedDate" class="form-control" />
          </div>

          <div class="col-md-3" v-if="mode === 'weekly'">
            <label class="form-label fw-semibold">Početak tjedna</label>
            <input type="date" v-model="selectedWeekStart" class="form-control" />
          </div>

          <div class="col-md-3" v-if="mode === 'monthly'">
            <label class="form-label fw-semibold">Mjesec</label>
            <input type="month" v-model="selectedMonth" class="form-control" />
          </div>

          <div class="col-md-3">
            <button class="btn btn-primary fw-bold w-100" @click="fetchAnalytics">
              Primijeni
            </button>
          </div>
        </div>
      </div>

      <!-- GREŠKA -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <!-- REZULTATI -->
      <div v-if="result" class="card rounded-4 shadow-sm p-3 p-md-4 result-card">

        <!-- DNEVNO / MJESEČNO / SVE -->
        <div v-if="mode !== 'weekly'">
          <h5 class="fw-bold mb-3 section-title">
            {{ mode === 'daily' ? 'Sažetak za ' + formatDate(result.date) : '' }}
            {{ mode === 'monthly' ? 'Sažetak za ' + result.month : '' }}
            {{ mode === 'all' ? 'Sažetak za sve vrijeme' : '' }}
          </h5>

          <div class="row text-center mb-3">
            <div class="col-md-3" v-for="(val, key) in result.total" :key="key">
              <div class="stat-box">
                <div class="stat-value">{{ val }}</div>
                <div class="stat-label">{{ getLabel(key) }}</div>
              </div>
            </div>
          </div>

          <h6 class="fw-bold section-title">Obroci</h6>
          <ul class="list-group list-group-flush">
            <li v-for="meal in result.meals" :key="meal.id" class="list-group-item">
              {{ formatDate(meal.date) }} – {{ meal.recipe.name }}
            </li>
          </ul>
        </div>

        <!-- TJEDNO -->
        <div v-if="mode === 'weekly'">
          <h5 class="fw-bold mb-3 section-title">Pregled tjedna</h5>

          <div v-for="day in result" :key="day.date" class="mb-3 p-3 border rounded-3 weekly-day">
            <strong class="section-title">{{ formatDate(day.date) }}</strong>

            <div class="row text-center my-2">
              <div class="col-md-3" v-for="(val, key) in day.total" :key="key">
                <div class="stat-box small">
                  <div class="stat-value">{{ val }}</div>
                  <div class="stat-label">{{ key }}</div>
                </div>
              </div>
            </div>

            <ul class="list-group list-group-flush">
              <li v-for="meal in day.meals" :key="meal.id" class="list-group-item">
                {{ meal.recipe.name }}
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* ✅ ISTO kao recipes-bg */
.analytics-bg {
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
.analytics-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

/* food slika umjesto logo */
.analytics-panel::before {
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

.analytics-panel > * {
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

/* brand i naslov boje */
.brand {
  color: #9C6644;
}

/* navbar soft */
.custom-navbar {
  background: rgba(255, 255, 255, 0.92) !important;
  border: 0;
}

/* filter/result card soft */
.filter-card,
.result-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

.section-title {
  color: #3E2723;
}

/* smeđi primary */
.btn-primary {
  background-color: #B08968;
  border-color: #B08968;
}
.btn-primary:hover {
  background-color: #9C6644;
  border-color: #9C6644;
}

.btn-outline-primary {
  color: #9C6644;
  border-color: #9C6644;
}
.btn-outline-primary:hover {
  background-color: #9C6644;
  border-color: #9C6644;
  color: #fff;
}

/* stat boxes */
.stat-box {
  background: rgba(245, 239, 230, 0.85);
  padding: 0.8rem;
  border-radius: 10px;
  border: 1px solid rgba(176, 137, 104, 0.25);
}
.stat-box.small {
  padding: 0.6rem;
}
.stat-value {
  font-weight: 800;
  font-size: 1.2rem;
  color: #9C6644;
}
.stat-label {
  text-transform: capitalize;
  font-size: 0.85rem;
  color: #555;
}

/* weekly day border */
.weekly-day {
  border-color: rgba(176, 137, 104, 0.25) !important;
  background: rgba(255, 255, 255, 0.75);
}
</style>