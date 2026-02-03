<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { computed } from 'vue'


const route = useRoute()
const router = useRouter()
const currentUserId = ref(null)

const recipe = ref(null)
const loading = ref(true)
const error = ref('')

// Auth
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

function goToEdit() {
  router.push(`/recipes/${recipe.value.id}/edit`)
}
function goBackToRecipes() {
  router.push('/recipes')
}
</script>

<template>
  <div class="details-bg d-flex align-items-center justify-content-center">
    <div class="details-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADING OVERLAY -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Učitavanje...</span>
        </div>
      </div>

      <template v-if="recipe">
        <!-- HEADER -->
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h2 class="fw-bold brand mb-1">{{ recipe.name }}</h2>
            <p class="text-muted mb-0">Detalji recepta</p>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary fw-semibold" @click="goBackToRecipes()">
              Natrag na recepte
            </button>

            <button v-if="isOwner" class="btn btn-outline-primary fw-semibold" @click="goToEdit">
              Uredi
            </button>

            <button v-if="isOwner" class="btn btn-outline-danger fw-semibold" @click="deleteRecipe">
              Obriši
            </button>
          </div>
        </div>

        <!-- ERROR -->
        <div v-if="error" class="alert alert-danger py-2">
          {{ error }}
        </div>

        <!-- DETAILS -->
        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Kalorije</strong>
              <div class="fs-5 stat-value">{{ recipe.calories }} kcal</div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Proteini</strong>
              <div class="fs-5 stat-value">{{ recipe.protein }} g</div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Ugljikohidrati</strong>
              <div class="fs-5 stat-value">{{ recipe.carbs }} g</div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Masti</strong>
              <div class="fs-5 stat-value">{{ recipe.fat }} g</div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="stat-card p-3 rounded-3 shadow-sm">
              <strong>Vrijeme pripreme</strong>
              <div class="fs-5 stat-value">{{ recipe.prep_time }} min</div>
            </div>
          </div>
        </div>

        <!-- INGREDIENTS -->
        <h5 class="fw-bold mb-3 section-title">Sastojci</h5>

        <ul class="list-group list-group-flush">
          <li
            v-for="ing in recipe.ingredients"
            :key="ing.id"
            class="list-group-item d-flex align-items-center"
          >
            <span class="ingredient-dot me-2"></span>
            {{ ing.name }}
          </li>
        </ul>
      </template>

      <div v-else-if="!loading" class="text-center text-muted">
        Recept nije pronađen.
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ✅ bež background */
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

/* panel */
.details-panel {
  position: relative;
  width: 100%;
  max-width: 900px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
  overflow: hidden;
}

/* ✅ food pozadina */
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

.details-panel > * {
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

/* brand + naslovi */
.brand {
  color: #9C6644;
}
.section-title {
  color: #3E2723;
}

/* stat cards */
.stat-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.25);
}
.stat-value {
  color: #9C6644;
  font-weight: 700;
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

/* ingredient dot */
.ingredient-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #B08968;
}
</style>
