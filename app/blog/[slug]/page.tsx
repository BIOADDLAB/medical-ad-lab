import { notFound, permanentRedirect } from "next/navigation";
import { articleMetadata, articlePath, articleSchema, breadcrumbSchema, crumbs, getArticle, getArticles, relatedArticles } from "@/medicaladlab-blog/kit";
import { BlogArticle, JsonLd } from "@/medicaladlab-blog/ui";
export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  return articleMetadata(a);
}
export default async function Page({ params }: Props) {
  const { slug } = await params, a = await getArticle(slug);
  if (!a) notFound();
  if (a.slug !== slug) permanentRedirect(articlePath(a.slug));
  const all = await getArticles(), position = all.findIndex((x) => x.id === a.id);
  return (
    <>
      <JsonLd data={articleSchema(a)} />
      <JsonLd data={breadcrumbSchema(crumbs(a.category, a))} />
      <BlogArticle article={a} related={relatedArticles(all, a)} previous={all[position + 1]} next={all[position - 1]} />
    </>
  );
}
