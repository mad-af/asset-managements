<script lang="ts">
  import { Label, Input, Alert } from 'flowbite-svelte';
  import { SignIn } from '$lib/components';
  import MetaTag from '../../utils/MetaTag.svelte';
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let formElement: HTMLFormElement;

  const handleSubmit = (event: Event) => {
    // Form akan disubmit secara normal karena method="POST" sudah diset
  };

  let title = 'Sign in to platform';
  let site = {
    name: 'Asset Management',
    img: '/images/flowbite-svelte-icon-logo.svg',
    link: '/',
    imgAlt: 'FlowBite Logo'
  };
  let rememberMe = true;
  let lostPassword = true;
  let createAccount = true;
  let lostPasswordLink = 'forgot-password';
  let loginTitle = 'Login to your account';
  let registerLink = 'sign-up';
  let createAccountTitle = 'Create account';

  const path: string = '/authentication/sign-in';
  const description: string = 'Sign in example - Flowbite Svelte Admin Dashboard';
  const metaTitle: string = 'Flowbite Svelte Admin Dashboard - Sign in';
  const subtitle: string = 'Sign in';
</script>

<MetaTag {path} {description} title={metaTitle} {subtitle} />

{#if form?.message}
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
    <Alert color="red" class="max-w-md shadow-lg">
      {form.message}
    </Alert>
  </div>
{/if}

<SignIn {title} {site} {rememberMe} {lostPassword} {createAccount} {lostPasswordLink} {loginTitle} {registerLink} {createAccountTitle} method="POST" onsubmit={handleSubmit} {enhance}>
  <div>
    <Label for="email" class="mb-2 dark:text-white">Your email</Label>
    <Input type="email" name="email" id="email" placeholder="name@company.com" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
  </div>
  <div>
    <Label for="password" class="mb-2 dark:text-white">Your password</Label>
    <Input type="password" name="password" id="password" placeholder="••••••••" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
  </div>
</SignIn>
