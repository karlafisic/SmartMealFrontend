<template>
  <div class="recipes-bg d-flex align-items-center justify-content-center">
    <div class="recipes-panel shadow-lg rounded-4 p-4 p-md-5">
      <div class="recipe-page container-fluid py-2">
        <!-- HEADER -->
        <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm">
          <div class="container-fluid">
            <a class="navbar-brand fw-bold brand" href="#">SmartMeal AI</a>

            <div class="ms-auto d-flex gap-2">
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

        <!-- FILTER CARD -->
        <div v-if="isLoggedIn" class="card mb-4 p-3 rounded-4 shadow-sm filter-card">
          <h5 class="fw-bold mb-3">Filter Recipes</h5>

          <div class="row g-3 align-items-end">
            <div class="col-md-2">
              <label class="form-label fw-semibold">Min Calories</label>
              <input type="number" class="form-control" v-model="minCalories" />
            </div>

            <div class="col-md-2">
              <label class="form-label fw-semibold">Max Calories</label>
              <input type="number" class="form-control" v-model="maxCalories" />
            </div>

            <!-- Ingredients -->
            <div class="col-md-4 dropdown-wrapper">
              <label class="form-label fw-semibold">Ingredients</label>

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
                        : 'Select ingredients'
                    }}
                  </span>
                </button>

                <div class="dropdown-menu p-3">
                  <input
                    type="text"
                    class="form-control mb-2"
                    placeholder="Search ingredients..."
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
                    No ingredients found.
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-2">
              <button class="btn btn-success w-100 fw-bold" @click="fetchRecipes">
                Apply
              </button>
            </div>

            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100 fw-bold" @click="resetFilters">
                Clear
              </button>
            </div>
          </div>
        </div>

        <!-- LOADING -->
        <div v-if="loading" class="loading-overlay">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- RECIPE GRID -->
        <div v-if="!loading" class="row row-cols-1 row-cols-md-3 g-4">
          <div class="col" v-for="recipe in recipes" :key="recipe.id">
            <RecipeCard :recipe="recipe" />
          </div>
        </div>

        <!-- EMPTY -->
        <div v-if="!loading && recipes.length === 0" class="mt-4 text-center text-muted">
          <p class="mb-0">No recipes found for the selected filters.</p>
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

const recipes = ref([])
const loading = ref(true)
const isLoggedIn = ref(!!localStorage.getItem('token'))

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

// Refresh preko query parametra
onMounted(() => {
  if (route.query.refresh) {
    fetchRecipes()
    router.replace({ query: {} })
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

const goProfile = () => router.push('/profile')
const addRecipe = () => router.push('/add-recipe')
const goMealPlanner = () => router.push('/meal-plan') // promijeni ako ti je druga ruta
</script>

<style scoped>
/* full screen green background (kao login) */
.recipes-bg {
  min-height: 100vh;
  width: 100%;
  background: #198754;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-x: hidden;   /* <-- uklanja horizontalnu strelicu */
}

/* centralni panel (kao login card) */
.recipes-panel {
  position: relative;
  width: 100%;
  max-width: 1200px;
  min-height: calc(100vh - 48px);
  height: auto;
  overflow: visible;
  background: #ffffff;
}

/* faded logo u pozadini panela */
.recipes-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/logosmartmeal.jpeg');  /* <-- VRACENA SLIKA */
  background-repeat: no-repeat;
  background-position: top center;
  background-size: cover;
  opacity: 0.10;
  z-index: 0;
}

/* sadržaj iznad slike */
.recipes-panel > * {
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

/* brand boja */
.brand {
  color: #198754;
}

/* profile gumb svjetliji zeleni */
.profile-btn {
  border-color: #6fdd8b;
  color: #198754;
}
.profile-btn:hover {
  background-color: #6fdd8b;
  border-color: #6fdd8b;
  color: #fff;
}

/* filter card malo “soft” */
.filter-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
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

/* pomakni dropdown strelicu udesno */
.dropdown-toggle::after {
  margin-left: auto;
  margin-right: 4px;
}
</style>