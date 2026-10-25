/**
 * @akalin/module_management - Modül Yönetimi Modül Tanımı ve Fabrikası
 */

import React, { lazy, Suspense } from 'react';
import { PackageOpen, LayoutGrid, ShieldCheck } from 'lucide-react';
import type { IModuleDefinition } from '@akalin/module_core';
import type { ModuleManagementModuleOptions } from './types';
import {
  ModuleManagementServiceProvider,
  defaultModuleManagementAdapter
} from './adapters/ModuleManagementServiceContext';

const LazyModullerPage = lazy(() => import('./pages/ModullerPage'));

export function createModuleManagementModule(
  options: ModuleManagementModuleOptions = {}
): IModuleDefinition & { components: any } {
  const adapter = options.adapter || defaultModuleManagementAdapter;
  const baseRoute = options.baseRoute || '/moduller';

  const withProvider = (Component: React.ComponentType<any>, props: any = {}) => {
    return React.createElement(
      ModuleManagementServiceProvider,
      { adapter },
      React.createElement(
        Suspense,
        { fallback: React.createElement('div', { className: 'p-16 text-muted' }, 'Yükleniyor...') },
        React.createElement(Component, props)
      )
    );
  };

  const moduleDef: IModuleDefinition & { components: any } = {
    id: options.id || 'modul_yonetimi',
    title: options.title || 'Modül Yönetimi',
    icon: options.icon || React.createElement(PackageOpen, { size: 20 }),
    iconName: 'PackageOpen',
    order: options.order ?? 60,
    routes: [
      {
        path: baseRoute,
        element: withProvider(LazyModullerPage),
        title: 'Modül Yönetimi'
      },
      {
        path: `${baseRoute}/ui`,
        element: withProvider(LazyModullerPage, { scope: 'ERP' }),
        title: 'UI Modülleri'
      },
      {
        path: `${baseRoute}/admin`,
        element: withProvider(LazyModullerPage, { scope: 'Admin' }),
        title: 'Admin Modülleri'
      }
    ],
    menuItems: [
      {
        id: 'menu_modul_yonetimi',
        label: options.title || 'Modül Yönetimi',
        icon: options.icon || React.createElement(PackageOpen, { size: 20 }),
        isDropdown: true,
        order: options.order ?? 60
      },
      {
        id: 'menu_moduller_ui',
        parentId: 'menu_modul_yonetimi',
        label: 'UI Modülleri',
        path: `${baseRoute}/ui`,
        icon: React.createElement(LayoutGrid, { size: 16 }),
        order: 10
      },
      {
        id: 'menu_moduller_admin',
        parentId: 'menu_modul_yonetimi',
        label: 'Admin Modülleri',
        path: `${baseRoute}/admin`,
        icon: React.createElement(ShieldCheck, { size: 16 }),
        order: 20
      }
    ],
    components: {
      ModullerPage: LazyModullerPage,
      Moduller: LazyModullerPage
    }
  };

  return moduleDef;
}

export const ModuleManagementModule = createModuleManagementModule();
export default ModuleManagementModule;
