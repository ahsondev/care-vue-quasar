<template>
  <q-page class="row items-center justify-evenly">
    <q-form style="width: 400px" @submit.stop="onSubmit" class="q-gutter-md">
      <q-input outlined label="Email" v-model="username">
        <template v-slot:prepend>
          <q-icon name="email" />
        </template>
      </q-input>

      <q-input type="password" outlined label="Password" v-model="password">
        <template v-slot:prepend>
          <q-icon name="lock" />
        </template>
      </q-input>

      <q-btn label="Login" type="submit" color="primary" :loading="loading" />
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useStore } from '../store';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'Login',
  components: {},
  setup() {
    const username = ref('');
    const password = ref('');
    const loading = ref(false);
    const store = useStore();
    const router = useRouter();

    async function onSubmit() {
      loading.value = true;
      try {
        await store.dispatch('auth/login', {
          username: username.value,
          password: password.value,
        });

        if (store.state.auth.authenticated) {
          await router.push({ name: 'home' });
        } else {
          //
        }
      } catch (ex) {
        console.log(ex);
      } finally {
        setTimeout(() => {
          loading.value = false;
        }, 500);
      }
    }

    return { loading, username, password, onSubmit };
  },
});
</script>
