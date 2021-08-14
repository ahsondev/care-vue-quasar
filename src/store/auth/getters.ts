import { GetterTree } from 'vuex';
import { AppState } from '../index';
import { AuthState } from './state';

const getters: GetterTree<AuthState, AppState> = {
  someAction (/* context */) {
    // your code
  }
};

export default getters;
