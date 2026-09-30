'use client';

import { useState } from 'react';

import { Button, Input, Label, Typography } from '#client-web/components';
import { useAppTranslations } from '#client-web/lib/nextIntl/useAppTranslation';

import { errorMessageKey } from './errorMessages';
import { useMyUnavailability } from './hooks';

/** Today and the following 365 days: the widest window one query allows (366 days). */
function nextYear(): { from: string; to: string } {
  const from = new Date();
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 365);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function UnavailabilityList() {
  const t = useAppTranslations();
  const [period] = useState(nextYear);
  const { add, entries, error, isLoading, remove } = useMyUnavailability(period);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const onAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsAdding(true);
    const isAdded = await add({
      from,
      to: to || from,
      reason: reason.trim() === '' ? null : reason.trim(),
    });
    setIsAdding(false);
    if (isAdded) {
      setFrom('');
      setTo('');
      setReason('');
    }
  };

  return (
    <section className="flex w-full max-w-2xl flex-col gap-3">
      <Typography as="h3">{t('profile.unavailability')}</Typography>
      {!isLoading && entries.length === 0 && <p>{t('profile.noUnavailability')}</p>}
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-2">
            <span>
              {entry.from === entry.to ? entry.from : `${entry.from} → ${entry.to}`}
              {entry.reason ? ` · ${entry.reason}` : ''}
              {entry.appliesToAllBands ? ` · ${t('profile.allBands')}` : ''}
            </span>
            <Button type="button" variant="ghost" onClick={() => void remove(entry.id)}>
              {t('profile.remove')}
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={onAdd} className="grid grid-cols-[1fr_1fr_2fr_auto] items-end gap-2">
        <Label>
          {t('profile.from')}
          <Input
            type="date"
            required
            min={period.from}
            max={period.to}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Label>
        <Label>
          {t('profile.to')}
          <Input
            type="date"
            min={from || period.from}
            max={period.to}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Label>
        <Label>
          {t('profile.reason')}
          <Input maxLength={100} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Label>
        <Button type="submit" disabled={isAdding}>
          {t('profile.addUnavailability')}
        </Button>
      </form>
      {error && (
        <p className="text-destructive" role="alert">
          {t(errorMessageKey(error.errorType))}
          {error.errorType === 'VALIDATION' ? ` (${error.message})` : null}
        </p>
      )}
    </section>
  );
}
