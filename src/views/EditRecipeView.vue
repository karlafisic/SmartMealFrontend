<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const error = ref('')

// Recipe fields
const name = ref('')
const calories = ref('')
const protein = ref('')
const carbs = ref('')
const fat = ref('')
const prep_time = ref('')

// Ingredients
const allIngredients = ref([])
const selectedIngredientIds = ref([])
const ingredientSearch = ref('')

// Auth token
const token = localStorage.getItem('token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// Filter ingredients based on search
const filteredIngredients = computed(() => {
  if (!ingredientSearch.value) return allIngredients.value
  return allIngredients.value.filter(i =>
    i.name.toLowerCase().includes(ingredientSearch.value.toLowerCase())
  )
})

// Load recipe + ingredients
onMounted(async () => {
  try {
    const res = await api.get(`/recipes/${route.params.id}`)
    const r = res.data

    name.value = r.name
    calories.value = r.calories
    protein.value = r.protein
    carbs.value = r.carbs
    fat.value = r.fat
    prep_time.value = r.prep_time

    selectedIngredientIds.value = r.ingredients.map(i => i.id)

    const ingRes = await api.get('/ingredients')
    allIngredients.value = ingRes.data
  } catch (err) {
    console.error(err)
    error.value = 'Greška pri učitavanju recepta'
  } finally {
    loading.value = false
  }
})

const submit = async () => {
  error.value = ''
  loading.value = true

  try {
    await api.put(`/recipes/${route.params.id}`, {
      name: name.value,
      calories: Number(calories.value),
      protein: Number(protein.value),
      carbs: Number(carbs.value),
      fat: Number(fat.value),
      prep_time: Number(prep_time.value)
    })

    await api.post(`/recipes/${route.params.id}/ingredients`, {
      ingredient_ids: selectedIngredientIds.value
    })

    router.push(`/recipes/${route.params.id}`)
  } catch (err) {
    console.error(err)
    error.value = 'Greška pri ažuriranju recepta.'
  } finally {
    loading.value = false
  }
}

const toggleIngredient = (id) => {
  if (selectedIngredientIds.value.includes(id)) {
    selectedIngredientIds.value = selectedIngredientIds.value.filter(x => x !== id)
  } else {
    selectedIngredientIds.value.push(id)
  }
}

const ingredientNameById = (id) => {
  const ing = allIngredients.value.find(i => i.id === id)
  return ing ? ing.name : ''
}

const goBack = () => router.back()
</script>

<template>
  <div class="edit-bg d-flex align-items-center justify-content-center">
    <div class="edit-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADING -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- HEADER -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="fw-bold brand mb-1">Uredi recept</h2>
          <p class="text-muted mb-0">Ažuriraj detalje i sastojke</p>
        </div>

        <button class="btn btn-outline-secondary fw-semibold" @click="goBack">
          ← Natrag
        </button>
      </div>

      <!-- ERROR -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <!-- FORM -->
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label fw-semibold">Naziv</label>
          <input v-model="name" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Kalorije</label>
          <input v-model.number="calories" type="number" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Proteini</label>
          <input v-model.number="protein" type="number" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Ugljikohidrati</label>
          <input v-model.number="carbs" type="number" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Masti</label>
          <input v-model.number="fat" type="number" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Vrijeme pripreme (min)</label>
          <input v-model.number="prep_time" type="number" class="form-control" />
        </div>
      </div>

      <hr class="my-4" />

      <!-- INGREDIENTS -->
      <h5 class="fw-bold mb-2 section-title">Sastojci</h5>

      <!-- SEARCH INPUT -->
      <input
        v-model="ingredientSearch"
        type="text"
        class="form-control mb-2"
        placeholder="Pretraži sastojke..."
      />

      <!-- FILTERED INGREDIENTS LIST -->
      <div class="search-results mb-2">
        <div
          v-for="ing in filteredIngredients"
          :key="ing.id"
          class="ingredient-option"
          @click="toggleIngredient(ing.id)"
        >
          <input type="checkbox" :checked="selectedIngredientIds.includes(ing.id)" readonly />
          <span>{{ ing.name }}</span>
        </div>
      </div>

      <!-- SELECTED TAGS -->
      <div class="d-flex flex-wrap gap-2 mb-3">
        <span
          v-for="id in selectedIngredientIds"
          :key="id"
          class="badge ingredient-badge"
          @click="toggleIngredient(id)"
        >
          {{ ingredientNameById(id) }}
          <button type="button" class="btn-close btn-close-white ms-1"></button>
        </span>
      </div>

      <p v-if="!selectedIngredientIds.length" class="text-muted">
        Nema odabranih sastojaka.
      </p>

      <!-- ACTIONS -->
      <div class="d-flex gap-2 mt-4 flex-wrap">
        <button
          class="btn btn-primary fw-bold flex-grow-1"
          @click="submit"
          :disabled="loading || !name"
        >
          Ažuriraj recept
        </button>

        <button
          class="btn btn-outline-secondary fw-bold"
          @click="goBack"
          :disabled="loading"
        >
          Odustani
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* BACKGROUND */
.edit-bg {
  min-height: 100vh;
  background: #F5EFE6;
  padding: 24px;
}

/* PANEL */
.edit-panel {
  position: relative;
  width: 100%;
  max-width: 1200px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.edit-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background: url('/slika.png') center / cover no-repeat;
  opacity: 0.14;
}

.edit-panel > * {
  position: relative;
  z-index: 1;
}

/* LOADING */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* TITLES */
.brand { color: #9C6644; }
.section-title,
.form-label { color: #3E2723; }

/* BUTTONS */
.btn-primary {
  background: #B08968;
  border-color: #B08968;
}
.btn-primary:hover {
  background: #9C6644;
  border-color: #9C6644;
}

/* SEARCH RESULTS */
.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(176,137,104,0.35);
  border-radius: 6px;
  background: rgba(255,255,255,.9);
}

.ingredient-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: .2s;
}

.ingredient-option:hover {
  background: rgba(176,137,104,.15);
}

/* TAGS */
.ingredient-badge {
  background: #B08968;
  color: #fff;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>
