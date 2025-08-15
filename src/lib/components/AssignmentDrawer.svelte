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

  interface AssignmentDrawerProps {
    open?: boolean;
    data?: Record<string, any>;
    isCheckout?: boolean;
    assets?: Array<{ id: string; name: string; }>;
    users?: Array<{ id: string; name: string; email: string; }>;
  }

  let { open = $bindable(false), data, isCheckout = true, assets = [], users = [] }: AssignmentDrawerProps = $props();

  let title = $derived(
    isCheckout ? "Checkout Asset" : "Return Asset"
  );
  let formAction = $derived(isCheckout ? "?/checkout" : "?/return");

  function init(form: HTMLFormElement) {
    // Populate form fields with existing data
    for (const key in data) {
      const el = form.elements.namedItem(key);
      if (el) {
        if (el instanceof HTMLInputElement) {
          el.value = data[key] || "";
        } else if (el instanceof HTMLTextAreaElement) {
          el.value = data[key] || "";
        } else if (el instanceof HTMLSelectElement) {
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
  {#if !isCheckout}
    <input type="hidden" name="id" value={data?.id || ""} />
  {/if}

  <div class="space-y-4">
    {#if isCheckout}
      <Label class="space-y-2">
        <span>Asset ID *</span>
        <Select
          name="assetId"
          class="border outline-none"
          required
        >
          {#each assets as asset}
            <option value={asset.id}>{asset.name} ({asset.id})</option>
          {/each}
        </Select>
      </Label>

      <Label class="space-y-2">
        <span>User ID *</span>
        <Select
          name="userId"
          class="border outline-none"
          required
        >
          {#each users as user}
            <option value={user.id}>{user.name} ({user.email})</option>
          {/each}
        </Select>
      </Label>

      <Label class="space-y-2">
        <span>Due Date</span>
        <Input
          name="dueAt"
          type="date"
          class="border outline-none"
        />
      </Label>

      <Label class="space-y-2">
        <span>Condition Out</span>
        <Select name="conditionOut" class="border outline-none">
          <option value="">Select condition</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </Select>
      </Label>
    {:else}
      <div class="space-y-2">
        <span class="text-sm font-medium">Assignment ID: {data?.id}</span>
        <span class="text-sm text-gray-500">Asset: {data?.assetId}</span>
        <span class="text-sm text-gray-500">User: {data?.userId}</span>
      </div>

      <Label class="space-y-2">
        <span>Condition In</span>
        <Select name="conditionIn" class="border outline-none">
          <option value="">Select condition</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </Select>
      </Label>
    {/if}

    <Label class="space-y-2">
      <span>Notes</span>
      <Textarea
        name="notes"
        rows={4}
        class="w-full bg-gray-50 outline-none dark:bg-gray-700"
        placeholder={isCheckout ? "Notes about checkout..." : "Notes about return..."}
      ></Textarea>
    </Label>

    <div
      class="bottom-0 left-0 flex w-full justify-center space-x-4 pb-4 md:absolute md:px-4"
    >
      <Button type="submit" class="w-full">
        {isCheckout ? "Checkout Asset" : "Return Asset"}
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
