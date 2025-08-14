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

  let { hidden = $bindable(true), data }: UserDrawerProps = $props();

  let title = data && Object.keys(data).length ? "Edit user" : "Add new user";

  function init(form: HTMLFormElement) {
    if (data?.name) [data.first_name, data.last_name] = data.name.split(" ");
    for (const key in data) {
      // console.log(key, data[key]);
      const el = form.elements.namedItem(key);
      if (el) {
        if (el instanceof HTMLInputElement) {
          el.value = data[key];
        } else if (el instanceof HTMLTextAreaElement) {
          el.value = data[key];
        }
      }
    }
  }
</script>

<Heading tag="h5" class="mb-6 text-sm font-semibold uppercase">{title}</Heading>
<CloseButton
  onclick={() => (hidden = true)}
  class="absolute top-2.5 right-2.5 text-gray-400 hover:text-black dark:text-white"
/>

<form action="#" use:init>
  <div class="space-y-4">
    <Label class="space-y-2">
      <span>First Name</span>
      <Input
        name="first_name"
        class="border outline-none"
        placeholder="e.g. Bonnie"
        required
      />
    </Label>

    <Label class="space-y-2">
      <span>Last Name</span>
      <Input
        name="last_name"
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
      />
    </Label>
    <Label class="space-y-2">
      <span>Position</span>
      <Input
        name="position"
        class="border outline-none"
        placeholder="e.g. React Developer"
        required
      />
    </Label>
    <Label class="space-y-2">
      <span>Current Password</span>
      <Input
        name="current-password"
        type="password"
        class="border outline-none"
        placeholder="••••••••"
        required
      />
    </Label>

    <Label class="space-y-2">
      <span>New Password</span>
      <Input
        name="news-password"
        type="password"
        class="border outline-none"
        placeholder="••••••••"
        required
      />
    </Label>

    <div
      class="bottom-0 left-0 flex w-full justify-center space-x-4 pb-4 md:absolute md:px-4"
    >
      <Button type="submit" class="w-full">{title}</Button>
      <Button
        color="alternative"
        class="w-full"
        onclick={() => (hidden = true)}
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
