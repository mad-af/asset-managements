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
  import type { UserDrawerProps } from "./types";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";

  let { open = $bindable(false), data }: UserDrawerProps = $props();

  let title = $derived(
    data && Object.keys(data).length ? "Edit user" : "Add new user"
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
      <span>First Name</span>
      <Input
        name="firstName"
        class="border outline-none"
        placeholder="e.g. Bonnie"
        required
      />
    </Label>

    <Label class="space-y-2">
      <span>Last Name</span>
      <Input
        name="lastName"
        class="border outline-none"
        placeholder="e.g. Green"
        required
      />
    </Label>

    <Label class="space-y-2">
      <span>Email</span>
      <Input
        name="email"
        type="email"
        class="border outline-none"
        placeholder="e.g. bonnie@flowbite.com"
        required
      />
    </Label>

    <Label class="space-y-2">
      <span>Position</span>
      <Input
        name="position"
        class="border outline-none"
        placeholder="e.g. React Developer"
      />
    </Label>

    <!-- <Label class="space-y-2">
      <span>Password</span>
      <Input
        name="password"
        type="password"
        class="border outline-none"
        placeholder="••••••••"
        required={!isEditing}
      />
    </Label> -->

    <Label class="space-y-2">
      <span>Biography</span>
      <Textarea
        name="biography"
        rows={4}
        class="w-full bg-gray-50 outline-none dark:bg-gray-700"
        placeholder="👨‍💻Full-stack web developer. Open-source contributor."
      ></Textarea>
    </Label>

    <div
      class="bottom-0 left-0 flex w-full justify-center space-x-4 pb-4 md:absolute md:px-4"
    >
      <Button type="submit" class="w-full">
        {isEditing ? "Update user" : "Add user"}
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
