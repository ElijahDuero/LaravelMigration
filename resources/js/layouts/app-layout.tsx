import AppLayout from '@/components/AppLayout';
import type { BreadcrumbItem } from '@/types';

export default function Layout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const pageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].title : undefined;

    return (
        <AppLayout title={pageTitle}>
            {children}
        </AppLayout>
    );
}
