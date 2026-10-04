import CatalogPage, { catalogMetadata, type CatalogPageProps } from "@/components/catalog/CatalogPage";
type Props = Pick<CatalogPageProps, "searchParams">;
export const generateMetadata = (props: Props) => catalogMetadata(props);
export default function CatalogoPage(props: Props) { return <CatalogPage {...props} />; }
