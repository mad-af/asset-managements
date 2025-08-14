<script lang="ts">
  import { Label, Input, Alert } from 'flowbite-svelte';
  import { SignUp } from '$lib/components';
  import MetaTag from '../../utils/MetaTag.svelte';
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let formElement: HTMLFormElement;

  const handleSubmit = (event: Event) => {
    // Form akan disubmit secara normal karena method="POST" sudah diset
  };

  const title = 'Create a Free Account';
  const site = {
    name: 'Asset Management',
    img: '/images/flowbite-svelte-icon-logo.svg',
    link: '/',
    imgAlt: 'FlowBite Logo'
  };
  const acceptTerms = true;
  const haveAccount = true;
  const btnTitle = 'Create account';
  const termsLink = '/';
  const loginLink = 'sign-in';
  const labelClass = 'space-y-2 dark:text-white';

  const path: string = '/authentication/sign-up';
  const description: string = 'Sign up example - Flowbite Svelte Admin Dashboard';
  const metaTitle: string = 'Flowbite Svelte Admin Dashboard - Sign up';
  const subtitle: string = 'Sign up';
</script>

<MetaTag {path} {description} title={metaTitle} {subtitle} />

{#if form?.message}
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
    <Alert color="red" class="max-w-md shadow-lg">
      {form.message}
    </Alert>
  </div>
{/if}

<SignUp {title} {site} {acceptTerms} {haveAccount} {btnTitle} {termsLink} {loginLink} method="POST" onsubmit={handleSubmit} {enhance}>
  <div>
    <Label class={labelClass}>
      <span>Your email</span>
      <Input type="email" name="email" placeholder="name@company.com" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
    </Label>
  </div>
  <div>
    <Label class={labelClass}>
      <span>Your password</span>
      <Input type="password" name="password" placeholder="••••••••" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
    </Label>
  </div>
  <div>
    <Label class={labelClass}>
      <span>Confirm password</span>
      <Input type="password" name="confirm-password" placeholder="••••••••" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
    </Label>
  </div>
</SignUp>
