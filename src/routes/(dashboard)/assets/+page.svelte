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
    AssetDrawer,
  } from "$lib/components";
  import MetaTag from "../../utils/MetaTag.svelte";
  import type { Component } from "svelte";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let openDelete: boolean = $state(false); // modal control

  let open: boolean = $state(false);
  let DrawerComponent: Component = $state(AssetDrawer); // drawer component

  const toggle = (component: Component) => {
    DrawerComponent = component;
    open = !open;
  };

  let selectedAsset: any = $state({});
  let searchTerm: string = $state("");

  // Filter assets based on search term
  let filteredAssets = $derived(
    data.assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.serialNo && asset.serialNo.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );
  const path: string = "/crud/assets";
  const description: string =
    "CRUD assets example - Flowbite Svelte Admin Dashboard";
  const title: string = "Flowbite Svelte Admin Dashboard - CRUD Assets";
  const subtitle: string = "CRUD Assets";
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
  <h1 class="hidden">CRUD: Users</h1>
  <div class="p-4">
    <Breadcrumb class="mb-5">
      <BreadcrumbItem home href="/dashboard">Home</BreadcrumbItem>
      <BreadcrumbItem href="/assets">Assets</BreadcrumbItem>
      <BreadcrumbItem>List</BreadcrumbItem>
    </Breadcrumb>
    <Heading
      tag="h1"
      class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
      >All assets</Heading
    >

    <Toolbar embedded class="w-full py-4 text-gray-500  dark:text-gray-300">
      <Input
        placeholder="Search for assets"
        class="me-4 w-80 border xl:w-96"
        bind:value={searchTerm}
      />

      {#snippet end()}
        <div class="flex items-center space-x-2">
          <Button
            size="sm"
            class="gap-2 px-3 whitespace-nowrap"
            onclick={() => ((selectedAsset = {}), toggle(AssetDrawer))}
          >
            <PlusOutline size="sm" />Add asset
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
      {#each ["Code", "Name", "Serial No", "Status", "Actions"] as title}
        <TableHeadCell class="p-4 font-medium">{title}</TableHeadCell>
      {/each}
    </TableHead>
    <TableBody>
      {#each filteredAssets as asset}
        <TableBodyRow class="text-base">
          <TableBodyCell class="w-4 p-4"><Checkbox /></TableBodyCell>
          <TableBodyCell class="p-4 whitespace-nowrap">
            <div class="text-base font-semibold text-gray-900 dark:text-white">
              {asset.code}
            </div>
          </TableBodyCell>
          <TableBodyCell class="p-4">{asset.name}</TableBodyCell>
          <TableBodyCell class="p-4">{asset.serialNo || '-'}</TableBodyCell>
          <TableBodyCell class="p-4 font-normal">
            <div class="flex items-center gap-2">
              <Indicator color={asset.status === "active" ? "green" : 
                         asset.status === "maintenance" ? "yellow" : 
                         asset.status === "inactive" ? "gray" : 
                         "red"} />
              {asset.status}
            </div>
          </TableBodyCell>
          <TableBodyCell class="space-x-2 p-4">
            <Button
              size="sm"
              class="gap-2 px-3"
              onclick={() => ((selectedAsset = asset), toggle(AssetDrawer))}
            >
              <EditOutline size="sm" /> Edit
            </Button>
            <Button
              color="red"
              size="sm"
              class="gap-2 px-3"
              onclick={() => ((selectedAsset = asset), (openDelete = true))}
            >
              <TrashBinSolid size="sm" /> Delete
            </Button>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</main>

<!-- Modals -->

<Drawer placement="right" bind:open>
  <DrawerComponent bind:open data={selectedAsset} categories={data.categories} locations={data.locations} />
</Drawer>
<DeleteModal
  bind:open={openDelete}
  title={`Are you sure you want to delete ${selectedAsset?.name || "this asset"}?`}
  userId={selectedAsset?.id}
/>
