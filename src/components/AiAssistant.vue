<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  userId: {
    type: [Number, String],
    default: null
  }
})

const isOpen = ref(false)
const socket = ref(null)
const messages = ref([])
const inputMessage = ref('')
const status = ref('offline') // offline, connecting, online, error
const messagesContainer = ref(null)

// Auto-scroll to bottom directly
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Format time
const formatTime = () => {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

// Connect to WebSocket
const connect = () => {
  // Use prop userId OR generate a random guest Id if missing
  const activeUserId = props.userId || `guest-${Math.floor(Math.random() * 10000)}`
  
  console.log('Connecting to WebSocket with User ID:', activeUserId) // Debug log
  
  status.value = 'connecting'
  
  // Create WebSocket - user ID is part of URL
  try {
    socket.value = new WebSocket(`ws://127.0.0.1:8001/ws/assistant/${activeUserId}`)
    
    socket.value.onopen = () => {
      console.log('WebSocket Connected!')
      status.value = 'online'
      messages.value.push({
        id: Date.now(),
        type: 'system',
        text: 'Spojen na AI Asistenta. Kako ti mogu pomoći u kuhanju danas?',
        time: formatTime()
      })
    }
    
    socket.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleIncomingMessage(data)
    }
    
    socket.value.onclose = (event) => {
      console.log('WebSocket Closed:', event)
      status.value = 'offline'
      socket.value = null
    }
    
    socket.value.onerror = (error) => {
      console.error('WebSocket error:', error)
      status.value = 'error'
    }
  } catch (e) {
    console.error('Connection failed:', e)
    status.value = 'error'
  }
}

// Handle incoming messages
const handleIncomingMessage = (data) => {
  let text = ''
  
  if (data.type === 'response') {
    text = data.content
  } else if (data.type === 'substitutions') {
    text = `Zamjene za **${data.ingredient}**:\n`
    data.substitutions.forEach(sub => {
      text += `• ${sub.substitute} (${sub.ratio}) - ${sub.note}\n`
    })
  } else if (data.type === 'recipe_started') {
    text = data.message
  } else if (data.type === 'step') {
    text = `Korak ${data.step_number}/${data.total_steps}:\n${data.instruction}`
  } else if (data.type === 'recipe_complete') {
    text = data.message
  } else {
    text = JSON.stringify(data)
  }
  
  messages.value.push({
    id: Date.now(),
    type: 'assistant',
    text: text,
    time: formatTime()
  })
  
  scrollToBottom()
}

// Send message
const sendMessage = () => {
  if (!inputMessage.value.trim() || !socket.value || status.value !== 'online') return
  
  const text = inputMessage.value.trim()
  
  // Add user message locally
  messages.value.push({
    id: Date.now(),
    type: 'user',
    text: text,
    time: formatTime()
  })
  
  // Send to backend
  socket.value.send(JSON.stringify({
    type: 'chat',
    content: text
  }))
  
  inputMessage.value = ''
  scrollToBottom()
}

// Ask for substitution specifically (helper UI maybe?)
const askSubstitution = (ingredient) => {
  if (!socket.value || status.value !== 'online') return
  
  messages.value.push({
    id: Date.now(),
    type: 'user',
    text: `Zamjena za ${ingredient}`,
    time: formatTime()
  })
  
  socket.value.send(JSON.stringify({
    type: 'substitute',
    ingredient: ingredient
  }))
  
  scrollToBottom()
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && (!socket.value || status.value === 'offline' || status.value === 'error')) {
    connect()
  } else if (isOpen.value) {
    // Just scroll to bottom if opening
    scrollToBottom()
  }
}

// Watch for userId changes - reconnect if ID changes (e.g. login)
watch(() => props.userId, (newId) => {
  if (newId && isOpen.value) {
    if (socket.value) socket.value.close()
    connect()
  }
})

onUnmounted(() => {
  if (socket.value) socket.value.close()
})
</script>

<template>
  <div class="ai-assistant-container">
    <!-- Chat Window -->
    <div v-if="isOpen" class="chat-window shadow-lg">
      <!-- Header -->
      <div class="chat-header d-flex justify-content-between align-items-center p-3 bg-success text-white">
        <div class="d-flex align-items-center gap-2">
          <span>🤖</span>
          <span class="fw-bold">AI Asistent</span>
          <span class="status-dot" :class="status"></span>
        </div>
        <button class="btn-close btn-close-white" @click="toggleChat"></button>
      </div>
      
      <!-- Messages -->
      <div ref="messagesContainer" class="chat-messages p-3">
        <div v-if="status === 'connecting'" class="text-center text-muted my-3">
          Spajanje...
        </div>
        <div v-if="status === 'error'" class="text-center text-danger my-3">
          Greška u konekciji. Pokušaj ponovno.
          <button class="btn btn-sm btn-outline-danger mt-2" @click="connect">Ponovi</button>
        </div>
        
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="message-wrapper mb-3"
          :class="msg.type === 'user' ? 'text-end' : 'text-start'"
        >
          <div 
            class="message p-2 d-inline-block text-start"
            :class="msg.type === 'user' ? 'user-msg text-white' : 'assistant-msg bg-light'"
          >
            <div class="message-content" style="white-space: pre-wrap;">{{ msg.text }}</div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>
      </div>
      
      <!-- Input -->
      <div class="chat-input p-3 border-top bg-white">
        <form @submit.prevent="sendMessage" class="d-flex gap-2">
          <input 
            v-model="inputMessage" 
            type="text" 
            class="form-control" 
            placeholder="Pitaj za savjet o kuhanju..."
            :disabled="status !== 'online'"
          >
          <button 
            type="submit" 
            class="btn btn-success"
            :disabled="status !== 'online'"
          >
            ➤
          </button>
        </form>
        <div class="mt-2 text-center" v-if="status !== 'online'">
             <small class="text-danger" v-if="status === 'error' || status === 'offline'">Niste povezani (Status: {{status}})</small>
        </div>
      </div>
    </div>
    
    <!-- Floating Button -->
    <button class="chat-toggle-btn shadow-lg" @click="toggleChat">
      <span v-if="!isOpen">💬 AI Pomoć</span>
      <span v-else>⬇️ Zatvori</span>
    </button>
  </div>
</template>

<style scoped>
.ai-assistant-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chat-toggle-btn {
  background: #198754;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 15px 25px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.chat-toggle-btn:hover {
  transform: scale(1.05);
  background: #146c43;
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
}

.message-wrapper {
  margin-bottom: 12px;
}

.message {
  max-width: 80%;
  border-radius: 12px;
  position: relative;
}

.user-msg {
  background: #198754;
  border-bottom-right-radius: 2px;
}

.assistant-msg {
  background: #e9ecef;
  color: #333;
  border-bottom-left-radius: 2px;
  border: 1px solid #dee2e6;
}

.message-content {
  font-size: 14px;
}

.message-time {
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.7;
  text-align: right;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  display: inline-block;
}

.status-dot.online { background: #adff2f; box-shadow: 0 0 5px #adff2f; }
.status-dot.connecting { background: #ffc107; }
.status-dot.error { background: #dc3545; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.btn-xs {
  padding: 2px 6px;
  font-size: 11px;
}
</style>
