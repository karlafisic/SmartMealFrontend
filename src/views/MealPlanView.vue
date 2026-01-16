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
// Nav buttons (isti stil kao Recipes header)
// --------------------
const goRecipes = () => router.push('/recipes')
const addRecipe = () => router.push('/add-recipe')
const goProfile = () => router.push('/profile')
</script>

<template>
  <div class="planner-bg d-flex align-items-center justify-content-center">
    <div class="planner-panel shadow-lg rounded-4 p-4 p-md-5">

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

            <button class="btn btn-outline-success fw-semibold profile-btn" @click="goProfile">
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
        <h5 class="fw-bold mb-3">Generate plan</h5>

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
              <button type="button" class="btn btn-success fw-bold" @click="addPreference">
                Add
              </button>
            </div>

            <!-- Tags -->
            <div class="mt-3" v-if="form.preferences.length">
              <div class="d-flex flex-wrap gap-2">
                <span v-for="pref in form.preferences" :key="pref" class="badge rounded-pill text-bg-light pref-badge">
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

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-success fw-bold flex-grow-1" @click="generatePlan" :disabled="loading">
            Generate meal plan
          </button>

          <button class="btn btn-outline-secondary fw-bold" @click="() => { form.date=''; form.goal=''; form.preferences=[]; preferenceInput=''; result=null; error=''; }" :disabled="loading">
            Clear
          </button>
        </div>
      </div>

      <!-- RESULT CARD -->
      <div v-if="result" class="card rounded-4 shadow-sm p-3 p-md-4 mt-4 result-card">
        <h5 class="fw-bold mb-3">Meal plan for {{ result.date }}</h5>

        <div class="row g-3">
          <div v-for="meal in result.meals" :key="meal.id" class="col-md-6">
            <div class="meal-box p-3 rounded-3 shadow-sm">
              <div class="fw-bold text-capitalize mb-1">{{ meal.meal_type }}</div>
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
/* full screen green background */
.planner-bg {
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
.planner-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
}

/* faded logo background */
.planner-panel::before {
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

.planner-panel > * {
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

/* profile button light green */
.profile-btn {
  border-color: #6fdd8b;
  color: #198754;
}
.profile-btn:hover {
  background-color: #6fdd8b;
  border-color: #6fdd8b;
  color: #fff;
}

/* form card */
.form-card,
.result-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

/* preference badges */
.pref-badge {
  border: 1px solid rgba(25, 135, 84, 0.25);
  color: #198754;
  padding: 0.55rem 0.75rem;
}

/* meal boxes */
.meal-box {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(25, 135, 84, 0.15);
}
</style>