<script setup>
import { ref, onMounted } from 'vue'
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
const meals = ref([])
const recipes = ref([])
const loading = ref(true)
const error = ref('')

// --------------------
// Form
// --------------------
const form = ref({
  recipe_id: '',
  date: '',
  meal_type: ''
})

// 📅 Hrvatski format datuma
function formatDate(date) {
  return new Date(date).toLocaleDateString('hr-HR')
}

// --------------------
// API
// --------------------
const fetchMeals = async () => {
  try {
    const res = await api.get('/meals')
    meals.value = res.data
  } catch (err) {
    error.value = 'Failed to load meals'
  } finally {
    loading.value = false
  }
}

const fetchRecipes = async () => {
  const res = await api.get('/recipes')
  recipes.value = res.data
}

const addMeal = async () => {
  error.value = ''
  try {
    await api.post('/meals', form.value)
    form.value = { recipe_id: '', date: '', meal_type: '' }
    fetchMeals()
  } catch (err) {
    error.value = 'Failed to add meal'
  }
}

// --------------------
// Navigation
// --------------------
const goRecipes = () => router.push('/recipes')
const addRecipe = () => router.push('/add-recipe')
const goProfile = () => router.push('/profile')
const goMealPlanner = () => router.push('/meal-plan')

onMounted(async () => {
  await fetchRecipes()
  await fetchMeals()
})
</script>

<template>
  <div class="meals-bg d-flex align-items-center justify-content-center">
    <div class="meals-panel shadow-lg rounded-4 p-4 p-md-5">

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
        <h2 class="fw-bold brand mb-1">My Meals</h2>
        <p class="text-muted mb-0">Manage and review your planned meals.</p>
      </div>

      <!-- ERROR -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <!-- ADD MEAL CARD -->
      <div class="card rounded-4 shadow-sm p-3 p-md-4 form-card mb-4">
        <h5 class="fw-bold mb-3 section-title">Add Meal</h5>

        <div class="row g-3">
          <div class="col-md-5">
            <label class="form-label fw-semibold">Recipe</label>
            <select class="form-select" v-model="form.recipe_id">
              <option disabled value="">Select recipe</option>
              <option v-for="r in recipes" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label fw-semibold">Date</label>
            <input type="date" class="form-control" v-model="form.date" />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-semibold">Meal type</label>
            <select class="form-select" v-model="form.meal_type">
              <option value="">Optional</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-primary fw-bold flex-grow-1" @click="addMeal">
            Add meal
          </button>
        </div>
      </div>

      <!-- LIST -->
      <div v-if="!loading" class="list">
        <div
          v-for="meal in meals"
          :key="meal.id"
          class="meal-box p-3 rounded-3 shadow-sm"
        >
          <div class="d-flex align-items-center justify-content-between mb-1">
            <strong class="date-text">{{ formatDate(meal.date) }}</strong>
            <span v-if="meal.meal_type" class="badge rounded-pill meal-type">
              {{ meal.meal_type }}
            </span>
          </div>

          <div class="recipe-name">
            {{ meal.recipe.name }}
          </div>
        </div>

        <p v-if="meals.length === 0" class="text-muted text-center mt-3">
          No meals yet.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ✅ bež background */
.meals-bg {
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
.meals-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

/* ✅ food pozadina */
.meals-panel::before {
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

.meals-panel > * {
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

/* cards */
.form-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

/* list */
.list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.meal-box {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.25);
}

.date-text {
  color: #3E2723;
}

/* badge */
.meal-type {
  background-color: #B08968;
  text-transform: capitalize;
}

.recipe-name {
  margin-top: 0.2rem;
  font-weight: 600;
  color: #9C6644;
}
</style>
