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
    AuditDrawer,
  } from "$lib/components";
  import MetaTag from "../../utils/MetaTag.svelte";
  import type { Component } from "svelte";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let open: boolean = $state(false);
  let DrawerComponent: Component = $state(AuditDrawer); // drawer component

  const toggle = (component: Component) => {
    DrawerComponent = component;
    open = !open;
  };

  let selectedAudit: any = $state({});
  let searchTerm: string = $state("");

  // Filter audits based on search term
  let filteredAudits = $derived(
    data.audits.filter(
      (audit) =>
        audit.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const path: string = "/crud/audits";
  const description: string =
    "CRUD audits example - Flowbite Svelte Admin Dashboard";
  const title: string = "Flowbite Svelte Admin Dashboard - CRUD Audits";
  const subtitle: string = "CRUD Audits";
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
  <h1 class="hidden">CRUD: Audits</h1>
  <div class="p-4">
    <Breadcrumb class="mb-5">
      <BreadcrumbItem home href="/dashboard">Home</BreadcrumbItem>
      <BreadcrumbItem href="/audits">Audits</BreadcrumbItem>
      <BreadcrumbItem>List</BreadcrumbItem>
    </Breadcrumb>
    <Heading
      tag="h1"
      class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
      >All audits</Heading
    >

    <Toolbar embedded class="w-full py-4 text-gray-500  dark:text-gray-300">
      <Input
        placeholder="Search for audits"
        class="me-4 w-80 border xl:w-96"
        bind:value={searchTerm}
      />

      {#snippet end()}
        <div class="flex items-center space-x-2">
          <Button
            size="sm"
            class="gap-2 px-3 whitespace-nowrap"
            onclick={() => ((selectedAudit = {}), toggle(AuditDrawer))}
          >
            <PlusOutline size="sm" />Add audit
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
      {#each ["Title", "Location", "Status", "Progress", "Actions"] as title}
        <TableHeadCell class="p-4 font-medium">{title}</TableHeadCell>
      {/each}
    </TableHead>
    <TableBody>
      {#each filteredAudits as audit}
        <TableBodyRow class="text-base">
          <TableBodyCell class="w-4 p-4"><Checkbox /></TableBodyCell>
          <TableBodyCell class="p-4 font-semibold text-gray-900 dark:text-white">
            {audit.title}
          </TableBodyCell>
          <TableBodyCell class="p-4">
            {audit.locationId || 'All Locations'}
          </TableBodyCell>
          <TableBodyCell class="p-4 font-normal">
            <div class="flex items-center gap-2">
              <Indicator color={audit.status === 'draft' ? 'yellow' : audit.status === 'in_progress' ? 'blue' : 'green'} />
              {audit.statusDisplay}
            </div>
          </TableBodyCell>
          <TableBodyCell class="p-4">
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div class="bg-blue-600 h-2.5 rounded-full" style="width: {audit.progress}%"></div>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">{audit.progress}%</span>
          </TableBodyCell>
          <TableBodyCell class="space-x-2 p-4">
            {#if audit.status === 'draft'}
              <Button
                size="sm"
                class="gap-2 px-3"
                onclick={() => ((selectedAudit = audit), toggle(AuditDrawer))}
              >
                <EditOutline size="sm" /> Edit
              </Button>
              <Button
                color="green"
                size="sm"
                class="gap-2 px-3"
                onclick={() => {
                  const form = new FormData();
                  form.append('id', audit.id);
                  fetch('?/start', { method: 'POST', body: form });
                }}
              >
                Start
              </Button>
            {:else if audit.status === 'in_progress'}
              <Button
                color="blue"
                size="sm"
                class="gap-2 px-3"
                onclick={() => {
                  const form = new FormData();
                  form.append('id', audit.id);
                  fetch('?/finalize', { method: 'POST', body: form });
                }}
              >
                Finalize
              </Button>
            {:else}
              <span class="text-sm text-gray-500 dark:text-gray-400">Completed</span>
            {/if}
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</main>

<!-- Modals -->

<Drawer placement="right" bind:open>
  <DrawerComponent bind:open data={selectedAudit} locations={data.locations} />
</Drawer>
