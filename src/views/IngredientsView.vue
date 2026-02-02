<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

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
const ingredients = ref([])
const newIngredient = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const initialLoading = ref(true)

// --------------------
// Navigation
// --------------------
const goRecipes = () => router.push('/recipes')
const addRecipe = () => router.push('/add-recipe')
const goMealPlanner = () => router.push('/meal-plan')
const goProfile = () => router.push('/profile')

// --------------------
// API
// --------------------
async function loadIngredients() {
  error.value = ''
  try {
    const res = await api.get('/ingredients')
    ingredients.value = res.data
  } catch (err) {
    error.value = 'Failed to load ingredients'
  } finally {
    initialLoading.value = false
  }
}

onMounted(loadIngredients)

async function addIngredient() {
  const name = newIngredient.value.trim()
  if (!name) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const res = await api.post('/ingredients', { name })
    ingredients.value.unshift(res.data)
    newIngredient.value = ''
    success.value = 'Ingredient added successfully!'
  } catch (err) {
    if (err.response?.status === 422) {
      error.value = 'Ingredient already exists'
    } else {
      error.value = 'Failed to add ingredient'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="ing-bg d-flex align-items-center justify-content-center">
    <div class="ing-panel shadow-lg rounded-4 p-4 p-md-5">

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
        <h2 class="fw-bold brand mb-1">Ingredients</h2>
        <p class="text-muted mb-0">Add and view your ingredient list.</p>
      </div>

      <!-- INITIAL LOADING -->
      <div v-if="initialLoading" class="text-center my-4">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- ALERTS -->
      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
      <div v-if="success" class="alert alert-success py-2">{{ success }}</div>

      <div v-if="!initialLoading">
        <!-- ADD INGREDIENT -->
        <div class="card rounded-4 shadow-sm p-3 p-md-4 form-card mb-4">
          <h5 class="fw-bold mb-3 section-title">Add Ingredient</h5>

          <div class="row g-2 align-items-end">
            <div class="col-md-9">
              <label class="form-label fw-semibold">Ingredient name</label>
              <input
                class="form-control"
                v-model="newIngredient"
                placeholder="e.g. Eggs, Flour, Ketchup"
                @keyup.enter="addIngredient"
                :disabled="loading"
              />
            </div>

            <div class="col-md-3">
              <button
                class="btn btn-primary fw-bold w-100"
                @click="addIngredient"
                :disabled="loading || !newIngredient.trim()"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Add
              </button>
            </div>
          </div>
        </div>

        <!-- LIST -->
        <div class="card rounded-4 shadow-sm p-3 p-md-4 list-card">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fw-bold mb-0 section-title">All ingredients</h5>
            <span class="badge rounded-pill count-badge">
              {{ ingredients.length }}
            </span>
          </div>

          <div v-if="ingredients.length === 0" class="text-muted text-center py-4">
            No ingredients yet.
          </div>

          <ul v-else class="list-group list-group-flush">
            <li
              v-for="ing in ingredients"
              :key="ing.id"
              class="list-group-item d-flex align-items-center justify-content-between"
            >
              <span class="fw-semibold">{{ ing.name }}</span>
              <span class="text-muted small">#{{ ing.id }}</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ✅ ISTI background kao ostale stranice */
.ing-bg {
  min-height: 100vh;
  width: 100%;
  background: #F5EFE6;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-x: hidden;
}

/* panel – isto ponašanje kao recipes */
.ing-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

/* food pozadina */
.ing-panel::before {
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

.ing-panel > * {
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
.list-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

/* section title */
.section-title,
.form-label {
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

/* count badge */
.count-badge {
  background-color: #B08968;
}
</style>
