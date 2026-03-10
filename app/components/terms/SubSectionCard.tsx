type Props = {
  title: string;
  children: React.ReactNode;
};

export default function SubSectionCard({ title, children }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>

      <div className="text-gray-700 space-y-3">{children}</div>
    </div>
  );
}
