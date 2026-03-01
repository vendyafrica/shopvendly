"use client";

import { useMemo, useState } from "react";

type Audience = "men" | "women";
type SizeRow = { size: string; uk: string; eu: string; us: string };

export function StyleGuide({ audience }: { audience: Audience }) {
    const [activeTab, setActiveTab] = useState<"guide" | "fit">("guide");

    const content = useMemo(() => {
        const columns = ["Size", "UK", "EU", "US"];

        if (audience === "men") {
            return {
                title: "Know your size",
                columns,
                guide: [
                    { size: "S", uk: "36", eu: "46", us: "36" },
                    { size: "M", uk: "38", eu: "48", us: "38" },
                    { size: "L", uk: "40", eu: "50", us: "40" },
                    { size: "XL", uk: "42", eu: "52", us: "42" },
                    { size: "XXL", uk: "44", eu: "54", us: "44" },
                    { size: "3XL", uk: "46", eu: "56", us: "46" },
                ] as SizeRow[],
                fit: [
                    "If you’re between sizes, size up for a relaxed fit.",
                    "Broad shoulders or chest? Consider the next size up.",
                ],
            };
        }

        return {
            title: "Know your size",
            columns,
            guide: [
                { size: "S", uk: "8", eu: "36", us: "4" },
                { size: "M", uk: "10", eu: "38", us: "6" },
                { size: "L", uk: "12", eu: "40", us: "8" },
                { size: "XL", uk: "14", eu: "42", us: "10" },
                { size: "XXL", uk: "16", eu: "44", us: "12" },
                { size: "3XL", uk: "18", eu: "46", us: "14" },
            ] as SizeRow[],
            fit: [
                "True to size for a regular fit.",
                "If you prefer a looser silhouette, size up.",
            ],
        };
    }, [audience]);

    return (
        <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden bg-white">
            <div className="px-4 py-3 flex items-center justify-between bg-neutral-50 border-b border-neutral-200">
                <div className="text-sm font-semibold text-neutral-900">{content.title}</div>
                <div className="flex items-center gap-1">
                    <button
                        className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${activeTab === "guide" ? "bg-white border border-neutral-200 text-neutral-900 shadow-xs" : "text-neutral-600 hover:text-neutral-900"}`}
                        onClick={() => setActiveTab("guide")}
                        type="button"
                    >
                        Guide
                    </button>
                    <button
                        className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${activeTab === "fit" ? "bg-white border border-neutral-200 text-neutral-900 shadow-xs" : "text-neutral-600 hover:text-neutral-900"}`}
                        onClick={() => setActiveTab("fit")}
                        type="button"
                    >
                        Fit tips
                    </button>
                </div>
            </div>

            <div className="p-4">
                {activeTab === "fit" ? (
                    <ul className="text-sm text-neutral-700 space-y-2 list-disc list-inside">
                        {content.fit.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                        ))}
                    </ul>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase text-neutral-500 border-b border-neutral-200">
                                <tr>
                                    {content.columns.map((col) => (
                                        <th key={col} className="py-2 pr-4 font-semibold">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {content.guide.map((row: SizeRow) => (
                                    <tr key={row.size} className="border-t border-neutral-100">
                                        <td className="py-2 pr-4 text-neutral-900 font-medium">{row.size}</td>
                                        <td className="py-2 pr-4 text-neutral-700">{row.uk}</td>
                                        <td className="py-2 pr-4 text-neutral-700">{row.eu}</td>
                                        <td className="py-2 text-neutral-700">{row.us}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-3 text-xs text-neutral-500">Measurements are in inches.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
