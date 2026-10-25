/**
 * @akalin/module_management - Modül Tanıtım & Reklam Mesajı Düzenleme Modalı
 * 
 * SuperAdmin'in modül eksikliği veya reklam durumunda müşteriye gösterilecek kampanya başlığı,
 * reklam metni, avantaj maddeleri, buton yazısı ve satın alma yönlendirme linkini düzenlemesini
 * ve canlı önizleme (Live Preview) eşliğinde kaydetmesini sağlar.
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  CheckCircle2, 
  ShoppingCart, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  X,
  MapPin,
  Cloud,
  Truck,
  QrCode,
  Barcode,
  Package,
  Zap,
  Code
} from 'lucide-react';
import { useModuleManagementService } from '../adapters/ModuleManagementServiceContext';
import type { IModuleInfo, IModulePromotion } from '../types';

const ICON_OPTIONS = [
  { value: 'MapPin', label: 'Harita / Konum (MapPin)' },
  { value: 'Cloud', label: 'Bulut / Depolama (Cloud)' },
  { value: 'Truck', label: 'Kargo / Araç (Truck)' },
  { value: 'QrCode', label: 'QR Kod (QrCode)' },
  { value: 'Barcode', label: 'Barkod (Barcode)' },
  { value: 'Package', label: 'Koli / Paket (Package)' },
  { value: 'Zap', label: 'Yıldırım / Hız (Zap)' },
  { value: 'Sparkles', label: 'Yıldız / Kampanya (Sparkles)' }
];

export interface ModulTanitimDuzenleModalProps {
  isOpen: boolean;
  onClose: () => void;
  modul: IModuleInfo | null;
  onSaved?: (data?: any) => void;
}

export function ModulTanitimDuzenleModal({
  isOpen,
  onClose,
  modul,
  onSaved
}: ModulTanitimDuzenleModalProps) {
  const service = useModuleManagementService();

  const [formData, setFormData] = useState<IModulePromotion>({
    baslik: '',
    ozet: '',
    detayliAciklama: '',
    rozet: '',
    butonMetni: 'Hemen Satın Al',
    satinAlmaUrl: '',
    ikon: 'Sparkles',
    gorselUrl: '',
    avantajlar: []
  });

  const [yeniAvantaj, setYeniAvantaj] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && modul) {
      service.getModulePromotion(modul.kod)
        .then((data) => {
          if (data) {
            setFormData({
              baslik: data.baslik || `${modul.ad} Modülü`,
              ozet: data.ozet || modul.aciklama || '',
              detayliAciklama: data.detayliAciklama || modul.aciklama || '',
              rozet: data.rozet || '%30 İndirim Fırsatı',
              butonMetni: data.butonMetni || 'Hemen Satın Al',
              satinAlmaUrl: data.satinAlmaUrl || `/abonelik/moduller/${modul.kod}`,
              ikon: data.ikon || modul.ikon || 'Sparkles',
              gorselUrl: data.gorselUrl || '',
              avantajlar: Array.isArray(data.avantajlar) ? [...data.avantajlar] : []
            });
          }
        })
        .catch((err) => {
          console.error('Tanıtım verisi alınamadı:', err);
          setFormData({
            baslik: modul.tanitimBaslik || `${modul.ad} Modülü`,
            ozet: modul.tanitimOzet || modul.aciklama || '',
            detayliAciklama: modul.tanitimDetay || modul.aciklama || '',
            rozet: modul.tanitimRozet || '%30 İndirim Fırsatı',
            butonMetni: modul.tanitimButonMetni || 'Hemen Satın Al',
            satinAlmaUrl: modul.tanitimSatinAlmaUrl || `/abonelik/moduller/${modul.kod}`,
            ikon: modul.tanitimIkon || modul.ikon || 'Sparkles',
            gorselUrl: modul.tanitimGorselUrl || '',
            avantajlar: Array.isArray(modul.tanitimAvantajlar) ? [...modul.tanitimAvantajlar] : [
              'Kurumsal süreçlerde tam entegrasyon ve yüksek verimlilik',
              'Hatasız işlem akışı ve gelişmiş raporlama imkanı'
            ]
          });
        });
    }
  }, [isOpen, modul, service]);

  if (!isOpen || !modul) return null;

  const handleAddAvantaj = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!yeniAvantaj.trim()) return;
    setFormData((prev) => ({
      ...prev,
      avantajlar: [...(prev.avantajlar || []), yeniAvantaj.trim()]
    }));
    setYeniAvantaj('');
  };

  const handleRemoveAvantaj = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      avantajlar: (prev.avantajlar || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.baslik?.trim()) {
      toast.error('Lütfen tanıtım başlığı giriniz.');
      return;
    }

    try {
      setSaving(true);
      const res = await service.saveModulePromotion(modul.kod, formData);
      toast.success(`'${modul.ad}' tanıtım ve reklam mesajı başarıyla güncellendi!`);
      if (typeof onSaved === 'function') {
        onSaved(res);
      }
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.mesaj || error?.message || 'Kayıt sırasında bir hata oluştu.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderPreviewIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'mappin':
        return <MapPin size={24} color="var(--accent-primary, #6366f1)" />;
      case 'cloud':
        return <Cloud size={24} color="var(--accent-primary, #6366f1)" />;
      case 'truck':
        return <Truck size={24} color="var(--accent-primary, #6366f1)" />;
      case 'qrcode':
        return <QrCode size={24} color="var(--accent-primary, #6366f1)" />;
      case 'barcode':
        return <Barcode size={24} color="var(--accent-primary, #6366f1)" />;
      case 'zap':
        return <Zap size={24} color="var(--warning, #f59e0b)" />;
      case 'package':
        return <Package size={24} color="var(--accent-primary, #6366f1)" />;
      default:
        return <Sparkles size={24} color="var(--accent-primary, #6366f1)" />;
    }
  };

  return (
    <div className="tanitim-modal-overlay">
      <div className="tanitim-modal-container glass-card">
        {/* ─── Modal Üst Barı ────────────────────────────────────── */}
        <div className="tanitim-modal-header">
          <div className="flex items-center gap-12">
            <div className="tanitim-modal-icon-badge">
              <Sparkles size={22} className="text-accent" />
            </div>
            <div>
              <h2 className="tanitim-modal-title">Modül Tanıtım & Reklam Mesajı Düzenleyici</h2>
              <p className="tanitim-modal-subtitle">
                Modül: <strong>{modul.ad}</strong> ({modul.kod}) — Kullanıcı modüle tıkladığında gösterilecek kampanya şartlarını belirleyin.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="tanitim-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* ─── İki Sütunlu Gövde: Sol Form | Sağ Canlı Önizleme ────── */}
        <div className="tanitim-modal-body">
          {/* Sol Kolon: Düzenleme Formu */}
          <div className="tanitim-form-col">
            <div className="tanitim-section-title">
              <Code size={16} /> Kampanya & Reklam Parametreleri
            </div>

            <div className="form-group">
              <label className="form-label">Tanıtım Başlığı <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="Örn: Merkezi Adres Yönetimi Modülü"
                value={formData.baslik}
                onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
              />
            </div>

            <div className="grid-2-col gap-12">
              <div className="form-group">
                <label className="form-label">Kampanya Rozeti (Badge)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: %30 İndirim Fırsatı"
                  value={formData.rozet}
                  onChange={(e) => setFormData({ ...formData, rozet: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">İkon Türü</label>
                <select
                  className="form-input"
                  value={formData.ikon}
                  onChange={(e) => setFormData({ ...formData, ikon: e.target.value })}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kısa Slogan / Özet</label>
              <input
                type="text"
                className="form-input"
                placeholder="Örn: Türkiye genelinde hatasız adres tespiti ve kargo kolaylığı."
                value={formData.ozet}
                onChange={(e) => setFormData({ ...formData, ozet: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detaylı Reklam & Tanıtım Mesajı</label>
              <textarea
                className="form-input textarea-tall"
                rows={3}
                placeholder="Müşteriye modülün kazandıracağı değerleri ve kampanya şartlarını açıklayın..."
                value={formData.detayliAciklama}
                onChange={(e) => setFormData({ ...formData, detayliAciklama: e.target.value })}
              />
            </div>

            <div className="grid-2-col gap-12">
              <div className="form-group">
                <label className="form-label">Satın Alma Buton Metni</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Hemen Satın Al"
                  value={formData.butonMetni}
                  onChange={(e) => setFormData({ ...formData, butonMetni: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Satın Alma / Yönlendirme Linki</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: /abonelik/moduller/MOD_ADRES veya https://..."
                  value={formData.satinAlmaUrl}
                  onChange={(e) => setFormData({ ...formData, satinAlmaUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Avantajlar Listesi */}
            <div className="form-group">
              <label className="form-label">Modülün Kazandırdığı Avantajlar (Maddeler)</label>
              <div className="flex gap-8 mb-8">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Yeni bir avantaj maddesi yazın..."
                  value={yeniAvantaj}
                  onChange={(e) => setYeniAvantaj(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAvantaj();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddAvantaj()}
                  className="btn btn-secondary px-12"
                  title="Madde Ekle"
                >
                  <Plus size={16} /> Ekle
                </button>
              </div>

              <div className="avantajlar-list">
                {(formData.avantajlar || []).map((item, idx) => (
                  <div key={idx} className="avantaj-item">
                    <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                    <span className="avantaj-text">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAvantaj(idx)}
                      className="avantaj-remove-btn"
                      title="Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Canlı Önizleme (Live Preview) */}
          <div className="tanitim-preview-col">
            <div className="tanitim-section-title">
              <Eye size={16} /> Müşteri Canlı Önizlemesi (Live Preview)
            </div>

            <div className="preview-modal-mockup">
              {/* Mockup Header */}
              <div className="preview-hero-banner">
                <div className="flex items-center gap-12">
                  <div className="preview-icon-box">
                    {renderPreviewIcon(formData.ikon)}
                  </div>
                  <div className="flex-col">
                    {formData.rozet && (
                      <div className="preview-badge">
                        <Sparkles size={11} /> {formData.rozet}
                      </div>
                    )}
                    <h4 className="preview-title">{formData.baslik || 'Modül Başlığı'}</h4>
                  </div>
                </div>
                {formData.ozet && (
                  <p className="preview-subtitle">{formData.ozet}</p>
                )}
              </div>

              {/* Mockup Body */}
              <div className="preview-body">
                <div className="preview-desc-box">
                  {formData.detayliAciklama || 'Burada modülün detaylı reklam ve tanıtım açıklaması yer alacaktır.'}
                </div>

                {formData.avantajlar && formData.avantajlar.length > 0 && (
                  <div className="preview-benefits-wrap">
                    <div className="preview-benefits-heading">
                      <Zap size={13} className="text-accent" /> MODÜLÜN SUNDUĞU AVANTAJLAR
                    </div>
                    <div className="preview-benefits-list">
                      {formData.avantajlar.map((b, i) => (
                        <div key={i} className="preview-benefit-item">
                          <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mockup Footer */}
              <div className="preview-footer">
                <button type="button" className="btn btn-secondary btn-sm" disabled>
                  Daha Sonra
                </button>
                <button type="button" className="btn btn-primary btn-sm flex items-center gap-6" disabled>
                  <ShoppingCart size={14} />
                  <span>{formData.butonMetni || 'Hemen Satın Al'}</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Alt Aksiyon Butonları ──────────────────────────────── */}
        <div className="tanitim-modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-secondary px-20"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary px-24 flex items-center gap-8 shadow-accent-glow font-bold"
          >
            <Save size={16} />
            <span>{saving ? 'Kaydediliyor...' : 'Reklam & Tanıtım Ayarlarını Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModulTanitimDuzenleModal;
