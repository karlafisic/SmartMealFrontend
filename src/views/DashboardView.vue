<template>
  <div class="recipes-bg d-flex align-items-center justify-content-center">
    <div class="recipes-panel shadow-lg rounded-4 p-4 p-md-5">
      <div class="container-fluid py-2">

        <!-- HEADER -->
        <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm custom-navbar">
          <div class="container-fluid">
            <router-link
  to="/dashboard"
  class="navbar-brand fw-bold brand text-decoration-none"
>
  SmartMeal
</router-link>

            <div class="ms-auto d-flex gap-2 align-items-center">
              <!-- ✅ maknut button "Recepti" iz headera -->

              <button class="btn btn-outline-primary hamburger-btn" type="button" @click="menuOpen = !menuOpen">
                <span class="hamburger-icon"><span></span><span></span><span></span></span>
              </button>
            </div>
          </div>
        </nav>

        <!-- DROPDOWN -->
        <transition name="slide-fade">
          <div v-if="menuOpen" class="dropdown-menu-custom shadow-lg rounded-4">
            <!-- ✅ dodano "Recepti" u dropdown -->
            <div class="menu-item" @click="go('/recipes')">📖 Recepti</div>

            <div class="menu-item" @click="go('/meal-plan')">📅 Planer obroka</div>
            <div class="menu-item" @click="go('/analytics')">📊 Analitika</div>
            <div class="menu-item" @click="go('/ingredients')">🥕 Sastojci</div>
            <div class="menu-item" @click="go('/recommendations')">⭐ Preporuke</div>
            <div class="menu-item" @click="go('/profile')">👤 Profil</div>
            <div class="menu-item" @click="go('/meals')">🍽️ Obroci</div>
          </div>
        </transition>

        <div v-if="menuOpen" class="menu-overlay" @click="menuOpen=false"></div>

        <!-- LOADING -->
        <div v-if="loading" class="loading-overlay">
          <div class="spinner-border" role="status"></div>
        </div>

        <div v-if="!loading && data">

          <!-- Greeting -->
          <div class="card mb-4 p-3 rounded-4 shadow-sm filter-card">
            <div class="d-flex flex-column flex-md-row justify-content-between gap-2">
              <div>
                <h4 class="fw-bold mb-1" style="color:#3E2723;">
                  Dobrodošao, {{ data.user?.name || 'korisniče' }} 👋
                </h4>
                <div class="text-muted">
                  Cilj: <b>{{ data.user?.goal || 'nije postavljen' }}</b>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-primary fw-semibold" @click="go('/add-recipe')">
                  + Dodaj recept
                </button>
                <button class="btn btn-outline-secondary fw-semibold" @click="go('/meal-plan')">
                  Plan obroka
                </button>
              </div>
            </div>
          </div>

          <!-- KPIs (preuređeno po tvom) -->
          <div class="row g-3 mb-4">
            <!-- 1) koliko je danas obroka -->
            <div class="col-12 col-md-3">
              <div class="card p-3 rounded-4 shadow-sm filter-card">
                <div class="text-muted">Obroka danas</div>
                <div class="kpi">{{ data.stats?.today_meals_count ?? 0 }}</div>
              </div>
            </div>

            <!-- 2) danas: kalorije/protein/ugljikohidrati -->
          <div class="col-12 col-md-3">
  <div class="card p-3 rounded-4 shadow-sm filter-card kpi-card">
    <div class="text-muted">Uneseno danas</div>

    <!-- kcal kao glavni broj -->
    <div class="kpi kpi-main">
      {{ daily?.total?.calories ?? 0 }}
      <span class="kpi-unit">kcal</span>
    </div>

    <!-- P/U u istom stilu i veličini (ujednačeno) -->
    <div class="kpi-macros">
      <div class="macro">
        <span class="macro-label">Protein</span>
        <span class="macro-value">{{ daily?.total?.protein ?? 0 }}</span>
        <span class="macro-unit">g</span>
      </div>

      <div class="macro-divider"></div>

      <div class="macro">
        <span class="macro-label">Šećer</span>
        <span class="macro-value">{{ daily?.total?.carbs ?? 0 }}</span>
        <span class="macro-unit">g</span>
      </div>

      <!-- ako želiš i masti, samo otkomentiraj -->
      <!--
      <div class="macro-divider"></div>
      <div class="macro">
        <span class="macro-label">M</span>
        <span class="macro-value">{{ daily?.total?.fat ?? 0 }}</span>
        <span class="macro-unit">g</span>
      </div>
      -->
    </div>
  </div>
</div>

            <!-- 3) koliko je obroka ovaj tjedan -->
            <div class="col-12 col-md-3">
              <div class="card p-3 rounded-4 shadow-sm filter-card">
                <div class="text-muted">Obroka ovaj tjedan</div>
                <div class="kpi">{{ data.stats?.week_meals_count ?? 0 }}</div>
              </div>
            </div>

            <!-- 4) koliko recepata ima u bazi -->
            <div class="col-12 col-md-3">
              <div class="card p-3 rounded-4 shadow-sm filter-card">
                <div class="text-muted">Ukupno recepata</div>
                <div class="kpi">{{ data.stats?.total_recipes ?? 0 }}</div>
              </div>
            </div>
          </div>

          <!-- Today + Recent -->
          <div class="row g-3">

            <!-- TODAY -->
            <div class="col-12 col-lg-6">
              <div class="card p-3 rounded-4 shadow-sm filter-card h-100">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5 class="fw-bold mb-0" style="color:#3E2723;">🍽️ Danas</h5>
                  <button class="btn btn-sm btn-outline-primary" @click="go('/meals')">Svi</button>
                </div>

                <!-- ADD MEAL TODAY (bez unosa datuma) -->
                <div class="p-2 mb-3 rounded-3" style="background: rgba(245,239,230,0.7);">
                  <div class="fw-semibold mb-2">Dodaj obrok (danas)</div>

                  <div class="row g-2">
                    <div class="col-12 col-md-7">
                      <label class="form-label fw-semibold mb-1">Recept</label>
                      <select class="form-select" v-model="formToday.recipe_id">
                        <option disabled value="">Odaberite recept</option>
                        <option v-for="r in recipes" :key="r.id" :value="r.id">
                          {{ r.name }}
                        </option>
                      </select>
                    </div>

                    <div class="col-12 col-md-5">
                      <label class="form-label fw-semibold mb-1">Tip obroka</label>
                      <select class="form-select" v-model="formToday.meal_type">
                        <option disabled value="">Odaberite tip obroka</option>
                        <option value="doručak">Doručak</option>
                        <option value="ručak">Ručak</option>
                        <option value="večera">Večera</option>
                      </select>
                    </div>

                    <div class="col-12 d-flex gap-2 mt-1">
                      <button
                        class="btn btn-outline-primary fw-bold"
                        @click="addMealToday"
                        :disabled="addingMeal"
                      >
                        <span v-if="addingMeal">Dodajem...</span>
                        <span v-else>Dodaj obrok</span>
                      </button>

                      <button
                        class="btn btn-outline-secondary fw-bold"
                        @click="resetTodayForm"
                        :disabled="addingMeal"
                      >
                        Očisti
                      </button>
                    </div>

                    <div v-if="addMealError" class="text-danger small mt-1">
                      {{ addMealError }}
                    </div>
                  </div>
                </div>

                <!-- LIST -->
                <div v-if="(data.today_meals || []).length === 0" class="text-muted">
                  Nema obroka za danas.
                </div>

                <div v-else>
                  <div
                    v-for="m in data.today_meals"
                    :key="m.id"
                    class="p-2 mb-2 rounded-3 shadow-sm"
                    style="background:rgba(255,255,255,0.92);"
                  >
                    <div class="d-flex justify-content-between">
                      <div>
                        <div class="fw-semibold">{{ m.recipe?.name || 'Obrok' }}</div>
                        <div class="small text-muted">{{ m.meal_type || '' }}</div>
                      </div>
                      <div class="text-end">
                        <div class="fw-bold">{{ m.recipe?.calories ?? '-' }} kcal</div>
                        <div class="small text-muted">{{ m.recipe?.prep_time ?? '-' }} min</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- RECENT -->
            <div class="col-12 col-lg-6">
              <div class="card p-3 rounded-4 shadow-sm filter-card h-100">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5 class="fw-bold mb-0" style="color:#3E2723;">📚 Zadnji recepti</h5>
                  <button class="btn btn-sm btn-outline-primary" @click="go('/recipes')">Svi</button>
                </div>

                <div v-if="(data.recent_recipes || []).length === 0" class="text-muted">
                  Nema recepata.
                </div>

                <div v-else>
                  <div
                    v-for="r in data.recent_recipes"
                    :key="r.id"
                    class="p-2 mb-2 rounded-3 shadow-sm"
                    style="background:rgba(255,255,255,0.92); cursor:pointer;"
                    @click="go(`/recipes/${r.id}`)"
                  >
                    <div class="d-flex justify-content-between">
                      <div class="fw-semibold">{{ r.name }}</div>
                      <div class="text-end">
                        <div class="fw-bold">{{ r.calories ?? '-' }} kcal</div>
                        <div class="small text-muted">{{ r.prep_time ?? '-' }} min</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-3 p-2 rounded-3" style="background: rgba(245,239,230,0.7);">
                  <div class="small text-muted">⚡ Najbrži recept</div>
                  <div v-if="data.stats?.quickest_recipe" class="fw-semibold">
                    {{ data.stats.quickest_recipe.name }} — {{ data.stats.quickest_recipe.prep_time }} min
                  </div>
                  <div v-else class="text-muted small">Nema podatka.</div>
                </div>

              </div>
            </div>

          </div>
        </div>

        <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const menuOpen = ref(false)

const loading = ref(true)
const error = ref('')
const data = ref(null)

// ✅ auth isto kao MealsView
const token = localStorage.getItem('token')
if (!token) router.push('/login')
api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// ✅ dropdown recipes
const recipes = ref([])

// ✅ daily analytics (cal/protein/carbs/fat) za danas
const daily = ref(null)

const addingMeal = ref(false)
const addMealError = ref('')

const formToday = ref({
  recipe_id: '',
  meal_type: ''
})

const go = (path) => {
  menuOpen.value = false
  router.push(path)
}

const todayISO = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const fetchDashboard = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/dashboard')
    data.value = res.data
  } catch (e) {
    console.error(e)
    const status = e?.response?.status
    if (status === 401) error.value = '401: Nisi prijavljen (token).'
    else if (status === 404) error.value = '404: Ruta /api/dashboard ne postoji.'
    else if (status === 500) error.value = '500: Backend error (pogledaj storage/logs/laravel.log).'
    else error.value = 'Greška pri učitavanju dashboarda.'
  } finally {
    loading.value = false
  }
}

const fetchRecipes = async () => {
  try {
    const res = await api.get('/recipes', { params: { limit: 500, offset: 0 } })
    recipes.value = res.data || []
  } catch (e) {
    console.error(e)
    recipes.value = []
  }
}

// ✅ koristi tvoj AnalyticsController@daily
const fetchDailyAnalytics = async () => {
  try {
    const res = await api.get('/analytics/daily', { params: { date: todayISO() } })
    daily.value = res.data
  } catch (e) {
    console.error(e)
    daily.value = { total: { calories: 0, protein: 0, carbs: 0, fat: 0 } }
  }
}

const resetTodayForm = () => {
  formToday.value = { recipe_id: '', meal_type: '' }
  addMealError.value = ''
}

const addMealToday = async () => {
  addMealError.value = ''

  if (!formToday.value.recipe_id) {
    addMealError.value = 'Odaberite recept.'
    return
  }
  if (!formToday.value.meal_type) {
    addMealError.value = 'Odaberite tip obroka.'
    return
  }

  addingMeal.value = true
  try {
    await api.post('/meals', {
      recipe_id: formToday.value.recipe_id,
      meal_type: formToday.value.meal_type,
      date: todayISO(), // ✅ auto danas
    })

    resetTodayForm()

    // refresh "Danas" + KPI + makroi
    await fetchDashboard()
    await fetchDailyAnalytics()
  } catch (err) {
    console.error(err)
    addMealError.value =
      err?.response?.data?.message ||
      'Greška pri dodavanju obroka (moguće: već postoji obrok na taj dan).'
  } finally {
    addingMeal.value = false
  }
}

onMounted(async () => {
  await fetchRecipes()
  await fetchDashboard()
  await fetchDailyAnalytics()
})
</script>

<style scoped>
/* isti look kao recipes */
.recipes-bg {
  min-height: 100vh;
  width: 100%;
  background: #F5EFE6;
  display:flex;
  align-items:flex-start;
  justify-content:center;
  padding:24px;
  overflow-x:hidden;
}
.recipes-panel {
  position: relative;
  width: 100%;
  max-width: 1200px;
  min-height: calc(100vh - 48px);
  overflow: hidden;
  background: #ffffff;
}
.recipes-panel::before {
  content:"";
  position:absolute;
  inset:0;
  background-image:url('/slika.png');
  background-repeat:no-repeat;
  background-position:center;
  background-size:cover;
  opacity:0.14;
  z-index:0;
}
.recipes-panel > * { position: relative; z-index: 1; }
.brand { color: #9C6644; }
.custom-navbar { background: rgba(255,255,255,0.92) !important; border: 0; }
.filter-card { background: rgba(255, 255, 255, 0.92); border: 0; }
.kpi { font-size: 28px; font-weight: 800; color: #3E2723; margin-top: 6px; }
.kpi-sm { font-size: 22px; font-weight: 800; color: #3E2723; margin-top: 6px; }

/* hamburger + dropdown */
.hamburger-btn { padding: 8px 12px; border: 2px solid #9C6644; background: transparent; cursor:pointer; transition: all .3s; }
.hamburger-btn:hover { background:#9C6644; }
.hamburger-icon { display:flex; flex-direction:column; gap:4px; width:24px; }
.hamburger-icon span { height:3px; background:#9C6644; border-radius:2px; transition: all .3s; }
.hamburger-btn:hover .hamburger-icon span { background:#fff; }

.dropdown-menu-custom { position:absolute; top:80px; right:24px; background:#fff; border:1px solid #e0e0e0; min-width:240px; z-index:2500; overflow:hidden; }
.menu-item { padding:14px 20px; cursor:pointer; transition:.2s; font-size:15px; font-weight:500; color:#3E2723; border-bottom:1px solid #f0f0f0; }
.menu-item:last-child { border-bottom:none; }
.menu-item:hover { background:#F5EFE6; color:#9C6644; }

.menu-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.2); z-index:2000; }

.slide-fade-enter-active { transition: all .3s ease; }
.slide-fade-leave-active { transition: all .2s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-10px); opacity: 0; }

.btn-outline-primary { color:#9C6644; border-color:#9C6644; }
.btn-outline-primary:hover { background:#9C6644; color:#fff; border-color:#9C6644; }

.loading-overlay { position:absolute; inset:0; z-index:3000; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.55); backdrop-filter: blur(2px); }

.kpi-card {
  min-height: 110px;
}

.kpi-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;
  margin-top: 6px;
  font-size: 28px;      /* isto kao ostale KPI */
  font-weight: 800;
  color: #3E2723;
}

.kpi-unit {
  font-size: 14px;
  font-weight: 700;
  color: rgba(62, 39, 35, 0.7);
}

.kpi-macros {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.macro {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.macro-label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(62, 39, 35, 0.65);
  letter-spacing: 0.4px;
}

.macro-value {
  font-size: 18px;     /* ✅ ujednačeno i čitljivo */
  font-weight: 800;
  color: #3E2723;
  line-height: 1;
}

.macro-unit {
  font-size: 12px;
  font-weight: 700;
  color: rgba(62, 39, 35, 0.65);
}

.macro-divider {
  width: 1px;
  height: 18px;
  background: rgba(176, 137, 104, 0.35);
}

</style>
