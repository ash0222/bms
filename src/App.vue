<script lang="ts" setup>
import FloatingChat from './components/FloatingChat.vue'
</script>

<template>
    <div>
        <FloatingChat />
        <router-view></router-view>
    </div>
</template>


<style>
  *{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
</style>