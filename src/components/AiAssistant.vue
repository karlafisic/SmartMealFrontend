<template>
  <div v-if="userId" class="ai-assistant-container">
    <!-- Chat Window -->
    <div v-if="isOpen" class="chat-window shadow-lg">
      <!-- Header -->
      <div class="chat-header d-flex justify-content-between align-items-center p-3">
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
            :class="msg.type === 'user' ? 'user-msg text-white' : (msg.type === 'system' ? 'system-msg' : 'assistant-msg')"
          >
            <div class="message-content" style="white-space: pre-wrap;">{{ msg.text }}</div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input p-3 border-top">
        <form @submit.prevent="sendMessage" class="d-flex gap-2">
          <input
            v-model="inputMessage"
            type="text"
            class="form-control"
            placeholder="Pitaj za savjet o kuhanju..."
            :disabled="status === 'connecting'"
          />
          <button type="submit" class="btn btn-primary" :disabled="status !== 'online'">➤</button>
        </form>
        <div class="mt-2 text-center" v-if="status !== 'online'">
          <small class="text-danger" v-if="status === 'error' || status === 'offline'">
            Niste povezani (Status: {{ status }})
          </small>
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

<script setup>
import { ref, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  userId: { type: [Number, String], default: null }
})

const isOpen = ref(false)
const socket = ref(null)
const messages = ref([])
const inputMessage = ref('')
const status = ref('offline')
const messagesContainer = ref(null)

let reconnectTimer = null
let reconnectAttempts = 0
const manuallyClosed = ref(false)

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

const formatTime = () => {
  const now = new Date()
  return now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0')
}

const scheduleReconnect = () => {
  if (!isOpen.value || manuallyClosed.value || reconnectTimer) return
  const delay = Math.min(2000*(reconnectAttempts+1),10000)
  reconnectTimer = setTimeout(()=>{ reconnectTimer=null; reconnectAttempts++; connect() }, delay)
}

const clearReconnect = () => { if(reconnectTimer){ clearTimeout(reconnectTimer); reconnectTimer=null } }

const connect = () => {
  if(!props.userId) return // samo za ulogirane
  clearReconnect()
  status.value='connecting'
  manuallyClosed.value=false

  if(socket.value) try{socket.value.close()}catch(_){}
  socket.value = new WebSocket(`ws://127.0.0.1:8001/ws/assistant/${props.userId}`)

  socket.value.onopen = () => {
    status.value='online'; reconnectAttempts=0
    if(messages.value.length===0) messages.value.push({id:Date.now(), type:'system', text:'Spojen na AI Asistenta. Kako ti mogu pomoći u kuhanju danas?', time:formatTime()})
    scrollToBottom()
  }
  socket.value.onmessage = e => { try{handleIncomingMessage(JSON.parse(e.data))}catch(err){console.error(err)} }
  socket.value.onclose = () => { socket.value=null; if(!manuallyClosed.value){status.value='offline'; scheduleReconnect()} }
  socket.value.onerror = e => { console.error(e); status.value='error'; scheduleReconnect() }
}

const handleIncomingMessage = (data) => {
  let text = ''
  if(data.type==='response') text=data.content
  else if(data.type==='substitutions') text=`Zamjene za ${data.ingredient}:\n`+data.substitutions.map(s=>`• ${s.substitute} (${s.ratio}) - ${s.note}`).join('\n')
  else if(data.type==='recipe_started' || data.type==='recipe_complete') text=data.message
  else if(data.type==='step') text=`Korak ${data.step_number}/${data.total_steps}:\n${data.instruction}`
  else text=JSON.stringify(data)

  messages.value.push({id:Date.now(), type:'assistant', text, time:formatTime()})
  scrollToBottom()
}

const buildHistory = () => messages.value.filter(m=>['user','assistant'].includes(m.type)).slice(-10).map(m=>({role:m.type==='user'?'user':'assistant', content:m.text}))

const sendMessage = () => {
  const raw = inputMessage.value.trim(); if(!raw) return
  if(!socket.value || status.value!=='online' || socket.value.readyState!==WebSocket.OPEN){ status.value='offline'; scheduleReconnect(); return }
  messages.value.push({id:Date.now(), type:'user', text:raw, time:formatTime()})
  socket.value.send(JSON.stringify({type:'chat', content:raw, history:buildHistory()}))
  inputMessage.value=''
  scrollToBottom()
}

const toggleChat = () => {
  if(!props.userId) return // samo ulogirani
  isOpen.value=!isOpen.value
  if(isOpen.value){
    if(!socket.value || status.value==='offline' || status.value==='error') connect()
    else scrollToBottom()
  } else {
    manuallyClosed.value=true
    clearReconnect()
    if(socket.value) try{socket.value.close()}catch(_){}
    socket.value=null
    status.value='offline'
  }
}

watch(()=>props.userId, ()=>{ if(isOpen.value){if(socket.value) try{socket.value.close()}catch(_){socket.value=null}; reconnectAttempts=0; connect()} })

onUnmounted(()=>{ manuallyClosed.value=true; clearReconnect(); if(socket.value) try{socket.value.close()}catch(_){}})
</script>


<style scoped>
/* theme vars samo za ovu komponentu */
.ai-assistant-container {
  --bg: #F5EFE6;
  --brown-1: #B08968;
  --brown-2: #9C6644;
  --text: #3E2723;
  --panel: rgba(255, 255, 255, 0.92);
  --border: rgba(176, 137, 104, 0.25);

  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chat-toggle-btn {
  background: linear-gradient(135deg, var(--brown-2), var(--brown-1));
  color: white;
  border: none;
  border-radius: 50px;
  padding: 14px 22px;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.2s, filter 0.2s;
}

.chat-toggle-btn:hover {
  transform: scale(1.05);
  filter: brightness(0.95);
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 360px;
  height: 520px;
  background: var(--panel);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  backdrop-filter: blur(2px);
  animation: slideUp 0.25s ease-out;
}

/* header */
.chat-header {
  background: linear-gradient(135deg, var(--brown-2), var(--brown-1));
  color: #fff;
}

/* messages area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}

/* bubbles */
.message {
  max-width: 82%;
  border-radius: 14px;
  position: relative;
  border: 1px solid transparent;
}

.user-msg {
  background: var(--brown-1);
  border-bottom-right-radius: 4px;
}

.assistant-msg {
  background: rgba(255, 255, 255, 0.95);
  color: var(--text);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}

.system-msg {
  background: rgba(255, 255, 255, 0.85);
  color: var(--text);
  border: 1px dashed rgba(176, 137, 104, 0.35);
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

/* input */
.chat-input {
  background: rgba(255, 255, 255, 0.95);
}

/* lokalno preboji “primary” tipku u smeđu */
.btn-primary {
  background-color: var(--brown-1);
  border-color: var(--brown-1);
  font-weight: 800;
}
.btn-primary:hover {
  background-color: var(--brown-2);
  border-color: var(--brown-2);
}

/* status dots */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  display: inline-block;
}

.status-dot.online {
  background: #B08968;
  box-shadow: 0 0 6px rgba(176, 137, 104, 0.75);
}
.status-dot.connecting { background: #ffc107; }
.status-dot.error { background: #dc3545; }
.status-dot.offline { background: #999; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
