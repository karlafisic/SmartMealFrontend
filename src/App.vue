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
      const { data } = await api.get('/user')
      userId.value = data.id
    } catch (e) {
      console.error('Failed to fetch user', e)
      // If unauthorized, maybe clear token? 
      // localStorage.removeItem('token')
    }
  }
}

onMounted(() => {
  fetchUser()
  
  // Watch for route changes to re-check user info if login happens
  router.afterEach(() => {
    // If we don't have user ID but have token, try fetch again
    if (!userId.value && localStorage.getItem('token')) {
      fetchUser()
    }
  })
})
</script>

<template>
  <div class="app-container">
    <router-view />
    <AiAssistant :user-id="userId" />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #198754; 
  color: #333;
}

h1, h2 {
  color: #2c3e50;
}
</style>
