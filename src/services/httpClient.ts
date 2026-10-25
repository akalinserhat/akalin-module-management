/**
 * @akalin/module_management - HTTP Client Altyapısı
 */

import axios, { type AxiosInstance } from 'axios';

let customClient: AxiosInstance | null = null;

export function setModuleManagementHttpClient(client: AxiosInstance) {
  customClient = client;
}

export function getModuleManagementHttpClient(): AxiosInstance {
  if (customClient) {
    return customClient;
  }
  return axios;
}
