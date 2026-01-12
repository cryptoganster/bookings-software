/**
 * Test: PageHeader Component
 * Verifica el renderizado del header de página
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import { PageHeader } from "../PageHeader";

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <MantineProvider>{ui}</MantineProvider>
    </BrowserRouter>,
  );
};

describe("PageHeader", () => {
  it("should render title", () => {
    renderWithProviders(<PageHeader title="Test Page" />);
    expect(screen.getByText("Test Page")).toBeInTheDocument();
  });

  it("should render without breadcrumbs", () => {
    renderWithProviders(<PageHeader title="Test Page" />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("should render breadcrumbs when provided", () => {
    const breadcrumbs = [
      { label: "Home", href: "/" },
      { label: "Current Page" },
    ];
    renderWithProviders(
      <PageHeader title="Test Page" breadcrumbs={breadcrumbs} />,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Current Page")).toBeInTheDocument();
  });

  it("should render breadcrumb links correctly", () => {
    const breadcrumbs = [{ label: "Home", href: "/" }];
    renderWithProviders(
      <PageHeader title="Test Page" breadcrumbs={breadcrumbs} />,
    );
    const link = screen.getByText("Home");
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  it("should render breadcrumb without link when href not provided", () => {
    const breadcrumbs = [{ label: "Current" }];
    renderWithProviders(
      <PageHeader title="Test Page" breadcrumbs={breadcrumbs} />,
    );
    const text = screen.getByText("Current");
    expect(text.tagName).toBe("SPAN");
  });

  it("should render actions when provided", () => {
    const actions = <button>Action Button</button>;
    renderWithProviders(<PageHeader title="Test Page" actions={actions} />);
    expect(screen.getByText("Action Button")).toBeInTheDocument();
  });

  it("should render without actions", () => {
    renderWithProviders(<PageHeader title="Test Page" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should render multiple breadcrumbs", () => {
    const breadcrumbs = [
      { label: "Home", href: "/" },
      { label: "Section", href: "/section" },
      { label: "Current" },
    ];
    renderWithProviders(
      <PageHeader title="Test Page" breadcrumbs={breadcrumbs} />,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("should render title and actions together", () => {
    const actions = <button>Create</button>;
    renderWithProviders(<PageHeader title="My Page" actions={actions} />);
    expect(screen.getByText("My Page")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });
});
