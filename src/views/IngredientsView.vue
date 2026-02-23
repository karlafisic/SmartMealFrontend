<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const token = localStorage.getItem('token')
if (!token) router.push('/login')
api.defaults.headers.common['Authorization'] = `Bearer ${token}`

const ingredients = ref([])
const error = ref('')
const success = ref('')
const loading = ref(false)
const initialLoading = ref(true)
const menuOpen = ref(false)

const newIngredient = ref({
  name: '',
  unit: 'g',
  ref_amount: 100,
  calories: '',
  protein: '',
  carbs: '',
  fat: ''
})

const toggleMenu = () => { menuOpen.value = !menuOpen.value }
const navigate = (path) => { menuOpen.value = false; router.push(path) }

async function loadIngredients() {
  error.value = ''
  try {
    const res = await api.get('/ingredients')
    ingredients.value = res.data.sort((a, b) => a.name.localeCompare(b.name, 'hr'))
  } catch (err) {
    error.value = 'Greška pri učitavanju sastojaka'
  } finally {
    initialLoading.value = false
  }
}

onMounted(loadIngredients)

async function addIngredient() {
  if (!newIngredient.value.name.trim()) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const res = await api.post('/ingredients', {
      name: newIngredient.value.name.trim(),
      unit: newIngredient.value.unit,
      ref_amount: newIngredient.value.ref_amount,
      calories: newIngredient.value.calories,
      protein: newIngredient.value.protein,
      carbs: newIngredient.value.carbs,
      fat: newIngredient.value.fat,
    })
    ingredients.value.push(res.data)
    ingredients.value.sort((a, b) => a.name.localeCompare(b.name, 'hr'))

    // Reset forme
    newIngredient.value = { name: '', unit: 'g', ref_amount: 100, calories: '', protein: '', carbs: '', fat: '' }
    success.value = 'Sastojak je uspješno dodan!'
  } catch (err) {
    if (err.response?.status === 422) {
      error.value = 'Sastojak već postoji ili su podaci neispravni'
    } else {
      error.value = 'Greška pri dodavanju sastojka'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="ing-bg">
    <div class="ing-panel shadow-lg rounded-4 p-4 p-md-5">

      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <!-- NAVBAR -->
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm custom-navbar">
        <div class="container-fluid">
          <router-link to="/dashboard" class="navbar-brand fw-bold brand text-decoration-none">SmartMeal</router-link>
          <div class="ms-auto d-flex gap-2 align-items-center">
            <button class="btn btn-outline-primary hamburger-btn" @click="toggleMenu">
              <span class="hamburger-icon">
                <span></span><span></span><span></span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      <transition name="slide-fade">
        <div v-if="menuOpen" class="dropdown-menu-custom shadow-lg rounded-4">
          <div class="menu-item" @click="navigate('/recipes')"><span class="menu-icon">📖</span><span>Recepti</span></div>
          <div class="menu-item" @click="navigate('/meal-plan')"><span class="menu-icon">📅</span><span>Planer obroka</span></div>
          <div class="menu-item" @click="navigate('/recommendations')"><span class="menu-icon">⭐</span><span>Preporuke</span></div>
          <div class="menu-item" @click="navigate('/profile')"><span class="menu-icon">👤</span><span>Profil</span></div>
        </div>
      </transition>
      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>

      <!-- NASLOV -->
      <div class="mb-3">
        <h2 class="fw-bold brand mb-1">Sastojci</h2>
        <p class="text-muted mb-0">Dodaj i pregledaj listu sastojaka.</p>
      </div>

      <div v-if="initialLoading" class="text-center my-4">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
      <div v-if="success" class="alert alert-success py-2">{{ success }}</div>

      <div v-if="!initialLoading">

        <!-- FORMA -->
        <div class="card rounded-4 shadow-sm p-3 p-md-4 form-card mb-4">
          <h5 class="fw-bold mb-3 section-title">Dodaj sastojak</h5>

          <div class="row g-3">
            <!-- Naziv -->
            <div class="col-md-6">
              <label class="form-label fw-semibold">Naziv sastojka</label>
              <input class="form-control" v-model="newIngredient.name" placeholder="npr. Brašno, Mlijeko..." :disabled="loading" />
            </div>

            <!-- Jedinica -->
            <div class="col-md-3">
              <label class="form-label fw-semibold">Jedinica</label>
              <select class="form-select" v-model="newIngredient.unit" :disabled="loading">
                <option value="g">g (grami)</option>
                <option value="ml">ml (mililitri)</option>
              </select>
            </div>

            <!-- Referentna količina -->
            <div class="col-md-3">
              <label class="form-label fw-semibold">Nutrijenti na</label>
              <div class="input-group">
                <input type="number" class="form-control" v-model="newIngredient.ref_amount" min="1" :disabled="loading" />
                <span class="input-group-text">{{ newIngredient.unit }}</span>
              </div>
            </div>

            <!-- Nutrijenti -->
            <div class="col-12">
              <p class="fw-semibold mb-2 section-title">
                Nutritivne vrijednosti na {{ newIngredient.ref_amount }} {{ newIngredient.unit }}
              </p>
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label fw-semibold">Kalorije (kcal)</label>
              <input type="number" class="form-control" v-model="newIngredient.calories" min="0" placeholder="0" :disabled="loading" />
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label fw-semibold">Proteini (g)</label>
              <input type="number" class="form-control" v-model="newIngredient.protein" min="0" placeholder="0" :disabled="loading" />
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label fw-semibold">Ugljikohidrati (g)</label>
              <input type="number" class="form-control" v-model="newIngredient.carbs" min="0" placeholder="0" :disabled="loading" />
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label fw-semibold">Masti (g)</label>
              <input type="number" class="form-control" v-model="newIngredient.fat" min="0" placeholder="0" :disabled="loading" />
            </div>

            <!-- Gumb -->
            <div class="col-12 d-flex justify-content-end">
              <button class="btn btn-primary fw-bold px-4" @click="addIngredient" :disabled="loading || !newIngredient.name.trim()">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Dodaj sastojak
              </button>
            </div>
          </div>
        </div>

        <!-- TABLICA -->
        <div class="card rounded-4 shadow-sm p-3 p-md-4 list-card">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fw-bold mb-0 section-title">Svi sastojci</h5>
            <span class="badge rounded-pill count-badge">{{ ingredients.length }}</span>
          </div>

          <div v-if="ingredients.length === 0" class="text-muted text-center py-4">
            Nema još sastojaka.
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr class="table-header-row">
                  <th>Naziv</th>
                  <th class="text-center">Jedinica</th>
                  <th class="text-center">Na količinu</th>
                  <th class="text-center">Kalorije (kcal)</th>
                  <th class="text-center">Proteini (g)</th>
                  <th class="text-center">Ugljikohidrati (g)</th>
                  <th class="text-center">Masti (g)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ing in ingredients" :key="ing.id">
                  <td class="fw-semibold">{{ ing.name }}</td>
                  <td class="text-center">
                    <span class="badge unit-badge">{{ ing.unit }}</span>
                  </td>
                  <td class="text-center">{{ ing.ref_amount }} {{ ing.unit }}</td>
                  <td class="text-center">{{ ing.calories }}</td>
                  <td class="text-center">{{ ing.protein }}</td>
                  <td class="text-center">{{ ing.carbs }}</td>
                  <td class="text-center">{{ ing.fat }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
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

.ing-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

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

.ing-panel > * { position: relative; z-index: 1; }

.hamburger-btn {
  padding: 8px 12px;
  border: 2px solid #9C6644;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}
.hamburger-btn:hover { background-color: #9C6644; }
.hamburger-icon { display: flex; flex-direction: column; gap: 4px; width: 24px; }
.hamburger-icon span { display: block; width: 100%; height: 3px; background-color: #9C6644; border-radius: 2px; transition: all 0.3s ease; }
.hamburger-btn:hover .hamburger-icon span { background-color: #fff; }

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
.menu-item:last-child { border-bottom: none; }
.menu-item:hover { background-color: #F5EFE6; color: #9C6644; }
.menu-icon { font-size: 20px; width: 24px; text-align: center; }

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 2000;
}

.slide-fade-enter-active { transition: all 0.3s ease; }
.slide-fade-leave-active { transition: all 0.2s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-10px); opacity: 0; }

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

.brand { color: #9C6644; }
.custom-navbar { background: rgba(255, 255, 255, 0.92) !important; border: 0; }
.form-card, .list-card { background: rgba(255, 255, 255, 0.92); border: 0; }
.section-title, .form-label { color: #3E2723; }

.btn-primary { background-color: #B08968; border-color: #B08968; }
.btn-primary:hover { background-color: #9C6644; border-color: #9C6644; }
.btn-outline-primary { color: #9C6644; border-color: #9C6644; }
.btn-outline-primary:hover { background-color: #9C6644; border-color: #9C6644; color: #fff; }

.count-badge { background-color: #B08968; }

.table-header-row th {
  background-color: #F5EFE6;
  color: #3E2723;
  font-weight: 600;
  border-bottom: 2px solid #B08968;
}

.unit-badge {
  background-color: #B08968;
  color: white;
  font-size: 12px;
}

.table tbody tr:hover {
  background-color: #fdf8f3;
}
</style>