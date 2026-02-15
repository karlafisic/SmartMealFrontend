import { createRouter, createWebHistory } from 'vue-router'

import RecipesView from '@/views/RecipesView.vue'
import RecipeDetailView from '@/views/RecipeDetailView.vue'
import AddRecipeView from '@/views/AddRecipeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import IngredientsView from '@/views/IngredientsView.vue'
import ProfileView from '@/views/ProfileView.vue'
import EditRecipeView from '@/views/EditRecipeView.vue'
import MealsView from '@/views/MealsView.vue'
import MealPlanView from '@/views/MealPlanView.vue'
import RecommendationView from '@/views/RecommendationView.vue'
import AnalyticsView from '@/views/AnalyticsView.vue'   
import Dashboard from '@/views/DashboardView.vue'

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/recipes', name: 'recipes', component: RecipesView },
  { path: '/recipes/:id', name: 'recipe-detail', component: RecipeDetailView, props: true },

  { 
    path: '/add-recipe', 
    name: 'add-recipe', 
    component: AddRecipeView,
    meta: { requiresAuth: true }  
  },
  {
  path: '/dashboard',
  name: 'Dashboard',
  component: Dashboard,
  meta: { requiresAuth: true }
  },
  {
    path: '/recipes/:id/edit',
    name: 'edit-recipe',
    component: EditRecipeView,
    props: true,
    meta: { requiresAuth: true }
  },

  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },

  {
    path: '/profile',
    name: 'profile',
    component: ProfileView, 
    meta: { requiresAuth: true }
  },

  {
    path: '/ingredients',
    name: 'ingredients',
    component: IngredientsView, 
    meta: { requiresAuth: true }
  },

  { 
    path: '/meals', 
    name: 'meals', 
    component: MealsView,
    meta: { requiresAuth: true }  
  },

  {
    path: '/meal-plan',
    name: 'meal-plan',
    component: MealPlanView,
    meta: { requiresAuth: true }
  },

  {
    path: '/recommendations',
    name: 'recommendations',
    component: RecommendationView,
    meta: { requiresAuth: true }
  },

  // ✅ ANALYTICS RUTA
  {
    path: '/analytics',
    name: 'analytics',
    component: AnalyticsView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 🌍 Globalna zaštita ruta
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    // ako ruta zahtijeva login, a token ne postoji -> redirect na login
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router