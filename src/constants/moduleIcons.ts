/**
 * @akalin/module_management - Modül İkon Sabitleri ve Seçici Seçenekleri (moduleIcons.ts)
 * Sistem modüllerinde kullanılan standart Lucide ikonlarının haritası ve BaseDropdownSecici seçenekleri.
 */

import React from 'react';
import {
  Boxes,
  ShieldCheck,
  Package,
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Coins,
  Warehouse,
  ScanBarcode,
  Barcode,
  HardDrive,
  Settings,
  MapPin,
  HelpCircle,
  Bell,
  Lock,
  Building2,
  Bot,
  Database,
  Mail,
  Cloud,
  Landmark,
  Search,
  FileCode,
  Sliders,
  Cpu,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { DropdownOption } from '@akalin/ui';

export const MODULE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  FileText,
  Coins,
  Warehouse,
  ScanBarcode,
  Barcode,
  HardDrive,
  Settings,
  MapPin,
  HelpCircle,
  Bell,
  Lock,
  Bot,
  Database,
  Mail,
  Cloud,
  Landmark,
  ShieldCheck,
  Search,
  FileCode,
  Sliders,
  Cpu,
  Activity,
  CheckCircle2,
  AlertCircle
};

export const MODULE_ICON_OPTIONS: DropdownOption[] = Object.keys(MODULE_ICON_MAP).map((iconKey) => {
  const IconComponent = MODULE_ICON_MAP[iconKey];
  return {
    id: iconKey,
    rawValue: iconKey,
    searchText: iconKey,
    label: React.createElement(
      'div',
      { className: 'flex items-center gap-8' },
      React.createElement(IconComponent, { size: 16 }),
      React.createElement('span', null, iconKey)
    )
  };
});

export function renderModuleIcon(iconName?: string, size = 18, className?: string): React.ReactNode {
  const IconComp = iconName && MODULE_ICON_MAP[iconName] ? MODULE_ICON_MAP[iconName] : Package;
  return React.createElement(IconComp, { size, className });
}
