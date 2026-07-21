import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/overlay';
import { Input, Label, Textarea } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { contributorSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import { toast } from '@/components/ui/toast';

export function ContributorDialog({ open, onClose, editing }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(contributorSchema),
    values: editing
      ? { name: editing.name, phone: editing.phone ?? '', notes: editing.notes ?? '' }
      : { name: '', phone: '', notes: '' }
  });

  async function onSubmit(values) {
    if (editing?.id) {
      await db.contributors.update(editing.id, values);
      toast('Contributor updated');
    } else {
      await db.contributors.add({ ...values, createdAt: new Date().toISOString() });
      toast('Contributor added');
    }
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'Edit Contributor' : 'Add Contributor'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" {...register('name')} placeholder="Ahmed Khan" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="c-phone">Phone (optional)</Label>
          <Input id="c-phone" {...register('phone')} placeholder="+971 5X XXX XXXX" />
        </div>
        <div>
          <Label htmlFor="c-notes">Notes (optional)</Label>
          <Textarea id="c-notes" rows={3} {...register('notes')} placeholder="Any additional details" />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {editing ? 'Save Changes' : 'Add Contributor'}
        </Button>
      </form>
    </Dialog>
  );
}
