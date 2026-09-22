import type { CompanyAttributeDisplay } from "@/lib/company-attributes";

type Props = {
    items: CompanyAttributeDisplay[];
};

export function CompanyAttributes({ items }: Props) {
    if (items.length === 0) return null;

    return (
        <section>
            <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10 mb-3">Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item) => (
                    <div key={item.attributeId} className="text-lg text-muted-foreground">
                        <span>{item.name}:</span>{" "}
                        <span className="font-bold">{item.values.join(", ")}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
