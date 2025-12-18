<template>
  <div id="app">
    <nav class="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <router-link to="/" class="flex items-center gap-2 text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors">
            <img src="/logo-light.svg" alt="VIBE" class="w-8 h-8" />
            <span>VIBE</span>
          </router-link>
          <div class="flex items-center gap-4">
            <router-link 
              to="/" 
              class="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              active-class="text-blue-600 font-medium"
            >
              Demo
            </router-link>
            <router-link 
              to="/examples" 
              class="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              active-class="text-blue-600 font-medium"
            >
              Examples
            </router-link>
          </div>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
// Root App component with router
</script>
