export default function FooterBrand() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ACCSZONE</h2>

      <p className="font-semibold mb-3">Customer Support</p>

      <div className="flex flex-col gap-3 max-w-xs">
        <button className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm">
          New Ticket / Ask a Question
        </button>

        <button className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm">
          Become a Supplier
        </button>
      </div>
    </div>
  );
}
