<script lang="ts">
  import { Button, Modal } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { DeleteModalProps } from './types';

  let { open = $bindable(true), title = 'Are you sure you want to delete this?', yes = "Yes, I'm sure", no = 'No, cancel', onConfirm, userId }: DeleteModalProps = $props();
</script>

<Modal bind:open size="sm">
  <ExclamationCircleOutline class="mx-auto mt-8 mb-4 h-10 w-10 text-red-600" />

  <h3 class="mb-6 text-center text-lg text-gray-500 dark:text-gray-300">{title}</h3>

  <form method="POST" action="?/delete" use:enhance={() => {
    return async ({ result, update }) => {
      if (result.type === 'success') {
        open = false;
        await invalidateAll();
        if (onConfirm) onConfirm();
      } else if (result.type === 'failure') {
        // Biarkan SvelteKit menangani error secara default
        await update();
      }
    };
  }}>
    {#if userId}
      <input type="hidden" name="id" value={userId} />
    {/if}
    <div class="flex items-center justify-center">
      <Button type="submit" color="red" class="mr-2">{yes}</Button>
      <Button type="button" color="alternative" onclick={() => (open = false)}>{no}</Button>
    </div>
  </form>
</Modal>

<!--
@component
[Go to docs](https://flowbite-svelte-admin-dashboard.vercel.app/)
## Type
[DeleteModalProps](https://github.com/themesberg/flowbite-svelte-admin-dashboard/blob/main/src/lib/types.ts#L237)
## Props
@prop open = $bindable(true)
@prop title = 'Are you sure you want to delete this?'
@prop yes = "Yes, I'm sure"
@prop no = 'No, cancel'
-->
