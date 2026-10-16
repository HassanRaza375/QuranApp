<script setup lang="ts">
defineProps<{ message: string; clearLabel?: string }>();
defineEmits<{ clear: [] }>();
</script>

<template>
  <div class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="empty-list">
    <p class="text-[15px]">{{ message }}</p>
    <Button variant="outline" class="mt-3 min-h-11 md:min-h-8" data-testid="empty-clear" @click="$emit('clear')">{{ clearLabel ?? "Clear" }}</Button>
  </div>
</template>
