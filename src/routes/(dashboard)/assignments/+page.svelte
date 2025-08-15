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
    AssignmentDrawer,
  } from "$lib/components";
  import MetaTag from "../../utils/MetaTag.svelte";
  import type { Component } from "svelte";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let open: boolean = $state(false);
  let DrawerComponent: Component = $state(AssignmentDrawer); // drawer component

  const toggle = (component: Component) => {
    DrawerComponent = component;
    open = !open;
  };

  let selectedAssignment: any = $state({});
  let searchTerm: string = $state("");
  let isCheckout: boolean = $state(true); // true for checkout, false for return

  // Filter assignments based on search term
  let filteredAssignments = $derived(
    data.assignments.filter(
      (assignment) =>
        assignment.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.userId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const path: string = "/assignments";
  const description: string =
    "Asset Assignments - Flowbite Svelte Admin Dashboard";
  const title: string = "Flowbite Svelte Admin Dashboard - Asset Assignments";
  const subtitle: string = "Asset Assignments";
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
  <h1 class="hidden">Asset Assignments</h1>
  <div class="p-4">
    <Breadcrumb class="mb-5">
      <BreadcrumbItem home href="/dashboard">Home</BreadcrumbItem>
      <BreadcrumbItem href="/assignments">Assignments</BreadcrumbItem>
      <BreadcrumbItem>List</BreadcrumbItem>
    </Breadcrumb>
    <Heading
      tag="h1"
      class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
      >Asset Assignments</Heading
    >

    <Toolbar embedded class="w-full py-4 text-gray-500  dark:text-gray-300">
      <Input
        placeholder="Search assignments by asset or user ID"
        class="me-4 w-80 border xl:w-96"
        bind:value={searchTerm}
      />

      {#snippet end()}
        <div class="flex items-center space-x-2">
          <Button
            size="sm"
            class="gap-2 px-3 whitespace-nowrap"
            onclick={() => ((selectedAssignment = {}, isCheckout = true), toggle(AssignmentDrawer))}
          >
            <PlusOutline size="sm" />Checkout Asset
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
      {#each ["Asset ID", "User ID", "Assigned At", "Due At", "Status", "Actions"] as title}
        <TableHeadCell class="p-4 font-medium">{title}</TableHeadCell>
      {/each}
    </TableHead>
    <TableBody>
      {#each filteredAssignments as assignment}
        <TableBodyRow class="text-base">
          <TableBodyCell class="w-4 p-4"><Checkbox /></TableBodyCell>
          <TableBodyCell class="p-4 font-medium text-gray-900 dark:text-white">
            {assignment.assetId}
          </TableBodyCell>
          <TableBodyCell class="p-4">{assignment.userId}</TableBodyCell>
          <TableBodyCell class="p-4">
            {new Date(assignment.assignedAt).toLocaleDateString()}
          </TableBodyCell>
          <TableBodyCell class="p-4">
            {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'No due date'}
          </TableBodyCell>
          <TableBodyCell class="p-4 font-normal">
            <div class="flex items-center gap-2">
              <Indicator 
                color={assignment.status === "Active" ? (assignment.isOverdue ? "red" : "green") : "gray"} 
              />
              {assignment.status}
              {#if assignment.isOverdue}
                <span class="text-red-600 text-xs">(Overdue)</span>
              {/if}
            </div>
          </TableBodyCell>
          <TableBodyCell class="space-x-2 p-4">
            {#if assignment.status === "Active"}
              <Button
                size="sm"
                class="gap-2 px-3"
                onclick={() => ((selectedAssignment = assignment, isCheckout = false), toggle(AssignmentDrawer))}
              >
                <EditOutline size="sm" /> Return Asset
              </Button>
            {:else}
              <span class="text-gray-500 text-sm">Returned</span>
            {/if}
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</main>

<!-- Modals -->

<Drawer placement="right" bind:open>
  <DrawerComponent bind:open data={selectedAssignment} {isCheckout} assets={data.assets} users={data.users} />
</Drawer>
