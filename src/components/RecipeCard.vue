<template>
  <div class="recipe-card card h-100 shadow-sm rounded-4">
    <div class="card-body d-flex flex-column">
      <h5 class="card-title fw-bold brand mb-2">
        {{ recipe.name }}
      </h5>

      <div class="stats">
        <p class="card-text mb-1"><strong>Calories:</strong> {{ recipe.calories }}</p>
        <p class="card-text mb-1"><strong>Protein:</strong> {{ recipe.protein }}</p>
        <p class="card-text mb-1"><strong>Carbs:</strong> {{ recipe.carbs }}</p>
        <p class="card-text mb-3"><strong>Fat:</strong> {{ recipe.fat }}</p>
      </div>

      <button class="btn btn-success mt-auto fw-bold w-100" @click="viewRecipe">
        View
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

/* faded logo u pozadini kao login */
.recipe-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  opacity: 0.07;
  z-index: 0;
}

.recipe-card > * {
  position: relative;
  z-index: 1;
}

.recipe-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.12);
}

.brand {
  color: #198754;
}

.stats p {
  font-size: 0.95rem;
}
</style>