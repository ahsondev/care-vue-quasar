import { MutationTree } from 'vuex';
import { AuthState } from './state';

const mutation: MutationTree<AuthState> = {
  success(state: AuthState) {
    state.authenticated = true;
  },
};

export default mutation;
