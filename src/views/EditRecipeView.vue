<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const error = ref('')

const name = ref('')
const instructions = ref('')
const prep_time = ref('')

const allIngredients = ref([])
const selectedIngredients = ref([]) // { id, name, unit, ref_amount, quantity }
const ingredientSearch = ref('')

const token = localStorage.getItem('token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

const filteredIngredients = computed(() => {
  const list = ingredientSearch.value
    ? allIngredients.value.filter(i =>
        i.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .includes(ingredientSearch.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      )
    : allIngredients.value

  return [...list].sort((a, b) =>
    a.name.localeCompare(b.name, 'hr', { sensitivity: 'base' })
  )
})

onMounted(async () => {
  try {
    const res = await api.get(`/recipes/${route.params.id}`)
    const r = res.data

    name.value = r.name
    instructions.value = r.instructions ?? ''
    prep_time.value = r.prep_time

    selectedIngredients.value = r.ingredients.map(i => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      ref_amount: i.ref_amount,
      quantity: i.pivot?.quantity ?? i.ref_amount
    }))

    const ingRes = await api.get('/ingredients')
    allIngredients.value = ingRes.data
  } catch (err) {
    console.error(err)
    error.value = 'Greška pri učitavanju recepta'
  } finally {
    loading.value = false
  }
})

const isSelected = (id) => selectedIngredients.value.some(x => x.id === id)

const toggleIngredient = (ing) => {
  const exists = selectedIngredients.value.find(x => x.id === ing.id)
  if (exists) {
    selectedIngredients.value = selectedIngredients.value.filter(x => x.id !== ing.id)
  } else {
    selectedIngredients.value.push({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      ref_amount: ing.ref_amount,
      quantity: ing.ref_amount
    })
  }
}

const removeIngredient = (id) => {
  selectedIngredients.value = selectedIngredients.value.filter(x => x.id !== id)
}

const submit = async () => {
  error.value = ''
  loading.value = true

  try {
    await api.put(`/recipes/${route.params.id}`, {
      name: name.value,
      instructions: instructions.value,
      prep_time: Number(prep_time.value)
    })

    await api.put(`/recipes/${route.params.id}/ingredients`, {
      ingredients: selectedIngredients.value.map(i => ({
        id: i.id,
        quantity: i.quantity
      }))
    })

    router.push(`/recipes/${route.params.id}`)
  } catch (err) {
    console.error(err)
    error.value = 'Greška pri ažuriranju recepta.'
  } finally {
    loading.value = false
  }
}

const goBack = () => router.back()
</script>

<template>
  <div class="edit-bg d-flex align-items-center justify-content-center">
    <div class="edit-panel shadow-lg rounded-4 p-4 p-md-5">

      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary"></div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="fw-bold brand mb-1">Uredi recept</h2>
          <p class="text-muted mb-0">Ažuriraj detalje i sastojke</p>
        </div>
        <button class="btn btn-outline-secondary fw-semibold" @click="goBack">← Natrag</button>
      </div>

      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

      <div class="row g-3">
        <div class="col-12">
          <label class="form-label fw-semibold">Naziv</label>
          <input v-model="name" class="form-control" />
        </div>

        <div class="col-12">
          <label class="form-label fw-semibold">Opis / Upute pripreme</label>
          <textarea v-model="instructions" class="form-control" rows="4"></textarea>
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Vrijeme pripreme (min)</label>
          <input v-model.number="prep_time" type="number" class="form-control" />
        </div>
      </div>

      <hr class="my-4" />

      <h5 class="fw-bold mb-1 section-title">Sastojci</h5>
      <p class="text-muted small mb-2">
        Nutritivne vrijednosti se računaju automatski iz sastojaka i količina.
      </p>

      <input
        v-model="ingredientSearch"
        type="text"
        class="form-control mb-2"
        placeholder="Pretraži sastojke..."
      />

      <div class="search-results mb-3">
        <div
          v-for="ing in filteredIngredients"
          :key="ing.id"
          class="ingredient-option"
          @click="toggleIngredient(ing)"
        >
          <input type="checkbox" :checked="isSelected(ing.id)" readonly />
          <span>{{ ing.name }}</span>
          <span class="text-muted small ms-auto">{{ ing.calories }} kcal / {{ ing.ref_amount }}{{ ing.unit }}</span>
        </div>
      </div>

      <!-- SELECTED S QUANTITY -->
      <div v-if="selectedIngredients.length">
        <h6 class="fw-bold mb-2 section-title">Odabrani sastojci i količine</h6>
        <div
          v-for="ing in selectedIngredients"
          :key="ing.id"
          class="selected-ing-row d-flex align-items-center gap-2 mb-2 px-3 py-2 rounded-3"
        >
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
          <button type="button" class="btn btn-sm btn-outline-danger" @click="removeIngredient(ing.id)">✕</button>
        </div>
      </div>

      <p v-else class="text-muted">Nema odabranih sastojaka.</p>

      <div class="d-flex gap-2 mt-4 flex-wrap">
        <button class="btn btn-primary fw-bold flex-grow-1" @click="submit" :disabled="loading || !name">
          Ažuriraj recept
        </button>
        <button class="btn btn-outline-secondary fw-bold" @click="goBack" :disabled="loading">
          Odustani
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.edit-bg {
  min-height: 100vh;
  background: #F5EFE6;
  padding: 24px;
  align-items: flex-start;
}

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
  z-index: 0;
}

.edit-panel > * { position: relative; z-index: 1; }

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.brand { color: #9C6644; }
.section-title, .form-label { color: #3E2723; }

.btn-primary { background: #B08968; border-color: #B08968; }
.btn-primary:hover { background: #9C6644; border-color: #9C6644; }

.btn-outline-secondary { color: #9C6644; border-color: #9C6644; }
.btn-outline-secondary:hover { background-color: #9C6644; border-color: #9C6644; color: #fff; }

.form-control:focus, .form-select:focus {
  border-color: #9C6644 !important;
  box-shadow: 0 0 0 0.25rem rgba(156, 102, 68, 0.25) !important;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(176, 137, 104, 0.35);
  border-radius: 6px;
  background: rgba(255, 255, 255, .9);
}

.ingredient-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  cursor: pointer;
  transition: .2s;
  font-size: 14px;
}

.ingredient-option:hover { background: rgba(176, 137, 104, .15); }

.selected-ing-row {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(176, 137, 104, 0.35);
}

.quantity-group { width: 160px; }
.ing-name { color: #3E2723; min-width: 120px; }
</style>