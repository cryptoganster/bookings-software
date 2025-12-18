import { Group, Title, Breadcrumbs, Anchor } from "@mantine/core";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs mb="xs">
          {breadcrumbs.map((item, index) =>
            item.href ? (
              <Anchor key={index} component={Link} to={item.href}>
                {item.label}
              </Anchor>
            ) : (
              <span key={index}>{item.label}</span>
            ),
          )}
        </Breadcrumbs>
      )}
      <Group justify="space-between" align="center">
        <Title order={1}>{title}</Title>
        {actions && <Group gap="sm">{actions}</Group>}
      </Group>
    </div>
  );
}
