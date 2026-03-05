type Props = {
  id: number;
  title: string;
  children: React.ReactNode;
};

export default function TermsSection({ id, title, children }: Props) {
  return (
    <div id={`section-${id}`} className="bg-gray-200 rounded-2xl shadow-md p-8">
      <h3 className="text-2xl font-bold text-orange-500 mb-4">
        {id}. {title}
      </h3>

      <div className="bg-white rounded-xl shadow p-6 text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
