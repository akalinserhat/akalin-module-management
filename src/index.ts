/**
 * @akalin/module_management - Modül Yönetimi Paketi Ana Giriş Noktası
 */

import './styles/moduleManagement.css';

export * from './types';
export * from './services/httpClient';
export * from './services/moduleManagementService';
export * from './adapters/ModuleManagementServiceContext';
export * from './constants/moduleIcons';
export * from './pages/ModulYonetimiPage';
export * from './pages/ModulFeatureForm';
export * from './pages/ModulFeatureFormValidation';
export * from './pages/ModulFeatureFormDefaultValue';
export * from './pages/ModulFeatureFormAutoFocus';
export * from './pages/ModullerPage';
export * from './pages/Moduller';
export * from './pages/ModulEksiklikArabirimiModal';
export * from './pages/ModulTanitimDuzenleModal';
export * from './createModuleManagementModule';

import { ModuleManagementModule, createModuleManagementModule } from './createModuleManagementModule';

export const ModulYonetimiModule = ModuleManagementModule;
export { createModuleManagementModule };
export default ModuleManagementModule;
