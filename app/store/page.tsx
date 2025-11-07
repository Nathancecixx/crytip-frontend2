import Store from '@/components/Store';

export const dynamic = 'force-dynamic';

export default function StorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Store</h1>
      <Store />
    </div>
  );
}
