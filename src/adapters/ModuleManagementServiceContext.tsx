/**
 * @akalin/module_management - Modül Yönetimi Adapter ve Context Altyapısı
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type {
  IModuleManagementAdapter,
  IModuleInfo,
  IModuleRegisterRequest,
  IModuleUnregisterRequest,
  IModuleToggleRequest,
  IModulePromotion
} from '../types';
import { moduleManagementService } from '../services/moduleManagementService';
import { setModuleManagementHttpClient } from '../services/httpClient';

export function createRestModuleManagementAdapter(customHttpClient?: any): IModuleManagementAdapter {
  if (customHttpClient) {
    setModuleManagementHttpClient(customHttpClient);
  }

  return {
    getDiscoveredModules: (kapsam: 'Admin' | 'ERP') => moduleManagementService.getDiscoveredModules(kapsam),
    registerModule: (data: IModuleRegisterRequest) => moduleManagementService.registerModule(data),
    unregisterModule: (data: IModuleUnregisterRequest) => moduleManagementService.unregisterModule(data),
    toggleModule: (data: IModuleToggleRequest) => moduleManagementService.toggleModule(data),
    getModulePromotion: (kod: string) => moduleManagementService.getModulePromotion(kod),
    saveModulePromotion: (kod: string, data: Partial<IModulePromotion>) => moduleManagementService.saveModulePromotion(kod, data)
  };
}

export const defaultModuleManagementAdapter = createRestModuleManagementAdapter();

export const ModuleManagementServiceContext = createContext<IModuleManagementAdapter>(defaultModuleManagementAdapter);

export interface ModuleManagementServiceProviderProps {
  adapter?: IModuleManagementAdapter;
  children?: ReactNode;
}

export const ModuleManagementServiceProvider: React.FC<ModuleManagementServiceProviderProps> = ({
  adapter,
  children
}) => {
  const activeAdapter = useMemo(() => adapter || defaultModuleManagementAdapter, [adapter]);

  return (
    <ModuleManagementServiceContext.Provider value={activeAdapter}>
      {children}
    </ModuleManagementServiceContext.Provider>
  );
};

export function useModuleManagementService(): IModuleManagementAdapter {
  const context = useContext(ModuleManagementServiceContext);
  if (!context) {
    return defaultModuleManagementAdapter;
  }
  return context;
}
