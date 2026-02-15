<template>
  <div class="recipes-bg d-flex align-items-center justify-content-center">
    <div class="recipes-panel shadow-lg rounded-4 p-4 p-md-5">
      <div class="recipe-page container-fluid py-2">

        <!-- HEADER -->
        <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm custom-navbar">
          <div class="container-fluid">
<router-link
  to="/dashboard"
  class="navbar-brand fw-bold brand text-decoration-none"
>
  SmartMeal
</router-link>
            <div class="ms-auto d-flex gap-2 align-items-center">
              <button class="btn btn-outline-primary fw-semibold" @click="addRecipe">
                Dodaj recept
              </button>

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

        <!-- DROPDOWN MENU -->
        <transition name="slide-fade">
          <div v-if="menuOpen" class="dropdown-menu-custom shadow-lg rounded-4">
            <div class="menu-item" @click="navigate('/meal-plan')">📅 Planer obroka</div>
            <div class="menu-item" @click="navigate('/analytics')">📊 Analitika</div>
            <div class="menu-item" @click="navigate('/ingredients')">🥕 Sastojci</div>
            <div class="menu-item" @click="navigate('/recommendations')">⭐ Preporuke</div>
            <div class="menu-item" @click="navigate('/profile')">👤 Profil</div>
            <div class="menu-item" @click="navigate('/meals')">🍽️ Obroci</div>
          </div>
        </transition>

        <!-- OVERLAY -->
        <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>

        <!-- FILTER CARD -->
        <div v-if="isLoggedIn" class="card mb-4 p-3 rounded-4 shadow-sm filter-card">
          <h5 class="fw-bold mb-3 section-title">Filtriranje i sortiranje</h5>

          <div class="row g-3 align-items-end">
            <div class="col-md-2">
              <label class="form-label fw-semibold">Min kcal</label>
              <input type="number" class="form-control" v-model="minCalories" />
            </div>

            <div class="col-md-2">
              <label class="form-label fw-semibold">Max kcal</label>
              <input type="number" class="form-control" v-model="maxCalories" />
            </div>

            <div class="col-md-3">
              <label class="form-label fw-semibold">Sortiraj po</label>
              <select class="form-select" v-model="sortBy">
                <option value="">Bez sortiranja</option>
                <option value="calories">Kalorije</option>
                <option value="prep_time">Vrijeme pripreme</option>
              </select>
            </div>

            <div class="col-md-3">
              <label class="form-label fw-semibold">Smjer</label>
              <select class="form-select" v-model="sortOrder" :disabled="!sortBy">
                <option value="asc">Uzlazno</option>
                <option value="desc">Silazno</option>
              </select>
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
          <div class="spinner-border" role="status"></div>
        </div>

        <!-- RECIPE GRID -->
        <div v-if="!loading" class="row row-cols-1 row-cols-md-3 g-4">
          <div class="col" v-for="recipe in displayedRecipes" :key="recipe.id">
            <RecipeCard :recipe="recipe" :currentUserId="currentUserId" />
          </div>
        </div>

        <!-- EMPTY -->
        <div v-if="!loading && recipes.length === 0" class="text-center text-muted mt-4">
          Nema recepata za odabrane filtre.
        </div>

        <!-- LOAD MORE -->
        <div v-if="!loading && recipes.length" class="d-flex justify-content-center mt-4">
          <button
            class="btn btn-outline-primary fw-bold px-4"
            @click="loadMore"
            :disabled="loadingMore || !hasMore"
          >
            <span v-if="loadingMore">Učitavam...</span>
            <span v-else-if="hasMore">Učitaj još</span>
            <span v-else>Nema više recepata</span>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import RecipeCard from '@/components/RecipeCard.vue'

/* utils */
function debounce(fn, delay = 400) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

const router = useRouter()

const isLoggedIn = ref(!!localStorage.getItem('token'))
const currentUserId = ref(null)

/* menu */
const menuOpen = ref(false)
const toggleMenu = () => (menuOpen.value = !menuOpen.value)
const navigate = (path) => {
  menuOpen.value = false
  router.push(path)
}

/* data */
const recipes = ref([])
const loading = ref(true)
const loadingMore = ref(false)

/* pagination */
const limit = 20
const offset = ref(0)
const hasMore = ref(true)

/* filters */
const minCalories = ref('')
const maxCalories = ref('')

/* sorting */
const sortBy = ref('')
const sortOrder = ref('asc')

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

const displayedRecipes = computed(() => {
  const list = [...recipes.value]
  if (!sortBy.value) return list
  const dir = sortOrder.value === 'desc' ? -1 : 1
  return list.sort((a, b) => (num(a[sortBy.value]) - num(b[sortBy.value])) * dir)
})

/* fetch */
const fetchRecipes = async ({ append = false } = {}) => {
  loading.value = !append
  loadingMore.value = append

  try {
    const params = {
      limit,
      offset: append ? offset.value : 0
    }

    if (minCalories.value) params.min_calories = minCalories.value
    if (maxCalories.value) params.max_calories = maxCalories.value

    const res = await api.get('/recipes', {
      params,
      headers: isLoggedIn.value
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
        : {}
    })

    const items = res.data || []

    if (append) {
      recipes.value.push(...items)
      offset.value += items.length
    } else {
      recipes.value = items
      offset.value = items.length
    }

    hasMore.value = items.length === limit
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const fetchDebounced = debounce(() => {
  offset.value = 0
  hasMore.value = true
  fetchRecipes()
})

const loadMore = () => {
  if (!hasMore.value || loadingMore.value) return
  fetchRecipes({ append: true })
}

const resetFilters = () => {
  minCalories.value = ''
  maxCalories.value = ''
  sortBy.value = ''
  sortOrder.value = 'asc'
  offset.value = 0
  hasMore.value = true
  fetchRecipes()
}

const addRecipe = () => router.push('/add-recipe')

watch([minCalories, maxCalories], fetchDebounced)

onMounted(async () => {
  if (isLoggedIn.value) {
    try {
      const res = await api.get('/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      currentUserId.value = res.data.id
    } catch {}
  }
  fetchRecipes()
})
</script>

<style scoped>
/* ✅ BACKGROUND S SLIKOM KAO NA DRUGOM KODU */
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

/* ✅ PSEUDO-ELEMENT ZA BACKGROUND SLIKU */
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

/* ✅ SVE OSTALO IZNAD BACKGROUNDA */
.recipes-panel > * {
  position: relative;
  z-index: 1;
}

.brand { color: #9C6644; }

/* navbar */
.custom-navbar {
  background: rgba(255,255,255,0.92) !important;
  border: 0;
}

/* filter card soft */
.filter-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}

/* section title */
.section-title {
  color: #3E2723;
}

/* hamburger */
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

/* dropdown */
.dropdown-menu-custom {
  position: absolute;
  top: 80px;
  right: 24px;
  background: #fff;
  border: 1px solid #e0e0e0;
  min-width: 240px;
  z-index: 2500;
  overflow: hidden;
}

.menu-item {
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 15px;
  font-weight: 500;
  color: #3E2723;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: #F5EFE6;
  color: #9C6644;
}

/* overlay */
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.2);
  z-index: 2000;
}

/* animation */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* buttons */
.btn-outline-primary {
  color: #9C6644;
  border-color: #9C6644;
}
.btn-outline-primary:hover {
  background: #9C6644;
  color: #fff;
  border-color: #9C6644;
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
</style>