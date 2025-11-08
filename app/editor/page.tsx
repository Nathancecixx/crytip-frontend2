import ProtectedRoute from '@/components/ProtectedRoute';
import EditorClient from './EditorClient';

export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <ProtectedRoute>
      <EditorClient />
    </ProtectedRoute>
  );
}
