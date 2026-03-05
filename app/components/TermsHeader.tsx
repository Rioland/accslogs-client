type Props = {
  effectiveDate: string;
  lastUpdated: string;
};

export default function TermsHeader({ effectiveDate, lastUpdated }: Props) {
  return (
    <div className="bg-gray-200 rounded-2xl shadow-md p-10 text-center">
      <h1 className="text-4xl font-bold text-orange-500 mb-6">
        Terms & Conditions
      </h1>

      <div className="flex justify-center gap-4 flex-wrap">
        <span className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm">
          Effective Date: {effectiveDate}
        </span>

        <span className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm">
          Last Updated: {lastUpdated}
        </span>
      </div>
    </div>
  );
}
