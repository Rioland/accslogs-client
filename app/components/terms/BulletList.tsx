type Props = {
  items: string[];
};

export default function BulletList({ items }: Props) {
  return (
    <ul className="list-disc ml-6 space-y-2 text-gray-700">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
