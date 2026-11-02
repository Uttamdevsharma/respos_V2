"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ManageQuotationsTab } from "../../../components/quotations/ManageQuotationsTab";
import { QuotationForm } from "../../../components/quotations/QuotationForm";
import { RefreshCw } from "lucide-react";

function QuotationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const editIdParam = searchParams.get("id");

  const [activeTab, setActiveTab] = useState<"quotations" | "quotation-create" | "quotation-edit">(
    tabParam === "create" || tabParam === "quotation-create"
      ? "quotation-create"
      : tabParam === "edit" || tabParam === "quotation-edit"
      ? "quotation-edit"
      : "quotations"
  );

  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(editIdParam || null);

  useEffect(() => {
    if (tabParam === "create" || tabParam === "quotation-create") {
      setActiveTab("quotation-create");
    } else if ((tabParam === "edit" || tabParam === "quotation-edit") && editIdParam) {
      setSelectedQuotationId(editIdParam);
      setActiveTab("quotation-edit");
    } else if (!tabParam || tabParam === "quotations" || tabParam === "manage") {
      setActiveTab("quotations");
    }
  }, [tabParam, editIdParam]);

  const handleTabChange = (tab: "quotations" | "quotation-create" | "quotation-edit", id?: string) => {
    setActiveTab(tab);
    if (tab === "quotations") {
      setSelectedQuotationId(null);
      router.push("/super-admin/quotations");
    } else if (tab === "quotation-create") {
      setSelectedQuotationId(null);
      router.push("/super-admin/quotations?tab=create");
    } else if (tab === "quotation-edit" && id) {
      setSelectedQuotationId(id);
      router.push(`/super-admin/quotations?tab=edit&id=${id}`);
    }
  };

  switch (activeTab) {
    case "quotation-create":
      return (
        <QuotationForm
          onSuccess={() => handleTabChange("quotations")}
          onCancel={() => handleTabChange("quotations")}
        />
      );

    case "quotation-edit":
      return (
        <QuotationForm
          quotationId={selectedQuotationId}
          isEdit={true}
          onSuccess={() => handleTabChange("quotations")}
          onCancel={() => handleTabChange("quotations")}
        />
      );

    case "quotations":
    default:
      return (
        <ManageQuotationsTab
          onAddClick={() => handleTabChange("quotation-create")}
          onEditClick={(id) => handleTabChange("quotation-edit", id)}
          onPrintClick={(id) => {
            window.open(`/quote/${id}`, "_blank");
          }}
        />
      );
  }
}

export default function QuotationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading Quotations Module...</p>
        </div>
      }
    >
      <QuotationsContent />
    </Suspense>
  );
}
