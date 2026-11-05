<script setup lang="ts">
const props = defineProps<{ user: User }>()
const colorMode = useColorMode()
const userUrl = computed(() => `https://github.com/${props.user.username}`)
</script>

<template>
  <header class="hero-panel flex flex-col items-center gap-2 px-5 py-7 sm:px-8 sm:py-9">
    <a :href="userUrl" target="_blank"><UAvatar
      :src="user.avatar"
      :alt="user.name"
      size="xl"
    />
    </a>
    <h1 class="text-2xl sm:text-4xl text-center font-semibold tracking-tight text-neutral-950 dark:text-white">
      <a :href="userUrl" target="_blank">
        {{ user.name }}
      </a>
    </h1>
    <div class="flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300">
      <ClientOnly>
        <UButton
          :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          :icon="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="neutral"
          variant="link"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        />
        <template #fallback>
          <div class="w-8 h-8" />
        </template>
      </ClientOnly>
      <UButton
        :to="userUrl"
        external
        target="_blank"
        :aria-label="`${user.name}'s GitHub profile`"
        icon="i-lucide-github"
        color="neutral"
        variant="link"
      />
      <UButton
        to="/feed.xml"
        external
        target="_blank"
        aria-label="RSS Feed"
        icon="i-lucide-rss"
        color="neutral"
        variant="link"
      />
      <UButton
        to="https://wayne.is-a.dev/"
        external
        aria-label="Open Wayne's portfolio"
        icon="i-lucide-panels-top-left"
        color="neutral"
        variant="link"
      />
      <UButton
        to="https://wayne.is-a.dev/cv.pdf"
        external
        aria-label="Open Wayne's CV"
        icon="i-lucide-file-user"
        color="neutral"
        variant="link"
      />
    </div>
    <slot />
  </header>
</template>
