import React, { ReactNode } from 'react';
import { DateTime } from 'luxon';

import Card from '@/ui-components/card';

interface StickyNoteItemProps {
  content: ReactNode;
  author?: string;
  createdAt: string;
}

export default function StickyNoteItem({ content, author, createdAt }: StickyNoteItemProps) {
  const dt = DateTime.fromISO(createdAt);
  const datetimeString = `${dt.toLocaleString(DateTime.DATE_MED)} @ ${dt.toLocaleString(DateTime.TIME_SIMPLE)}`;
  const subtext = author ? `${author} | ${datetimeString}` : datetimeString;
  return (
    <Card className="bg-blue-100">
      <Card.Body>
        <p className="mb-2 text-base">{content}</p>
        <p className="text-neutral-600 text-sm">{subtext}</p>
      </Card.Body>
    </Card>
  );
}
