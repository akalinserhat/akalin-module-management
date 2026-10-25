# @akalin/module_management

Webakus SaaS ve ERP ekosistemi için bağımsız Modül Yönetimi, Keşif, Tanıtım ve Eksiklik Analizi paketi.

## Özellikler

- **Otomatik Modül Keşfi (Discovery)**: Dosya sistemindeki fiziksel modül klasörleri (Frontend & Backend) ve veritabanı kayıtlarını otomatik tarar.
- **Durum Yönetimi**: Kayıtlı (Registered), Kayıtsız/Yeni (Unregistered), Devre Dışı (Disabled) ve Dosyası Eksik (Missing) modül analizi.
- **Tek Tıkla Kurulum / Kayıt**: Modülleri veritabanına ekleme, devre dışı bırakma veya kaynak koda zarar vermeden kaydını kaldırma.
- **Eksiklik Arabirimi Düzenleyici**: Lisans veya yetki eksikliğinde son kullanıcıya gösterilecek zengin HTML şablonu (WYSIWYG & Kaynak Kod).
- **Modül Tanıtım & Reklam Modalı**: Canlı önizleme (Live Preview) eşliğinde tanıtım metni, rozet, avantaj maddeleri ve satın alma butonlarını yönetme.
- **Modüler Adapter Mimarisi**: HTTP istemcisi ve API uç noktaları `IModuleManagementAdapter` arayüzü ile tamamen soyutlanmıştır.

## Kurulum

```bash
npm install @akalin/module_management
```

## Kullanım

```tsx
import { ModuleRegistry } from '@akalin/module_core';
import { createModuleManagementModule } from '@akalin/module_management';

const moduleManagement = createModuleManagementModule({
  title: 'Modül Yönetimi',
  baseRoute: '/moduller',
  order: 60
});

ModuleRegistry.register(moduleManagement);
```

## Lisans

ISC - Akalin Software
