export default function NewsletterForm() {
  return (
    <div>
      <h3 className="font-semibold mb-2">Subscribe to Newsletter</h3>
      <p className="text-sm text-gray-600 mb-4">
        Stay updated with our latest offers and news
      </p>

      <form className="flex max-w-sm">
        <input
          type="email"
          placeholder="Enter Your Email..."
          className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 text-sm focus:outline-none"
        />
        <button
          type="submit"
          className="bg-[#F87D1F] hover:bg-[#e06b10] text-white px-4 py-2 rounded-r-md text-sm transition-colors"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
