/**
 * @akalin/module_management - Modül Özellikleri Form Sayfası (ModulFeatureForm.tsx)
 * BaseCardPage temel bileşeni üzerinden türetilmiş modül yapılandırma ve özellik formu.
 * 
 * MİMARİ NOTLARI:
 * - Sayfa altı düğmeler KESİNLİKLE kaldırılmıştır (BaseCardPage Sıfır Alt Düğme Mimarisi).
 * - "Aktif" ve "Çekirdek" durum kontrolleri ActionMenu içerisine BaseSwitch ile yerleştirilmiştir.
 * - Kaydetme işlemi sayfa başlığındaki ActionMenu (split-button) ve Cmd+S / Ctrl+S kısayolu ile yürütülür.
 * - Breadcrumb başlığı (recordTitle) formData.title üzerinden reaktif olarak senkronize edilir.
 * - Header'da aksi belirtilmedikçe rozet / etiket yer almaz (Zero Header Badges Policy).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  BaseCardPage,
  BaseSwitch,
  BasitInput,
  TamsayiInput,
  NotInput,
  BaseDropdownSecici,
  FieldError,
  PageLoader,
  DataTable,
  type BaseTabItem,
  type ActionMenuItem,
  type Column
} from '@akalin/ui';
import {
  ShieldCheck,
  Power,
  RotateCcw,
  Sliders,
  FileCode,
  Files,
  FileText,
  CreditCard,
  CheckCircle2,
  Lock,
  Layers,
  Inbox,
  ListOrdered
} from 'lucide-react';
import { ModuleRegistry, type IModuleEntityDefinition } from '@akalin/module_core';
import type { ModuleConfigItem } from '../types';
import { MODULE_ICON_OPTIONS, renderModuleIcon } from '../constants/moduleIcons';
import { validateModulFeatureField, validateModulFeatureForm } from './ModulFeatureFormValidation';
import { getModulFeatureDefaultValues } from './ModulFeatureFormDefaultValue';
import { focusModulFeatureFirstInput } from './ModulFeatureFormAutoFocus';

export interface ModulFeatureFormProps {
  moduleId?: string;
  scope?: 'ERP' | 'Admin';
  initialData?: ModuleConfigItem;
  baseRoute?: string;
  onClose?: () => void;
  onSaved?: (savedItem: ModuleConfigItem) => void;
}

export function ModulFeatureForm({
  moduleId: propModuleId,
  scope: propScope,
  initialData,
  baseRoute: propBaseRoute,
  onClose,
  onSaved
}: ModulFeatureFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ moduleId?: string; subModuleId?: string; id?: string }>();

  // Kapsam ve Modül ID çözümleme
  const effectiveScope: 'ERP' | 'Admin' = useMemo(() => {
    if (propScope) return propScope;
    const sub = params.subModuleId?.toLowerCase();
    return sub === 'admin' ? 'Admin' : 'ERP';
  }, [propScope, params.subModuleId]);

  const effectiveModuleId: string | undefined = useMemo(() => {
    if (propModuleId) return propModuleId;
    if (params.id) return params.id;
    if (params.subModuleId && params.subModuleId !== 'ui' && params.subModuleId !== 'admin') {
      return params.subModuleId;
    }
    return undefined;
  }, [propModuleId, params.id, params.subModuleId]);

  const resolvedBaseRoute = useMemo(() => {
    if (propBaseRoute) return propBaseRoute;
    if (location.pathname.startsWith('/moduller')) return '/moduller';
    return '/ayarlar/ModulYonetimi';
  }, [propBaseRoute, location.pathname]);

  // State'ler
  const [formData, setFormData] = useState<ModuleConfigItem>(() => {
    const navStateData = (location.state as any)?.moduleItem as ModuleConfigItem | undefined;
    return getModulFeatureDefaultValues(initialData || navStateData);
  });
  const [originalData, setOriginalData] = useState<ModuleConfigItem>(formData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(!initialData && Boolean(effectiveModuleId));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTabId, setActiveTabId] = useState<string>('belgeler-kartlar');

  // Modüle ait tescilli liste, kart ve belgeler (ModuleRegistry / entities.ts)
  const moduleEntities = useMemo(() => {
    let fromRegistry = ModuleRegistry.getModuleEntities(effectiveModuleId || formData.id || '');
    if ((!fromRegistry.tree?.length && !fromRegistry.lists?.length && !fromRegistry.cards?.length && !fromRegistry.documents?.length) && formData.package) {
      const fromPkg = ModuleRegistry.getModuleEntities(formData.package);
      if (fromPkg.tree?.length || fromPkg.lists?.length || fromPkg.cards?.length || fromPkg.documents?.length || fromPkg.reports?.length) {
        fromRegistry = fromPkg;
      }
    }

    if (fromRegistry.tree && fromRegistry.tree.length > 0) {
      return fromRegistry;
    }

    if (fromRegistry.lists?.length || fromRegistry.cards?.length || fromRegistry.documents?.length) {
      return fromRegistry;
    }

    if (formData.lists?.length || formData.cards?.length || formData.documents?.length) {
      const lists = formData.lists || [];
      const cards = formData.cards || [];
      const documents = formData.documents || [];
      return {
        lists,
        cards,
        documents,
        reports: [],
        operations: [],
        tree: lists.length > 0 ? lists : [...documents, ...cards],
        all: [...lists, ...documents, ...cards]
      };
    }

    return fromRegistry;
  }, [formData.lists, formData.cards, formData.documents, formData.id, formData.package, effectiveModuleId]);

  // Modül verisini API'den yükle (Eğer initialData yoksa)
  const loadModuleData = useCallback(async () => {
    if (!effectiveModuleId) return;
    setLoading(true);
    try {
      const response = await axios.get('/api/moduller/config-file', {
        params: { kapsam: effectiveScope, scope: effectiveScope }
      });
      const list: ModuleConfigItem[] = response.data?.modules || [];
      const found = list.find((m) => m.id === effectiveModuleId);
      if (found) {
        const fullItem = getModulFeatureDefaultValues(found);
        setFormData(fullItem);
        setOriginalData(JSON.parse(JSON.stringify(fullItem)));
      } else {
        toast.error(t('modul_bulunamadi', 'İlgili modül yapılandırması bulunamadı.'));
        if (onClose) {
          onClose();
        } else {
          navigate(`${resolvedBaseRoute}/${effectiveScope === 'Admin' ? 'admin' : 'ui'}`);
        }
      }
    } catch (err: any) {
      console.error('Modül detayı yüklenirken hata oluştu:', err);
      toast.error(err.response?.data?.mesaj || t('modul_yuklenemedi', 'Modül bilgisi yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, [effectiveModuleId, effectiveScope, resolvedBaseRoute, t, onClose, navigate]);

  useEffect(() => {
    if (!initialData && effectiveModuleId) {
      loadModuleData();
    }
  }, [initialData, effectiveModuleId, loadModuleData]);

  // Form açıldığında ilk alana otomatik odaklan
  useEffect(() => {
    if (!loading) {
      focusModulFeatureFirstInput();
    }
  }, [loading]);

  // Alan değişiklik yöneticisi
  const handleFieldChange = useCallback((field: keyof ModuleConfigItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Hata varsa anında temizle
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  }, [errors]);

  // Odaktan çıkıldığında (onBlur) alan doğrulaması
  const handleFieldBlur = useCallback((field: keyof ModuleConfigItem) => {
    const fieldErrors = validateModulFeatureField(field, formData[field], t);
    setErrors((prev) => {
      const copy = { ...prev };
      if (fieldErrors[field]) {
        copy[field] = fieldErrors[field];
      } else {
        delete copy[field];
      }
      return copy;
    });
  }, [formData, t]);

  // İkon seçimi değişikliği
  const handleIconChange = useCallback((selectedId: any) => {
    handleFieldChange('iconName', selectedId ? String(selectedId) : '');
  }, [handleFieldChange]);

  // Formu kapatma / vazgeçme eylemi
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate(`${resolvedBaseRoute}/${effectiveScope === 'Admin' ? 'admin' : 'ui'}`);
    }
  }, [onClose, navigate, resolvedBaseRoute, effectiveScope]);

  // Değişiklikleri sıfırlama (ActionMenu içerisinden)
  const handleReset = useCallback(() => {
    setFormData(JSON.parse(JSON.stringify(originalData)));
    setErrors({});
    toast.success(t('degisiklikler_geri_alindi', 'Değişiklikler geri alındı.'));
  }, [originalData, t]);

  // Form Kaydetme
  const handleSave = useCallback(async () => {
    const validationErrors = validateModulFeatureForm(formData, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // İlk hatalı alana sekme geçişi yap
      if (validationErrors.title || validationErrors.id || validationErrors.order) {
        setActiveTabId('genel');
      } else if (validationErrors.package) {
        setActiveTabId('teknik');
      }
      toast.error(t('lutfen_zorunlu_alanlari_doldurunuz', 'Lütfen formdaki zorunlu ve hatalı alanları kontrol ediniz.'));
      return;
    }

    setIsSaving(true);
    try {
      // 1. Mevcut dosyadaki modülleri al
      const response = await axios.get('/api/moduller/config-file', {
        params: { kapsam: effectiveScope, scope: effectiveScope }
      });
      const currentList: ModuleConfigItem[] = response.data?.modules || [];

      // 2. Güncellenen modülü listeye işle
      let found = false;
      const updatedList = currentList.map((item) => {
        if (item.id === formData.id) {
          found = true;
          return { ...item, ...formData };
        }
        return item;
      });

      if (!found) {
        updatedList.push(formData);
      }

      // 3. Dosyaya kaydet
      await axios.put('/api/moduller/config-file', {
        kapsam: effectiveScope,
        scope: effectiveScope,
        modules: updatedList
      });

      setOriginalData(JSON.parse(JSON.stringify(formData)));
      toast.success(t('modul_basariyla_guncellendi', '{{title}} modülü başarıyla güncellendi.', { title: formData.title }));

      if (onSaved) {
        onSaved(formData);
      } else {
        handleClose();
      }
    } catch (err: any) {
      console.error('Modül kaydedilirken hata oluştu:', err);
      toast.error(
        err.response?.data?.mesaj || t('modul_kayit_hatasi', 'Modül yapılandırması kaydedilirken bir hata oluştu.')
      );
    } finally {
      setIsSaving(false);
    }
  }, [formData, effectiveScope, t, onSaved, handleClose]);

  // ActionMenu Ek Dropdown Aksiyonları (Aktif & Çekirdek Durum Switch'leri)
  const extraDropdownActions = useMemo<ActionMenuItem[]>(() => {
    return [
      {
        custom: (
          <div
            className="action-menu-switch-item-wrapper p-8"
            style={{ minWidth: '200px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <BaseSwitch
              id="actionMenuModulAktifSwitch"
              checked={formData.enabled ?? true}
              onChange={(e) => handleFieldChange('enabled', e.target.checked)}
              label={
                <span className="flex items-center gap-8">
                  <Power size={15} className={formData.enabled ? 'text-success' : 'text-secondary'} />
                  <span className="font-medium">{t('durum', 'Durum')}:</span>
                  <span className={formData.enabled ? 'text-success font-semibold' : 'text-secondary font-semibold'}>
                    {formData.enabled ? t('aktif', 'Aktif') : t('pasif', 'Pasif')}
                  </span>
                </span>
              }
              className="action-menu-switch-item"
            />
          </div>
        ),
        dividerAbove: true
      },
      {
        custom: (
          <div
            className="action-menu-switch-item-wrapper p-8"
            style={{ minWidth: '200px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <BaseSwitch
              id="actionMenuModulCekirdekSwitch"
              checked={formData.isCore ?? false}
              onChange={(e) => handleFieldChange('isCore', e.target.checked)}
              label={
                <span className="flex items-center gap-8">
                  <ShieldCheck size={15} className={formData.isCore ? 'text-primary' : 'text-secondary'} />
                  <span className="font-medium">{t('cekirdek_sistem', 'Çekirdek Sistem')}:</span>
                  <span className={formData.isCore ? 'text-primary font-semibold' : 'text-secondary font-semibold'}>
                    {formData.isCore ? t('cekirdek', 'Çekirdek') : t('eklenti', 'Eklenti')}
                  </span>
                </span>
              }
              className="action-menu-switch-item"
            />
          </div>
        )
      },
      {
        dividerAbove: true,
        label: t('degisiklikleri_sifirla', 'Değişiklikleri Sıfırla'),
        icon: <RotateCcw size={15} />,
        onClick: handleReset
      }
    ];
  }, [formData.enabled, formData.isCore, handleFieldChange, handleReset, t]);

  // Varlıklar Tablosu Sütunları
  const entityColumns = useMemo<Column<IModuleEntityDefinition>[]>(() => [
    {
      id: 'title',
      header: t('baslik_varlik_adi', 'Başlık / Tanım'),
      sortable: true,
      minWidth: '280px',
      render: (item) => {
        const isList = item.category === 'liste';
        const isCard = item.category === 'kart';
        const isDoc = item.category === 'belge';

        return (
          <div className="flex items-center gap-8 py-4">
            <span
              className={`badge text-xs font-semibold px-8 py-2 rounded-full flex items-center gap-4 ${
                isList
                  ? 'badge-primary'
                  : isCard
                  ? 'badge-secondary'
                  : isDoc
                  ? 'badge-success'
                  : 'badge-info'
              }`}
            >
              {isList ? (
                <>
                  <ListOrdered size={13} />
                  {t('liste', 'Liste')}
                </>
              ) : isCard ? (
                <>
                  <CreditCard size={13} />
                  {t('kart', 'Kart')}
                </>
              ) : isDoc ? (
                <>
                  <FileText size={13} />
                  {t('belge', 'Belge')}
                </>
              ) : (
                <>
                  <Layers size={13} />
                  {item.category}
                </>
              )}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-primary text-sm">
                {t(item.titleKey, item.title || item.titleKey)}
              </span>
              {item.description && (
                <span className="text-xs text-secondary line-clamp-1">{item.description}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'id',
      header: t('kimlik_kodu', 'Kimlik (ID)'),
      sortable: true,
      width: '160px',
      render: (item) => (
        <span className="font-mono text-xs bg-surface-subtle px-8 py-3 rounded border border-border text-primary font-medium">
          {item.id}
        </span>
      )
    },
    {
      id: 'route',
      header: t('rota', 'Rota'),
      sortable: true,
      width: '180px',
      render: (item) => {
        const routePath = item.route || item.listRoute || item.formRoute;
        return routePath ? (
          <span className="font-mono text-xs text-secondary font-medium">
            {routePath}
          </span>
        ) : (
          <span className="text-muted text-xs">-</span>
        );
      }
    },
    {
      id: 'permissions',
      header: t('yetkiler_ve_eylemler', 'Yetkiler & Eylemler'),
      minWidth: '220px',
      render: (item) => (
        <div className="flex items-center gap-6 flex-wrap">
          {item.useStandardCrud !== false && (
            <span className="badge badge-neutral text-xs px-6 py-2 rounded border border-border text-secondary flex items-center gap-4">
              <Lock size={11} />
              {t('crud', 'CRUD')}
            </span>
          )}
          {item.customActions?.map((act) => (
            <span
              key={act.action}
              className={`badge text-xs px-8 py-2 rounded border ${
                act.danger
                  ? 'border-danger text-danger bg-danger-subtle'
                  : 'border-border text-secondary bg-surface-subtle'
              }`}
              title={act.description}
            >
              {act.labelKey}
            </span>
          ))}
        </div>
      )
    },
    {
      id: 'status',
      header: t('durum', 'Durum'),
      width: '120px',
      align: 'center',
      render: () => (
        <span className="inline-flex items-center gap-4 text-xs font-semibold text-success bg-success-subtle px-8 py-2 rounded-full border border-success">
          <CheckCircle2 size={13} />
          {t('tescilli', 'Tescilli')}
        </span>
      )
    }
  ], [t]);

  // Sekmeler (TabLayout)
  const tabs = useMemo<BaseTabItem[]>(() => [
    {
      id: 'belgeler-kartlar',
      label: t('belgeler_ve_kartlar', 'Belgeler ve Kartlar'),
      icon: <Files size={16} />,
      content: (
        <div className="modul-entities-tab-content pt-16">
          {/* Üst Bilgi Başlığı */}
          <div className="flex items-center justify-between gap-16 mb-16 flex-wrap">
            <div className="flex items-center gap-8">
              <span className="text-sm text-secondary font-medium">
                {t('tescilli_varliklar_ozet', 'Modül bünyesinde tescil edilmiş ve menüde aktif olan liste, kart ve belgeler.')}
              </span>
              <span className="badge badge-neutral text-xs font-semibold px-8 py-2 rounded-full border border-border">
                {moduleEntities.all.length} {t('kayit', 'Kayıt')}
              </span>
            </div>
          </div>

          {/* Hiyerarşik DataTable (TreeView Görünümü) */}
          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <DataTable<IModuleEntityDefinition>
              data={moduleEntities.tree && moduleEntities.tree.length > 0 ? moduleEntities.tree : moduleEntities.all}
              columns={entityColumns}
              enableTreeView={true}
              childrenField="children"
              defaultExpandAll={true}
              treeColumnId="title"
              keyExtractor={(item) => (item ? `${item.category}_${item.id}` : '')}
              pageSize={100}
              emptyMessage={t('tanimli_varlik_yok', 'Bu modüle ait tescilli liste, kart veya belge bulunamadı.')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'genel',
      label: t('genel_bilgiler', 'Genel Bilgiler'),
      icon: <Sliders size={16} />,
      content: (
        <div className="modul-feature-tab-content pt-16">
          <div className="form-grid">
            {/* Modül Başlığı */}
            <div className="form-group">
              <label htmlFor="modul-form-title" className="form-label required font-medium">
                {t('modul_adi', 'Modül Başlığı')}
              </label>
              <BasitInput
                id="modul-form-title"
                name="title"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                onBlur={() => handleFieldBlur('title')}
                placeholder={t('modul_basligi_ornek', 'Örn: Cari Yönetimi')}
                error={errors.title}
              />
              <FieldError error={errors.title} />
            </div>

            {/* Modül Kimliği (ID) */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="modul-form-id" className="form-label font-medium">
                  {t('modul_kodu', 'Modül Kimliği (ID)')}
                </label>
                <span className="text-xs text-secondary">{t('sistem_anahtari', 'Sistem Anahtarı')}</span>
              </div>
              <BasitInput
                id="modul-form-id"
                name="id"
                value={formData.id}
                onChange={(e) => handleFieldChange('id', e.target.value)}
                onBlur={() => handleFieldBlur('id')}
                placeholder={t('modul_id_ornek', 'Örn: cari_yonetimi')}
                disabled={Boolean(effectiveModuleId)}
                readOnly={Boolean(effectiveModuleId)}
                className="font-mono bg-disabled"
                error={errors.id}
              />
              <FieldError error={errors.id} />
            </div>

            {/* Modül İkonu */}
            <div className="form-group">
              <label className="form-label font-medium">
                {t('modul_ikonu', 'Modül İkonu')}
              </label>
              <div className="flex items-center gap-12">
                <div
                  className="modul-icon-preview p-8 rounded-lg flex items-center justify-center glass-card"
                  style={{ minWidth: '42px', minHeight: '42px' }}
                >
                  {renderModuleIcon(formData.iconName, 22)}
                </div>
                <div className="flex-1">
                  <BaseDropdownSecici
                    value={formData.iconName || 'Package'}
                    options={MODULE_ICON_OPTIONS}
                    onChange={handleIconChange}
                    placeholder={t('ikon_seciniz', 'İkon seçiniz...')}
                    clearable={false}
                  />
                </div>
              </div>
            </div>

            {/* Sıra Numarası */}
            <div className="form-group">
              <label className="form-label font-medium">
                {t('calisma_sirasi', 'Çalışma Sırası (Sıra No)')}
              </label>
              <TamsayiInput
                value={formData.order}
                onChange={(e) => handleFieldChange('order', e.target.value)}
                placeholder={t('sira_ornek', 'Örn: 10')}
                className={errors.order ? 'is-invalid' : ''}
              />
              <FieldError error={errors.order} />
            </div>

            {/* Modül Açıklaması */}
            <div className="form-group full-width">
              <label htmlFor="modul-form-desc" className="form-label font-medium">
                {t('modul_aciklamasi', 'Modül Açıklaması')}
              </label>
              <NotInput
                id="modul-form-desc"
                name="description"
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={t('modul_aciklamasi_placeholder', 'Modülün üstlendiği işlevleri ve entegrasyon amacını açıklayın...')}
                rows={3}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'teknik',
      label: t('paket_ve_entegrasyon', 'Paket & Entegrasyon'),
      icon: <FileCode size={16} />,
      content: (
        <div className="modul-feature-tab-content pt-16">
          <div className="form-grid">
            {/* NPM Paket Adı */}
            <div className="form-group">
              <label htmlFor="modul-form-package" className="form-label required font-medium">
                {t('npm_paket_adi', 'NPM Paket Adı (@akalin/*)')}
              </label>
              <BasitInput
                id="modul-form-package"
                name="package"
                value={formData.package || ''}
                onChange={(e) => handleFieldChange('package', e.target.value)}
                onBlur={() => handleFieldBlur('package')}
                placeholder={t('paket_ornek', 'Örn: @akalin/customer_module')}
                className="font-mono"
                error={errors.package}
              />
              <FieldError error={errors.package} />
            </div>

            {/* Export Sınıf / Modül Adı */}
            <div className="form-group">
              <label htmlFor="modul-form-export" className="form-label font-medium">
                {t('export_nesne_adi', 'Export Modül Tanımı (Export Name)')}
              </label>
              <BasitInput
                id="modul-form-export"
                name="exportName"
                value={formData.exportName || ''}
                onChange={(e) => handleFieldChange('exportName', e.target.value)}
                placeholder={t('export_ornek', 'Örn: CariYonetimiModule')}
                className="font-mono"
              />
            </div>

            {/* Modül Sürümü */}
            <div className="form-group">
              <label htmlFor="modul-form-version" className="form-label font-medium">
                {t('surum', 'Sürüm')}
              </label>
              <BasitInput
                id="modul-form-version"
                name="version"
                value={formData.version || ''}
                onChange={(e) => handleFieldChange('version', e.target.value)}
                placeholder={t('surum_ornek', 'Örn: 1.0.0')}
                className="font-mono"
              />
            </div>

            {/* Dizin / Yol */}
            <div className="form-group">
              <label htmlFor="modul-form-path" className="form-label font-medium">
                {t('dosya_yolu', 'Fiziksel Dosya / Modül Yolu')}
              </label>
              <BasitInput
                id="modul-form-path"
                name="path"
                value={formData.path || ''}
                onChange={(e) => handleFieldChange('path', e.target.value)}
                placeholder={t('yol_ornek', 'Örn: src/modules/CariYonetimi')}
                className="font-mono"
              />
            </div>
          </div>
        </div>
      )
    }
  ], [
    moduleEntities,
    formData,
    errors,
    effectiveModuleId,
    handleFieldChange,
    handleFieldBlur,
    handleIconChange,
    t
  ]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <BaseCardPage
      id="modulFeatureForm"
      title={formData.title ? `${formData.title} - ${t('modul_yapilandirma', 'Modül Yapılandırması')}` : t('modul_duzenle', 'Modül Düzenle')}
      pageTitle={formData.title || t('modul_duzenle', 'Modül Düzenle')}
      recordTitle={formData.title}
      icon={renderModuleIcon(formData.iconName, 24)}
      subtitleLeft={
        effectiveScope === 'Admin'
          ? t('admin_paneli_modulu', 'Webakus Admin Paneli Modülü')
          : t('erp_ui_modulu', 'Webakus ERP UI Modülü')
      }
      showBackButton={true}
      onClose={handleClose}
      onSave={handleSave}
      isSaving={isSaving}
      saveButtonText={t('kaydet', 'Kaydet')}
      extraDropdownActions={extraDropdownActions}
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={(tabId) => setActiveTabId(tabId as string)}
      className="modul-feature-form-page fade-in"
    />
  );
}

export default ModulFeatureForm;
