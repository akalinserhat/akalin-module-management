/**
 * @akalin/module_management - Sistem Modülleri ve Eklenti Yönetimi Sayfası (ModulYonetimiPage.tsx)
 * BaseSystemPage altyapısı üzerinde çalışan modül yönetim ve sıralama merkezi.
 * 
 * MİMARİ NOTLARI:
 * - Content alanındaki mükerrer toolbar/kartlar tamamen kaldırılmıştır.
 * - Tüm birincil (modules.json Kaydet) ve ikincil (Geri Al, Yenile, Anlık Kaydet, Sırala) operasyonlar
 *   Base sınıftan gelen ActionMenu (split-button & dropdown) üzerinden yönetilmektedir.
 * - "Sırala" seçeneği açık olduğunda DataTable'ın sürükle-bırak (Drag & Drop) mekanizması devreye girer.
 * - DataTable üzerinde Çekirdek ve Durum alanları salt-okunur (read-only) rozetler olarak gösterilir.
 * - Satırların en sağındaki ActionMenu'de varsayılan "Düzenle" seçeneği bulunur ve BaseCardPage
 *   türevi ModulFeatureForm sayfasına yönlendirir.
 * - ERP ve Admin sekmeleri arasında geçiş yapıldığında ilgili projenin modules.json dosyası
 *   reaktif olarak yüklenir ve kaydedilir.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  Boxes,
  ShieldCheck,
  Save,
  Undo2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  Edit2,
  ArrowUpDown
} from 'lucide-react';
import {
  BaseSystemPage,
  ActionMenu,
  BaseSwitch,
  BaseButton,
  DataTable,
  type Column,
  type ActionMenuItem,
  type BaseTabItem
} from '@akalin/ui';
import { UndoNotificationBar } from '@akalin/notification_module';
import { renderModuleIcon } from '../constants/moduleIcons';
import ModulFeatureForm from './ModulFeatureForm';
import type { ModuleConfigItem } from '../types';
import '../styles/moduleManagement.css';

export interface ModulYonetimiPageProps {
  baseRoute?: string;
  backRoute?: string;
  scope?: 'ERP' | 'Admin';
}

export function ModulYonetimiPage({
  baseRoute: propBaseRoute,
  backRoute: propBackRoute,
  scope: propScope
}: ModulYonetimiPageProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { subModuleId, id } = useParams<{ subModuleId?: string; id?: string }>();

  // Kök rota çözümleme (Örn: /ayarlar/ModulYonetimi veya /moduller)
  const resolvedBaseRoute = useMemo(() => {
    if (propBaseRoute) return propBaseRoute;
    if (location.pathname.startsWith('/moduller')) return '/moduller';
    return '/ayarlar/ModulYonetimi';
  }, [propBaseRoute, location.pathname]);

  // Aktif sekme: 'ui' (ERP) veya 'admin' (Admin Paneli)
  const isKnownTab = subModuleId?.toLowerCase() === 'ui' || subModuleId?.toLowerCase() === 'admin';
  const activeTabId = isKnownTab ? subModuleId!.toLowerCase() : (propScope === 'Admin' ? 'admin' : 'ui');
  const scope = propScope || (activeTabId === 'admin' ? 'Admin' : 'ERP');
  const effectiveModuleId = isKnownTab ? id : (subModuleId && !isKnownTab ? subModuleId : undefined);

  // State'ler
  const [modules, setModules] = useState<ModuleConfigItem[]>([]);
  const [originalModules, setOriginalModules] = useState<ModuleConfigItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const [undoState, setUndoState] = useState<{ message: string; previousModules: ModuleConfigItem[] } | null>(null);

  // API'den modül listesini çek
  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/moduller/config-file', {
        params: { kapsam: scope, scope }
      });
      const data: ModuleConfigItem[] = response.data?.modules || [];
      const sorted = data.map((m: any) => ({
        ...m,
        order: m.order ?? 0,
        isCore: Boolean(m.isCore),
        enabled: m.enabled !== false
      })).sort((a, b) => a.order - b.order);

      setModules(sorted);
      setOriginalModules(JSON.parse(JSON.stringify(sorted)));
    } catch (err: any) {
      console.error('Modül konfigürasyonu yüklenemedi:', err);
      toast.error(
        err.response?.data?.mesaj || t('moduller_yuklenemedi', 'Modül konfigürasyonu yüklenemedi.')
      );
    } finally {
      setLoading(false);
    }
  }, [scope, t]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Değişiklik var mı kontrolü (isDirty)
  const isDirty = useMemo(() => {
    return JSON.stringify(modules) !== JSON.stringify(originalModules);
  }, [modules, originalModules]);

  // Değişiklikleri modules.json dosyasına kaydet
  const handleSave = useCallback(async (
    itemsToSave: ModuleConfigItem[] = modules,
    previousForUndo?: ModuleConfigItem[],
    customMessage?: string
  ) => {
    setSaving(true);
    try {
      await axios.put('/api/moduller/config-file', {
        kapsam: scope,
        scope,
        modules: itemsToSave
      });
      setOriginalModules(JSON.parse(JSON.stringify(itemsToSave)));
      if (previousForUndo) {
        setUndoState({
          message: customMessage || t('degisiklik_kaydedildi', 'Değişiklik kaydedildi.'),
          previousModules: previousForUndo
        });
      }
    } catch (err: any) {
      console.error('Kaydetme hatası:', err);
      toast.error(
        err.response?.data?.mesaj || t('modules_json_kayit_hatasi', 'modules.json kaydedilirken bir hata oluştu.')
      );
    } finally {
      setSaving(false);
    }
  }, [modules, scope, t]);

  // Otomatik kaydetme fonksiyonu (autoSave aktif ise)
  const triggerAutoSaveIfNeeded = useCallback((
    updated: ModuleConfigItem[],
    previous: ModuleConfigItem[],
    msg?: string
  ) => {
    if (autoSave) {
      handleSave(updated, previous, msg);
    }
  }, [autoSave, handleSave]);

  // Geri al fonksiyonu (UndoNotificationBar içindeki Geri Al butonu)
  const handleUndo = useCallback(async () => {
    if (!undoState) return;
    const prevList = undoState.previousModules;
    setUndoState(null);
    setModules(prevList);
    if (autoSave) {
      await handleSave(prevList);
    }
  }, [undoState, autoSave, handleSave]);

  // Değişiklikleri geri al (ActionMenu içerisindeki Geri Al)
  const handleReset = useCallback(() => {
    setModules(JSON.parse(JSON.stringify(originalModules)));
    setUndoState(null);
  }, [originalModules]);

  // Modül Düzenleme Formunu Açma Eylemi
  const handleEdit = useCallback((item: ModuleConfigItem) => {
    navigate(`${resolvedBaseRoute}/${activeTabId}/${item.id}`, {
      state: { moduleItem: item }
    });
  }, [navigate, resolvedBaseRoute, activeTabId]);

  // DataTable sürükle-bırak (Drag & Drop) satır yer değiştirme
  const handleRowReorder = useCallback((newData: ModuleConfigItem[]) => {
    const previousCopy = JSON.parse(JSON.stringify(modules));
    const reorderedWithOrder = newData.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    setModules(reorderedWithOrder);
    triggerAutoSaveIfNeeded(
      reorderedWithOrder,
      previousCopy,
      t('modul_siralamasi_kaydedildi', 'Modül sıralaması kaydedildi.')
    );
  }, [modules, triggerAutoSaveIfNeeded, t]);

  // Kısayol: Ctrl+S / Cmd+S ile kaydet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isDirty && !saving) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, saving, handleSave]);

  // DataTable Sütun Tanımları
  const columns = useMemo<Column<ModuleConfigItem>[]>(() => [
    {
      id: 'icon',
      header: t('ikon', 'İkon'),
      width: 60,
      align: 'center',
      render: (item) => (
        <div className="module-grid-icon-cell">
          {renderModuleIcon(item.iconName)}
        </div>
      )
    },
    {
      id: 'title',
      header: t('modul_adi', 'Modül Başlığı'),
      accessor: 'title',
      sortable: true,
      minWidth: 200,
      render: (item) => (
        <div className="module-title-cell cursor-pointer" onClick={() => handleEdit(item)}>
          <span className="module-title-primary font-medium hover:text-primary transition-colors">
            {item.title}
          </span>
          <span className="module-title-secondary">{item.exportName || item.id}</span>
        </div>
      )
    },
    {
      id: 'id',
      header: t('modul_kodu', 'Modül Kimliği (ID)'),
      accessor: 'id',
      sortable: true,
      width: 170,
      render: (item) => (
        <span className="module-id-badge font-mono">{item.id}</span>
      )
    },
    {
      id: 'package',
      header: t('paket_yolu', 'Paket (@akalin/*) / Yol'),
      accessor: 'package',
      minWidth: 200,
      render: (item) => (
        <span className="module-package-text font-mono">
          {item.package || item.path || '—'}
        </span>
      )
    },
    {
      id: 'isCore',
      header: t('cekirdek_sistem', 'Çekirdek Sistem'),
      accessor: 'isCore',
      sortable: true,
      width: 150,
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center">
          {item.isCore ? (
            <span className="modul-badge badge-core">
              <ShieldCheck size={12} />
              {t('cekirdek', 'Çekirdek')}
            </span>
          ) : (
            <span
              className="modul-badge"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)'
              }}
            >
              <Package size={12} />
              {t('eklenti', 'Eklenti')}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'enabled',
      header: t('durum', 'Durum'),
      accessor: 'enabled',
      sortable: true,
      width: 150,
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center">
          {item.enabled ? (
            <span className="modul-badge badge-registered">
              <CheckCircle2 size={12} />
              {t('aktif', 'Aktif')}
            </span>
          ) : (
            <span className="modul-badge badge-disabled">
              <AlertCircle size={12} />
              {t('pasif', 'Pasif')}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'actions',
      header: '',
      width: 60,
      align: 'right',
      render: (item) => (
        <ActionMenu
          actions={[
            {
              label: t('duzenle', 'Düzenle'),
              icon: <Edit2 size={15} />,
              isDefault: true,
              onClick: () => handleEdit(item)
            }
          ]}
        />
      )
    }
  ], [t, handleEdit]);

  // Base sınıftan gelen ActionMenu Öğeleri (Split Button & Dropdown)
  const actionMenuItems = useMemo<ActionMenuItem[]>(() => {
    return [
      {
        label: saving ? t('kaydediliyor', 'Kaydediliyor...') : t('kaydet', 'Kaydet'),
        icon: saving ? <Loader2 size={15} className="spinning" /> : <Save size={15} />,
        isDefault: true,
        variant: 'primary',
        disabled: !isDirty || saving,
        onClick: () => handleSave(),
        title: isDirty ? t('kaydet', 'Kaydet') : t('degisiklik_yok', 'Kaydedilecek değişiklik bulunmuyor')
      },
      {
        label: t('geri_al', 'Geri Al'),
        icon: <Undo2 size={15} />,
        disabled: !isDirty || saving,
        onClick: handleReset,
        hidden: !isDirty
      },
      {
        dividerAbove: true,
        custom: (
          <div
            className="flex items-center justify-between p-8"
            style={{ minWidth: '190px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <BaseSwitch
              id="switch-actionmenu-sorting"
              checked={isSorting}
              onChange={(e) => setIsSorting(e.target.checked)}
              label={
                <span className="flex items-center gap-8">
                  <ArrowUpDown size={15} className={isSorting ? 'text-primary' : 'text-secondary'} />
                  <span className="font-medium">{t('sirala', 'Sırala')}</span>
                  {isSorting && (
                    <span className="text-xs text-primary font-semibold">({t('aktif', 'Aktif')})</span>
                  )}
                </span>
              }
            />
          </div>
        )
      },
      {
        dividerAbove: true,
        custom: (
          <div
            className="flex items-center justify-between p-8"
            style={{ minWidth: '190px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <BaseSwitch
              id="switch-actionmenu-autosave"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              label={t('anlik_kaydet', 'Anlık Kaydet')}
            />
          </div>
        )
      }
    ];
  }, [saving, isDirty, isSorting, autoSave, t, handleSave, handleReset]);

  // Sekmeler (TabLayout / BaseSystemPage tabs)
  const tabs = useMemo<BaseTabItem[]>(() => [
    {
      id: 'ui',
      label: t('ui_modulleri_erp', 'UI Modülleri & Eklentiler (ERP)'),
      icon: <Boxes size={18} />
    },
    {
      id: 'admin',
      label: t('admin_paneli_modulleri', 'Admin Paneli Modülleri'),
      icon: <ShieldCheck size={18} />
    }
  ], [t]);

  const handleTabChange = (tabId: string | number) => {
    navigate(`${resolvedBaseRoute}/${tabId}`, { replace: true });
  };

  // Eğer URL'de bir modül ID'si varsa ModulFeatureForm kart sayfasını render et
  if (effectiveModuleId) {
    return (
      <ModulFeatureForm
        moduleId={effectiveModuleId}
        scope={scope}
        baseRoute={resolvedBaseRoute}
        onClose={() => navigate(`${resolvedBaseRoute}/${activeTabId}`)}
        onSaved={() => {
          fetchModules();
          navigate(`${resolvedBaseRoute}/${activeTabId}`);
        }}
      />
    );
  }

  return (
    <BaseSystemPage
      title={t('modul_yonetimi', 'Modül Yönetimi')}
      subtitle={t('modul_yonetimi_desc', 'Webakus sistem modülleri, ERP ve Admin eklentilerinin tespiti, lisanslama ve durum yönetimi')}
      icon={<Boxes size={28} />}
      baseRoute={resolvedBaseRoute}
      backRoute={propBackRoute || (resolvedBaseRoute.startsWith('/moduller') ? '/moduller' : '/ayarlar')}
      showBackButton={true}
      headerSync={false}
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      customActionMenu={
        <ActionMenu
          showDefaultActionAsButton={true}
          actions={actionMenuItems}
        />
      }
    >
      <div className="modul-yonetimi-table-container">
        {/* ─── SIRALAMA AKTİF BİLGİ ŞERİDİ ─────────── */}
        {isSorting && (
          <div className="sorting-active-banner mb-12 p-8 px-12 flex items-center justify-between rounded-lg glass-card text-primary text-sm font-medium border border-primary/25 bg-primary/5">
            <div className="flex items-center gap-8">
              <ArrowUpDown size={16} className="text-primary" />
              <span>{t('siralama_aktif_bilgi', 'Sıralama modu açık: Modüllerin sırasını değiştirmek için sol taraftaki tutamaçları sürükleyip bırakabilirsiniz.')}</span>
            </div>
            <BaseButton
              text={t('tamamla', 'Tamamla')}
              variant="outline"
              onClick={() => setIsSorting(false)}
              className="btn-sm text-xs font-semibold"
            />
          </div>
        )}

        {/* ─── DATA TABLE (SÜRÜKLE-BIRAK SIRALAMA DESTEKLİ) ─────────── */}
        <div className="modul-datatable-wrapper glass-card">
          <DataTable<ModuleConfigItem>
            columns={columns}
            data={modules}
            loading={loading}
            pageSize={100}
            keyExtractor={(item) => item.id}
            emptyMessage={t('eslesen_modul_bulunamadi', 'Modül bulunamadı.')}
            enableRowReorder={isSorting}
            onRowReorder={handleRowReorder}
            showRowIndex={true}
            onRowDoubleClick={(item) => !isSorting && handleEdit(item)}
          />
        </div>
      </div>

      {/* ─── GERİ ALMA BİLDİRİM ÇUBUĞU (UNDO NOTIFICATION BAR) ─────────── */}
      {undoState && (
        <UndoNotificationBar
          message={undoState.message}
          onUndo={handleUndo}
          onDismiss={() => setUndoState(null)}
          duration={4500}
        />
      )}
    </BaseSystemPage>
  );
}

export default ModulYonetimiPage;
