type Props = {
  title: string;
  items: string[];
};

export default function BulletCard({ title, items }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h4 className="text-lg font-semibold mb-4">{title}</h4>

      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
