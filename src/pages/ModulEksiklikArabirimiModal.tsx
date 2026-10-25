/**
 * @akalin/module_management - Modül Eksiklik Arabirimi Düzenleyici
 * 
 * Modülün yüklü olmadığı, lisanslanmadığı veya yetkinin bulunmadığı durumlarda kullanıcıya sunulacak
 * eksiklik arabirimini (Missing Module Interface / Reklam & Kampanya Şablonu) HtmlEditor ile
 * görsel (WYSIWYG) ve kaynak kod modunda düzenleme ve kaydetme imkanı sunar.
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HtmlEditor } from '@akalin/ui';
import { useModuleManagementService } from '../adapters/ModuleManagementServiceContext';
import type { IModuleInfo } from '../types';

export interface ModulEksiklikArabirimiModalProps {
  isOpen: boolean;
  onClose: () => void;
  modul: IModuleInfo | null;
  onSaved?: (data?: any) => void;
}

export function ModulEksiklikArabirimiModal({
  isOpen,
  onClose,
  modul,
  onSaved
}: ModulEksiklikArabirimiModalProps) {
  const service = useModuleManagementService();
  const [htmlContent, setHtmlContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && modul) {
      service.getModulePromotion(modul.kod)
        .then((data) => {
          if (data && data.tanitimHtml) {
            setHtmlContent(data.tanitimHtml);
          } else if (modul.tanitimHtml) {
            setHtmlContent(modul.tanitimHtml);
          } else {
            setHtmlContent(generateDefaultHtml(modul));
          }
        })
        .catch((err) => {
          console.error('Eksiklik arabirimi HTML verisi alınamadı:', err);
          if (modul.tanitimHtml) {
            setHtmlContent(modul.tanitimHtml);
          } else {
            setHtmlContent(generateDefaultHtml(modul));
          }
        });
    }
  }, [isOpen, modul, service]);

  if (!isOpen || !modul) return null;

  const generateDefaultHtml = (mod: IModuleInfo) => {
    return `<div class="modul-eksiklik-container" style="padding: 6px; font-family: inherit;">
  <div class="modul-eksiklik-hero">
    <span class="modul-eksiklik-badge">%30 İNDİRİM FIRSATI</span>
    <h2 class="modul-eksiklik-title">${mod.ad || 'Modül'}</h2>
    <p class="modul-eksiklik-subtitle">${mod.aciklama || 'Bu modül ile kurumsal süreçlerinizi uçtan uca otomatikleştirin ve hız kazanın.'}</p>
  </div>

  <div class="modul-eksiklik-box">
    <p style="margin: 0;">Bu özellik lisans paketinizde aktif değildir. Modülü hemen aktive ederek tam yetki ve entegrasyon sağlayabilirsiniz.</p>
  </div>

  <div style="margin-bottom: 24px;">
    <h4 class="modul-eksiklik-adv-title">Öne Çıkan Modül Avantajları</h4>
    <ul class="modul-eksiklik-list">
      <li class="modul-eksiklik-item"><span style="color: #10b981; font-weight: bold; font-size: 15px;">✓</span> Tek tıkla otomatik sorgulama ve anlık doğrulama</li>
      <li class="modul-eksiklik-item"><span style="color: #10b981; font-weight: bold; font-size: 15px;">✓</span> Tüm sistem modülleri ve mobil terminallerle tam uyum</li>
      <li class="modul-eksiklik-item"><span style="color: #10b981; font-weight: bold; font-size: 15px;">✓</span> Öncelikli VIP teknik destek ve düzenli otomatik güncellemeler</li>
    </ul>
  </div>

  <div style="text-align: right; padding-top: 14px; border-top: 1px solid var(--glass-border);">
    <a href="/abonelik/moduller/${mod.kod}" class="btn-satin-al">Modülü Hemen Satın Al &rarr;</a>
  </div>
</div>`;
  };

  const handleSave = async (savedHtml?: string) => {
    const contentToSave = savedHtml !== undefined ? savedHtml : htmlContent;
    try {
      setSaving(true);
      const res = await service.saveModulePromotion(modul.kod, {
        tanitimHtml: contentToSave,
        baslik: modul.ad,
        ozet: modul.aciklama
      });
      toast.success(`'${modul.ad}' eksiklik arabirimi HTML şablonu başarıyla kaydedildi!`);
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

  return (
    <HtmlEditor
      isModal={true}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      isSaving={saving}
      value={htmlContent}
      onChange={setHtmlContent}
      modulKodu={modul.kod}
      modulAdi={modul.ad}
      title="Modül Eksiklik Arabirimi Düzenleyici"
      subtitle="Modül eksikliği veya yetki kısıtlamasında kullanıcıya sunulacak arabirimi serbest HTML ile tasarlayın."
      saveButtonText="Eksiklik Arabirimini Kaydet"
    />
  );
}

export default ModulEksiklikArabirimiModal;
