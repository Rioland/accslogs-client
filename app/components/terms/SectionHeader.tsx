type Props = {
  number: string;
  title: string;
};

export default function SectionHeader({ number, title }: Props) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-orange-500">
        {number}. {title}
      </h2>

      <div className="border-t mt-3 border-gray-300"></div>
    </div>
  );
}
