type Props = {
  number: string;
  title: string;
  children: React.ReactNode;
};

export default function TermsBlock({ number, title, children }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <h2 className="text-2xl font-bold text-orange-500">
        {number}. {title}
      </h2>

      <div className="border-t mt-3 mb-6 border-gray-300"></div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
