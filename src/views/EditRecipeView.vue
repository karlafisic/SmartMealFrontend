<script setup>
import { ref, onMounted } from 'vue'
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
const selectedIngredientObjects = ref([])

// Auth token
const token = localStorage.getItem('token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

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
    selectedIngredientObjects.value = r.ingredients

    const ingRes = await api.get('/ingredients')
    allIngredients.value = ingRes.data
  } catch (err) {
    console.error(err)
    error.value = 'Error loading recipe'
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
    error.value = 'Failed to update recipe'
  } finally {
    loading.value = false
  }
}

const onIngredientChange = () => {
  selectedIngredientObjects.value = allIngredients.value.filter(i =>
    selectedIngredientIds.value.includes(i.id)
  )
}

const removeIngredientTag = async (id) => {
  error.value = ''

  try {
    // Poziv backend rute za brisanje veze recept–sastojak
    await api.delete(`/recipes/${route.params.id}/ingredients/${id}`)

    // Ukloni iz frontenda nakon uspješnog brisanja
    selectedIngredientIds.value = selectedIngredientIds.value.filter(i => i !== id)
    selectedIngredientObjects.value = selectedIngredientObjects.value.filter(i => i.id !== id)
  } catch (err) {
    console.error(err)
    error.value = 'Failed to remove ingredient from recipe'
  }
}

const goBack = () => router.back()
</script>

<template>
  <div class="edit-bg d-flex align-items-center justify-content-center">
    <div class="edit-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADING OVERLAY -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- HEADER -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 class="fw-bold brand mb-1">Edit Recipe</h2>
          <p class="text-muted mb-0">Update recipe details and ingredients</p>
        </div>

        <button class="btn btn-outline-secondary fw-semibold" @click="goBack">
          ← Back
        </button>
      </div>

      <!-- ERROR -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <!-- FORM -->
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label fw-semibold">Name</label>
          <input v-model="name" type="text" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Calories</label>
          <input v-model.number="calories" type="number" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Protein</label>
          <input v-model.number="protein" type="number" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Carbs</label>
          <input v-model.number="carbs" type="number" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Fat</label>
          <input v-model.number="fat" type="number" class="form-control" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Prep Time (min)</label>
          <input v-model.number="prep_time" type="number" class="form-control" />
        </div>
      </div>

      <hr class="my-4" />

      <!-- INGREDIENTS -->
      <h5 class="fw-bold mb-3">Ingredients</h5>

      <div class="row g-2 align-items-end">
        <div class="col-md-8">
          <label class="form-label fw-semibold">Select ingredients</label>
          <select
            multiple
            v-model="selectedIngredientIds"
            @change="onIngredientChange"
            class="form-select"
          >
            <option v-for="ing in allIngredients" :key="ing.id" :value="ing.id">
              {{ ing.name }}
            </option>
          </select>
        </div>

        <div class="col-md-4 text-muted small">
          Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple.
        </div>
      </div>

      <!-- TAGS -->
      <div class="mt-3" v-if="selectedIngredientObjects.length">
        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="ing in selectedIngredientObjects"
            :key="ing.id"
            class="badge rounded-pill text-bg-light ingredient-badge"
          >
            {{ ing.name }}
            <button class="btn-close ms-2" aria-label="Remove" @click="removeIngredientTag(ing.id)"></button>
          </span>
        </div>
      </div>

      <div v-else class="text-muted mt-3">
        No ingredients selected.
      </div>

      <!-- ACTIONS -->
      <div class="d-flex gap-2 mt-4">
        <button
          class="btn btn-success fw-bold flex-grow-1"
          @click="submit"
          :disabled="loading || !name"
        >
          Update Recipe
        </button>

        <button
          class="btn btn-outline-secondary fw-bold"
          @click="goBack"
          :disabled="loading"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* full screen green background */
.edit-bg {
  min-height: 100vh;
  width: 100%;
  background: #198754;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-x: hidden;
}

/* centralni panel */
.edit-panel {
  position: relative;
  width: 100%;
  max-width: 900px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
}

/* faded logo u pozadini */
.edit-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/logosmartmeal.jpeg');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: cover;
  opacity: 0.10;
  z-index: 0;
}

.edit-panel > * {
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

/* brand */
.brand {
  color: #198754;
}

/* ingredient badge */
.ingredient-badge {
  border: 1px solid rgba(25, 135, 84, 0.25);
  color: #198754;
  padding: 0.55rem 0.75rem;
}
</style>