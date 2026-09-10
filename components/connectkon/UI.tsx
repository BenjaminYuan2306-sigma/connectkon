import { type ReactNode, useId, useState } from 'react';
import { Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
export function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="ck-modal">
        <DialogTitle className="modal-title">{title}</DialogTitle>
        <DialogDescription>
          {description || 'Keep the details that help you stay connected.'}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <AlertDialogContent className="ck-confirm">
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <div className="form-footer">
          <button onClick={onClose}>Cancel</button>
          <button
            className="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={'field ' + (wide ? 'wide' : '')}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <span id={id}>{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v || '')}>
        <SelectTrigger aria-labelledby={id} className="choice-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="choice-content">
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function Strength({
  value,
  onChange,
}: {
  value: number;
  onChange?: (n: number) => void;
}) {
  return (
    <span className="stars" aria-label={`Relationship strength ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            type="button"
            key={n}
            aria-label={`Strength ${n} of 5`}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
          >
            <Star
              size={16}
              fill={n <= value ? 'currentColor' : 'none'}
              className={n <= value ? '' : 'dim'}
            />
          </button>
        ) : (
          <Star
            key={n}
            size={13}
            fill={n <= value ? 'currentColor' : 'none'}
            className={n <= value ? '' : 'dim'}
          />
        ),
      )}
    </span>
  );
}
export function Avatar({
  name,
  url,
  large = false,
}: {
  name: string;
  url?: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={'person-avatar ' + (large ? 'large' : '')}>
      {url && !failed ? (
        <img src={url} alt="" onError={() => setFailed(true)} />
      ) : (
        name
          .split(' ')
          .map((s) => s[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      )}
    </span>
  );
}
