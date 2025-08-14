<script lang="ts">
  import { onMount } from "svelte";
  import { Spinner } from "flowbite-svelte";

  // Komponen ini akan otomatis redirect melalui +page.server.ts
  // Hanya menampilkan loading state sementara
</script>

<svelte:head>
  <title>Logging out...</title>
</svelte:head>

<div
  class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"
>
  <div class="flex flex-col items-center space-y-4">
    <Spinner size="8" />
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
      Signing out...
    </h2>
    <p class="text-gray-600 dark:text-gray-400">
      Please wait while we log you out securely.
    </p>
  </div>
</div>
