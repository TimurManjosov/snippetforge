'use client';

import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import CollectionPickerDialog from './collection-picker-dialog';

interface AddToCollectionButtonProps {
  snippetId: string;
}

export default function AddToCollectionButton({ snippetId }: AddToCollectionButtonProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        className="add-to-collection-btn"
        aria-label="Add to collection"
        onClick={() => setDialogOpen(true)}
      >
        <span className="add-to-collection-icon">📁</span>
        <span className="add-to-collection-text">Collect</span>
      </button>
      <CollectionPickerDialog
        snippetId={snippetId}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
