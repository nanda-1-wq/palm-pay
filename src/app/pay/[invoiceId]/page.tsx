export default function PayPage({
  params,
}: {
  params: { invoiceId: string };
}) {
  return (
    <div className="flex flex-1 items-center justify-center text-gray-400">
      <p>Checkout for invoice {params.invoiceId} — coming in T5</p>
    </div>
  );
}
