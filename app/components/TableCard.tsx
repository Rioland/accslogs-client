type Props = {
  items: string[];
};

export default function TableCard({ items }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index}>
            <a
              href={`#section-${index + 1}`}
              className="text-blue-600 hover:underline"
            >
              {index + 1}. {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
