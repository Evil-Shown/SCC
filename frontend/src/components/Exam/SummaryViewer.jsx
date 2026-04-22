import React from 'react';

const SummaryViewer = ({ summaryData }) => {
    if (!summaryData) {
        return <div className="p-4 text-center text-gray-500">සාරාංශ දත්ත නොමැත (No summary data available)</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto my-4 border border-gray-100">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 border-blue-500 pb-4 inline-block">
                {summaryData.summaryTitle || "පාඩම් සාරාංශය (Study Summary)"}
            </h1>

            {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
                <div className="space-y-6 mt-4">
                    {summaryData.keyPoints.map((point, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:shadow-md transition">
                            <div className="flex items-start">
                                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{point.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-justify">
                                        {point.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {summaryData.detailedSummary && (
                <div className="mt-8 bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-blue-900 mb-3">අවසාන නිගමනය (Conclusion)</h3>
                    <p className="text-blue-800 leading-relaxed text-justify">
                        {summaryData.detailedSummary}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SummaryViewer;
