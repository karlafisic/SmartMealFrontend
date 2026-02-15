<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

// --------------------
// Autentikacija
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
const menuOpen = ref(false)

// ✅ EDIT state
const editingMealId = ref(null)
const editRecipeId = ref('')

// --------------------
// Forma
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

// ✅ OTVORI DETALJE RECEPTA
const goToRecipe = (meal) => {
  // sigurnost: ako iz nekog razloga nema recipe ili id
  const id = meal?.recipe?.id
  if (!id) return
  router.push(`/recipes/${id}`)
}

// --------------------
// API
// --------------------
const fetchMeals = async () => {
  try {
    const res = await api.get('/meals')
    meals.value = res.data
  } catch (err) {
    error.value = 'Greška pri učitavanju obroka'
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

  // ✅ frontend validacije (da se ne može "prazno" dodati)
  if (!form.value.recipe_id) {
    error.value = 'Odaberite recept.'
    return
  }
  if (!form.value.date) {
    error.value = 'Odaberite datum.'
    return
  }
  if (!form.value.meal_type) {
    error.value = 'Odaberite tip obroka (doručak/ručak/večera).'
    return
  }

  try {
    await api.post('/meals', form.value)
    form.value = { recipe_id: '', date: '', meal_type: '' }
    await fetchMeals()
  } catch (err) {
    error.value = 'Greška pri dodavanju obroka, na taj dan već postoji obrok'
  }
}

// ✅ EDIT: start/cancel/save
const startEdit = (meal) => {
  editingMealId.value = meal.id
  editRecipeId.value = meal.recipe_id
}

const cancelEdit = () => {
  editingMealId.value = null
  editRecipeId.value = ''
}

const saveEdit = async (mealId) => {
  error.value = ''
  try {
    await api.put(`/meals/${mealId}`, { recipe_id: editRecipeId.value })
    await fetchMeals()
    cancelEdit()
  } catch (err) {
    error.value = 'Greška pri uređivanju obroka'
  }
}

// ✅ DELETE: obriši samo taj zapis u planu
const deleteMeal = async (mealId) => {
  error.value = ''
  const ok = confirm('Jeste li sigurni da želite obrisati ovaj planirani obrok?')
  if (!ok) return

  try {
    await api.delete(`/meals/${mealId}`)
    await fetchMeals()
  } catch (err) {
    error.value = 'Greška pri brisanju obroka'
  }
}

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

onMounted(async () => {
  await fetchRecipes()
  await fetchMeals()
})
</script>

<template>
  <div class="meals-bg d-flex align-items-center justify-content-center">
    <div class="meals-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADER -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Učitavanje...</span>
        </div>
      </div>

      <!-- NAVBAR -->
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm custom-navbar">
        <div class="container-fluid">
<router-link
  to="/dashboard"
  class="navbar-brand fw-bold brand text-decoration-none"
>
  SmartMeal
</router-link>
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
          <div class="menu-item" @click="navigate('/recipes')">
            <span class="menu-icon">📖</span>
            <span>Recepti</span>
          </div>
          <div class="menu-item" @click="navigate('/analytics')">
            <span class="menu-icon">📊</span>
            <span>Analitika</span>
          </div>
          <div class="menu-item" @click="navigate('/recommendations')">
            <span class="menu-icon">⭐</span>
            <span>Preporuke</span>
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
        <h2 class="fw-bold brand mb-1">Moji obroci</h2>
        <p class="text-muted mb-0">Upravljajte i pregledajte svoje planirane obroke.</p>
      </div>

      <!-- GREŠKA -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <!-- DODAJ OBROK CARD -->
      <div class="card rounded-4 shadow-sm p-3 p-md-4 form-card mb-4">
        <h5 class="fw-bold mb-3 section-title">Dodaj obrok</h5>

        <div class="row g-3">
          <div class="col-md-5">
            <label class="form-label fw-semibold">Recept</label>
            <select class="form-select" v-model="form.recipe_id">
              <option disabled value="">Odaberite recept</option>
              <option v-for="r in recipes" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label fw-semibold">Datum</label>
            <input type="date" class="form-control" v-model="form.date" />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-semibold">Tip obroka</label>
            <select class="form-select" v-model="form.meal_type">
              <option disabled value="">Odaberite tip obroka</option>
              <option value="doručak">Doručak</option>
              <option value="ručak">Ručak</option>
              <option value="večera">Večera</option>
            </select>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-primary fw-bold flex-grow-1" @click="addMeal">
            Dodaj obrok
          </button>
        </div>
      </div>

      <!-- LISTA OBROKA -->
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

          <!-- prikaz / edit -->
          <div v-if="editingMealId !== meal.id" class="recipe-name">
            {{ meal.recipe.name }}
          </div>

          <div v-else class="mt-2">
            <label class="form-label fw-semibold mb-1">Promijeni recept</label>
            <select class="form-select" v-model="editRecipeId">
              <option disabled value="">Odaberite recept</option>
              <option v-for="r in recipes" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>

          <!-- ✅ akcije -->
          <div class="d-flex gap-2 mt-3 flex-wrap">
            <!-- kad nije edit: dodaj i "Pogledaj" -->
            <template v-if="editingMealId !== meal.id">
              <button class="btn btn-outline-primary fw-bold" @click.stop="goToRecipe(meal)">
                Pogledaj
              </button>

              <button class="btn btn-outline-primary fw-bold" @click.stop="startEdit(meal)">
                Uredi
              </button>

              <button class="btn btn-outline-secondary fw-bold" @click.stop="deleteMeal(meal.id)">
                Obriši
              </button>
            </template>

            <!-- kad je edit -->
            <template v-else>
              <button
                class="btn btn-primary fw-bold"
                @click.stop="saveEdit(meal.id)"
                :disabled="!editRecipeId"
              >
                Spremi
              </button>
              <button class="btn btn-outline-secondary fw-bold" @click.stop="cancelEdit">
                Odustani
              </button>
            </template>
          </div>
        </div>

        <p v-if="meals.length === 0" class="text-muted text-center mt-3">
          Još nema obroka.
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
