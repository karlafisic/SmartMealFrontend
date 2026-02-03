<template>
  <div class="recipes-bg d-flex align-items-center justify-content-center">
    <div class="recipes-panel shadow-lg rounded-4 p-4 p-md-5">
      <div class="recipe-page container-fluid py-2">
        <!-- HEADER -->
        <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm custom-navbar">
          <div class="container-fluid">
            <a class="navbar-brand fw-bold brand" href="#">SmartMeal AI</a>

            <div class="ms-auto d-flex gap-2 align-items-center">
              <button class="btn btn-outline-primary fw-semibold" @click="addRecipe">
                Dodaj recept
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
            <div class="menu-item" @click="navigate('/meal-plan')">
              <span class="menu-icon">📅</span>
              <span>Planer obroka</span>
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
            <div class="menu-item" @click="navigate('/meals')">
              <span class="menu-icon">🍽️</span>
              <span>Obroci</span>
            </div>
          </div>
        </transition>

        <!-- Overlay when menu is open -->
        <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>

        <!-- FILTER CARD -->
        <div v-if="isLoggedIn" class="card mb-4 p-3 rounded-4 shadow-sm filter-card">
          <h5 class="fw-bold mb-3 section-title">Filtriranje recepata</h5>

          <div class="row g-3 align-items-end">
            <div class="col-md-2">
              <label class="form-label fw-semibold">Minimalno kalorija</label>
              <input type="number" class="form-control" v-model="minCalories" />
            </div>

            <div class="col-md-2">
              <label class="form-label fw-semibold">Maksimalno kalorija</label>
              <input type="number" class="form-control" v-model="maxCalories" />
            </div>

            <!-- Ingredients -->
            <div class="col-md-4 dropdown-wrapper">
              <label class="form-label fw-semibold">Sastojci</label>

              <div class="dropdown">
                <button
                  class="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex align-items-center"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <span class="flex-grow-1">
                    {{
                      selectedIngredients.length
                        ? selectedIngredients.map(i => i.name).join(', ')
                        : 'Odaberite sastojke'
                    }}
                  </span>
                </button>

                <div class="dropdown-menu p-3">
                  <input
                    type="text"
                    class="form-control mb-2"
                    placeholder="Pretraživanje sastojaka..."
                    v-model="ingredientSearch"
                  />

                  <div v-for="ingredient in filteredIngredients" :key="ingredient.id">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="'ingredient-' + ingredient.id"
                        :value="ingredient"
                        v-model="selectedIngredients"
                      />
                      <label class="form-check-label" :for="'ingredient-' + ingredient.id">
                        {{ ingredient.name }}
                      </label>
                    </div>
                  </div>

                  <div v-if="filteredIngredients.length === 0" class="text-muted mt-2">
                    Nisu pronađeni sastojci.
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-2">
              <button class="btn btn-primary w-100 fw-bold" @click="fetchRecipes">
                Primijeni
              </button>
            </div>

            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100 fw-bold" @click="resetFilters">
                Očisti
              </button>
            </div>
          </div>
        </div>

        <!-- LOADING -->
        <div v-if="loading" class="loading-overlay">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Učitavanje...</span>
          </div>
        </div>

        <!-- RECIPE GRID -->
        <div v-if="!loading" class="row row-cols-1 row-cols-md-3 g-4">
          <div class="col" v-for="recipe in recipes" :key="recipe.id">
            <RecipeCard
              :recipe="recipe"
              :currentUserId="currentUserId"
            />

          </div>
        </div>

        <!-- EMPTY -->
        <div v-if="!loading && recipes.length === 0" class="mt-4 text-center text-muted">
          <p class="mb-0">Nisu pronađeni recepti za odabrane filtre.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import RecipeCard from '@/components/RecipeCard.vue'

function debounce(fn, delay = 400) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

const router = useRouter()
const route = useRoute()
const currentUserId = ref(null)

const recipes = ref([])
const loading = ref(true)
const isLoggedIn = ref(!!localStorage.getItem('token'))
const menuOpen = ref(false)

// Filters
const minCalories = ref('')
const maxCalories = ref('')
const allIngredients = ref([])
const selectedIngredients = ref([])
const ingredientSearch = ref('')

// Computed filtered ingredients for search
const filteredIngredients = computed(() => {
  if (!ingredientSearch.value) return allIngredients.value
  return allIngredients.value.filter(i =>
    i.name.toLowerCase().includes(ingredientSearch.value.toLowerCase())
  )
})

// Menu toggle
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

// Navigation
const navigate = (path) => {
  menuOpen.value = false
  router.push(path)
}

// Fetch recipes
const fetchRecipes = async () => {
  loading.value = true
  try {
    const params = { limit: 20 }
    if (minCalories.value) params.min_calories = minCalories.value
    if (maxCalories.value) params.max_calories = maxCalories.value
    if (selectedIngredients.value.length) {
      params.ingredients = selectedIngredients.value.map(i => i.id).join(',')
    }

    const res = await api.get('/recipes', {
      params,
      headers: isLoggedIn.value
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
        : {}
    })

    recipes.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const fetchRecipesDebounced = debounce(fetchRecipes, 400)

// Fetch ingredients
const fetchIngredients = async () => {
  try {
    const res = await api.get('/ingredients')
    allIngredients.value = res.data
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  await Promise.all([fetchIngredients(), fetchRecipes()])
})

onMounted(async () => {
  try {
    if (isLoggedIn.value) {
      const res = await api.get('/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      currentUserId.value = res.data.id
    }

    await Promise.all([fetchIngredients(), fetchRecipes()])
  } catch (err) {
    console.error(err)
  }
})


watch(
  () => route.query.refresh,
  (val) => {
    if (val) {
      fetchRecipes()
      router.replace({ query: {} })
    }
  }
)

// Auto-refresh na promjenu filtera (debounce)
watch([minCalories, maxCalories, selectedIngredients], fetchRecipesDebounced, { deep: true })

// Actions
const resetFilters = () => {
  minCalories.value = ''
  maxCalories.value = ''
  selectedIngredients.value = []
  ingredientSearch.value = ''
  fetchRecipes()
}

const addRecipe = () => router.push('/add-recipe')
</script>

<style scoped>
/* ✅ Usklađeno s login/register */
.recipes-bg {
  min-height: 100vh;
  width: 100%;
  background: #F5EFE6;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-x: hidden;
}

.recipes-panel {
  position: relative;
  width: 100%;
  max-width: 1200px;
  min-height: calc(100vh - 48px);
  height: auto;
  overflow: hidden;
  background: #ffffff;
}

.recipes-panel::before {
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

.recipes-panel > * {
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

/* brand boja */
.brand {
  color: #9C6644;
}

/* navbar malo "soft" */
.custom-navbar {
  background: rgba(255, 255, 255, 0.92) !important;
  border: 0;
}

/* filter card soft */
.filter-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

/* naslov sekcija */
.section-title {
  color: #3E2723;
}

/* ✅ Bootstrap primary prebacimo u smeđu (samo unutar ove stranice) */
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

/* dropdown da ide iznad kartica */
.dropdown-wrapper {
  position: relative;
  overflow: visible;
}

.dropdown-wrapper .dropdown-menu {
  position: absolute;
  z-index: 2000;
  max-height: 250px;
  overflow-y: auto;
  width: 100%;
}

.dropdown-toggle::after {
  margin-left: auto;
  margin-right: 4px;
}
</style>