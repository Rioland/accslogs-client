import TableCard from "./TableCard";

export default function TableOfContents() {
  const left = [
    "Acceptance of Terms",
    "Definitions",
    "Account Sales",
    "Account Ownership & Risk",
    "Payment & Refunds",
    "User Obligations",
    "Intellectual Property",
  ];

  const right = [
    "Disclaimers",
    "Privacy & Data Protection",
    "Termination",
    "Dispute Resolution",
    "Amendments",
    "Contact Information",
    "Entire Agreement",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-10">
      <h2 className="text-3xl font-semibold text-orange-500 text-center mb-10">
        Table of Contents
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        <TableCard items={left} />
        <TableCard items={right} />
      </div>
    </div>
  );
}
