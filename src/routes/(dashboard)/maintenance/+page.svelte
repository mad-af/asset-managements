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
    MaintenanceDrawer,
  } from "$lib/components";
  import MetaTag from "../../utils/MetaTag.svelte";
  import type { Component } from "svelte";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let openDelete: boolean = $state(false); // modal control

  let open: boolean = $state(false);
  let DrawerComponent: Component = $state(MaintenanceDrawer); // drawer component

  const toggle = (component: Component) => {
    DrawerComponent = component;
    open = !open;
  };

  let selectedTicket: any = $state({});
  let searchTerm: string = $state("");

  // Filter tickets based on search term
  let filteredTickets = $derived(
    data.tickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         ticket.assetId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const path: string = "/maintenance";
  const description: string =
    "Maintenance Orders - Flowbite Svelte Admin Dashboard";
  const title: string = "Flowbite Svelte Admin Dashboard - Maintenance Orders";
  const subtitle: string = "Maintenance Orders";
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
  <h1 class="hidden">Maintenance Orders</h1>
  <div class="p-4">
    <Breadcrumb class="mb-5">
      <BreadcrumbItem home href="/dashboard">Home</BreadcrumbItem>
      <BreadcrumbItem href="/maintenance">Maintenance</BreadcrumbItem>
      <BreadcrumbItem>Orders</BreadcrumbItem>
    </Breadcrumb>
    <Heading
      tag="h1"
      class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
      >All maintenance orders</Heading
    >

    <Toolbar embedded class="w-full py-4 text-gray-500  dark:text-gray-300">
      <Input
        placeholder="Search for maintenance orders"
        class="me-4 w-80 border xl:w-96"
        bind:value={searchTerm}
      />

      {#snippet end()}
        <div class="flex items-center space-x-2">
          <Button
            size="sm"
            class="gap-2 px-3 whitespace-nowrap"
            onclick={() => ((selectedTicket = {}), toggle(MaintenanceDrawer))}
          >
            <PlusOutline size="sm" />Open ticket
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
      {#each ["Title", "Asset", "Status", "Cost", "Duration", "Actions"] as title}
        <TableHeadCell class="p-4 font-medium">{title}</TableHeadCell>
      {/each}
    </TableHead>
    <TableBody>
      {#each filteredTickets as ticket}
        <TableBodyRow class="text-base">
          <TableBodyCell class="w-4 p-4"><Checkbox /></TableBodyCell>
          <TableBodyCell
            class="mr-12 flex items-center space-x-6 p-4 whitespace-nowrap"
          >
            <Avatar />
            <div class="text-sm font-normal text-gray-500 dark:text-gray-300">
              <div
                class="text-base font-semibold text-gray-900 dark:text-white"
              >
                {ticket.title}
              </div>
              <div class="text-sm font-normal text-gray-500 dark:text-gray-300">
                #{ticket.id}
              </div>
            </div>
          </TableBodyCell>
          <TableBodyCell class="p-4">Asset #{ticket.assetId}</TableBodyCell>
          <TableBodyCell class="p-4 font-normal">
            <div class="flex items-center gap-2">
              <Indicator color={ticket.status === "done" ? "green" : ticket.status === "in_progress" ? "yellow" : "red"} />
              {ticket.statusDisplay}
            </div>
          </TableBodyCell>
          <TableBodyCell class="p-4">{ticket.costDisplay}</TableBodyCell>
          <TableBodyCell class="p-4">{ticket.durationDays ? `${ticket.durationDays} days` : 'Ongoing'}</TableBodyCell>
          <TableBodyCell class="space-x-2 p-4">
            <Button
              size="sm"
              class="gap-2 px-3"
              onclick={() => ((selectedTicket = ticket), toggle(MaintenanceDrawer))}
            >
              <EditOutline size="sm" /> Edit ticket
            </Button>
            <Button
              color="red"
              size="sm"
              class="gap-2 px-3"
              onclick={() => ((selectedTicket = ticket), (openDelete = true))}
            >
              <TrashBinSolid size="sm" /> Close ticket
            </Button>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</main>

<!-- Modals -->

<Drawer placement="right" bind:open>
  <DrawerComponent bind:open data={selectedTicket} />
</Drawer>
<DeleteModal
  bind:open={openDelete}
  title={`Are you sure you want to close ${selectedTicket?.title || "this ticket"}?`}
  userId={selectedTicket?.id}
/>
