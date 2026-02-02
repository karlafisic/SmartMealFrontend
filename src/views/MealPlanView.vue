<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

// --------------------
// Auth
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

// --------------------
// Form
// --------------------
const form = ref({
  date: '',
  goal: '',
  preferences: []
})

const preferenceInput = ref('')

// --------------------
// Preferences helpers
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
// API call
// --------------------
const generatePlan = async () => {
  error.value = ''
  result.value = null

  if (!form.value.date) {
    error.value = 'Please select a date.'
    return
  }

  loading.value = true

  try {
    const res = await api.post('/meal-plan', form.value)
    result.value = res.data
  } catch (err) {
    error.value = 'Failed to generate meal plan.'
  } finally {
    loading.value = false
  }
}

// --------------------
// Nav buttons
// --------------------
const goRecipes = () => router.push('/recipes')
const addRecipe = () => router.push('/add-recipe')
const goProfile = () => router.push('/profile')

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

      <!-- LOADING OVERLAY -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- HEADER -->
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm custom-navbar">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold brand" href="#">SmartMeal AI</a>

          <div class="ms-auto d-flex gap-2">
            <button class="btn btn-outline-primary fw-semibold" @click="goRecipes">
              Recipes
            </button>

            <button class="btn btn-outline-primary fw-semibold" @click="addRecipe">
              Add Recipe
            </button>

            <button class="btn btn-outline-primary fw-semibold profile-btn" @click="goProfile">
              Profile
            </button>
          </div>
        </div>
      </nav>

      <!-- TITLE -->
      <div class="mb-3">
        <h2 class="fw-bold brand mb-1">Meal Plan Generator</h2>
        <p class="text-muted mb-0">Generate a plan based on your goal and preferences.</p>
      </div>

      <!-- ERROR -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <!-- FORM CARD -->
      <div class="card rounded-4 shadow-sm p-3 p-md-4 form-card">
        <h5 class="fw-bold mb-3 section-title">Generate plan</h5>

        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label fw-semibold">Date</label>
            <input type="date" class="form-control" v-model="form.date" />
          </div>

          <div class="col-md-8">
            <label class="form-label fw-semibold">Goal (optional)</label>
            <select class="form-select" v-model="form.goal">
              <option value="">Choose goal...</option>
              <option value="weight_loss">Weight loss</option>
              <option value="maintenance">Maintenance</option>
              <option value="muscle_gain">Muscle gain</option>
            </select>
          </div>

          <!-- Preferences -->
          <div class="col-12">
            <label class="form-label fw-semibold">Preferences</label>

            <div class="d-flex gap-2 flex-wrap">
              <input
                type="text"
                class="form-control flex-grow-1"
                v-model="preferenceInput"
                placeholder="Add preference (e.g. vegetarian, low carb)"
                @keyup.enter="addPreference"
              />
              <button type="button" class="btn btn-primary fw-bold" @click="addPreference">
                Add
              </button>
            </div>

            <!-- Tags -->
            <div class="mt-3" v-if="form.preferences.length">
              <div class="d-flex flex-wrap gap-2">
                <span
                  v-for="pref in form.preferences"
                  :key="pref"
                  class="badge rounded-pill pref-badge"
                >
                  {{ pref }}
                  <button class="btn-close ms-2" aria-label="Remove" @click="removePreference(pref)"></button>
                </span>
              </div>
            </div>

            <div v-else class="text-muted mt-2">
              No preferences added.
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4 flex-wrap">
          <button class="btn btn-primary fw-bold flex-grow-1" @click="generatePlan" :disabled="loading">
            Generate meal plan
          </button>

          <button class="btn btn-outline-secondary fw-bold" @click="clearAll" :disabled="loading">
            Clear
          </button>
        </div>
      </div>

      <!-- RESULT CARD -->
      <div v-if="result" class="card rounded-4 shadow-sm p-3 p-md-4 mt-4 result-card">
        <h5 class="fw-bold mb-3 section-title">Meal plan for {{ result.date }}</h5>

        <div class="row g-3">
          <div v-for="meal in result.meals" :key="meal.id" class="col-md-6">
            <div class="meal-box p-3 rounded-3 shadow-sm">
              <div class="fw-bold text-capitalize mb-1 meal-title">{{ meal.meal_type }}</div>
              <div class="text-muted small">Recipe ID: {{ meal.recipe_id }}</div>
            </div>
          </div>
        </div>

        <p class="text-muted mt-3 mb-0">
          Meals are automatically saved to <strong>My Meals</strong>.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ✅ bež background kao ostale */
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

/* profile button */
.profile-btn {
  color: #9C6644;
  border-color: #9C6644;
}
.profile-btn:hover {
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
