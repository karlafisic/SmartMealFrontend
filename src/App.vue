<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from './services/api'
import AiAssistant from './components/AiAssistant.vue'

const userId = ref(null)
const router = useRouter()

const fetchUser = async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const { data } = await api.get('/me')
      userId.value = data.id
    } catch (e) {
      console.error('Failed to fetch user', e)
      // localStorage.removeItem('token')
      // userId.value = null
    }
  }
}

onMounted(() => {
  fetchUser()

  router.afterEach(() => {
    if (!userId.value && localStorage.getItem('token')) {
      fetchUser()
    }
  })
})
</script>


<template>
  <div class="app-container">
    <router-view />
    <!-- AI pomoć samo ako je userId postavljen -->
    <AiAssistant v-if="userId" :user-id="userId" />
  </div>
</template>

<style>
/* ✅ GLOBAL THEME (bež + smeđe) */
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

/* da router-view uvijek zauzme visinu */
.app-container {
  min-height: 100vh;
}

/* naslovi */
h1, h2, h3, h4, h5 {
  color: var(--brand);
}
</style>
