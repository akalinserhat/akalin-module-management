/**
 * @akalin/module_management - Modül Yönetimi Tip Tanımları
 */

import type { ReactNode } from 'react';

export type ModuleDurum = 'REGISTERED' | 'UNREGISTERED' | 'DISABLED' | 'MISSING';

export interface IModuleInfo {
  id?: number | string;
  kod: string;
  ad: string;
  aciklama?: string;
  klasorYolu?: string;
  ikon?: string;
  icon?: any;
  iconName?: string;
  durum?: ModuleDurum;
  isCore?: boolean;
  aktifMi?: boolean;
  modulTipi?: 'frontend' | 'backend' | 'fullstack' | string;
  tanitimHtml?: string;
  tanitimBaslik?: string;
  tanitimOzet?: string;
  tanitimDetay?: string;
  tanitimRozet?: string;
  tanitimButonMetni?: string;
  tanitimSatinAlmaUrl?: string;
  tanitimIkon?: string;
  tanitimGorselUrl?: string;
  tanitimAvantajlar?: string[];
}

export interface IModuleRegisterRequest {
  kod: string;
  ad: string;
  aciklama?: string;
  klasorYolu?: string;
  ikon?: string;
}

export interface IModuleUnregisterRequest {
  id?: number | string;
  kod: string;
  kaliciSil?: boolean;
}

export interface IModuleToggleRequest {
  kod: string;
  aktifMi: boolean;
}

export interface IModulePromotion {
  kod?: string;
  baslik?: string;
  ozet?: string;
  detayliAciklama?: string;
  rozet?: string;
  butonMetni?: string;
  satinAlmaUrl?: string;
  ikon?: string;
  gorselUrl?: string;
  avantajlar?: string[];
  tanitimHtml?: string;
}

export interface IModuleManagementAdapter {
  getDiscoveredModules(kapsam: 'Admin' | 'ERP'): Promise<IModuleInfo[]>;
  registerModule(data: IModuleRegisterRequest): Promise<any>;
  unregisterModule(data: IModuleUnregisterRequest): Promise<any>;
  toggleModule(data: IModuleToggleRequest): Promise<any>;
  getModulePromotion(kod: string): Promise<IModulePromotion>;
  saveModulePromotion(kod: string, data: Partial<IModulePromotion>): Promise<any>;
}

export interface ModuleManagementModuleOptions {
  id?: string;
  title?: string;
  icon?: ReactNode;
  order?: number;
  adapter?: IModuleManagementAdapter;
  baseRoute?: string;
}
