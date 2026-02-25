const links = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "MarketPlace", href: "/market-place" },
  { label: "Terms", href: "/terms" },
  { label: "FAQ's", href: "/faq" },
  // { label: "Supplier Register", href: "/supplier-register" },
];

export default function FooterLinks() {
  return (
    <div>
      <h3 className="font-semibold mb-4">Useful Links</h3>

      <ul className="space-y-2 text-sm text-gray-600">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="hover:text-orange-500 transition"
            >
              › {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
