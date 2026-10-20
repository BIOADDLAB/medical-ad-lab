import { notFound } from "next/navigation";
import { PER_PAGE, breadcrumbSchema, categoryKey, categoryLabel, crumbs, getArticles, listMetadata, listSchema } from "@/bioadd-blog/kit";
import { BlogList, JsonLd } from "@/bioadd-blog/ui";
export const revalidate = 60;
type Props = { searchParams: Promise<{ category?: string; page?: string }> };
async function view(params: { category?: string; page?: string }) {
  const page = Number(params.page || 1), category = params.category ? categoryLabel(params.category) : "";
  if (!Number.isInteger(page) || page < 1 || (params.category && !category)) notFound();
  const all = await getArticles(), selected = category ? all.filter((a) => a.category === category) : all;
  if (page > 1 && (page - 1) * PER_PAGE >= selected.length) notFound();
  return { all, category, page, selected };
}
export async function generateMetadata({ searchParams }: Props) {
  const v = await view(await searchParams);
  return listMetadata(v.category, v.page, v.selected.length);
}
export default async function Page({ searchParams }: Props) {
  const { all, category, page, selected } = await view(await searchParams);
  const categories = [...new Set(all.map((a) => a.category).filter((c) => categoryKey(c)))];
  const articles = selected.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return (
    <>
      <JsonLd data={listSchema(articles, category, page, selected.length)} />
      <JsonLd data={breadcrumbSchema(crumbs(category))} />
      <BlogList articles={articles} categories={categories} category={category} page={page} total={selected.length} />
    </>
  );
}
