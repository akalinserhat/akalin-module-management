/**
 * @akalin/module_management - Modül Özellikleri Form Varsayılan Değerleri (ModulFeatureFormDefaultValue.ts)
 * Modül yapılandırma formu için başlangıç / varsayılan durum üreticisi.
 */

import type { ModuleConfigItem } from '../types';

export function getModulFeatureDefaultValues(initial?: Partial<ModuleConfigItem>): ModuleConfigItem {
  return {
    id: initial?.id || '',
    title: initial?.title || '',
    order: initial?.order ?? 10,
    isCore: Boolean(initial?.isCore),
    enabled: initial?.enabled !== false,
    package: initial?.package || '',
    exportName: initial?.exportName || '',
    path: initial?.path || '',
    iconName: initial?.iconName || 'Package',
    description: initial?.description || '',
    version: initial?.version || '1.0.0'
  };
}
