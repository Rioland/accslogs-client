type Item = {
  title: string;
  description: string;
};

type Props = {
  items: Item[];
};

export default function DefinitionList({ items }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <ul className="space-y-6">
        {items.map((item, index) => (
          <li key={index} className="flex gap-4">
            <span className="mt-2 w-2 h-2 bg-orange-500 rounded-full"></span>

            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-gray-600">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
