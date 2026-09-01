import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/app/actions/products";

export default async function DashboardPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true, steps: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-crystal bg-white p-6">
        <h2 className="mb-3 font-semibold text-mahogany">Create a new product</h2>
        <form
          action={async (formData) => {
            "use server";
            const name = formData.get("name") as string;
            if (name?.trim()) await createProduct(name.trim());
          }}
          className="flex gap-2"
        >
          <input
            name="name"
            required
            placeholder="Product name, e.g. Facebook Ads Campaign"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
          />
          <button className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover">
            Create
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-mahogany">Products</h2>
        <div className="divide-y divide-crystal rounded-lg border border-crystal bg-white">
          {products.length === 0 && (
            <p className="p-4 text-sm text-mahogany/50">No products yet.</p>
          )}
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/fot/products/${p.id}`}
              className="flex items-center justify-between p-4 hover:bg-crystal-soft"
            >
              <div>
                <p className="font-medium text-mahogany">{p.name}</p>
                <p className="text-sm text-mahogany/50">
                  {p._count.steps} step(s) · {p._count.submissions} submission(s)
                </p>
              </div>
              <span className="text-sm text-ignite">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
