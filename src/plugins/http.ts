export class Http {
  get = async (
    url: string,
    params: Record<string, unknown> = {}
  ): Promise<unknown> => {
    const headers = this.buildHeaders();

    let requestUrl = url;
    if (params) {
      requestUrl = `${requestUrl}?${this.objectToQuerystring(params)}`;
    }

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: headers,
    });

    return response.json();
  };

  post = async (url: string, data: unknown = {}) => {
    const headers = this.buildHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    return response.json();
  };

  private objectToQuerystring(params: Record<string, unknown>): string {
    return Object.keys(params)
      .map((key) => {
        const val = params[key];
        if (typeof val === 'undefined') {
          return null;
        }

        let str = '';
        if (val instanceof Array) {
          if (val.length === 0) return null;

          str = val.join(',');
        } else if (val instanceof String) {
          str = val as string;
        } else if (val instanceof Number) {
          str = val.toString();
        } else {
          str = String(val);
        }

        return `${encodeURIComponent(key)}=${encodeURIComponent(str)}`;
      })
      .filter((x) => x)
      .join('&');
  }

  private buildHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    } as Record<string, string>;

    const token = window.localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
}

export default new Http();
