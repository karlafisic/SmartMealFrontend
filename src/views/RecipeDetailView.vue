<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const currentUserId = ref(null)
const recipe = ref(null)
const loading = ref(true)
const error = ref('')

const token = localStorage.getItem('token')
if (!token) router.push('/login')
api.defaults.headers.common['Authorization'] = `Bearer ${token}`

const fetchCurrentUser = async () => {
  const res = await api.get('/profile')
  currentUserId.value = res.data.id
}

onMounted(async () => {
  try {
    await fetchCurrentUser()
    const res = await api.get(`/recipes/${route.params.id}`)
    recipe.value = res.data
  } catch (err) {
    if (err.response?.status === 401) router.push('/login')
    else console.error(err)
  } finally {
    loading.value = false
  }
})

const isOwner = computed(() => {
  if (!recipe.value || !currentUserId.value) return false
  return recipe.value.user_id === currentUserId.value
})

async function deleteRecipe() {
  if (!confirm('Jeste li sigurni da želite obrisati ovaj recept?')) return
  try {
    await api.delete(`/recipes/${recipe.value.id}`)
    router.push('/recipes')
  } catch (err) {
    error.value = 'Greška pri brisanju recepta.'
  }
}

function goToEdit() { router.push(`/recipes/${recipe.value.id}/edit`) }
function goBackToRecipes() { router.push('/recipes') }
</script>

<template>
  <div class="details-bg d-flex align-items-center justify-content-center">
    <div class="details-panel shadow-lg rounded-4 p-4 p-md-5">

      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <template v-if="recipe">
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h2 class="fw-bold brand mb-1">{{ recipe.name }}</h2>
            <p class="text-muted mb-0">Detalji recepta</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary fw-semibold" @click="goBackToRecipes">Natrag na recepte</button>
            <button v-if="isOwner" class="btn btn-outline-primary fw-semibold" @click="goToEdit">Uredi</button>
            <button v-if="isOwner" class="btn btn-outline-danger fw-semibold" @click="deleteRecipe">Obriši</button>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

        <!-- NUTRIJENTI - read only, automatski izračunati -->
        <h5 class="fw-bold mb-3 section-title">Nutritivne vrijednosti</h5>
        <div class="row g-3 mb-4">
          <div class="col-md-4 col-6">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Kalorije</strong>
              <div class="fs-5 stat-value">{{ recipe.calories }} kcal</div>
              <small class="text-muted">automatski izračunato</small>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Proteini</strong>
              <div class="fs-5 stat-value">{{ recipe.protein }} g</div>
              <small class="text-muted">automatski izračunato</small>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Ugljikohidrati</strong>
              <div class="fs-5 stat-value">{{ recipe.carbs }} g</div>
              <small class="text-muted">automatski izračunato</small>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Masti</strong>
              <div class="fs-5 stat-value">{{ recipe.fat }} g</div>
              <small class="text-muted">automatski izračunato</small>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Vrijeme pripreme</strong>
              <div class="fs-5 stat-value">{{ recipe.prep_time }} min</div>
            </div>
          </div>
        </div>

        <!-- UPUTE -->
        <h5 class="fw-bold mb-3 section-title">Opis / Upute pripreme</h5>
        <div class="p-3 rounded-3 shadow-sm mb-4 instructions-box">
          <p class="mb-0 instructions-text">{{ recipe.instructions || 'Nema unesenih uputa.' }}</p>
        </div>

        <!-- SASTOJCI S KOLIČINAMA -->
        <h5 class="fw-bold mb-3 section-title">Sastojci</h5>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="ing-table-header">
                <th>Naziv</th>
                <th class="text-center">Količina</th>
                <th class="text-center">Kalorije</th>
                <th class="text-center">Proteini</th>
                <th class="text-center">Ugljikohidrati</th>
                <th class="text-center">Masti</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ing in recipe.ingredients" :key="ing.id">
                <td class="fw-semibold">{{ ing.name }}</td>
                <td class="text-center">
                  <span class="badge quantity-badge">{{ ing.pivot?.quantity }} {{ ing.unit }}</span>
                </td>
                <td class="text-center">
                  {{ Math.round(ing.calories * (ing.pivot?.quantity / ing.ref_amount) * 10) / 10 }} kcal
                </td>
                <td class="text-center">
                  {{ Math.round(ing.protein * (ing.pivot?.quantity / ing.ref_amount) * 10) / 10 }} g
                </td>
                <td class="text-center">
                  {{ Math.round(ing.carbs * (ing.pivot?.quantity / ing.ref_amount) * 10) / 10 }} g
                </td>
                <td class="text-center">
                  {{ Math.round(ing.fat * (ing.pivot?.quantity / ing.ref_amount) * 10) / 10 }} g
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <div v-else-if="!loading" class="text-center text-muted">Recept nije pronađen.</div>

    </div>
  </div>
</template>

<style scoped>
.details-bg {
  min-height: 100vh;
  width: 100%;
  background: #F5EFE6;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-x: hidden;
}

.details-panel {
  position: relative;
  width: 100%;
  max-width: 900px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

.details-panel::before {
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

.details-panel > * { position: relative; z-index: 1; }

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
.section-title { color: #3E2723; }

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.25);
}
.stat-value { color: #9C6644; font-weight: 700; }

.btn-outline-primary { color: #9C6644; border-color: #9C6644; }
.btn-outline-primary:hover { background-color: #9C6644; border-color: #9C6644; color: #fff; }

.instructions-box {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.25);
}
.instructions-text { white-space: pre-line; color: #3E2723; }

.ing-table-header th {
  background-color: #F5EFE6;
  color: #3E2723;
  font-weight: 600;
  border-bottom: 2px solid #B08968;
}

.quantity-badge {
  background-color: #B08968;
  color: white;
  font-size: 13px;
  padding: 5px 10px;
}

.table tbody tr:hover { background-color: #fdf8f3; }
</style>