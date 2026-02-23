<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const name = ref('')
const instructions = ref('')
const prep_time = ref(null)

const allIngredients = ref([])
const selectedIngredients = ref([]) // { id, name, unit, ref_amount, quantity }
const ingredientToAdd = ref([])
const ingredientSearch = ref('')

const error = ref('')
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/ingredients')
    allIngredients.value = res.data
  } catch (err) {
    error.value = 'Greška pri učitavanju sastojaka'
  } finally {
    loading.value = false
  }
})

function normalizeText(s) {
  return (s || '').toString().trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const filteredIngredients = computed(() => {
  const q = normalizeText(ingredientSearch.value)
  const list = [...allIngredients.value].sort((a, b) =>
    a.name.localeCompare(b.name, 'hr', { sensitivity: 'base' })
  )
  if (!q) return list
  return list.filter(ing => normalizeText(ing.name).includes(q))
})

function addIngredient() {
  const toAdd = ingredientToAdd.value
  if (toAdd && toAdd.length > 0) {
    toAdd.forEach(ingredient => {
      if (!selectedIngredients.value.find(i => i.id === ingredient.id)) {
        selectedIngredients.value.push({
          ...ingredient,
          quantity: ingredient.ref_amount
        })
      }
    })
    ingredientToAdd.value = []
  }
}

function removeIngredient(id) {
  selectedIngredients.value = selectedIngredients.value.filter(i => i.id !== id)
}

async function submitRecipe() {
  if (!name.value?.trim()) return
  loading.value = true
  error.value = ''

  try {
    await api.post('/recipes', {
      name: name.value.trim(),
      instructions: instructions.value?.trim() || '',
      prep_time: prep_time.value,
      ingredients: selectedIngredients.value.map(i => ({
        id: i.id,
        quantity: i.quantity
      }))
    })

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
  <div class="page">
    <div class="add-bg">
      <div class="add-panel shadow-lg rounded-4">

        <div v-if="loading" class="loading-overlay">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Učitavanje...</span>
          </div>
        </div>

        <div class="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h2 class="fw-bold brand mb-1">Dodaj recept</h2>
            <p class="text-muted mb-0">Kreiraj novi SmartMeal recept.</p>
          </div>
          <button type="button" class="btn btn-outline-secondary fw-semibold" @click="goToRecipes">
            ← Natrag
          </button>
        </div>

        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

        <div class="row g-3">
          <div class="col-12">
            <label class="form-label fw-semibold">Naziv</label>
            <input v-model="name" type="text" class="form-control" placeholder="npr. Palačinke, Juha od povrća..." />
          </div>

          <div class="col-12">
            <label class="form-label fw-semibold">Opis / Upute pripreme</label>
            <textarea
              v-model="instructions"
              class="form-control"
              rows="4"
              placeholder="npr. 2 jaja, posoliti, razmutiti, izliti na tavu..."
            ></textarea>
            <small class="text-muted">Možeš pisati u više redova.</small>
          </div>

          <div class="col-md-4">
            <label class="form-label fw-semibold">Vrijeme pripreme (min)</label>
            <input v-model.number="prep_time" type="number" class="form-control" min="0" />
          </div>
        </div>

        <hr class="my-3" />

        <h6 class="fw-bold mb-2 section-title">Sastojci</h6>
        <p class="text-muted small mb-2">
          Nutritivne vrijednosti recepta računaju se automatski na temelju sastojaka i količina.
        </p>

        <!-- SEARCH -->
        <div class="row g-2 mb-2">
          <div class="col-12 col-md-8">
            <input
              v-model="ingredientSearch"
              type="text"
              class="form-control"
              placeholder="Pretraži sastojke (npr. piletina, sir...)"
            />
            <small class="text-muted">Pretraga radi i bez dijakritika.</small>
          </div>
          <div class="col-12 col-md-4">
            <button
              type="button"
              class="btn btn-outline-secondary w-100 fw-bold"
              @click="ingredientSearch = ''"
              :disabled="!ingredientSearch"
            >
              Očisti pretragu
            </button>
          </div>
        </div>

        <!-- SELECT -->
        <div class="row g-2 align-items-end">
          <div class="col-md-8">
            <select v-model="ingredientToAdd" class="form-select" multiple size="6">
              <option v-for="ing in filteredIngredients" :key="ing.id" :value="ing">
                {{ ing.name }}
              </option>
            </select>
            <small class="text-muted">Drži Ctrl za odabir više sastojaka</small>
            <div v-if="!loading && filteredIngredients.length === 0" class="text-muted mt-2">
              Nema sastojaka za "{{ ingredientSearch }}".
            </div>
          </div>
          <div class="col-md-4">
            <button
              type="button"
              class="btn btn-primary w-100 fw-bold"
              @click="addIngredient"
              :disabled="!ingredientToAdd || ingredientToAdd.length === 0"
            >
              Dodaj →
            </button>
          </div>
        </div>

        <!-- SELECTED INGREDIENTS S QUANTITY -->
        <div class="mt-3" v-if="selectedIngredients.length">
          <h6 class="fw-bold mb-2 section-title">Odabrani sastojci i količine</h6>
          <div class="selected-ing-row d-flex align-items-center gap-2 mb-2 px-3 py-2 rounded-3"
            v-for="ing in selectedIngredients" :key="ing.id">
            <span class="ing-name fw-semibold flex-grow-1">{{ ing.name }}</span>
            <div class="input-group quantity-group">
              <input
                type="number"
                class="form-control form-control-sm"
                v-model.number="ing.quantity"
                min="0"
              />
              <span class="input-group-text">{{ ing.unit }}</span>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="removeIngredient(ing.id)"
            >✕</button>
          </div>
        </div>

        <div class="actions-bar mt-3">
          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-primary fw-bold flex-grow-1"
              @click="submitRecipe"
              :disabled="loading || !name || !name.trim()"
            >
              Spremi recept
            </button>
            <button type="button" class="btn btn-outline-secondary fw-bold" @click="goToRecipes">
              Odustani
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; }

.add-bg {
  min-height: 100vh;
  width: 100%;
  background: #F5EFE6;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
}

.add-panel {
  position: relative;
  width: 100%;
  max-width: 980px;
  overflow: visible;
  padding: 0.75rem 2rem 1rem;
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
  border-radius: 16px;
}

.add-panel > * { position: relative; z-index: 1; }

.brand { color: #9C6644; }
.section-title, .form-label { color: #3E2723; }

.btn-primary {
  background-color: #9C6644 !important;
  border-color: #9C6644 !important;
}
.btn-primary:hover {
  background-color: #7D5436 !important;
  border-color: #7D5436 !important;
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

.form-control:focus, .form-select:focus {
  border-color: #9C6644 !important;
  box-shadow: 0 0 0 0.25rem rgba(156, 102, 68, 0.25) !important;
}

.spinner-border {
  color: #9C6644 !important;
}

.selected-ing-row {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.35);
}

.quantity-group {
  width: 160px;
}

.ing-name {
  color: #3E2723;
  min-width: 120px;
}

.actions-bar {
  position: sticky;
  bottom: 0;
  padding: 12px 0 4px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(2px);
  border-radius: 16px;
}
</style>