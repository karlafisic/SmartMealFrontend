<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

// --------------------
// Router & Auth
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
const mode = ref('daily') // daily | weekly | monthly | all

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedWeekStart = ref(new Date().toISOString().slice(0, 10))
const selectedMonth = ref(new Date().toISOString().slice(0, 7))

const result = ref(null)

// --------------------
// Navigation
// --------------------
const goRecipes = () => router.push('/recipes')
const addRecipe = () => router.push('/add-recipe')
const goMealPlanner = () => router.push('/meal-plan')
const goProfile = () => router.push('/profile')

// --------------------
// Helpers
// --------------------
function formatDate(date) {
  return new Date(date).toLocaleDateString('hr-HR')
}

// --------------------
// API Calls
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
    error.value = 'Failed to load analytics'
  } finally {
    loading.value = false
  }
}

// Load daily by default
onMounted(fetchAnalytics)
</script>

<template>
  <div class="analytics-bg d-flex align-items-center justify-content-center">
    <div class="analytics-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADING OVERLAY -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- HEADER -->
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold brand" href="#">SmartMeal AI</a>

          <div class="ms-auto d-flex gap-2">
            <button class="btn btn-outline-success fw-semibold" @click="goRecipes">
              Recipes
            </button>

            <button class="btn btn-outline-success fw-semibold" @click="addRecipe">
              Add Recipe
            </button>

            <button class="btn btn-outline-success fw-semibold" @click="goMealPlanner">
              Meal Planner
            </button>

            <button class="btn btn-outline-success fw-semibold profile-btn" @click="goProfile">
              Profile
            </button>
          </div>
        </div>
      </nav>

      <!-- TITLE -->
      <div class="mb-3">
        <h2 class="fw-bold brand mb-1">Nutrition Analytics</h2>
        <p class="text-muted mb-0">
          Track calories, macros and meals over time.
        </p>
      </div>

      <!-- MODE SELECT -->
      <div class="card rounded-4 shadow-sm p-3 p-md-4 filter-card mb-4">
        <h5 class="fw-bold mb-3">Select period</h5>

        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label fw-semibold">Mode</label>
            <select v-model="mode" class="form-select">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="all">All time</option>
            </select>
          </div>

          <!-- DATE PICKERS -->
          <div class="col-md-3" v-if="mode === 'daily'">
            <label class="form-label fw-semibold">Date</label>
            <input type="date" v-model="selectedDate" class="form-control" />
          </div>

          <div class="col-md-3" v-if="mode === 'weekly'">
            <label class="form-label fw-semibold">Week start</label>
            <input type="date" v-model="selectedWeekStart" class="form-control" />
          </div>

          <div class="col-md-3" v-if="mode === 'monthly'">
            <label class="form-label fw-semibold">Month</label>
            <input type="month" v-model="selectedMonth" class="form-control" />
          </div>

          <div class="col-md-3">
            <button class="btn btn-success fw-bold w-100" @click="fetchAnalytics">
              Apply
            </button>
          </div>
        </div>
      </div>

      <!-- ERROR -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <!-- RESULTS -->
      <div v-if="result" class="card rounded-4 shadow-sm p-3 p-md-4">

        <!-- DAILY / MONTHLY / ALL -->
        <div v-if="mode !== 'weekly'">
          <h5 class="fw-bold mb-3">
            {{ mode === 'daily' ? 'Summary for ' + formatDate(result.date) : '' }}
            {{ mode === 'monthly' ? 'Summary for ' + result.month : '' }}
            {{ mode === 'all' ? 'All time summary' : '' }}
          </h5>

          <div class="row text-center mb-3">
            <div class="col-md-3" v-for="(val, key) in result.total" :key="key">
              <div class="stat-box">
                <div class="stat-value">{{ val }}</div>
                <div class="stat-label">{{ key }}</div>
              </div>
            </div>
          </div>

          <h6 class="fw-bold">Meals</h6>
          <ul class="list-group list-group-flush">
            <li v-for="meal in result.meals" :key="meal.id" class="list-group-item">
              {{ formatDate(meal.date) }} – {{ meal.recipe.name }}
            </li>
          </ul>
        </div>

        <!-- WEEKLY -->
        <div v-if="mode === 'weekly'">
          <h5 class="fw-bold mb-3">Weekly overview</h5>

          <div v-for="day in result" :key="day.date" class="mb-3 p-3 border rounded-3">
            <strong>{{ formatDate(day.date) }}</strong>

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
/* full screen green background */
.analytics-bg {
  min-height: 100vh;
  width: 100%;
  background: #198754;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-x: hidden;
}

/* central panel */
.analytics-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
}

/* faded logo */
.analytics-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/logosmartmeal.jpeg');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: cover;
  opacity: 0.10;
  z-index: 0;
}

.analytics-panel > * {
  position: relative;
  z-index: 1;
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

/* brand */
.brand {
  color: #198754;
}

/* profile button */
.profile-btn {
  border-color: #6fdd8b;
  color: #198754;
}
.profile-btn:hover {
  background-color: #6fdd8b;
  border-color: #6fdd8b;
  color: #fff;
}

/* cards */
.filter-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

/* stat boxes */
.stat-box {
  background: #f1f8f5;
  padding: 0.8rem;
  border-radius: 10px;
}
.stat-box.small {
  padding: 0.6rem;
}
.stat-value {
  font-weight: 700;
  font-size: 1.2rem;
  color: #198754;
}
.stat-label {
  text-transform: capitalize;
  font-size: 0.85rem;
  color: #555;
}
</style>