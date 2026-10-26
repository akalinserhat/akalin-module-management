/**
 * @akalin/module_management - Modül Özellikleri Form Otomatik Odaklanma (ModulFeatureFormAutoFocus.ts)
 * Modül formu açıldığında ilk etkin alana (Modül Başlığı) otomatik odaklanmayı yönetir.
 */

export function focusModulFeatureFirstInput(): void {
  requestAnimationFrame(() => {
    const input = document.getElementById('modul-form-title') as HTMLInputElement | null;
    if (input && typeof input.focus === 'function') {
      input.focus();
    }
  });
}
