<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const user = ref(null)
const loading = ref(true)
const error = ref('')
const success = ref('')

// --------------------
// Auth
// --------------------
const token = localStorage.getItem('token')
if (!token) router.push('/login')
api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// --------------------
// Load user profile
// --------------------
onMounted(async () => {
  try {
    const res = await api.get('/me')
    user.value = res.data

    // Pretvori array u string za input
    if (Array.isArray(user.value.preferences)) {
      user.value.preferences = user.value.preferences.join(', ')
    }
  } catch (err) {
    console.error(err)
    router.push('/login')
  } finally {
    loading.value = false
  }
})

// --------------------
// Save profile
// --------------------
async function saveProfile() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    // Pretvori string u array prije slanja
    let prefsArray = []
    if (user.value.preferences) {
      prefsArray = user.value.preferences
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }

    const res = await api.put('/profile', {
      goal: user.value.goal,
      preferences: prefsArray
    })

    success.value = res.data.message || 'Profile updated successfully.'
  } catch (err) {
    error.value = 'Failed to update profile'
  } finally {
    loading.value = false
  }
}

// --------------------
// Navigation
// --------------------
const goRecipes = () => router.push('/recipes')
const addRecipe = () => router.push('/add-recipe')
const goMealPlanner = () => router.push('/meal-plan')
const logout = () => {
  localStorage.removeItem('token')
  delete api.defaults.headers.common['Authorization']
  router.push('/login')
}
</script>

<template>
  <div class="profile-bg d-flex align-items-center justify-content-center">
    <div class="profile-panel shadow-lg rounded-4 p-4 p-md-5">

      <!-- LOADING OVERLAY -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- HEADER -->
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded-4 px-3 shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold brand" href="#">SmartMeal AI</a>

          <div class="ms-auto d-flex gap-2">
            <button class="btn btn-outline-success fw-semibold" @click="goRecipes">
              Recipes
            </button>

            <button class="btn btn-outline-success fw-semibold" @click="addRecipe">
              Add Recipe
            </button>

            <button class="btn btn-outline-success fw-semibold" @click="goMealPlanner">
              Meal Planner
            </button>
            <button class="btn btn-outline-danger fw-semibold" @click="logout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <!-- TITLE -->
      <div class="mb-3">
        <h2 class="fw-bold brand mb-1">Your Profile</h2>
        <p class="text-muted mb-0">Update your goals and preferences.</p>
      </div>

      <!-- ERROR / SUCCESS -->
      <div v-if="error" class="alert alert-danger py-2">
        {{ error }}
      </div>

      <div v-if="success" class="alert alert-success py-2">
        {{ success }}
      </div>

      <!-- FORM CARD -->
      <div v-if="!loading && user" class="card rounded-4 shadow-sm p-3 p-md-4 form-card">
        <h5 class="fw-bold mb-3">Profile settings</h5>

        <div class="row g-3">
          <div class="col-12">
            <label class="form-label fw-semibold">Goal</label>
            <input
              type="text"
              class="form-control"
              v-model="user.goal"
              placeholder="Your goal..."
            />
          </div>

          <div class="col-12">
            <label class="form-label fw-semibold">Preferences (comma separated)</label>
            <input
              type="text"
              class="form-control"
              v-model="user.preferences"
              placeholder="e.g. vegetarian, low-carb"
            />
            <div class="form-text">
              Separate multiple preferences with commas.
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button
            class="btn btn-success fw-bold flex-grow-1"
            @click="saveProfile"
            :disabled="loading"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* full screen green background */
.profile-bg {
  min-height: 100vh;
  width: 100%;
  background: #198754;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-x: hidden;
}

/* central panel */
.profile-panel {
  position: relative;
  width: 100%;
  max-width: 900px;
  min-height: calc(100vh - 48px);
  background: #ffffff;
}

/* faded logo background */
.profile-panel::before {
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

.profile-panel > * {
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

/* form card */
.form-card {
  background: rgba(255, 255, 255, 0.92);
  border: 0;
}
</style>