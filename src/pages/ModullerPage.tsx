/**
 * @akalin/module_management - Sistem Modülleri ve Eklenti Yönetimi Sayfası (ModullerPage.tsx)
 * 
 * Dosya sistemindeki fiziksel modül klasörlerini (Frontend & Backend) ve veritabanı kayıtlarını tarayarak
 * Registered (Kayıtlı), Unregistered (Kayıtsız/Yeni), Disabled (Devre Dışı) ve Missing (Eksik) durumlarını listeler.
 * Tek tıkla modül kaydetme (Register), kaydı kaldırma (Unregister) ve durum yönetimi imkanı sunar.
 */

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  PackageOpen, 
  RefreshCcw, 
  ShieldCheck,
  Power,
  Code,
  Folder,
  AlertCircle,
  PlusCircle,
  Trash2,
  Lock,
  Layers,
  Users,
  Package,
  Box,
  FileText,
  FileCheck,
  ShoppingCart,
  Landmark,
  Wallet,
  Coins,
  CreditCard,
  Warehouse,
  Truck,
  MapPin,
  Cloud,
  Barcode,
  Building2,
  Bot,
  Cpu,
  UserCog,
  Mail,
  Database,
  Bell,
  HelpCircle,
  Settings,
  Sliders,
  Tag,
  Sparkles,
  LayoutDashboard,
  ListOrdered,
  ListTree,
  LayoutGrid,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { BaseSystemPage, BaseSystemCard, ModuleSettingsRegistry, DataTable, ActionMenu, type Column } from '@akalin/ui';
import { ModuleRegistry, type IModuleEntityDefinition } from '@akalin/module_core';
import { useModuleManagementService } from '../adapters/ModuleManagementServiceContext';
import type { IModuleInfo } from '../types';
import ModulEksiklikArabirimiModal from './ModulEksiklikArabirimiModal';
import ModulTanitimDuzenleModal from './ModulTanitimDuzenleModal';
import '../styles/moduleManagement.css';

const ICON_COMPONENTS: Record<string, any> = {
  users: Users,
  user: Users,
  cari: Users,
  usercog: UserCog,
  package: Package,
  boxes: Package,
  box: Box,
  stok: Package,
  urun: Package,
  filetext: FileText,
  fatura: FileText,
  filecheck: FileCheck,
  irsaliye: FileText,
  shoppingcart: ShoppingCart,
  siparis: ShoppingCart,
  landmark: Landmark,
  banka: Landmark,
  finans: Landmark,
  wallet: Wallet,
  kasa: Wallet,
  coins: Coins,
  creditcard: CreditCard,
  warehouse: Warehouse,
  depo: Warehouse,
  sube: Warehouse,
  truck: Truck,
  kargo: Truck,
  mappin: MapPin,
  adres: MapPin,
  cloud: Cloud,
  bulut: Cloud,
  barcode: Barcode,
  barkod: Barcode,
  settings: Settings,
  shieldcheck: ShieldCheck,
  tag: Tag,
  sparkles: Sparkles,
  layers: Layers,
  lock: Lock,
  mail: Mail,
  email: Mail,
  eposta: Mail,
  sliders: Sliders,
  dashboard: LayoutDashboard,
  building: Building2,
  building2: Building2,
  firma: Building2,
  bot: Bot,
  cpu: Cpu,
  ai: Bot,
  packageopen: PackageOpen,
  modul: PackageOpen,
  database: Database,
  seed: Database,
  bell: Bell,
  bildirim: Bell,
  helpcircle: HelpCircle,
  yardim: HelpCircle
};

export interface ModullerPageProps {
  scope?: 'Admin' | 'ERP';
  hideHeader?: boolean;
}

export function ModullerPage({ scope, hideHeader = false }: ModullerPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const service = useModuleManagementService();

  const [moduller, setModuller] = useState<IModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'ALL' | 'REGISTERED' | 'UNREGISTERED' | 'OTHER'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');

  const searchableFields = useMemo(() => [
    {
      id: 'Tumu',
      label: t('tumu', 'Tümü'),
      type: 'text',
      placeholder: t('modul_arama_placeholder', 'Modül adı, kod veya açıklama ara...')
    }
  ], [t]);

  // Kapsam tespiti (prop varsa öncelikli, yoksa /moduller/admin -> 'Admin', diğerleri -> 'ERP')
  const activeScope: 'Admin' | 'ERP' = scope || (location.pathname.endsWith('/admin') ? 'Admin' : 'ERP');

  // Modül Eksiklik Arabirimi (HTML Şablonu) Modal State
  const [selectedEksiklikModul, setSelectedEksiklikModul] = useState<IModuleInfo | null>(null);
  const [isEksiklikModalOpen, setIsEksiklikModalOpen] = useState(false);
  const [isTanitimModalOpen, setIsTanitimModalOpen] = useState(false);

  useEffect(() => {
    fetchModuller(activeScope);
  }, [activeScope]);

  const fetchModuller = async (targetScope = activeScope) => {
    try {
      setLoading(true);
      const list = await service.getDiscoveredModules(targetScope);
      setModuller(list || []);

      const remainingOthers = (list || []).filter((m) => m.durum === 'DISABLED' || m.durum === 'MISSING').length;
      if (activeTab === 'OTHER' && remainingOthers === 0) {
        setActiveTab('ALL');
      }
    } catch (error) {
      toast.error(t('moduller_taranirken_hata_olustu', 'Modüller taranırken hata oluştu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (modul: IModuleInfo) => {
    const key = modul.kod;
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      await service.registerModule({
        kod: modul.kod,
        ad: modul.ad,
        aciklama: modul.aciklama,
        klasorYolu: modul.klasorYolu,
        ikon: modul.ikon
      });
      toast.success(t('modul_basariyla_kaydedildi', `'${modul.ad}' başarıyla sisteme kaydedildi!`, { name: modul.ad }));
      await fetchModuller();
    } catch (error: any) {
      const msg = error.response?.data?.mesaj || error?.message || t('modul_kaydedilirken_hata_olustu', 'Modül kaydedilirken bir hata oluştu.');
      toast.error(msg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleUnregister = async (modul: IModuleInfo) => {
    const key = modul.kod;
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      await service.unregisterModule({
        id: modul.id,
        kod: modul.kod,
        kaliciSil: true
      });
      toast.success(t('modul_kaydi_kaldirildi', `'${modul.ad}' kaydı sistemden kaldırıldı (Kaynak kodlar korundu).`, { name: modul.ad }));
      await fetchModuller();
    } catch (error: any) {
      const msg = error.response?.data?.mesaj || error?.message || t('islem_basarisiz_oldu', 'İşlem başarısız oldu.');
      toast.error(msg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleToggle = async (modul: IModuleInfo) => {
    const key = modul.kod;
    const yeniDurum = !modul.aktifMi;
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      await service.toggleModule({
        kod: modul.kod,
        aktifMi: yeniDurum
      });
      const statusText = yeniDurum ? t('etkinlestirildi', 'etkinleştirildi') : t('devre_disi_birakildi', 'devre dışı bırakıldı');
      toast.success(t('modul_durumu_degistirildi', `'${modul.ad}' ${statusText}.`, { name: modul.ad, status: statusText }));
      await fetchModuller();
    } catch (error: any) {
      const msg = error.response?.data?.mesaj || error?.message || t('durum_degistirilemedi', 'Durum değiştirilemedi.');
      toast.error(msg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // İstatistikler (Çekirdek modüller sistemin zorunlu parçası olduğundan daima REGISTERED sayılır)
  const getEffectiveDurum = (m: IModuleInfo) => (m.isCore ? 'REGISTERED' : m.durum);

  const totalCount = moduller.length;
  const registeredCount = moduller.filter((m) => getEffectiveDurum(m) === 'REGISTERED').length;
  const unregisteredCount = moduller.filter((m) => getEffectiveDurum(m) === 'UNREGISTERED').length;
  const otherCount = moduller.filter((m) => getEffectiveDurum(m) === 'DISABLED' || getEffectiveDurum(m) === 'MISSING').length;

  useEffect(() => {
    if (activeTab === 'OTHER' && otherCount === 0 && !loading) {
      setActiveTab('ALL');
    }
  }, [otherCount, activeTab, loading]);

  // Filtreleme
  const filteredModules = moduller.filter((modul) => {
    const effectiveDurum = getEffectiveDurum(modul);
    if (activeTab === 'REGISTERED' && effectiveDurum !== 'REGISTERED') return false;
    if (activeTab === 'UNREGISTERED' && effectiveDurum !== 'UNREGISTERED') return false;
    if (activeTab === 'OTHER' && effectiveDurum !== 'DISABLED' && effectiveDurum !== 'MISSING') return false;

    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLocaleLowerCase('tr-TR').trim();
      const adMatch = modul.ad ? modul.ad.toLocaleLowerCase('tr-TR').includes(term) : false;
      const kodMatch = modul.kod ? modul.kod.toLocaleLowerCase('tr-TR').includes(term) : false;
      const aciklamaMatch = modul.aciklama ? modul.aciklama.toLocaleLowerCase('tr-TR').includes(term) : false;
      if (!adMatch && !kodMatch && !aciklamaMatch) {
        return false;
      }
    }

    return true;
  });

  // İkon Çözümleyici
  const resolveIcon = (modul: IModuleInfo): ReactNode => {
    if (React.isValidElement(modul.icon)) return modul.icon;

    const regDef = (ModuleSettingsRegistry as any)?.get?.(modul.kod || '');
    if (regDef && React.isValidElement(regDef.icon)) return regDef.icon;

    const explicitName = (
      modul.iconName || 
      modul.ikon || 
      modul.tanitimIkon || 
      (typeof modul.icon === 'string' ? modul.icon : '') || 
      (regDef && typeof regDef.icon === 'string' ? regDef.icon : '') ||
      ''
    ).trim().toLowerCase();

    if (explicitName && ICON_COMPONENTS[explicitName]) {
      const Comp = ICON_COMPONENTS[explicitName];
      return <Comp size={22} />;
    }

    const code = (modul.kod || '').toLowerCase();
    if (code.includes('cari')) return <Users size={22} />;
    if (code.includes('stok') || code.includes('urun')) return <Package size={22} />;
    if (code.includes('fatura') || code.includes('irsaliye')) return <FileText size={22} />;
    if (code.includes('siparis')) return <ShoppingCart size={22} />;
    if (code.includes('kasa')) return <Wallet size={22} />;
    if (code.includes('banka') || code.includes('finans')) return <Landmark size={22} />;
    if (code.includes('depo') || code.includes('sube')) return <Warehouse size={22} />;
    if (code.includes('kargo')) return <Truck size={22} />;
    if (code.includes('adres')) return <MapPin size={22} />;
    if (code.includes('bulut') || code.includes('cloud')) return <Cloud size={22} />;
    if (code.includes('barkod') || code.includes('terminal')) return <Barcode size={22} />;
    if (code.includes('firma')) return <Building2 size={22} />;
    if (code.includes('ai') || code.includes('yapay')) return <Bot size={22} />;
    if (code.includes('kullanici') || code.includes('yetki')) return <UserCog size={22} />;
    if (code.includes('email') || code.includes('eposta') || code.includes('mail')) return <Mail size={22} />;
    if (code.includes('seed')) return <Database size={22} />;
    if (code.includes('bildirim')) return <Bell size={22} />;
    if (code.includes('ayarlar') || code.includes('ayar')) return <Settings size={22} />;

    return <PackageOpen size={22} />;
  };

  // İkon Kutusu Renk Varyantı
  const getIconBoxVariant = (modul: IModuleInfo): any => {
    if (modul.isCore) return 'primary';
    if (modul.durum === 'MISSING') return 'danger';
    if (modul.durum === 'UNREGISTERED') return 'warning';
    if (modul.durum === 'REGISTERED') {
      return modul.aktifMi ? 'success' : 'secondary';
    }
    return 'secondary';
  };

  // Kenarlık Vurgusu
  const getBorderHighlight = (modul: IModuleInfo): any => {
    if (modul.isCore) return 'primary';
    if (modul.durum === 'MISSING') return 'border-l-danger';
    if (modul.durum === 'UNREGISTERED') return 'border-l-warning';
    if (modul.durum === 'REGISTERED') {
      return modul.aktifMi ? 'border-l-success' : 'none';
    }
    return 'none';
  };

  // Kart Rozeti (Kapsam & Tip)
  const renderCardBadge = (modul: IModuleInfo) => {
    const isScopeAdmin = activeScope === 'Admin';
    return (
      <div className="flex items-center gap-6 flex-wrap">
        <span className={`modul-scope-badge ${isScopeAdmin ? 'scope-admin' : 'scope-ui'}`}>
          {isScopeAdmin ? <ShieldCheck size={11} /> : <Layers size={11} />}
          <span>{isScopeAdmin ? t('admin_modulu', 'Admin') : t('ui_modulu', 'UI')}</span>
        </span>
        <span className={`modul-type-badge type-${(modul.modulTipi || 'frontend').toLowerCase()}`}>
          {modul.modulTipi || t('modul_tip_frontend', 'Frontend')}
        </span>
      </div>
    );
  };

  // Orta İçerik (Açıklama)
  const renderCardMiddleContent = (modul: IModuleInfo) => {
    if (!modul.aciklama) return null;
    return (
      <p className="text-13 text-secondary m-0 line-height-14">
        {modul.aciklama}
      </p>
    );
  };

  // Detay Kutusu (Dizin & Uyarı)
  const getCardDetails = (modul: IModuleInfo) => {
    const details: any[] = [
      {
        label: (
          <span className="flex items-center gap-6">
            <Folder size={13} />
            <span>{t('fiziksel_dizin', 'Fiziksel Dizin')}</span>
          </span>
        ),
        value: (
          <span className="font-mono text-12 truncate max-w-220" title={modul.klasorYolu}>
            {modul.klasorYolu || t('fiziksel_dizin_bulunamadi', '(Fiziksel Dizin Bulunamadı)')}
          </span>
        )
      }
    ];

    if (modul.durum === 'MISSING') {
      details.push({
        label: (
          <span className="flex items-center gap-6 text-danger">
            <AlertCircle size={13} />
            <span>{t('durum_uyarisi', 'Uyarı')}</span>
          </span>
        ),
        value: (
          <span className="text-danger text-12 font-medium">
            {t('dosya_diskte_yok', 'Dosyalar diskte bulunamadı')}
          </span>
        )
      });
    }

    return details;
  };

  // Kart Durum Bilgisi
  const getCardStatus = (modul: IModuleInfo) => {
    const isRegistered = modul.durum === 'REGISTERED' || modul.isCore;
    const isActive = Boolean(modul.aktifMi && isRegistered);

    let activeText = t('kayitli_aktif', 'Kayıtlı & Aktif');
    if (modul.isCore) activeText = t('cekirdek_sistem', 'Çekirdek Sistem');

    let passiveText = t('pasif_durumda', 'Pasif');
    if (modul.durum === 'MISSING') passiveText = t('dosya_eksik', 'Dosya Eksik');
    else if (modul.durum === 'UNREGISTERED') passiveText = t('kayitsiz_yeni_badge', 'Kayıtsız (Yeni)');
    else if (modul.durum === 'DISABLED') passiveText = t('devre_disi', 'Devre Dışı');

    return {
      active: isActive,
      label: t('durum', 'Durum'),
      activeText,
      passiveText
    };
  };

  // Kart 3 Noktalı ActionMenu Aksiyonları
  const getCardActions = (modul: IModuleInfo) => {
    const isProcessing = Boolean(actionLoading[modul.kod]);
    const actionList: any[] = [];

    if (!modul.isCore) {
      actionList.push({
        label: t('eksiklik_arabirimi', 'Eksiklik Arabirimi'),
        icon: <Code size={15} />,
        onClick: () => {
          setSelectedEksiklikModul(modul);
          setIsEksiklikModalOpen(true);
        },
        disabled: isProcessing
      });

      actionList.push({
        label: t('tanitim_reklam_duzenle', 'Tanıtım & Reklam Ayarları'),
        icon: <Sparkles size={15} />,
        onClick: () => {
          setSelectedEksiklikModul(modul);
          setIsTanitimModalOpen(true);
        },
        disabled: isProcessing
      });
    }

    if (modul.durum === 'UNREGISTERED') {
      actionList.push({
        label: t('sisteme_kaydet_kur', 'Sisteme Kaydet / Kur'),
        icon: <PlusCircle size={15} />,
        onClick: () => handleRegister(modul),
        disabled: isProcessing
      });
    } else if (modul.durum === 'REGISTERED' || modul.durum === 'MISSING') {
      if (modul.durum === 'REGISTERED') {
        actionList.push({
          label: modul.aktifMi ? t('pasife_al', 'Pasife Al') : t('aktif_et', 'Aktif Et'),
          icon: <Power size={15} />,
          onClick: () => handleToggle(modul),
          disabled: isProcessing
        });
      }
      actionList.push({
        label: modul.durum === 'MISSING' ? t('db_kaydini_temizle', 'DB Kaydını Temizle') : t('kaydi_kaldir', 'Kaydı Kaldır'),
        icon: <Trash2 size={15} />,
        onClick: () => handleUnregister(modul),
        danger: true,
        disabled: isProcessing
      });
    }

    return actionList;
  };

  // ─── HİYERARŞİK TREE VERİSİ (MODÜLLER -> LİSTELER -> KARTLAR / BELGELER) ──
  const treeData = useMemo(() => {
    return filteredModules.map((modul) => {
      let entities = ModuleRegistry.getModuleEntities(modul.kod);
      if ((!entities.tree || entities.tree.length === 0) && modul.ad) {
        const fromAd = ModuleRegistry.getModuleEntities(modul.ad);
        if (fromAd.tree && fromAd.tree.length > 0) {
          entities = fromAd;
        }
      }
      if ((!entities.tree || entities.tree.length === 0) && modul.id) {
        const fromId = ModuleRegistry.getModuleEntities(String(modul.id));
        if (fromId.tree && fromId.tree.length > 0) {
          entities = fromId;
        }
      }
      const entityTree = entities.tree && entities.tree.length > 0 ? entities.tree : entities.all;

      const mapEntityToNode = (ent: IModuleEntityDefinition): any => ({
        id: `${modul.kod}_${ent.id}`,
        ad: ent.title || ent.titleKey,
        kod: ent.id,
        kategori: ent.category,
        aciklama: ent.description,
        rota: ent.route || ent.listRoute || ent.formRoute,
        durum: 'REGISTERED',
        aktifMi: true,
        rawEntity: ent,
        customActions: ent.customActions,
        useStandardCrud: ent.useStandardCrud,
        children: ent.children && ent.children.length > 0 ? ent.children.map(mapEntityToNode) : undefined
      });

      const childNodes = entityTree.map(mapEntityToNode);

      return {
        id: modul.kod || String(modul.id),
        ad: modul.ad,
        kod: modul.kod,
        kategori: 'modul',
        aciklama: modul.aciklama,
        rota: modul.klasorYolu,
        durum: getEffectiveDurum(modul),
        aktifMi: modul.aktifMi,
        isCore: modul.isCore,
        rawModule: modul,
        children: childNodes.length > 0 ? childNodes : undefined
      };
    });
  }, [filteredModules]);

  // ─── TREE VIEW SÜTUNLARI ────────────────────────────────────────────────
  const treeColumns = useMemo<Column<any>[]>(() => [
    {
      id: 'ad',
      header: t('modul_liste_kart_adi', 'Modül / Liste / Kart / Belge'),
      sortable: true,
      minWidth: '320px',
      render: (node) => {
        if (node.kategori === 'modul') {
          return (
            <div className="flex items-center gap-10 py-4">
              <div className="text-primary flex items-center justify-center p-6 rounded-lg bg-surface-subtle border border-border">
                {node.rawModule ? resolveIcon(node.rawModule) : <PackageOpen size={18} />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-6">
                  <span className="font-bold text-primary text-sm">
                    {node.ad}
                  </span>
                  {node.isCore && (
                    <span className="badge badge-neutral text-xs font-semibold px-6 py-1 rounded">
                      {t('cekirdek', 'Çekirdek')}
                    </span>
                  )}
                </div>
                {node.aciklama && (
                  <span className="text-xs text-secondary line-clamp-1">{node.aciklama}</span>
                )}
              </div>
            </div>
          );
        }

        const isList = node.kategori === 'liste';
        const isCard = node.kategori === 'kart';
        const isDoc = node.kategori === 'belge';

        return (
          <div className="flex items-center gap-8 py-3">
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
                  <ListOrdered size={12} />
                  {t('liste', 'Liste')}
                </>
              ) : isCard ? (
                <>
                  <CreditCard size={12} />
                  {t('kart', 'Kart')}
                </>
              ) : isDoc ? (
                <>
                  <FileText size={12} />
                  {t('belge', 'Belge')}
                </>
              ) : (
                <>
                  <Layers size={12} />
                  {node.kategori}
                </>
              )}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-primary text-sm">
                {String(t(node.ad, { defaultValue: node.ad }))}
              </span>
              {node.aciklama && (
                <span className="text-xs text-secondary line-clamp-1">{node.aciklama}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'kod',
      header: t('kod_id', 'Kod / ID'),
      sortable: true,
      width: '180px',
      render: (node) => (
        <span className="font-mono text-xs bg-surface-subtle px-8 py-3 rounded border border-border text-primary font-medium">
          {node.kod}
        </span>
      )
    },
    {
      id: 'kategori',
      header: t('kategori', 'Kategori'),
      sortable: true,
      width: '120px',
      render: (node) => {
        let badgeColor = 'badge-neutral';
        let label = t('modul', 'Modül');
        if (node.kategori === 'liste') {
          badgeColor = 'badge-primary';
          label = t('liste', 'Liste');
        } else if (node.kategori === 'kart') {
          badgeColor = 'badge-secondary';
          label = t('kart', 'Kart');
        } else if (node.kategori === 'belge') {
          badgeColor = 'badge-success';
          label = t('belge', 'Belge');
        }
        return (
          <span className={`badge ${badgeColor} text-xs font-semibold px-8 py-2 rounded`}>
            {label}
          </span>
        );
      }
    },
    {
      id: 'rota',
      header: t('rota_dizin', 'Rota / Dizin'),
      sortable: true,
      minWidth: '180px',
      render: (node) => (
        <span className="font-mono text-xs text-secondary truncate max-w-220 block" title={node.rota}>
          {node.rota || '-'}
        </span>
      )
    },
    {
      id: 'durum',
      header: t('durum', 'Durum'),
      width: '140px',
      align: 'center',
      render: (node) => {
        if (node.kategori !== 'modul') {
          return (
            <span className="inline-flex items-center gap-4 text-xs font-semibold text-success bg-success-subtle px-8 py-2 rounded-full border border-success">
              <CheckCircle2 size={12} />
              {t('tescilli', 'Tescilli')}
            </span>
          );
        }

        const isRegistered = node.durum === 'REGISTERED' || node.isCore;
        if (isRegistered && node.aktifMi) {
          return (
            <span className="inline-flex items-center gap-4 text-xs font-semibold text-success bg-success-subtle px-8 py-2 rounded-full border border-success">
              <CheckCircle2 size={12} />
              {node.isCore ? t('cekirdek_sistem', 'Çekirdek Sistem') : t('kayitli_aktif', 'Kayıtlı & Aktif')}
            </span>
          );
        }
        if (node.durum === 'UNREGISTERED') {
          return (
            <span className="inline-flex items-center gap-4 text-xs font-semibold text-warning bg-warning-subtle px-8 py-2 rounded-full border border-warning">
              ⏳ {t('kayitsiz_yeni_badge', 'Kayıtsız (Yeni)')}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-4 text-xs font-semibold text-secondary bg-surface-subtle px-8 py-2 rounded-full border border-border">
            {t('pasif_durumda', 'Pasif')}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: t('islemler', 'İşlemler'),
      width: '90px',
      align: 'right',
      render: (node) => {
        if (node.kategori === 'modul' && node.rawModule) {
          const acts = getCardActions(node.rawModule);
          return acts.length > 0 ? (
            <ActionMenu items={acts} />
          ) : null;
        }
        if (node.rota && node.rota.startsWith('/')) {
          return (
            <button
              type="button"
              className="btn btn-ghost btn-sm p-4 rounded hover:bg-surface-subtle"
              title={t('sayfaya_git', 'Sayfaya Git')}
              onClick={() => navigate(node.rota)}
            >
              <ExternalLink size={15} className="text-secondary" />
            </button>
          );
        }
        return null;
      }
    }
  ], [t, navigate, getCardActions]);

  return (
    <BaseSystemPage
      title={activeScope === 'Admin' ? t('admin_paneli_modulleri', 'Admin Paneli Modülleri') : t('ui_modulleri_erp', 'UI Modülleri & Eklentiler (ERP)')}
      subtitle={activeScope === 'Admin'
        ? t('admin_modulleri_aciklama', 'Webakus SaaS yönetim paneline ait çekirdek yönetim modüllerini ve servis durumlarını görüntüleyin.')
        : t('ui_modulleri_aciklama', 'Dosya sistemindeki ERP modüllerini ve veritabanı kayıtlarını otomatik tarayın, tek tıkla sisteme kaydedin veya kaldırın.')}
      icon={activeScope === 'Admin' ? <ShieldCheck size={26} /> : <PackageOpen size={26} />}
      hideHeader={hideHeader}
      onRefresh={() => fetchModuller(activeScope)}
      refreshLoading={loading}
      searchPlaceholder={t('modul_arama_placeholder', 'Modül adı, kod veya açıklama ara...')}
      searchableFields={searchableFields}
      onSearchChange={(term) => setSearchTerm(term)}
      headerSync={false}
      baseRoute={activeScope === 'Admin' ? '/moduller/admin' : '/moduller/ui'}
    >
      {/* ─── İSTATİSTİK VE FİLTRE ÇUBUĞU ─────────────────────────── */}
      <div className="moduller-toolbar glass-card flex items-center justify-between flex-wrap gap-12">
        <div className="moduller-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            {t('tumu', 'Tümü')} <span className="tab-count">{totalCount}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'REGISTERED' ? 'active' : ''}`}
            onClick={() => setActiveTab('REGISTERED')}
          >
            ✓ {t('kayitli_olanlar', 'Kayıtlılar')} <span className="tab-count count-success">{registeredCount}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'UNREGISTERED' ? 'active' : ''}`}
            onClick={() => setActiveTab('UNREGISTERED')}
          >
            ⏳ {t('kayitsiz_yeni', 'Kayıtsız / Yeni')} <span className="tab-count count-warning">{unregisteredCount}</span>
          </button>
          {otherCount > 0 && (
            <button
              type="button"
              className={`tab-btn ${activeTab === 'OTHER' ? 'active' : ''}`}
              onClick={() => setActiveTab('OTHER')}
            >
              ⚠️ {t('pasif_eksik', 'Pasif / Eksik')} <span className="tab-count count-danger">{otherCount}</span>
            </button>
          )}
        </div>

        {/* Görünüm Değiştirici (Tree / Grid) */}
        <div className="flex items-center gap-4 bg-surface-subtle p-2 rounded-lg border border-border">
          <button
            type="button"
            className={`btn btn-sm flex items-center gap-6 px-10 py-4 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'tree' ? 'btn-primary shadow-sm' : 'text-secondary hover:text-primary'
            }`}
            onClick={() => setViewMode('tree')}
            title={t('agac_gorunumu', 'Ağaç Görünümü (DataTable)')}
          >
            <ListTree size={14} />
            <span>{t('agac_gorunumu', 'Ağaç (TreeView)')}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm flex items-center gap-6 px-10 py-4 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'grid' ? 'btn-primary shadow-sm' : 'text-secondary hover:text-primary'
            }`}
            onClick={() => setViewMode('grid')}
            title={t('kart_gorunumu', 'Kart Görünümü')}
          >
            <LayoutGrid size={14} />
            <span>{t('kartlar', 'Kartlar')}</span>
          </button>
        </div>
      </div>

      {/* ─── MODÜL KARTLARI VEYA HİYERARŞİK TREEVIEW TABLOSU ──────── */}
      {loading ? (
        <div className="glass-card loading-state">
          <RefreshCcw size={36} className="spinning loading-icon" />
          <h3>{t('modul_dizinleri_taraniyor', 'Modül dizinleri taranıyor...')}</h3>
          <p>{t('modul_dizinleri_taraniyor_desc', 'Frontend ve Backend dizinleri okunuyor, veritabanı ile eşleştiriliyor.')}</p>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon-wrap">
            <PackageOpen size={40} />
          </div>
          <h3>{t('eslesen_modul_bulunamadi', 'Eşleşen Modül Bulunamadı')}</h3>
          <p>
            {searchTerm && searchTerm.trim()
              ? t('arama_kriterine_uygun_modul_bulunamadi', '"{{term}}" arama kriterine uygun modül bulunamadı.', { term: searchTerm })
              : t('secili_filtreye_ait_modul_yok', 'Seçili filtreye ait herhangi bir modül bulunmuyor.')}
          </p>
        </div>
      ) : viewMode === 'tree' ? (
        <div className="glass-card rounded-xl border border-border overflow-hidden">
          <DataTable<any>
            data={treeData}
            columns={treeColumns}
            enableTreeView={true}
            childrenField="children"
            defaultExpandAll={true}
            treeColumnId="ad"
            keyExtractor={(item) => item.id}
            pageSize={100}
            emptyMessage={t('modul_bulunamadi', 'Modül veya varlık bulunamadı.')}
          />
        </div>
      ) : (
        <div className="moduller-grid">
          {filteredModules.map((modul) => (
            <BaseSystemCard
              key={modul.kod || String(modul.id)}
              id={modul.kod || String(modul.id)}
              icon={resolveIcon(modul)}
              iconBoxVariant={getIconBoxVariant(modul)}
              title={modul.ad}
              subtitle={modul.kod}
              badge={renderCardBadge(modul)}
              borderHighlight={getBorderHighlight(modul)}
              middleContent={renderCardMiddleContent(modul)}
              details={getCardDetails(modul)}
              status={getCardStatus(modul)}
              actions={getCardActions(modul)}
              onClick={!modul.isCore ? () => {
                setSelectedEksiklikModul(modul);
                setIsEksiklikModalOpen(true);
              } : undefined}
            />
          ))}
        </div>
      )}

      {/* ─── MODÜL EKSİKLİK ARABİRİMİ (HTML EDİTÖR) DÜZENLEME MODALI ─────────────── */}
      <ModulEksiklikArabirimiModal
        isOpen={isEksiklikModalOpen}
        onClose={() => setIsEksiklikModalOpen(false)}
        modul={selectedEksiklikModul}
        onSaved={fetchModuller}
      />

      {/* ─── MODÜL TANITIM & REKLAM DÜZENLEME MODALI ─────────────────────────────── */}
      <ModulTanitimDuzenleModal
        isOpen={isTanitimModalOpen}
        onClose={() => setIsTanitimModalOpen(false)}
        modul={selectedEksiklikModul}
        onSaved={fetchModuller}
      />
    </BaseSystemPage>
  );
}

export default ModullerPage;
