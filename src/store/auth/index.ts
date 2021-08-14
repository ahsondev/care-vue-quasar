import { Module } from 'vuex';
import { AppState } from '../index';
import state, { AuthState } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const exampleModule: Module<AuthState, AppState> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default exampleModule;
