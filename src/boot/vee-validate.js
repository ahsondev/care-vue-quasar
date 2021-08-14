import { boot } from 'quasar/wrappers';
import { defineRule } from 'vee-validate';
import { required, email, min } from '@vee-validate/rules';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot((/* { app, router, ... } */) => {
  defineRule('required', required);
  defineRule('email', email);
  defineRule('min', min);
});
