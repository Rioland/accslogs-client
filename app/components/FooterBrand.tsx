export default function FooterBrand() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Topnotchlogs</h2>

      <p className="font-semibold mb-3">Customer Support</p>

      <div className="flex flex-col gap-3 max-w-xs">
        <a
          href="/dashboard/tickets"
          className="bg-[#194572] hover:bg-[#153a61] text-white px-4 py-2 rounded-md text-sm transition-colors inline-block"
        >
          New Ticket / Ask a Question
        </a>
      </div>
    </div>
  );
}
