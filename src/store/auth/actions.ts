import { ActionTree } from 'vuex';
import { AppState } from '../index';
import { AuthState } from './state';
import http from '../../plugins/http';

const actions: ActionTree<AuthState, AppState> = {
  login({ commit }, data: { username: string; password: string }) {
    return http
      .post('https://my.tanda.co/api/oauth/token', {
        username: data.username,
        password: data.password,
        scope: 'timesheet department user leave',
        grant_type: 'password',
      })
      .then((resp: { access_token: string; created_at: number }) => {
        if (!resp.access_token) return;

        window.localStorage.setItem('access_token', resp.access_token);

        commit('success');
      });
  },
};

export default actions;
