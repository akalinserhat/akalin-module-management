/**
 * @akalin/module_management - Modül Özellikleri Form Doğrulama Kuralları (ModulFeatureFormValidation.ts)
 * Modül Feature Formu için alan bazlı ve form geneli saf (pure) doğrulama fonksiyonları.
 */

import type { TFunction } from 'i18next';
import type { ModuleConfigItem } from '../types';

export type TranslationFn = TFunction | ((key: string, ...args: any[]) => any);

/**
 * Tek bir alan için doğrulama yapar.
 */
export function validateModulFeatureField(
  field: keyof ModuleConfigItem | string,
  value: any,
  t: TranslationFn
): Record<string, string> {
  const errors: Record<string, string> = {};

  switch (field) {
    case 'title':
      if (!value || typeof value !== 'string' || !value.trim()) {
        errors.title = t('modul_basligi_zorunlu', 'Modül başlığı zorunludur.');
      } else if (value.trim().length < 2) {
        errors.title = t('modul_basligi_en_az_iki_karakter', 'Modül başlığı en az 2 karakter olmalıdır.');
      }
      break;

    case 'id':
      if (!value || typeof value !== 'string' || !value.trim()) {
        errors.id = t('modul_kimligi_zorunlu', 'Modül kimliği (ID) zorunludur.');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
        errors.id = t('modul_kimligi_gecersiz_format', 'Modül kimliği yalnızca harf, rakam, tire ve alt çizgi içerebilir.');
      }
      break;

    case 'package':
      if (!value || typeof value !== 'string' || !value.trim()) {
        errors.package = t('paket_yolu_zorunlu', 'Paket (@akalin/*) veya dosya yolu zorunludur.');
      }
      break;

    case 'order':
      if (value !== undefined && value !== null && value !== '') {
        const num = Number(value);
        if (isNaN(num) || num < 0) {
          errors.order = t('sira_no_gecersiz', 'Sıra numarası 0 veya daha büyük bir tam sayı olmalıdır.');
        }
      }
      break;

    default:
      break;
  }

  return errors;
}

/**
 * Form genelini topluca doğrular.
 */
export function validateModulFeatureForm(
  formData: Partial<ModuleConfigItem>,
  t: TranslationFn
): Record<string, string> {
  const errors: Record<string, string> = {};

  const titleErrors = validateModulFeatureField('title', formData.title, t);
  if (titleErrors.title) errors.title = titleErrors.title;

  const idErrors = validateModulFeatureField('id', formData.id, t);
  if (idErrors.id) errors.id = idErrors.id;

  const packageErrors = validateModulFeatureField('package', formData.package, t);
  if (packageErrors.package) errors.package = packageErrors.package;

  const orderErrors = validateModulFeatureField('order', formData.order, t);
  if (orderErrors.order) errors.order = orderErrors.order;

  return errors;
}
