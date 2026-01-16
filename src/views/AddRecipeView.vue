<script setup>
import { ref, onMounted } from 'vue'
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
    error.value = 'Failed to load ingredients'
  } finally {
    loading.value = false
  }
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
    // 1️⃣ Kreiraj recept
    const res = await api.post('/recipes', {
      name: name.value,
      calories: calories.value,
      protein: protein.value,
      carbs: carbs.value,
      fat: fat.value,
      prep_time: prep_time.value
    })

    const recipeId = res.data.id

    // 2️⃣ Poveži sastojke
    if (selectedIngredients.value.length > 0) {
      await api.post(`/recipes/${recipeId}/ingredients`, {
        ingredient_ids: selectedIngredients.value.map(i => i.id)
      })
    }

    router.push({ name: 'recipes', query: { refresh: true } })
  } catch (err) {
    console.error(err)
    error.value = 'Failed to add recipe'
  } finally {
    loading.value = false
  }
}

const goToRecipes = () => router.push('/recipes')
</script>

<template>
  <div class="add-bg d-flex align-items-center justify-content-center">
    <div class="add-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADING OVERLAY (da se panel ne smanjuje) -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- HEADER -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 class="fw-bold brand mb-1">Add Recipe</h2>
          <p class="text-muted mb-0">Create a new SmartMeal recipe with ingredients.</p>
        </div>

        <button class="btn btn-outline-success fw-semibold" @click="goToRecipes">
          Back to Recipes
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
          <input v-model="name" type="text" class="form-control" placeholder="e.g. Chicken Salad" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Calories</label>
          <input v-model.number="calories" type="number" class="form-control" placeholder="e.g. 450" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Protein</label>
          <input v-model.number="protein" type="number" class="form-control" placeholder="e.g. 35" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Carbs</label>
          <input v-model.number="carbs" type="number" class="form-control" placeholder="e.g. 40" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Fat</label>
          <input v-model.number="fat" type="number" class="form-control" placeholder="e.g. 18" />
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Prep Time (min)</label>
          <input v-model.number="prep_time" type="number" class="form-control" placeholder="e.g. 20" />
        </div>
      </div>

      <hr class="my-4" />

      <!-- INGREDIENTS -->
      <h5 class="fw-bold mb-3">Ingredients</h5>

      <div class="row g-2 align-items-end">
        <div class="col-md-8">
          <label class="form-label fw-semibold">Select ingredient</label>
          <select v-model="ingredientToAdd" class="form-select">
            <option disabled :value="null">Choose ingredient...</option>
            <option v-for="ing in allIngredients" :key="ing.id" :value="ing">
              {{ ing.name }}
            </option>
          </select>
        </div>

        <div class="col-md-4">
          <button class="btn btn-success w-100 fw-bold" @click="addIngredient" :disabled="!ingredientToAdd">
            Add
          </button>
        </div>
      </div>

      <!-- SELECTED INGREDIENTS LIST -->
      <div class="mt-3" v-if="selectedIngredients.length">
        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="ing in selectedIngredients"
            :key="ing.id"
            class="badge rounded-pill text-bg-light ingredient-badge"
          >
            {{ ing.name }}
            <button class="btn-close ms-2" aria-label="Remove" @click="removeIngredient(ing.id)"></button>
          </span>
        </div>
      </div>

      <div v-else class="text-muted mt-3">
        No ingredients selected yet.
      </div>

      <!-- ACTIONS -->
      <div class="d-flex gap-2 mt-4">
        <button class="btn btn-success fw-bold flex-grow-1" @click="submitRecipe" :disabled="loading || !name">
          Submit Recipe
        </button>

        <button class="btn btn-outline-secondary fw-bold" @click="goToRecipes" :disabled="loading">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* full screen green background (kao login/recipes) */
.add-bg {
  min-height: 100vh;
  width: 100vw;
  background: #198754;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* centralni panel (kao login/recipes) */
.add-panel {
  position: relative;
  width: 80vw;              /* puni cijelu širinu */
  height: 92vh;            /* puni cijelu visinu */
  overflow: hidden;         /* nema scroll trake */
  background: #ffffff;
  border-radius: 0 !important; /* ukloni zaobljenje ako želiš full-screen look */
}

/* faded logo u pozadini */
.add-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/logosmartmeal.jpeg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  opacity: 0.10;
  z-index: 0;
}

.add-panel > * {
  position: relative;
  z-index: 1;
}

.brand {
  color: #198754;
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

/* ingredient badge izgled */
.ingredient-badge {
  border: 1px solid rgba(25, 135, 84, 0.25);
  color: #198754;
  padding: 0.55rem 0.75rem;
}
</style>