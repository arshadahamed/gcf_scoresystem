'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CreateTournamentSchema, type CreateTournamentDTO } from '@scf/contracts';
import { useCreateTournament } from '../api/tournaments.queries';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

export function CreateTournamentForm() {
  const router = useRouter();
  const mutation = useCreateTournament();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateTournamentDTO>({
    resolver: zodResolver(CreateTournamentSchema),
  });

  const onSubmit = async (data: CreateTournamentDTO) => {
    await mutation.mutateAsync(data);
    router.push('/tournaments');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <div>
        <Label htmlFor="name">Tournament name</Label>
        <Input id="name" {...register('name')} placeholder="Cricket Fiesta 2026" />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="season">Season</Label>
        <Input id="season" {...register('season')} placeholder="2026" />
      </div>
      <div>
        <Label>Format</Label>
        <Select onValueChange={(v) => setValue('format', v as CreateTournamentDTO['format'])}>
          <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
          <SelectContent>
            {(['T10','T20','ODI','Custom'] as const).map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {mutation.error && (
        <p className="text-sm text-red-500">{(mutation.error as Error).message}</p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating…' : 'Create tournament'}
      </Button>
    </form>
  );
}
