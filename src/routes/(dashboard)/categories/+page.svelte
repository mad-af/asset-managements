<script lang="ts">
  import {
    Alert,
    Avatar,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Checkbox,
    Drawer,
    Heading,
    Indicator,
  } from "flowbite-svelte";
  import {
    Input,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
  } from "flowbite-svelte";
  import { TableHeadCell, Toolbar, ToolbarButton } from "flowbite-svelte";
  import {
    EditOutline,
    ExclamationCircleSolid,
    PlusOutline,
    TrashBinSolid,
  } from "flowbite-svelte-icons";
  import {
    imagesPath,
    DeleteModal,
    CategoryDrawer,
  } from "$lib/components";
  import MetaTag from "../../utils/MetaTag.svelte";
  import type { Component } from "svelte";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let openDelete: boolean = $state(false); // modal control

  let open: boolean = $state(false);
  let DrawerComponent: Component = $state(CategoryDrawer); // drawer component

  const toggle = (component: Component) => {
    DrawerComponent = component;
    open = !open;
  };

  let selectedCategory: any = $state({});
  let searchTerm: string = $state("");

  // Filter categories based on search term
  let filteredCategories = $derived(
    data.categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );
  const path: string = "/crud/categories";
  const description: string =
    "CRUD categories example - Flowbite Svelte Admin Dashboard";
  const title: string = "Flowbite Svelte Admin Dashboard - CRUD Categories";
  const subtitle: string = "CRUD Categories";
</script>

{#if form?.message}
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999999]">
    <Alert color="red" class="max-w-md shadow-lg">
      {form.message}
    </Alert>
  </div>
{/if}

<MetaTag {path} {description} {title} {subtitle} />

<main class="relative h-full w-full overflow-y-auto">
  <h1 class="hidden">CRUD: Categories</h1>
  <div class="p-4">
    <Breadcrumb class="mb-5">
      <BreadcrumbItem home href="/dashboard">Home</BreadcrumbItem>
      <BreadcrumbItem href="/categories">Categories</BreadcrumbItem>
      <BreadcrumbItem>List</BreadcrumbItem>
    </Breadcrumb>
    <Heading
      tag="h1"
      class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
      >All categories</Heading
    >

    <Toolbar embedded class="w-full py-4 text-gray-500  dark:text-gray-300">
      <Input
        placeholder="Search for categories"
        class="me-4 w-80 border xl:w-96"
        bind:value={searchTerm}
      />

      {#snippet end()}
        <div class="flex items-center space-x-2">
          <Button
            size="sm"
            class="gap-2 px-3 whitespace-nowrap"
            onclick={() => ((selectedCategory = {}), toggle(CategoryDrawer))}
          >
            <PlusOutline size="sm" />Add category
          </Button>
          <!-- <Button size="sm" color="alternative" class="gap-2 px-3">
            <DownloadSolid size="md" class="-ml-1" />Export
          </Button> -->
        </div>
      {/snippet}
    </Toolbar>
  </div>
  <Table>
    <TableHead
      class="border-y border-gray-200 bg-gray-100 dark:border-gray-700"
    >
      <TableHeadCell class="w-4 p-4"><Checkbox /></TableHeadCell>
      {#each ["Name", "Description", "Created", "Actions"] as title}
        <TableHeadCell class="p-4 font-medium">{title}</TableHeadCell>
      {/each}
    </TableHead>
    <TableBody>
      {#each filteredCategories as category}
        <TableBodyRow class="text-base">
          <TableBodyCell class="w-4 p-4"><Checkbox /></TableBodyCell>
          <TableBodyCell class="p-4">
            <div class="text-base font-semibold text-gray-900 dark:text-white">
              {category.name}
            </div>
          </TableBodyCell>
          <TableBodyCell
            class="max-w-sm truncate overflow-hidden p-4 text-base font-normal text-gray-500 xl:max-w-xs dark:text-gray-300"
          >
            {category.description || 'No description'}
          </TableBodyCell>
          <TableBodyCell class="p-4 font-normal text-gray-500 dark:text-gray-300">
            {new Date(category.createdAt).toLocaleDateString()}
          </TableBodyCell>
          <TableBodyCell class="space-x-2 p-4">
            <Button
              size="sm"
              class="gap-2 px-3"
              onclick={() => ((selectedCategory = category), toggle(CategoryDrawer))}
            >
              <EditOutline size="sm" /> Edit category
            </Button>
            <Button
              color="red"
              size="sm"
              class="gap-2 px-3"
              onclick={() => ((selectedCategory = category), (openDelete = true))}
            >
              <TrashBinSolid size="sm" /> Delete category
            </Button>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</main>

<!-- Modals -->

<Drawer placement="right" bind:open>
  <DrawerComponent bind:open data={selectedCategory} />
</Drawer>
<DeleteModal
  bind:open={openDelete}
  title={`Are you sure you want to delete ${selectedCategory?.name || "this category"}?`}
  userId={selectedCategory?.id}
/>
