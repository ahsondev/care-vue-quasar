export interface AuthState {
  authenticated: boolean;
}

function state(): AuthState {
  return {
    authenticated: false
  }
};

export default state;
