<template>
  <div class="recipe-card card h-100 shadow-sm rounded-4">
    <div class="card-body d-flex flex-column">
      <h5 class="card-title fw-bold recipe-title mb-2">
        {{ recipe.name }}
      </h5>

      <div class="stats mb-3">
        <p class="card-text mb-1"><strong>Kalorije:</strong> {{ recipe.calories }}</p>
        <p class="card-text mb-1"><strong>Proteini:</strong> {{ recipe.protein }}</p>
        <p class="card-text mb-1"><strong>Ugljikohidrati:</strong> {{ recipe.carbs }}</p>
        <p class="card-text mb-1"><strong>Masti:</strong> {{ recipe.fat }}</p>
      </div>

      <button class="btn btn-primary mt-auto fw-bold w-100" @click="viewRecipe">
        Pogledaj
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  recipe: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const viewRecipe = () => {
  router.push(`/recipes/${props.recipe.id}`)
}
</script>

<style scoped>
.recipe-card {
  position: relative;
  overflow: hidden;
  background: #ffffff;
  border: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* blaga food pozadina */
.recipe-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/slika.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  opacity: 0.06;
  z-index: 0;
}

.recipe-card > * {
  position: relative;
  z-index: 1;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

/* naslov */
.recipe-title {
  color: #9C6644;
}

/* tekst statistike */
.stats p {
  font-size: 0.95rem;
  color: #3E2723;
}

/* PRIMARY BUTTON – usklađen s aplikacijom */
.btn-primary {
  background-color: #B08968;
  border-color: #B08968;
}
.btn-primary:hover {
  background-color: #9C6644;
  border-color: #9C6644;
}
</style>
