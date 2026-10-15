import { toast } from "vue-sonner";

// "Undo over confirm" (DESIGN_SYSTEM.md): removing something shows a toast with an Undo action instead of a
// blocking dialog. Only "clear all data" asks first.
export function useUndoToast() {
  return {
    /** Show `message` with an Undo button; `undo` runs if it is pressed within `duration` ms. */
    withUndo(message: string, undo: () => void, duration = 6000) {
      return toast(message, { duration, action: { label: "Undo", onClick: undo } });
    },
    info: (message: string) => toast(message),
    dismiss: (id?: string | number) => toast.dismiss(id),
  };
}
