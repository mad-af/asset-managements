<script lang="ts">
  import {
    Button,
    CloseButton,
    Heading,
    Input,
    Label,
    Select,
    Textarea,
  } from "flowbite-svelte";
  import { CloseOutline } from "flowbite-svelte-icons";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";

  interface MaintenanceDrawerProps {
    open?: boolean;
    data?: Record<string, any>;
  }

  let { open = $bindable(false), data }: MaintenanceDrawerProps = $props();

  let title = $derived(
    data && Object.keys(data).length ? "Edit maintenance order" : "Open new ticket"
  );
  let isEditing = $derived(data && Object.keys(data).length > 0);
  let formAction = $derived(isEditing ? "?/update" : "?/create");

  function init(form: HTMLFormElement) {
    // Populate form fields with existing data
    for (const key in data) {
      const el = form.elements.namedItem(key);
      if (el) {
        if (el instanceof HTMLInputElement) {
          el.value = data[key] || "";
        } else if (el instanceof HTMLTextAreaElement) {
          el.value = data[key] || "";
        }
      }
    }
  }
</script>

<Heading tag="h5" class="mb-6 text-sm font-semibold uppercase">{title}</Heading>
<CloseButton
  onclick={() => (open = false)}
  class="absolute top-2.5 right-2.5 text-gray-400 hover:text-black dark:text-white"
/>

<form
  method="POST"
  action={formAction}
  use:init
  use:enhance={() => {
    return async ({
      result,
      update,
    }: {
      result: any;
      update: () => Promise<void>;
    }) => {
      if (result.type === "success") {
        open = false;
        await invalidateAll();
      } else if (result.type === "failure") {
        // Biarkan SvelteKit menangani error secara default
        await update();
      }
    };
  }}
>
  {#if isEditing}
    <input type="hidden" name="id" value={data?.id || ""} />
  {/if}

  <div class="space-y-4">
    <Label class="space-y-2">
      <span>Asset ID *</span>
      <Input
        name="assetId"
        class="border outline-none"
        placeholder="e.g. ASSET-001"
        required
      />
    </Label>

    <Label class="space-y-2">
      <span>Title *</span>
      <Input
        name="title"
        class="border outline-none"
        placeholder="e.g. Replace broken screen"
        required
      />
    </Label>

    <Label class="space-y-2">
      <span>Description</span>
      <Textarea
        name="description"
        rows={4}
        class="w-full bg-gray-50 outline-none dark:bg-gray-700"
        placeholder="Detailed description of the maintenance work needed..."
      ></Textarea>
    </Label>

    <Label class="space-y-2">
      <span>Cost (in cents)</span>
      <Input
        name="costCents"
        type="number"
        class="border outline-none"
        placeholder="e.g. 5000 (for $50.00)"
        min="0"
      />
    </Label>

    <div
      class="bottom-0 left-0 flex w-full justify-center space-x-4 pb-4 md:absolute md:px-4"
    >
      <Button type="submit" class="w-full">
        {isEditing ? "Update ticket" : "Open ticket"}
      </Button>

      <Button
        color="alternative"
        class="w-full"
        onclick={() => ((open = false), console.log("hallo"))}
      >
        <CloseOutline />
        Cancel
      </Button>
    </div>
  </div>
</form>

<!--
@component
[Go to docs](https://flowbite-svelte-admin-dashboard.vercel.app/)
## Type
[ProductDrawerProps](https://github.com/themesberg/flowbite-svelte-admin-dashboard/blob/main/src/lib/types.ts#L382)
## Props
@prop hidden = $bindable(true)
@prop title = 'Add new product'
-->
