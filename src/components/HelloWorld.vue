<script setup>
defineProps({
  msg: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="greetings">
    <h1 class="title">{{ msg }}</h1>

    <h3 class="subtitle">
      You’ve successfully created a project with
      <a href="https://vite.dev/" target="_blank" rel="noopener">Vite</a> +
      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>.
    </h3>
  </div>
</template>

<style scoped>
.title {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
  color: #9C6644; /* ✅ smeđa kao SmartMeal */
}

.subtitle {
  font-size: 1.2rem;
  color: #3E2723;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

/* linkovi u istom tonu */
a {
  color: #B08968;
  text-decoration: none;
  font-weight: 600;
}

a:hover {
  color: #9C6644;
  text-decoration: underline;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
