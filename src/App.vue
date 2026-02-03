<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from './services/api'
import AiAssistant from './components/AiAssistant.vue'

const userId = ref(null)
const router = useRouter()
const route = useRoute()

// ✅ sakrij AI na ovim stranicama
const hideAIOnAuthPages = computed(() =>
  route.path === '/login' || route.path === '/register'
)

const fetchUser = async () => {
  const token = localStorage.getItem('token')

  // ✅ ako nema tokena, nema ni userId
  if (!token) {
    userId.value = null
    return
  }

  try {
    const { data } = await api.get('/profile')
    userId.value = data.id
  } catch (e) {
    console.error('Failed to fetch user', e)
    // Ako token nije valjan ili je istekao, makni sve
    localStorage.removeItem('token')
    userId.value = null
  }
}

onMounted(() => {
  fetchUser()

  router.afterEach(() => {
    // refresh userId nakon navigacije ako postoji token a nema userId
    if (!userId.value && localStorage.getItem('token')) {
      fetchUser()
    }
    // ako ode na login/register, možeš i ugasiti userId (nije nužno)
    if (route.path === '/login' || route.path === '/register') {
      // ne diram token, samo sakrij AI
    }
  })
})
</script>

<template>
  <div class="app-container">
    <router-view />

    <!-- ✅ AI samo kad:
         1) userId postoji
         2) nismo na login/register -->
    <AiAssistant v-if="userId && !hideAIOnAuthPages" :userId="userId" />
  </div>
</template>

<style>
:root {
  --bg: #F5EFE6;
  --text: #3E2723;
  --brand: #9C6644;
  --primary: #B08968;
}

html, body {
  height: 100%;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--bg);
  color: var(--text);
}

.app-container {
  min-height: 100vh;
}

h1, h2, h3, h4, h5 {
  color: var(--brand);
}
</style>
