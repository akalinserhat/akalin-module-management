/**
 * @akalin/module_management - Modül Yönetimi REST Servisi
 */

import { getModuleManagementHttpClient } from './httpClient';
import type {
  IModuleInfo,
  IModuleRegisterRequest,
  IModuleUnregisterRequest,
  IModuleToggleRequest,
  IModulePromotion
} from '../types';

export const moduleManagementService = {
  async getDiscoveredModules(kapsam: 'Admin' | 'ERP' = 'ERP'): Promise<IModuleInfo[]> {
    const client = getModuleManagementHttpClient();
    const res = await client.get('/api/moduller/kesfet', {
      params: { kapsam }
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  async registerModule(data: IModuleRegisterRequest): Promise<any> {
    const client = getModuleManagementHttpClient();
    const res = await client.post('/api/moduller/register', data);
    return res.data;
  },

  async unregisterModule(data: IModuleUnregisterRequest): Promise<any> {
    const client = getModuleManagementHttpClient();
    const res = await client.post('/api/moduller/unregister', data);
    return res.data;
  },

  async toggleModule(data: IModuleToggleRequest): Promise<any> {
    const client = getModuleManagementHttpClient();
    const res = await client.post('/api/moduller/toggle', data);
    return res.data;
  },

  async getModulePromotion(kod: string): Promise<IModulePromotion> {
    const client = getModuleManagementHttpClient();
    const res = await client.get(`/api/moduller/tanitim/${encodeURIComponent(kod)}`);
    return res.data || {};
  },

  async saveModulePromotion(kod: string, data: Partial<IModulePromotion>): Promise<any> {
    const client = getModuleManagementHttpClient();
    const res = await client.put(`/api/moduller/${encodeURIComponent(kod)}/tanitim`, data);
    return res.data;
  }
};
