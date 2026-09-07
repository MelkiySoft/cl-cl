import type { CompanyAttributeDisplay } from "@/lib/company-attributes";

type Props = {
    items: CompanyAttributeDisplay[];
};

export function CompanyAttributes({ items }: Props) {
    if (items.length === 0) return null;

    return (
        <section>
            <h2 className="text-lg font-semibold mb-3">Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item) => (
                    <div key={item.attributeId} className="text-sm">
                        <span className="text-muted-foreground">{item.name}:</span>{" "}
                        <span className="font-medium">{item.values.join(", ")}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
