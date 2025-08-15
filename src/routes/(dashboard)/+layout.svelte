<script lang="ts">
  import "../../app.css";
  import Navbar from "./Navbar.svelte";
  import Sidebar from "./Sidebar.svelte";
  import type { LayoutProps } from "./$types";
  import Footer from "./Footer.svelte";

  interface Route {
    path: string;
  }

  let { children, data }: LayoutProps = $props();
  // const routes: Route[] = data.posts.adminDashboard;
  const routes: Route[] = [];
  const docsRoute = routes
    .filter((route) => route.path !== "")
    .map((route) => route.path);

  let drawerHidden = $state(false);
</script>

<header
  class="fixed top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
>
  <Navbar bind:drawerHidden />
</header>
<div
  class="overflow-hidden lg:flex bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
>
  <Sidebar bind:drawerHidden {docsRoute} />
  <div
    class="relative h-full w-full min-h-[100vh] overflow-y-auto pt-[70px] lg:ml-64"
  >
    {@render children()}
    <Footer />
  </div>
</div>
