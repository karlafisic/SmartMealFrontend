<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

// Polja recepta
const name = ref('')
const calories = ref(null)
const protein = ref(null)
const carbs = ref(null)
const fat = ref(null)
const prep_time = ref(null)

// Sastojci
const allIngredients = ref([])
const selectedIngredients = ref([])
const ingredientToAdd = ref(null)

// Greške/loading
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/ingredients')
    allIngredients.value = res.data
  } catch (err) {
    console.error(err)
    error.value = 'Greška pri učitavanju sastojaka'
  } finally {
    loading.value = false
  }
})
const sortedIngredients = computed(() => {
  return [...allIngredients.value].sort((a, b) =>
    a.name.localeCompare(b.name, 'hr', { sensitivity: 'base' })
  )
})


function addIngredient() {
  if (
    ingredientToAdd.value &&
    !selectedIngredients.value.find(i => i.id === ingredientToAdd.value.id)
  ) {
    selectedIngredients.value.push(ingredientToAdd.value)
    ingredientToAdd.value = null
  }
}

function removeIngredient(id) {
  selectedIngredients.value = selectedIngredients.value.filter(i => i.id !== id)
}

async function submitRecipe() {
  loading.value = true
  error.value = ''

  try {
    const res = await api.post('/recipes', {
      name: name.value,
      calories: calories.value,
      protein: protein.value,
      carbs: carbs.value,
      fat: fat.value,
      prep_time: prep_time.value
    })

    const recipeId = res.data.id

    if (selectedIngredients.value.length > 0) {
      await api.post(`/recipes/${recipeId}/ingredients`, {
        ingredient_ids: selectedIngredients.value.map(i => i.id)
      })
    }

    router.push({ name: 'recipes', query: { refresh: true } })
  } catch (err) {
    console.error(err)
    error.value = 'Greška pri dodavanju recepta'
  } finally {
    loading.value = false
  }
}

const goToRecipes = () => router.push('/recipes')
</script>

<template>
  <div class="add-bg d-flex align-items-center justify-content-center">
    <div class="add-panel shadow-lg rounded-4">

      <!-- LOADING -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Učitavanje...</span>
        </div>
      </div>

      <!-- HEADER -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 class="fw-bold brand mb-1">Dodaj recept</h2>
          <p class="text-muted mb-0">Kreiraj novi SmartMeal recept.</p>
        </div>

        <button class="btn btn-outline-secondary fw-semibold" @click="goToRecipes">
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
          <input v-model="name" type="text" class="form-control" />
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

      <hr class="my-3" />

      <!-- INGREDIENTS -->
      <h6 class="fw-bold mb-2 section-title">Sastojci</h6>

      <div class="row g-2 align-items-end">
        <div class="col-md-8">
          <select v-model="ingredientToAdd" class="form-select">
            <option disabled :value="null">Odaberite sastojak...</option>
            <option v-for="ing in sortedIngredients" :key="ing.id" :value="ing">
              {{ ing.name }}
            </option>
          </select>
        </div>

        <div class="col-md-4">
          <button
            class="btn btn-primary w-100 fw-bold"
            @click="addIngredient"
            :disabled="!ingredientToAdd"
          >
            Dodaj
          </button>
        </div>
      </div>

      <div class="mt-2" v-if="selectedIngredients.length">
        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="ing in selectedIngredients"
            :key="ing.id"
            class="badge rounded-pill ingredient-badge"
          >
            {{ ing.name }}
            <button class="btn-close ms-2" @click="removeIngredient(ing.id)"></button>
          </span>
        </div>
      </div>

      <!-- ACTIONS -->
      <div class="d-flex gap-2 mt-3">
        <button
          class="btn btn-primary fw-bold flex-grow-1"
          @click="submitRecipe"
          :disabled="loading || !name"
        >
          Spremi
        </button>

        <button class="btn btn-outline-secondary fw-bold" @click="goToRecipes">
          Odustani
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-bg {
  min-height: 100vh;
  width: 100vw;
  background: #F5EFE6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* PANEL */
.add-panel {
  position: relative;
  width: 100%;
  max-width: 980px;
  max-height: 90vh;
  padding: 2.5rem 3rem;
  overflow: hidden;
  background: #ffffff;
  border-radius: 16px;
}

.add-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/slika.png');
  background-size: cover;
  background-position: center;
  opacity: 0.12;
  z-index: 0;
}

.add-panel > * {
  position: relative;
  z-index: 1;
}

/* TITLES */
.brand { color: #9C6644; }
.section-title,
.form-label { color: #3E2723; }

/* BUTTONS */
.btn-primary {
  background-color: #B08968;
  border-color: #B08968;
}
.btn-primary:hover {
  background-color: #9C6644;
  border-color: #9C6644;
}

.btn-outline-secondary {
  color: #9C6644;
  border-color: #9C6644;
}
.btn-outline-secondary:hover {
  background-color: #9C6644;
  border-color: #9C6644;
  color: #fff;
}

/* TAGS */
.ingredient-badge {
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(176,137,104,0.45);
  color: #9C6644;
  padding: 0.45rem 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* LOADER */
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(2px);
}
</style>
