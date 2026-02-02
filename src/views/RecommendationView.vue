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
const recommendations = ref([])

// --------------------
// Form
// --------------------
const form = ref({
  goal: '',
  preferences: []
})

const preferenceInput = ref('')

// --------------------
// Preferences
// --------------------
const addPreference = () => {
  const value = preferenceInput.value.trim()
  if (value && !form.value.preferences.includes(value)) {
    form.value.preferences.push(value)
  }
  preferenceInput.value = ''
}

const removePreference = (pref) => {
  form.value.preferences = form.value.preferences.filter(p => p !== pref)
}

// --------------------
// API call
// --------------------
const fetchRecommendations = async () => {
  loading.value = true
  error.value = ''
  recommendations.value = []

  try {
    const res = await api.post('/recommendations', form.value)
    recommendations.value = res.data.recommendations
  } catch (err) {
    error.value = 'Failed to load recommendations'
  } finally {
    loading.value = false
  }
}

// --------------------
// Navigation
// --------------------
const goRecipes = () => router.push('/recipes')
const addRecipe = () => router.push('/add-recipe')
const goMealPlanner = () => router.push('/meal-plan')
const goProfile = () => router.push('/profile')
</script>

<template>
  <div class="recommend-bg d-flex align-items-center justify-content-center">
    <div class="recommend-panel shadow-lg rounded-4 p-4 p-md-5">

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

            <button class="btn btn-outline-primary fw-semibold" @click="goMealPlanner">
              Meal Planner
            </button>

            <button class="btn btn-outline-primary fw-semibold profile-btn" @click="goProfile">
              Profile
            </button>
          </div>
        </div>
      </nav>

      <!-- TITLE -->
      <div class="mb-3">
        <h2 class="fw-bold brand mb-1">Recipe Recommendations</h2>
        <p class="text-muted mb-0">
          Get personalized recipe suggestions based on your goals and preferences.
        </p>
      </div>

      <!-- FORM -->
      <div class="card rounded-4 shadow-sm p-3 p-md-4 filter-card mb-4">
        <h5 class="fw-bold mb-3 section-title">Your preferences</h5>

        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label fw-semibold">Goal</label>
            <select v-model="form.goal" class="form-select">
              <option value="">No specific goal</option>
              <option value="weight_loss">Weight loss</option>
              <option value="maintenance">Maintenance</option>
              <option value="muscle_gain">Muscle gain</option>
            </select>
          </div>

          <div class="col-md-5">
            <label class="form-label fw-semibold">Add preference</label>
            <div class="d-flex gap-2">
              <input
                type="text"
                v-model="preferenceInput"
                class="form-control"
                placeholder="e.g. vegetarian, low carb"
                @keyup.enter="addPreference"
              />
              <button type="button" class="btn btn-outline-primary fw-semibold" @click="addPreference">
                Add
              </button>
            </div>
          </div>

          <div class="col-md-3">
            <button
              class="btn btn-primary fw-bold w-100"
              @click="fetchRecommendations"
              :disabled="loading"
            >
              {{ loading ? 'Loading…' : 'Get recommendations' }}
            </button>
          </div>
        </div>

        <!-- TAGS -->
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

        <div v-else class="text-muted mt-3">
          No preferences added yet.
        </div>

        <!-- ERROR -->
        <div v-if="error" class="alert alert-danger py-2 mt-3">
          {{ error }}
        </div>
      </div>

      <!-- RESULTS -->
      <div v-if="recommendations.length" class="card rounded-4 shadow-sm p-3 p-md-4 result-card">
        <h5 class="fw-bold mb-3 section-title">Recommended recipes</h5>

        <div class="row row-cols-1 row-cols-md-2 g-3">
          <div v-for="recipe in recommendations" :key="recipe.id" class="col">
            <div
              class="recipe-card p-3 rounded-3 shadow-sm h-100"
              @click="router.push(`/recipes/${recipe.id}`)"
            >
              <strong class="recipe-title">{{ recipe.name }}</strong>
              <div class="recipe-meta">
                {{ recipe.calories }} kcal • {{ recipe.protein }}g protein
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!loading && recommendations.length === 0 && !error" class="text-muted text-center">
        No recommendations yet.
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

/* profile button (isti kao outline-primary) */
.profile-btn {
  color: #9C6644;
  border-color: #9C6644;
}
.profile-btn:hover {
  background-color: #9C6644;
  border-color: #9C6644;
  color: #fff;
}

/* preference badge */
.pref-badge {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.45);
  color: #9C6644;
  padding: 0.55rem 0.75rem;
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
